import * as vscode from 'vscode';
import WebSocket from 'ws';
import PTT from 'ptt-client';
import key from 'ptt-client/dist/utils/keymap';

(global as any).WebSocket = WebSocket;

import { PttTreeDataProvider, Board } from './pttDataProvider';
import ContentProvider from './provider';
import store, { ArticleListItem } from './store';
import { IPttClient, FavoriteBoardItem } from './types';

export { FavoriteBoardItem } from './types';

let ptt: IPttClient;
let ctx: vscode.ExtensionContext;
let pttProvider: PttTreeDataProvider;
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

export function setPttClient (client: IPttClient) {
  ptt = client;
  pttProvider?.setPtt?.(client);
  contentProvider?.setPtt?.(client);
  if (client?.on) {
    client.on('stateChange', () => updateLoginContext());
    client.on('disconnect', () => updateLoginContext());
  }
  updateLoginContext();
}

export function setExtensionContext (context: vscode.ExtensionContext) {
  ctx = context;
}

export function setPttProvider (provider: PttTreeDataProvider) {
  pttProvider = provider;
}

export function setContentProvider (provider: ContentProvider) {
  contentProvider = provider;
}

export function checkLogin () {
  return ptt?.state?.login ?? false;
}

export async function ensureConnectedPttClient (): Promise<boolean> {
  if (ptt && ptt.state?.connect) {
    return true;
  }
  const newClient = await pttClientFactory();
  setPttClient(newClient);
  return Boolean(newClient?.state?.connect);
}

export async function getLoginCredential (silent = false): Promise<{ username?: string; password?: string }> {
  const isSilent = silent === true;
  let username = ctx?.globalState?.get<string>('username');
  let password = ctx?.globalState?.get<string>('password');

  const hasCredentials = Boolean(username && ((password !== undefined && password !== null) || username.toLowerCase() === 'guest'));

  if (hasCredentials || isSilent) {
    return { username, password: password ?? '' };
  }

  username = await vscode.window.showInputBox({
    placeHolder: '帳號',
    prompt: '請輸入 PTT 登入帳號',
    value: username || ''
  });

  if (!username) {
    return {};
  }

  if (username.toLowerCase() === 'guest') {
    password = '';
  } else {
    password = await vscode.window.showInputBox({
      placeHolder: '密碼',
      prompt: '請輸入 PTT 登入密碼',
      password: true
    });

    if (password === undefined) {
      return {};
    }
  }

  return { username, password };
}

export async function login (silent = false) {
  const isSilent = silent === true;
  if (checkLogin()) {
    return;
  }

  // Ensure ptt client is connected
  const connected = await ensureConnectedPttClient();
  if (!connected) {
    if (!isSilent) {
      vscode.window.showWarningMessage('無法連線至 PTT 伺服器，請稍後再試。');
    }
    return;
  }

  let { username, password } = await getLoginCredential(isSilent);

  const isGuest = username?.toLowerCase() === 'guest';
  if (!username || (password === undefined && !isGuest)) {
    if (!isSilent) {
      vscode.window.showWarningMessage('需要帳密才能使用 VSCode PTT 噢！');
    }
    return;
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
          return;
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
    pttProvider?.refresh();
    if (!isSilent) {
      vscode.window.showInformationMessage(`以 ${username} 登入成功！`);
    }
  } else {
    updateLoginContext();
    if (!isSilent) {
      vscode.window.showWarningMessage('登入失敗 QQ');
    }
  }
}

async function pickFavorite (): Promise<string | null> {
  await login();
  if (!checkLogin()) {
    return null;
  }

  const favorites:FavoriteBoardItem[] = await ptt.getFavorite();
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
  else{
    return null;
  }
}

function setSearchCondition(type: string, criteria: string): void
{
  ptt.setSearchCondition(type, criteria);
}

