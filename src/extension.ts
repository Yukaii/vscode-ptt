import * as vscode from 'vscode';
(global as any).WebSocket = require('ws');
import initProxy from './proxy';
import PTT from 'ptt-client';

import * as path from 'path';
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

let proxyServer;
let proxyAddress;

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

let ptt;

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {
  if (!proxyServer) {
    await intializeProxy();
  }

  if (!ptt) {
    ptt = await intializePttClient(proxyAddress);
  }

	context.subscriptions.push(vscode.commands.registerCommand('ptt.login', async () => {
    const username = await vscode.window.showInputBox({
      placeHolder: '帳號'
    });

    const password = await vscode.window.showInputBox({
      placeHolder: '密碼',
      password: true
    });

    await ptt.login(username, password);
    const { login } = ptt.state;
    if (login) {
      // TODO: Save credentials
      vscode.window.showInformationMessage('登入成功！');
    } else {
      vscode.window.showWarningMessage('登入失敗 QQ');
    }
	}));
}

// this method is called when your extension is deactivated
export function deactivate() {}
