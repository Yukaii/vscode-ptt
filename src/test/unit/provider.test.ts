import * as assert from 'assert';
import * as vscode from 'vscode';
import ContentProvider from '../../provider';
import { MockPttClient } from './mockPttClient';

describe('ContentProvider Unit Tests', () => {
  it('has scheme "ptt"', () => {
    assert.strictEqual(ContentProvider.scheme, 'ptt');
  });

  it('provides text document content from article lines', async () => {
    const mockPtt = new MockPttClient(true);
    mockPtt.articleDetails['Gossiping/12345'] = {
      lines: [
        '作者: test (Test User) 看板: Gossiping',
        '標題: [問卦] 測試文章',
        '時間: Thu Aug 28 00:00:00 2026',
        '',
        '這是一篇測試文章內容。',
        '--'
      ]
    };

    const provider = new ContentProvider(mockPtt);
    const uri = { path: 'Gossiping/12345' } as unknown as vscode.Uri;
    const content = await provider.provideTextDocumentContent(uri);

    assert.ok(content.includes('作者: test (Test User) 看板: Gossiping'));
    assert.ok(content.includes('這是一篇測試文章內容。'));
    assert.strictEqual(content.split('\n').length, 6);
  });
});
