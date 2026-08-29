import * as vscode from 'vscode';
import WebSocket from 'ws';
import PTT from 'ptt-client';
import key from 'ptt-client/dist/utils/keymap';

(global as any).WebSocket = WebSocket;

import type { PttTreeDataProvider, Board } from './pttDataProvider';
import { PttTreeViewController, getBoardNameFromItem } from './views/PttTreeView';
import ContentProvider from './provider';
import store, { type ArticleListItem } from './store';
import type { IPttClient, FavoriteBoardItem } from './types';
import logger from './logger';

export type { FavoriteBoardItem } from './types';

let ptt: IPttClient;
let ctx: vscode.ExtensionContext;
let pttProvider: PttTreeDataProvider | PttTreeViewController;
let pttViewController: PttTreeViewController;
let contentProvider: ContentProvider;

function intializePttClient (timeoutMs = 5000): Promise<IPttClient> {
  return new Promise(resolve => {
    const client = new PTT({ origin: 'https://term.ptt.cc' });
    const timer = setTimeout(() => {
      resolve(client);
    }, timeoutMs);
    client.once('connect', () => {
      clearTimeout(timer);
      resolve(client);
    });
    client.once('error', () => {
      clearTimeout(timer);
      resolve(client);
    });
  });
}

let pttClientFactory = intializePttClient;

export function setPttClientFactory (factory: (timeoutMs?: number) => Promise<IPttClient>) {
  pttClientFactory = factory;
}

export function updateLoginContext () {
  const loggedIn = checkLogin();
  vscode.commands.executeCommand('setContext', 'ptt:loggedIn', loggedIn);
}

export function refreshTreeView () {
  pttViewController?.refresh();
  (pttProvider as any)?.refresh?.();
}

export class PttQueue {
  private queue: Promise<unknown> = Promise.resolve();

  public run<T>(task: () => Promise<T>): Promise<T> {
    const next = this.queue.then(task, task);
    this.queue = next.then(() => {}, () => {});
    return next;
  }
}

export const pttQueue = new PttQueue();

export function wrapPttWithQueue(client: IPttClient): IPttClient {
  if (!client || (client as any).__isQueued) {
    return client;
  }

  const asyncMethods = new Set([
    'getFavorite',
    'getArticles',
    'getArticle',
    'enterBoard',
    'login',
    'logout'
  ]);

  return new Proxy(client, {
    get(target, prop, receiver) {
      if (prop === '__isQueued') {
        return true;
      }
      const orig = Reflect.get(target, prop, receiver);
      if (typeof prop === 'string' && asyncMethods.has(prop) && typeof orig === 'function') {
        return function (...args: unknown[]) {
          return pttQueue.run(() => orig.apply(target, args));
        };
      }
      return orig;
    }
  });
}

export function setPttClient (client: IPttClient) {
  const queuedClient = wrapPttWithQueue(client);
  ptt = queuedClient;
  (pttProvider as any)?.setPtt?.(queuedClient);
  pttViewController?.setPtt?.(queuedClient);
  contentProvider?.setPtt?.(queuedClient);
  contentProvider?.setEnsureLogin?.(async () => {
    if (!checkLogin()) {
      await login(true);
    }
    return checkLogin();
  });
  if (client?.on) {
    client.on('stateChange', () => {
      updateLoginContext();
    });
    client.on('disconnect', () => {
      updateLoginContext();
      refreshTreeView();
    });
  }
  updateLoginContext();
}

export function setExtensionContext (context: vscode.ExtensionContext) {
  ctx = context;
}

export function setPttProvider (provider: PttTreeDataProvider | PttTreeViewController) {
  pttProvider = provider;
}

export function setPttViewController (controller: PttTreeViewController) {
  pttViewController = controller;
}

export function setContentProvider (provider: ContentProvider) {
  contentProvider = provider;
}

export function checkLogin () {
  return ptt?.state?.login ?? false;
}

let activeConnectPromise: Promise<boolean> | null = null;
let activeLoginPromise: Promise<boolean> | null = null;

export async function ensureConnectedPttClient (): Promise<boolean> {
  if (ptt?.state?.connect) {
    return true;
  }
  if (activeConnectPromise) {
    return activeConnectPromise;
  }
  activeConnectPromise = (async () => {
    try {
      const newClient = await pttClientFactory();
      setPttClient(newClient);
      return Boolean(newClient?.state?.connect);
    } finally {
      activeConnectPromise = null;
    }
  })();
  return activeConnectPromise;
}

