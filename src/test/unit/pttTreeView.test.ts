import assert from 'node:assert';
import type * as vscode from 'vscode';
import { PttTreeViewController, getBoardNameFromItem } from '../../views/PttTreeView';
import { MockPttClient } from './mockPttClient';
import store from '../../store';

describe('PttTreeView Component and Controller Tests', () => {
  beforeEach(() => {
    store.release('Gossiping');
    store.release('C_Chat');
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

    it('returns undefined for invalid or nullish inputs', () => {
      assert.strictEqual(getBoardNameFromItem(null), undefined);
      assert.strictEqual(getBoardNameFromItem(undefined), undefined);
      assert.strictEqual(getBoardNameFromItem({}), undefined);
    });
  });

  describe('PttTreeViewController', () => {
    it('creates and renders TreeView', () => {
      const mockPtt = new MockPttClient(true);
      const mockContext = {
        globalState: {
          get: (key: string) => (key === 'boardlist' ? ['Gossiping', 'C_Chat'] : undefined)
        }
      } as unknown as vscode.ExtensionContext;

      let isLoggedIn = true;
      const controller = new PttTreeViewController(mockPtt, mockContext, () => isLoggedIn);
      const treeView = controller.render();

      assert.ok(treeView);
      assert.strictEqual(controller.getTreeView(), treeView);

      // Should support setPtt and refresh without crashing
      controller.setPtt(mockPtt);
      controller.refresh();

      isLoggedIn = false;
      controller.refresh();
    });
  });
});
