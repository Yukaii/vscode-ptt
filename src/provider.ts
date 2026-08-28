import * as vscode from 'vscode';
import { IPttClient } from './types';

export default class Provider implements vscode.TextDocumentContentProvider {
  static scheme = 'ptt';

  private _subscriptions: vscode.Disposable;

  constructor (private ptt: IPttClient) {}

	dispose() {
		if (this._subscriptions) {
			this._subscriptions.dispose();
		}
	}

	async provideTextDocumentContent(uri: vscode.Uri): Promise<string> {
    const [boardname, sn] = uri.path.split('/');
    const article = await this.ptt.getArticle(boardname, sn);

    return article.lines.join('\n');
	}
}