export async function activate(context: vscode.ExtensionContext) {
  ctx = context;

  if (!ptt) {
    ptt = await intializePttClient();
  }

  pttProvider = new PttTreeDataProvider(ptt, ctx);
  vscode.window.registerTreeDataProvider('pttTree', pttProvider);

  contentProvider = new ContentProvider(ptt);
  context.subscriptions.push(vscode.workspace.registerTextDocumentContentProvider(ContentProvider.scheme, contentProvider));

  updateLoginContext();

  context.subscriptions.push(vscode.commands.registerCommand('ptt.login', () => login(false)));
  context.subscriptions.push(vscode.commands.registerCommand('ptt.logout', async () => {
    const res = await vscode.window.showInformationMessage('你確定要登出嗎？登出會一併清除您的訂閱看板', '好', '算了');
    if (res === '好') {
      ctx.globalState.update('username', null);
      ctx.globalState.update('password', null);
      ctx.globalState.update('boardlist', []);
      pttProvider?.refresh();

      if (checkLogin()) {
        // logout
        await ptt.send(`${key.ArrowLeft.repeat(10)}${key.ArrowRight}y${key.Enter}`);
        // !FIXME: should be fixed in upstream  ptt-client library
        ptt._state.login = false;
      }
      updateLoginContext();

      vscode.window.showInformationMessage('已登出 PTT');
    }
  }));
	context.subscriptions.push(vscode.commands.registerCommand('ptt.add-board', async function () {
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
    pttProvider.refresh();
  }));

  context.subscriptions.push(vscode.commands.registerCommand('ptt.show-article', async (sn, boardname) => {
    const doc = await vscode.workspace.openTextDocument(vscode.Uri.parse(`${ContentProvider.scheme}:${boardname}/${sn}`));
    await vscode.window.showTextDocument(doc, vscode.ViewColumn.Active);
  }));

  context.subscriptions.push(vscode.commands.registerCommand('ptt.remove-board', (board: Board) => {
    const boardlist: string[] = ctx.globalState.get('boardlist') || [];
    const boards = boardlist.filter(b => b !== board.boardname);
    ctx.globalState.update('boardlist', boards.filter(Boolean));
    pttProvider.refresh();
  }));

  context.subscriptions.push(vscode.commands.registerCommand('ptt.refresh-article', () => {
    if (!checkLogin()) {
      return;
    }
    ptt.resetSearchCondition();
    const boards = store.getBoardNames();
    boards.forEach(async (boardname: string) => {
      store.release(boardname);
      const articles = await ptt.getArticles(boardname);
      store.add(boardname, articles);
      pttProvider?.refresh();
    });
  }));

  context.subscriptions.push(vscode.commands.registerCommand('ptt.load-more-article', async (boardname: string) => {
    const lastSn = store.lastSn(boardname);
    const articles = await ptt.getArticles(boardname, lastSn - 1);
    store.add(boardname, articles);
    pttProvider.refresh();
  }));

  context.subscriptions.push(vscode.commands.registerCommand('ptt.release-board', async (board: Board) => {
    store.release(board.boardname);
    pttProvider.refresh();
  }));

  context.subscriptions.push(vscode.commands.registerCommand('ptt.search-board-by-push', async (board: Board) => {
    let push = await vscode.window.showInputBox({
      prompt: '輸入推文數',
      placeHolder: '0 ~ 100'
    });

    if (Number(push) > 100)
    {
      push = '100';
    }

    if (store.isEmpty(board.boardname) === false)
    {
      store.release(board.boardname);
    }

    vscode.window.showInformationMessage('開始搜尋');
    setSearchCondition("push", push);
    const pushArticles: ArticleListItem[] = await ptt.getArticles(board.boardname);
    vscode.window.showInformationMessage('完成搜尋');

    store.add(board.boardname, pushArticles);
    pttProvider.refresh();
  }));

  context.subscriptions.push(
    vscode.commands.registerCommand('ptt.favorite-board', async () => {
      const boardlist: string[] = ctx.globalState.get('boardlist') || [];
      const boardName = await pickFavorite();
      const boards = [...new Set(boardlist.concat(boardName))];
      ctx.globalState.update('boardlist', boards.filter(Boolean)); //check if board exist?
      pttProvider.refresh();
    })
  );

  await login(true);
}

// this method is called when your extension is deactivated
export function deactivate() {}
