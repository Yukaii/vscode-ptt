import * as vscode from 'vscode';
import PTT from 'ptt-client';

(global as any).WebSocket = require('ws');

import initProxy from './proxy';
import { ArticleProvider } from './articleProvider';

let proxyServer;
let proxyAddress;
let ptt;

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

async function login () {
  if (checkLogin()) {
    return;
  }

  const username = await vscode.window.showInputBox({
    placeHolder: '帳號'
  });

  const password = await vscode.window.showInputBox({
    placeHolder: '密碼',
    password: true
  });

  await ptt.login(username, password);
  var { login } = ptt.state;
  if (login) {
    // TODO: Save credentials
    vscode.window.showInformationMessage('登入成功！');
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
  if (!proxyServer) {
    await intializeProxy();
  }

  if (!ptt) {
    ptt = await intializePttClient(proxyAddress);
  }

  const articleProvider = new ArticleProvider(ptt);
  vscode.window.registerTreeDataProvider('articleList', articleProvider);

	context.subscriptions.push(vscode.commands.registerCommand('ptt.login', login));
}

// this method is called when your extension is deactivated
export function deactivate() {}
