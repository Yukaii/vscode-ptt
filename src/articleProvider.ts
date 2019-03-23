import * as vscode from 'vscode';

export class ArticleProvider implements vscode.TreeDataProvider<Article> {
  constructor (private ptt) {}

  getTreeItem(element: Article): vscode.TreeItem {
		return element;
	}

	getChildren(element?: Article): Thenable<Article[]> {
    return Promise.resolve([]);
  }
}

export class Article extends vscode.TreeItem {
	constructor(
		public readonly title: string,
		private version: string,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,
		public readonly command?: vscode.Command
	) {
		super(title, collapsibleState);
	}

	get tooltip(): string {
		return `${this.title}-${this.version}`;
	}

	get description(): string {
		return this.version;
	}

	// iconPath = {
	// 	light: path.join(__filename, '..', '..', 'resources', 'light', 'dependency.svg'),
	// 	dark: path.join(__filename, '..', '..', 'resources', 'dark', 'dependency.svg')
	// };

	// contextValue = 'dependency';
}
