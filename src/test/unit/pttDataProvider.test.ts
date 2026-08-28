import * as assert from 'assert';
import * as vscode from 'vscode';
import { PttTreeDataProvider, Board, Article, StartupChildren, ChildrenFactory, ArticleChildren } from '../../pttDataProvider';
import { MockPttClient } from './mockPttClient';
import store from '../../store';

describe('PttDataProvider Unit Tests', () => {
  beforeEach(() => {
    store.release('Gossiping');
    store.release('C_Chat');
  });

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

    const mockPtt = new MockPttClient();
    const factory = new ChildrenFactory(undefined, mockPtt, mockContext);
    const handler = factory.getChidrenType();
    assert.ok(handler instanceof StartupChildren);
  });

  it('ChildrenFactory creates ArticleChildren when element is provided', () => {
    const mockContext = {
      globalState: { get: () => [] }
    } as unknown as vscode.ExtensionContext;
    const board = new Board('Gossiping', vscode.TreeItemCollapsibleState.Collapsed);

    const mockPtt = new MockPttClient();
    const factory = new ChildrenFactory(board, mockPtt, mockContext);
    const handler = factory.getChidrenType();
    assert.ok(handler instanceof ArticleChildren);
  });

  describe('PttTreeDataProvider State Transitions', () => {
    it('returns empty children when logged out', async () => {
      const mockPtt = new MockPttClient(false); // login: false
      const mockContext = {
        globalState: { get: () => ['Gossiping'] }
      } as unknown as vscode.ExtensionContext;

      const provider = new PttTreeDataProvider(mockPtt, mockContext);
      const children = await provider.getChildren();

      assert.deepStrictEqual(children, []);
    });

    it('returns subscribed boards when logged in', async () => {
      const mockPtt = new MockPttClient(true); // login: true
      const mockContext = {
        globalState: {
          get: (key: string) => (key === 'boardlist' ? ['Gossiping', 'C_Chat'] : undefined)
        }
      } as unknown as vscode.ExtensionContext;

      const provider = new PttTreeDataProvider(mockPtt, mockContext);
      const children = await provider.getChildren();

      assert.strictEqual(children.length, 2);
      assert.strictEqual((children[0] as Board).boardname, 'C_Chat');
      assert.strictEqual((children[1] as Board).boardname, 'Gossiping');
    });

    it('fetches and caches articles when expanding a board', async () => {
      const mockPtt = new MockPttClient(true);
      mockPtt.articlesByBoard['Gossiping'] = [
        {
          sn: 1001,
          push: '爆',
          date: '08/27',
          fixed: false,
          author: 'user1',
          status: '',
          title: 'Article 1'
        },
        {
          sn: 1002,
          push: '50',
          date: '08/27',
          fixed: true,
          author: 'admin',
          status: '!',
          title: 'Pinned Article'
        }
      ];

      const mockContext = {
        globalState: { get: () => ['Gossiping'] }
      } as unknown as vscode.ExtensionContext;

      const provider = new PttTreeDataProvider(mockPtt, mockContext);
      const boardNode = new Board('Gossiping', vscode.TreeItemCollapsibleState.Collapsed);

      // First fetch (cache-miss)
      const articleNodes = await provider.getChildren(boardNode);

      // Should return pinned first, then regular, plus "LoadMoreArticle" node
      assert.strictEqual(articleNodes.length, 3);
      assert.strictEqual(store.isEmpty('Gossiping'), false);
      assert.strictEqual(store.asList('Gossiping').length, 2);

      // Verify second fetch uses cache (clear mockPtt backend to prove it hits store cache)
      mockPtt.articlesByBoard['Gossiping'] = [];
      const cachedNodes = await provider.getChildren(boardNode);
      assert.strictEqual(cachedNodes.length, 3);
    });

    it('fires onDidChangeTreeData event on refresh', (done) => {
      const mockPtt = new MockPttClient(true);
      const mockContext = {
        globalState: { get: () => [] }
      } as unknown as vscode.ExtensionContext;

      const provider = new PttTreeDataProvider(mockPtt, mockContext);

      provider.onDidChangeTreeData((element) => {
        assert.strictEqual(element, undefined);
        done();
      });

      provider.refresh();
    });
  });
});
