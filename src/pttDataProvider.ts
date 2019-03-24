import * as vscode from 'vscode';
import * as path from 'path';

export class PttTreeDataProvider implements vscode.TreeDataProvider<Board> {
  constructor (private ptt, private ctx: vscode.ExtensionContext) {}

	private _onDidChangeTreeData: vscode.EventEmitter<Board | undefined> = new vscode.EventEmitter<Board | undefined>();
  readonly onDidChangeTreeData: vscode.Event<Board | undefined> = this._onDidChangeTreeData.event;

  refresh(): void {
		this._onDidChangeTreeData.fire();
  }

  getTreeItem (element: Board): vscode.TreeItem {
		return element;
	}

	async getChildren (element?: Board): Promise<Board[]> {
    if (!this.ptt.state.login) {
      return [];
    }

    if (element) {
      // expand board node
      const articleNodes = await this.createArticleList(element.boardname);
      return articleNodes;
    } else {
      // list board nodes
      const boardlist: string[] = this.ctx.globalState.get('boardlist') || [];
      if (boardlist.length > 0) {
        return boardlist.sort().map(board => new Board(board, vscode.TreeItemCollapsibleState.Collapsed));
      } else {
        return [];
      }
    }
  }

  private async createArticleList (boardname) {
    const articles = await this.ptt.getArticles(boardname);
    return articles.map(article => new Article(
      `${article.status} ${article.title}`,
      vscode.TreeItemCollapsibleState.None,
      {
        command: 'ptt.show-article',
        title: '',
        arguments: [article.sn, boardname]
      }
    ));
  }
}

export class Board extends vscode.TreeItem {
  constructor (
    public readonly boardname: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly command?: vscode.Command
  ) {
    super(boardname, collapsibleState);
  }

  contextValue = 'board';
}

export class Article extends vscode.TreeItem {
	constructor(
		public readonly title: string,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,
		public readonly command?: vscode.Command
	) {
		super(title, collapsibleState);
  }

  contextValue = 'article';
}
