// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
(global as any).WebSocket = require('ws');

const path = require('path');
require('./proxy');

require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

import PTT from 'ptt-client';

const ptt = new PTT({
  url: 'ws://127.0.0.1:9770',
});

let firstTime = true;

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
		console.log('Congratulations, your extension "vscode-ptt" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('extension.helloWorld', async () => {

    // The code you place here will be executed every time your command is executed
    if (firstTime) {
      // !FIXME: workaround for PTT not get initialized properly
      await sleep(1000);
      firstTime = false;
    }

    const isLogin = await ptt.login(process.env.USERNAME, process.env.PASSWORD)
    if (!isLogin) {
      // TODO: handle this

      return;
    }

    // get last 20 articles from specific board
    let articles = await ptt.getArticles('C_Chat');
    console.log(articles);
    // // get the content of specific article
    // let article = await ptt.getArticle('C_Chat', articles[articles.length-1].sn);
    // console.log(article);

		// Display a message box to the user
		// vscode.window.showInformationMessage('Hello World!');
	});

	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}
