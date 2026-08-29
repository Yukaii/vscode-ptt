import * as assert from 'node:assert';
import * as vscode from 'vscode';
import PttFileSystemProvider from '../../provider';
import { MockPttClient } from './mockPttClient';

describe('PttFileSystemProvider Unit Tests', () => {
  it('has scheme "ptt"', () => {
    assert.strictEqual(PttFileSystemProvider.scheme, 'ptt');
  });

  it('provides stat for root, board, article and invalid path', async () => {
    const mockPtt = new MockPttClient(true);
    const provider = new PttFileSystemProvider(mockPtt);

    // Root
    const rootStat = provider.stat(vscode.Uri.parse('ptt:/'));
    assert.strictEqual(rootStat.type, vscode.FileType.Directory);

    // Board
    const boardStat = provider.stat(vscode.Uri.parse('ptt:/Gossiping'));
    assert.strictEqual(boardStat.type, vscode.FileType.Directory);

    // Article (.ptt)
    const articleStat = provider.stat(vscode.Uri.parse('ptt:/Gossiping/12345.ptt'));
    assert.strictEqual(articleStat.type, vscode.FileType.File);
    assert.strictEqual(articleStat.permissions, vscode.FilePermission.Readonly);

    // Invalid path throws
    assert.throws(() => {
      provider.stat(vscode.Uri.parse('ptt:/Gossiping/12345/extra/invalid'));
    });
  });

  it('reads file from PTT client, caches content, and handles .ptt extension', async () => {
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

    let ensureLoginCalled = false;
    const provider = new PttFileSystemProvider(mockPtt, async () => {
      ensureLoginCalled = true;
      return true;
    });

    const uri = vscode.Uri.parse('ptt:/Gossiping/12345.ptt');
    const bytes = await provider.readFile(uri);
    const content = new TextDecoder().decode(bytes);

    assert.ok(ensureLoginCalled);
    assert.ok(content.includes('作者: test (Test User) 看板: Gossiping'));
    assert.ok(content.includes('這是一篇測試文章內容。'));
    assert.strictEqual(content.split('\n').length, 6);

    // Update underlying data in mock PTT
    mockPtt.articleDetails['Gossiping/12345'] = {
      lines: ['更新後的文章內容']
    };

    // Verify cached content is returned without re-fetching
    const cachedBytes = await provider.readFile(uri);
    const cachedContent = new TextDecoder().decode(cachedBytes);
    assert.strictEqual(cachedContent, content);

    // Verify clearCache forces re-fetch of updated content
    provider.clearCache('Gossiping', '12345');
    const updatedBytes = await provider.readFile(uri);
    const updatedContent = new TextDecoder().decode(updatedBytes);
    assert.strictEqual(updatedContent, '更新後的文章內容');
  });

  it('readDirectory returns cached boards and articles', async () => {
    const mockPtt = new MockPttClient(true);
    mockPtt.articleDetails['Gossiping/12345'] = { lines: ['line1'] };
    mockPtt.articleDetails['C_Chat/67890'] = { lines: ['line2'] };

    const provider = new PttFileSystemProvider(mockPtt);
    await provider.readFile(vscode.Uri.parse('ptt:/Gossiping/12345.ptt'));
    await provider.readFile(vscode.Uri.parse('ptt:/C_Chat/67890.ptt'));

    const rootDir = provider.readDirectory(vscode.Uri.parse('ptt:/'));
    assert.strictEqual(rootDir.length, 2);

    const gossipingDir = provider.readDirectory(vscode.Uri.parse('ptt:/Gossiping'));
    assert.strictEqual(gossipingDir.length, 1);
    assert.strictEqual(gossipingDir[0][0], '12345.ptt');
  });

  it('mutation operations throw NoPermissions error', () => {
    const mockPtt = new MockPttClient(true);
    const provider = new PttFileSystemProvider(mockPtt);

    assert.throws(() => provider.createDirectory());
    assert.throws(() => provider.writeFile());
    assert.throws(() => provider.delete());
    assert.throws(() => provider.rename());
  });

  it('throws Unavailable if user is not logged in', async () => {
    const mockPtt = new MockPttClient(false);
    const provider = new PttFileSystemProvider(mockPtt, async () => false);

    await assert.rejects(
      async () => {
        await provider.readFile(vscode.Uri.parse('ptt:/Gossiping/12345.ptt'));
      },
      (err: unknown) => (err as vscode.FileSystemError)?.code === 'Unavailable'
    );
  });
});
