import assert from 'node:assert';
import type * as vscode from 'vscode';
import { PttTreeViewController, getBoardNameFromItem } from '../../views/PttTreeView';
import { MockPttClient } from './mockPttClient';
import store from '../../store';
import type { FavoriteBoardItem } from '../../types';

describe('PttTreeView Component and Controller Tests', () => {
  beforeEach(() => {
    store.release('Gossiping');
    store.release('C_Chat');
    store.release('Stock');
  });

  describe('getBoardNameFromItem', () => {
    it('extracts board name from string', () => {
      assert.strictEqual(getBoardNameFromItem('Gossiping'), 'Gossiping');
    });

    it('extracts board name from object with boardname', () => {
      assert.strictEqual(getBoardNameFromItem({ boardname: 'C_Chat' }), 'C_Chat');
    });

    it('extracts board name from ExtendedTreeItem value label', () => {
      assert.strictEqual(getBoardNameFromItem({ value: { label: 'Baseball' } }), 'Baseball');
      assert.strictEqual(getBoardNameFromItem({ value: { label: { label: 'NBA' } } }), 'NBA');
    });

    it('extracts board name from ExtendedTreeItem value id', () => {
      assert.strictEqual(getBoardNameFromItem({ value: { id: 'board-Stock' } }), 'Stock');
    });

    it('extracts board name from standard TreeItem label', () => {
      assert.strictEqual(getBoardNameFromItem({ label: 'Tech_Job' }), 'Tech_Job');
      assert.strictEqual(getBoardNameFromItem({ label: { label: 'joke' } }), 'joke');
    });

    it('extracts board name from loadmore item id and ignores loadmore label', () => {
      assert.strictEqual(getBoardNameFromItem({ id: 'loadmore-SYSOP', label: '載入更多文章' }), 'SYSOP');
      assert.strictEqual(
        getBoardNameFromItem({ value: { id: 'loadmore-Gossiping', label: '載入更多文章' } }),
        'Gossiping'
      );
    });

    it('returns undefined for invalid or nullish inputs', () => {
      assert.strictEqual(getBoardNameFromItem(null), undefined);
      assert.strictEqual(getBoardNameFromItem(undefined), undefined);
      assert.strictEqual(getBoardNameFromItem({}), undefined);
    });
  });

  describe('PttTreeViewController', () => {
    it('creates and renders TreeView with favorites', async () => {
      const mockPtt = new MockPttClient(true);
      const mockFavorites: FavoriteBoardItem[] = [
        {
          bn: '1',
          read: 'true',
          boardname: 'Gossiping',
          category: '綜合',
          title: '八卦板',
          users: '1000',
          admin: 'admin',
          folder: false,
          divider: false
        },
        {
          bn: '2',
          read: 'true',
          boardname: '------------',
          category: '',
          title: '------------',
          users: '',
          admin: '',
          folder: false,
          divider: true
        },
        {
          bn: '3',
          read: 'true',
          boardname: 'C_Chat',
          category: '動漫',
          title: '希洽板',
          users: '500',
          admin: 'admin',
          folder: false,
          divider: false
        }
      ];
      mockPtt.favorites = mockFavorites;

      const mockContext = {
        globalState: {
          get: (key: string) => (key === 'boardlist' ? ['Stock'] : undefined),
          update: () => Promise.resolve()
        }
      } as unknown as vscode.ExtensionContext;

      let isLoggedIn = true;
      const controller = new PttTreeViewController(mockPtt, mockContext, () => isLoggedIn);
      const treeView = controller.render();

      assert.ok(treeView);
      assert.strictEqual(controller.getTreeView(), treeView);

      // Support setPtt and refresh without crashing
      controller.setPtt(mockPtt);
      controller.refresh();

      // Render when logged out
      isLoggedIn = false;
      controller.refresh();
    });

    it('renders with empty favorites gracefully', async () => {
      const mockPtt = new MockPttClient(true);
      mockPtt.favorites = [];

      const mockContext = {
        globalState: {
          get: () => undefined,
          update: () => Promise.resolve()
        }
      } as unknown as vscode.ExtensionContext;

      const controller = new PttTreeViewController(mockPtt, mockContext, () => true);
      const treeView = controller.render();

      assert.ok(treeView);
    });

    it('renders when getFavorite throws an error', async () => {
      const mockPtt = new MockPttClient(true);
      mockPtt.getFavorite = async () => {
        throw new Error('Network error');
      };

      const mockContext = {
        globalState: {
          get: () => undefined,
          update: () => Promise.resolve()
        }
      } as unknown as vscode.ExtensionContext;

      const controller = new PttTreeViewController(mockPtt, mockContext, () => true);
      const treeView = controller.render();

      assert.ok(treeView);
    });
  });

  describe('wrapPttWithQueue', () => {
    it('serializes concurrent async calls in FIFO order', async () => {
      const mockPtt = new MockPttClient(true);
      const order: number[] = [];

      mockPtt.getArticles = async (boardname: string) => {
        if (boardname === 'first') {
          await new Promise(r => setTimeout(r, 20));
          order.push(1);
        } else {
          order.push(2);
        }
        return [];
      };

      const { wrapPttWithQueue } = await import('../../extension');
      const queuedPtt = wrapPttWithQueue(mockPtt);

      await Promise.all([
        queuedPtt.getArticles('first'),
        queuedPtt.getArticles('second')
      ]);

      assert.deepStrictEqual(order, [1, 2]);
    });
  });
});