export async function getLoginCredential (silent = false): Promise<{ username?: string; password?: string }> {
  const isSilent = silent === true;
  const username = ctx?.globalState?.get<string>('username');
  const password = ctx?.globalState?.get<string>('password');

  const hasCredentials = Boolean(username && ((password !== undefined && password !== null) || username.toLowerCase() === 'guest'));

  if (hasCredentials || isSilent) {
    return { username, password: password ?? '' };
  }

  const inputUsername = await vscode.window.showInputBox({
    placeHolder: '帳號',
    prompt: '請輸入 PTT 登入帳號',
    value: username || ''
  });

  if (!inputUsername) {
    return {};
  }

  let inputPassword = '';
  if (inputUsername.toLowerCase() === 'guest') {
    inputPassword = '';
  } else {
    const enteredPassword = await vscode.window.showInputBox({
      placeHolder: '密碼',
      prompt: '請輸入 PTT 登入密碼',
      password: true
    });

    if (enteredPassword === undefined) {
      return {};
    }
    inputPassword = enteredPassword;
  }

  return { username: inputUsername, password: inputPassword };
}

export async function login (silent = false): Promise<boolean> {
  const isSilent = silent === true;
  if (checkLogin()) {
    return true;
  }

  if (activeLoginPromise) {
    const res = await activeLoginPromise;
    if (res || isSilent) {
      return res;
    }
  }

  activeLoginPromise = (async () => {
    try {
      return await performLogin(isSilent);
    } finally {
      activeLoginPromise = null;
    }
  })();

  return activeLoginPromise;
}

async function performLogin (isSilent: boolean): Promise<boolean> {
  // Ensure ptt client is connected
  const connected = await ensureConnectedPttClient();
  if (!connected) {
    if (!isSilent) {
      vscode.window.showWarningMessage('無法連線至 PTT 伺服器，請稍後再試。');
    }
    return false;
  }

  let { username, password } = await getLoginCredential(isSilent);

  const isGuest = username?.toLowerCase() === 'guest';
  if (!username || (password === undefined && !isGuest)) {
    if (!isSilent) {
      vscode.window.showWarningMessage('需要帳密才能使用 VSCode PTT 噢！');
    }
    return false;
  }

  const attemptLogin = async (user: string, pass: string): Promise<boolean> => {
    try {
      const kick = Boolean(vscode.workspace.getConfiguration().get('kickLogin') ?? true);
      const loginPromise = ptt.login(user, pass ?? '', kick);
      const timeoutPromise = new Promise<boolean>((_, reject) =>
        setTimeout(() => reject(new Error('Login timeout')), 15000)
      );
      await Promise.race([loginPromise, timeoutPromise]);
      return ptt.state?.login ?? false;
    } catch {
      return false;
    }
  };

  let success = await attemptLogin(username, password ?? '');

  // If login failed with stored credentials during manual login, prompt the user for new credentials
  if (!success && !isSilent) {
    const freshUsername = await vscode.window.showInputBox({
      placeHolder: '帳號',
      prompt: '登入失敗，請重新輸入 PTT 登入帳號',
      value: username || ''
    });

    if (freshUsername) {
      let freshPassword = '';
      if (freshUsername.toLowerCase() !== 'guest') {
        const inputPass = await vscode.window.showInputBox({
          placeHolder: '密碼',
          prompt: '請輸入 PTT 登入密碼',
          password: true
        });
        if (inputPass !== undefined) {
          freshPassword = inputPass;
        } else {
          return false;
        }
      }
      username = freshUsername;
      password = freshPassword;
      success = await attemptLogin(username, password);
    }
  }

  if (success) {
    ctx.globalState.update('username', username);
    ctx.globalState.update('password', password ?? '');
    updateLoginContext();
    refreshTreeView();
    if (!isSilent) {
      vscode.window.showInformationMessage(`以 ${username} 登入成功！`);
    }
    return true;
  } else {
    updateLoginContext();
    if (!isSilent) {
      vscode.window.showWarningMessage('登入失敗 QQ');
    }
    return false;
  }
}

