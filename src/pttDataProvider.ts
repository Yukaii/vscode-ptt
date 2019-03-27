import * as vscode from 'vscode';

import store from './store';

type Node = Board | Article | LoadMoreArticle;

export class PttTreeDataProvider implements vscode.TreeDataProvider<Node> {
  constructor (private ptt, private ctx: vscode.ExtensionContext) {}

	private _onDidChangeTreeData: vscode.EventEmitter<Board | undefined> = new vscode.EventEmitter<Board | undefined>();
  readonly onDidChangeTreeData: vscode.Event<Board | undefined> = this._onDidChangeTreeData.event;

  refresh(): void {
		this._onDidChangeTreeData.fire();
  }

  getTreeItem (element: Board): vscode.TreeItem {
		return element;
	}

	async getChildren (element?: Node): Promise<Node[]> {
    if (!this.ptt.state.login) {
      return [];
    }

    if (element) {
      // expand board node
      const articleNodes = await this.createArticleList((element as Board).boardname);
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

  private async createArticleList (boardname: string) {
    let articles = store.asList(boardname);
    if (articles.length === 0) {
      articles = await this.ptt.getArticles(boardname);
      store.add(boardname, articles);
    }

    return [
      ...store.asList(boardname).map(article => new Article(
        `${article.status} ${article.title}`,
        vscode.TreeItemCollapsibleState.None,
        {
          command: 'ptt.show-article',
          title: '',
          arguments: [article.sn, boardname]
        }
      )),
      new LoadMoreArticle(boardname)
    ];
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

class LoadMoreArticle extends vscode.TreeItem {
  constructor (boardname: string) {
    super('載入更多文章', vscode.TreeItemCollapsibleState.None);

    this.command = {
      command: 'ptt.load-more-article',
      title: '',
      arguments: [boardname]
    };
  }
}
