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

	let disposable = vscode.commands.registerCommand('extension.helloWorld', async () => {
    const { login } = ptt.state;

    if (!login) {
      await ptt.login(process.env.USERNAME, process.env.PASSWORD)
    }

    let articles = await ptt.getArticles('C_Chat');
    console.log(articles);

		// Display a message box to the user
		// vscode.window.showInformationMessage('Hello World!');
	});

	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}
