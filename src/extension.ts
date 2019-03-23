import * as vscode from 'vscode';
import PTT from 'ptt-client';

(global as any).WebSocket = require('ws');

import initProxy from './proxy';
import { PttTreeDataProvider, Board } from './pttDataProvider';

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

async function getLoginCredential () {
  let username = ctx.globalState.get('username');
  let password = ctx.globalState.get('password');

  if (username && password) {
    return { username, password };
  }

  username = await vscode.window.showInputBox({
    placeHolder: '帳號'
  });

  password = await vscode.window.showInputBox({
    placeHolder: '密碼',
    password: true
  });

  return { username, password };
}

async function login () {
  if (checkLogin()) {
    return;
  }

  const { username, password } = await getLoginCredential();

  await ptt.login(username, password);
  var { login } = ptt.state;
  if (login) {
    ctx.globalState.update('username', username);
    ctx.globalState.update('password', password);
    pttProvider.refresh();
    vscode.window.showInformationMessage(`以 ${username} 登入成功！`);
  } else {
    vscode.window.showWarningMessage('登入失敗 QQ');
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

	context.subscriptions.push(vscode.commands.registerCommand('ptt.login', login));
	context.subscriptions.push(vscode.commands.registerCommand('ptt.add-board', async function () {
    await login();

    const boardName = await vscode.window.showInputBox({
      prompt: '輸入看板名稱',
      placeHolder: 'C_Chat'
    });

    const boardlist: string[] = ctx.globalState.get('boardlist') || [];
    const boards = [...new Set(boardlist.concat(boardName))];
    ctx.globalState.update('boardlist', boards.filter(Boolean));
    pttProvider.refresh();
  }));

  context.subscriptions.push(vscode.commands.registerCommand('ptt.show-article', (sn, boardname) => {
    vscode.window.showInformationMessage(`ID: ${sn}, board: ${boardname}`);
  }));

  context.subscriptions.push(vscode.commands.registerCommand('ptt.remove-board', (board: Board) => {
    const boardlist: string[] = ctx.globalState.get('boardlist') || [];
    const boards = boardlist.filter(b => b !== board.boardname);
    ctx.globalState.update('boardlist', boards.filter(Boolean));
    pttProvider.refresh();
  }));

  // TODO: make this silent
  await login();
}

// this method is called when your extension is deactivated
export function deactivate() {}