async function pickFavorite (): Promise<string | null> {
  await login();
  if (!checkLogin()) {
    return null;
  }

  const favorites: FavoriteBoardItem[] = await ptt.getFavorite();
  // TODO: exclude subscribed boards
  const favoriteItems: vscode.QuickPickItem[] = favorites.filter(f => !f.divider).map(fav => {
    return {
      label: fav.boardname,
      description: fav.title
    };
  });

  const board = await vscode.window.showQuickPick(favoriteItems);
  if (board){
    return board.label;
  }
  return null;
}

function setSearchCondition(type: string, criteria: string): void
{
  ptt.setSearchCondition(type, criteria);
}

export async function activate(context: vscode.ExtensionContext) {
  ctx = context;
  logger.init();
  logger.log('Extension activating...');

  const persistedFavorites = ctx.globalState.get<FavoriteBoardItem[]>('cachedFavorites');
  if (persistedFavorites && persistedFavorites.length > 0) {
    store.setFavorites(persistedFavorites);
    logger.log(`Loaded ${persistedFavorites.length} cached favorites from persistent state.`);
  }

  if (!ptt) {
    const initialClient = await intializePttClient();
    setPttClient(initialClient);
  }

  pttViewController = new PttTreeViewController(ptt, ctx, checkLogin);
  pttViewController.render();
  setPttProvider(pttViewController);

  contentProvider = new ContentProvider(ptt, async () => {
    if (!checkLogin()) {
      await login(true);
    }
    return checkLogin();
  });
  setContentProvider(contentProvider);

  context.subscriptions.push(
    vscode.workspace.registerFileSystemProvider(ContentProvider.scheme, contentProvider, {
      isReadonly: true,
      isCaseSensitive: true
    })
  );

  updateLoginContext();

  context.subscriptions.push(vscode.commands.registerCommand('ptt.login', () => login(false)));
  context.subscriptions.push(vscode.commands.registerCommand('ptt.logout', async () => {
    const res = await vscode.window.showInformationMessage('你確定要登出嗎？登出會一併清除您的訂閱看板', '好', '算了');
    if (res === '好') {
      ctx.globalState.update('username', null);
      ctx.globalState.update('password', null);
      ctx.globalState.update('boardlist', []);
      ctx.globalState.update('cachedFavorites', []);
      store.clearAll();
      refreshTreeView();

      if (checkLogin()) {
        await ptt.send(`${key.ArrowLeft.repeat(10)}${key.ArrowRight}y${key.Enter}`);
        ptt._state.login = false;
      }
      updateLoginContext();

      vscode.window.showInformationMessage('已登出 PTT');
    }
  }));
	context.subscriptions.push(vscode.commands.registerCommand('ptt.add-board', async () => {
    await login();

    if (!checkLogin()) {
      return;
    }

    const boardName = await vscode.window.showInputBox({
      prompt: '輸入看板名稱',
      placeHolder: 'C_Chat'
    });

    if (boardName){
      const checkBoard = await ptt.enterBoard(boardName);
      if (!checkBoard) {
        vscode.window.showInformationMessage("此看板不存在");
        return;
      }
    }
    else{
      return;
    }

    const boardlist: string[] = ctx.globalState.get('boardlist') || [];
    const boards = [...new Set(boardlist.concat(boardName))];
    ctx.globalState.update('boardlist', boards.filter(Boolean));
    refreshTreeView();
  }));

  context.subscriptions.push(vscode.commands.registerCommand('ptt.show-article', async (sn, boardname) => {
    logger.log(`[ShowArticle] Opening /${boardname}/${sn}.ptt`);
    const uri = vscode.Uri.from({
      scheme: ContentProvider.scheme,
      path: `/${boardname}/${sn}.ptt`
    });
    const doc = await vscode.workspace.openTextDocument(uri);
    await vscode.window.showTextDocument(doc, vscode.ViewColumn.Active);
  }));

  context.subscriptions.push(vscode.commands.registerCommand('ptt.remove-board', (board: Board | unknown) => {
    const boardname = getBoardNameFromItem(board);
    if (!boardname) {
      return;
    }
    const boardlist: string[] = ctx.globalState.get('boardlist') || [];
    const boards = boardlist.filter(b => b !== boardname);
    ctx.globalState.update('boardlist', boards.filter(Boolean));
    refreshTreeView();
  }));

  context.subscriptions.push(vscode.commands.registerCommand('ptt.refresh-article', async (board?: unknown) => {
    if (!checkLogin()) {
      return;
    }
    await vscode.window.withProgress({ location: { viewId: 'pttTree' } }, async () => {
      const specificBoard = typeof board === 'string' ? board : getBoardNameFromItem(board);
      if (specificBoard) {
        logger.log(`[Refresh] Refreshing board: ${specificBoard}`);
        contentProvider?.clearCache(specificBoard);
        store.release(specificBoard);
        const articles = await ptt.getArticles(specificBoard);
        logger.log(`[Refresh] Loaded ${articles?.length || 0} articles for ${specificBoard}`);
        store.add(specificBoard, articles);
        refreshTreeView();
        return;
      }

      logger.log('[Refresh] Refreshing all loaded boards and favorites...');
      contentProvider?.clearCache();
      store.clearFavorites();
      ctx.globalState.update('cachedFavorites', []);
      ptt.resetSearchCondition();
      const boards = store.getBoardNames();
      for (const boardname of boards) {
        store.release(boardname);
        const articles = await ptt.getArticles(boardname);
        store.add(boardname, articles);
      }
      refreshTreeView();
    });
  }));

  context.subscriptions.push(vscode.commands.registerCommand('ptt.load-more-article', async (boardnameOrItem: string | unknown) => {
    const boardname = typeof boardnameOrItem === 'string'
      ? boardnameOrItem
      : getBoardNameFromItem(boardnameOrItem);

    logger.log('[LoadMore] Invoked with argument:', { raw: boardnameOrItem, resolvedBoard: boardname });
    if (!boardname) {
      logger.error('[LoadMore] Could not resolve board name from:', boardnameOrItem);
      return;
    }
    const lastSn = store.lastSn(boardname);
    logger.log(`[LoadMore] Current lastSn for ${boardname} is ${lastSn}`);

    if (lastSn <= 1 && !store.isEmpty(boardname)) {
      vscode.window.showInformationMessage('已載入此看板所有歷史文章');
      return;
    }

    await vscode.window.withProgress({ location: { viewId: 'pttTree' } }, async () => {
      const targetSn = lastSn > 0 ? Math.max(lastSn - 1, 1) : 0;
      logger.log(`[LoadMore] Fetching older articles for ${boardname} (target cursor SN: ${targetSn})...`);
      const articles = await ptt.getArticles(boardname, targetSn);
      logger.log(`[LoadMore] Received ${articles?.length || 0} older articles for ${boardname}`);

      if (articles?.length > 0) {
        store.add(boardname, articles);
        logger.log(`[LoadMore] Total articles now in store for ${boardname}: ${store.asList(boardname).length}`);
      }
      refreshTreeView();
    });
  }));

  context.subscriptions.push(vscode.commands.registerCommand('ptt.release-board', async (board: Board | unknown) => {
    const boardname = getBoardNameFromItem(board);
    if (!boardname) {
      return;
    }
    contentProvider?.clearCache(boardname);
    store.release(boardname);
    refreshTreeView();
  }));

  context.subscriptions.push(vscode.commands.registerCommand('ptt.search-board-by-push', async (board: Board | unknown) => {
    const boardname = getBoardNameFromItem(board);
    if (!boardname) {
      return;
    }
    let push = await vscode.window.showInputBox({
      prompt: '輸入推文數',
      placeHolder: '0 ~ 100'
    });

    if (Number(push) > 100)
    {
      push = '100';
    }

    if (store.isEmpty(boardname) === false)
    {
      store.release(boardname);
    }

    vscode.window.showInformationMessage('開始搜尋');
    setSearchCondition("push", push);
    const pushArticles: ArticleListItem[] = await ptt.getArticles(boardname);
    vscode.window.showInformationMessage('完成搜尋');

    store.add(boardname, pushArticles);
    refreshTreeView();
  }));

  context.subscriptions.push(
    vscode.commands.registerCommand('ptt.favorite-board', async () => {
      const boardlist: string[] = ctx.globalState.get('boardlist') || [];
      const boardName = await pickFavorite();
      if (!boardName) {
        return;
      }
      const boards = [...new Set(boardlist.concat(boardName))];
      ctx.globalState.update('boardlist', boards.filter(Boolean));
      refreshTreeView();
    })
  );

  await login(true);
}

// this method is called when your extension is deactivated
export function deactivate() {}
