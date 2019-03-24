import * as vscode from 'vscode';
import PTT from 'ptt-client';
import key from 'ptt-client/dist/utils/keyboard';

(global as any).WebSocket = require('ws');

import initProxy from './proxy';
import { PttTreeDataProvider, Board } from './pttDataProvider';
import ContentProvider from './provider';

let proxyServer;
let proxyAddress;
let ptt;
let ctx: vscode.ExtensionContext;
let pttProvider: PttTreeDataProvider;

async function intializeProxy () {
  const { server, address } = await initProxy();
  proxyServer = server;
  proxyAddress = address;
}

function intializePttClient (url: string) {
  return new Promise(resolve => {
    const ptt = new PTT({ url });
    ptt.once('connect', () => resolve(ptt));
  });
}

function checkLogin () {
  const { login } = ptt.state;
  return login;
}

async function getLoginCredential (silent = false) {
  let username = ctx.globalState.get('username');
  let password = ctx.globalState.get('password');

  if ((username && password) || silent) {
    return { username, password };
  }

  username = await vscode.window.showInputBox({
    placeHolder: '帳號',
    prompt: '請輸入 PTT 登入帳號'
  });

  if (!username) {
    return {};
  }

  password = await vscode.window.showInputBox({
    placeHolder: '密碼',
    prompt: '請輸入 PTT 登入密碼',
    password: true
  });

  return { username, password };
}

async function login (silent = false) {
  if (checkLogin()) {
    return;
  }

  const { username, password } = await getLoginCredential(silent);

  if (!username || !password) {
    if (!silent) {
      vscode.window.showWarningMessage('需要帳密才能使用 VSCode PTT 噢！');
    }
    return;
  }

  await ptt.login(username, password);
  var { login } = ptt.state;
  if (login) {
    ctx.globalState.update('username', username);
    ctx.globalState.update('password', password);
    pttProvider.refresh();
    if (!silent) {
      vscode.window.showInformationMessage(`以 ${username} 登入成功！`);
    }
  } else {
    if (!silent) {
      vscode.window.showWarningMessage('登入失敗 QQ');
    }
  }
}

async function pickFavorite (): Promise<string> {
  await login();

  const favorites = await ptt.getFavorite();
  const favoriteItems: vscode.QuickPickItem[] = favorites.filter(f => !f.divider).map(fav => {
    return {
      label: fav.boardname,
      description: fav.title
    };
  });

  const board = await vscode.window.showQuickPick(favoriteItems);
  return board.label;
}

export async function activate(context: vscode.ExtensionContext) {
  ctx = context;

  if (!proxyServer) {
    await intializeProxy();
  }

  if (!ptt) {
    ptt = await intializePttClient(proxyAddress);
  }

  pttProvider = new PttTreeDataProvider(ptt, ctx);
  vscode.window.registerTreeDataProvider('pttTree', pttProvider);

  const provider = new ContentProvider(ptt);
  context.subscriptions.push(vscode.workspace.registerTextDocumentContentProvider(ContentProvider.scheme, provider));

  context.subscriptions.push(vscode.commands.registerCommand('ptt.login', login));
  context.subscriptions.push(vscode.commands.registerCommand('ptt.logout', async () => {
    if (!checkLogin()) {
      return;
    }

    const res = await vscode.window.showInformationMessage('你確定要登出嗎？登出會一併清除您的訂閱看板', '好', '算了');
    if (res === '好') {
      ctx.globalState.update('username', null);
      ctx.globalState.update('password', null);
      ctx.globalState.update('boardlist', []);
      pttProvider.refresh();

      // logout
      await ptt.send(`${key.ArrowLeft.repeat(10)}${key.ArrowRight}y${key.Enter}`);
      // !FIXME: should be fixed in upstream  ptt-client library
      ptt._state.login = false;

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
    pttProvider.refresh();
  }));

  await login(true);
}

// this method is called when your extension is deactivated
export function deactivate() {}
