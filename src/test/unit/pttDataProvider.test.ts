import * as assert from 'assert';
import * as vscode from 'vscode';
import { Board, Article, StartupChildren, ChildrenFactory, ArticleChildren } from '../../pttDataProvider';

describe('PttDataProvider Unit Tests', () => {
  it('creates Board tree item with correct properties', () => {
    const board = new Board('Gossiping', vscode.TreeItemCollapsibleState.Collapsed);
    assert.strictEqual(board.label, 'Gossiping');
    assert.strictEqual(board.collapsibleState, vscode.TreeItemCollapsibleState.Collapsed);
    assert.strictEqual(board.contextValue, 'board');
  });

  it('creates Article tree item with correct properties', () => {
    const article = new Article(1234, '[問卦] 測試文章', vscode.TreeItemCollapsibleState.None);
    assert.strictEqual(article.sn, 1234);
    assert.strictEqual(article.label, '[問卦] 測試文章');
    assert.strictEqual(article.contextValue, 'article');
  });

  it('StartupChildren returns boards from globalState', async () => {
    const mockContext = {
      globalState: {
        get: (key: string) => {
          if (key === 'boardlist') {
            return ['Gossiping', 'C_Chat', 'Baseball'];
          }
          return undefined;
        }
      }
    } as unknown as vscode.ExtensionContext;

    const startupChildren = new StartupChildren(mockContext);
    const nodes = await startupChildren.getNode();

    assert.strictEqual(nodes.length, 3);
    // Should be sorted alphabetically
    assert.strictEqual((nodes[0] as Board).boardname, 'Baseball');
    assert.strictEqual((nodes[1] as Board).boardname, 'C_Chat');
    assert.strictEqual((nodes[2] as Board).boardname, 'Gossiping');
  });

  it('ChildrenFactory creates StartupChildren when element is undefined', () => {
    const mockContext = {
      globalState: { get: () => [] }
    } as unknown as vscode.ExtensionContext;

    const factory = new ChildrenFactory(undefined, {}, mockContext);
    const handler = factory.getChidrenType();
    assert.ok(handler instanceof StartupChildren);
  });

  it('ChildrenFactory creates ArticleChildren when element is provided', () => {
    const mockContext = {
      globalState: { get: () => [] }
    } as unknown as vscode.ExtensionContext;
    const board = new Board('Gossiping', vscode.TreeItemCollapsibleState.Collapsed);

    const factory = new ChildrenFactory(board, {}, mockContext);
    const handler = factory.getChidrenType();
    assert.ok(handler instanceof ArticleChildren);
  });
});
