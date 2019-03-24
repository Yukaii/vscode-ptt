'use strict';

import * as vscode from 'vscode';

export default class Provider implements vscode.TextDocumentContentProvider {
  static scheme = 'ptt';

  private _subscriptions: vscode.Disposable;

  constructor (private ptt) {}

	dispose() {
		this._subscriptions.dispose();
	}

	async provideTextDocumentContent(uri: vscode.Uri): Promise<string> {
    const [boardname, sn] = uri.path.split('/');
    const article = await this.ptt.getArticle(boardname, sn);

    return article.lines.join('\n');
	}
}
