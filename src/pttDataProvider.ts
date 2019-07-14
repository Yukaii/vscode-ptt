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

  getTreeItem (element: Node): vscode.TreeItem {
		return element;
	}

	async getChildren (element?: Node): Promise<Node[]> {
    if (!this.ptt.state.login) {
      return [];
    }

    let childrenFactory = new ChildrenFactory(element, this.ptt, this.ctx);
    return childrenFactory.getChidrenType().getNode();
  }
}

export interface IChildren{
  getNode(): Promise<Node[]>;
}

export class ArticleChildren implements IChildren
{
  element: Node;
  ptt: any;

  constructor(element: Node, ptt: any)
  {
    this.element = element;
    this.ptt = ptt;
  }
  
  async getNode(): Promise<Node[]>
  {
    const articleNodes = await this.createArticleList((this.element as Board).boardname);
    return articleNodes;
  }
  
  async createArticleList(boardname: string)
  {
    let articles = store.asList(boardname);
    if (articles.length === 0) {
      articles = await this.ptt.getArticles(boardname);
      store.add(boardname, articles);
    }
  
    let articlesList: (Article | LoadMoreArticle)[] = [
      ...store.asList(boardname).map(article => new Article(
        Number(article.sn),
        `${article.push} ${article.status} ${article.title}`,
        vscode.TreeItemCollapsibleState.None,
        {
          command: 'ptt.show-article',
          title: '',
          arguments: [article.sn, boardname]
        }
      )).sort((article1, article2) => { // revert sorting order
        if (article1.sn > article2.sn) { return -1; }
        else if (article1.sn < article2.sn) { return 1; }
        return 0;
      }),
      new LoadMoreArticle(boardname)
    ];

    return articlesList;
  }
}

export class StartupChildren implements IChildren
{
  ctx: vscode.ExtensionContext;
  
  constructor(ctx: vscode.ExtensionContext)
  {
    this.ctx = ctx;
  }

  async getNode(): Promise<Node[]>
  {
    const boardlist: string[] = this.ctx.globalState.get('boardlist') || [];
    if (boardlist.length > 0) {
      return boardlist.sort().map(board => new Board(board, vscode.TreeItemCollapsibleState.Collapsed));
    } else {
      return [];
    }
  }
}

export class ChildrenFactory
{
  element: Node;
  ptt: any;
  ctx: vscode.ExtensionContext;

  constructor(element: Node, ptt: any, ctx: vscode.ExtensionContext)
  {
    this.element = element;
    this.ptt = ptt;
    this.ctx = ctx;
  }

  getChidrenType(): IChildren
  {
    if (this.element === undefined)
    {
      return new StartupChildren(this.ctx);
    }
    else
    {
      return new ArticleChildren(this.element, this.ptt);
    }
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
    public readonly sn: number,
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
