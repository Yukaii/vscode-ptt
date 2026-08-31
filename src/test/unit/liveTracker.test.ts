import * as assert from 'node:assert';
import * as vscode from 'vscode';
import PttFileSystemProvider from '../../provider';
import { LiveTracker } from '../../liveTracker';
import { MockPttClient } from './mockPttClient';

describe('LiveTracker Unit Tests', () => {
  let mockPtt: MockPttClient;
  let provider: PttFileSystemProvider;
  let isLoggedIn: boolean;
  let checkLogin: () => boolean;
  let tracker: LiveTracker;

  beforeEach(() => {
    mockPtt = new MockPttClient(true);
    isLoggedIn = true;
    checkLogin = () => isLoggedIn;
    provider = new PttFileSystemProvider(mockPtt, async () => isLoggedIn);
    tracker = new LiveTracker(provider, checkLogin);
  });

  afterEach(() => {
    tracker.dispose();
  });

  it('parses valid ptt URIs and rejects invalid schemes/paths', () => {
    const valid1 = tracker.parseUri(vscode.Uri.parse('ptt:/Gossiping/12345.ptt'));
    assert.deepStrictEqual(valid1?.boardname, 'Gossiping');
    assert.deepStrictEqual(valid1?.sn, '12345');

    const valid2 = tracker.parseUri(vscode.Uri.parse('ptt:/NBA/67890'));
    assert.deepStrictEqual(valid2?.boardname, 'NBA');
    assert.deepStrictEqual(valid2?.sn, '67890');

    assert.strictEqual(tracker.getKeyFromUri(vscode.Uri.parse('ptt:/Gossiping/12345.ptt')), 'Gossiping/12345');

    // Invalid scheme
    assert.strictEqual(tracker.parseUri(vscode.Uri.parse('file:/Gossiping/12345.ptt')), null);
    assert.strictEqual(tracker.getKeyFromUri(vscode.Uri.parse('file:/Gossiping/12345.ptt')), null);

    // Invalid path
    assert.strictEqual(tracker.parseUri(vscode.Uri.parse('ptt:/')), null);
    assert.strictEqual(tracker.parseUri(vscode.Uri.parse('ptt:/Gossiping')), null);
    assert.strictEqual(tracker.parseUri(undefined), null);
  });

  it('rejects startTracking if not logged in or invalid URI', async () => {
    isLoggedIn = false;
    const uri = vscode.Uri.parse('ptt:/Gossiping/12345.ptt');
    const started = await tracker.startTracking(uri);
    assert.strictEqual(started, false);
    assert.strictEqual(tracker.isTracking(uri), false);

    isLoggedIn = true;
    const invalidUri = vscode.Uri.parse('file:/workspace/test.txt');
    const startedInvalid = await tracker.startTracking(invalidUri);
    assert.strictEqual(startedInvalid, false);
  });

  it('starts, checks, and stops tracking successfully', async () => {
    const uri = vscode.Uri.parse('ptt:/Gossiping/12345.ptt');

    assert.strictEqual(tracker.isTracking(uri), false);
    assert.strictEqual(tracker.getTrackingCount(), 0);

    const started = await tracker.startTracking(uri);
    assert.strictEqual(started, true);
    assert.strictEqual(tracker.isTracking(uri), true);
    assert.strictEqual(tracker.getTrackingCount(), 1);

    // Calling startTracking again on already tracked URI returns true without duplicate
    const startedAgain = await tracker.startTracking(uri);
    assert.strictEqual(startedAgain, true);
    assert.strictEqual(tracker.getTrackingCount(), 1);

    // Stop tracking
    const stopped = tracker.stopTracking(uri);
    assert.strictEqual(stopped, true);
    assert.strictEqual(tracker.isTracking(uri), false);
    assert.strictEqual(tracker.getTrackingCount(), 0);

    // Stopping non-tracked URI returns false
    const stoppedAgain = tracker.stopTracking(uri);
    assert.strictEqual(stoppedAgain, false);
  });

  it('toggles live tracking state on and off', async () => {
    const uri = vscode.Uri.parse('ptt:/C_Chat/99999.ptt');

    // 1. Toggle ON
    const state1 = await tracker.toggle(uri);
    assert.strictEqual(state1, true);
    assert.strictEqual(tracker.isTracking(uri), true);

    // 2. Toggle OFF
    const state2 = await tracker.toggle(uri);
    assert.strictEqual(state2, true);
    assert.strictEqual(tracker.isTracking(uri), false);
  });

  it('stopAll clears all active sessions across multiple articles', async () => {
    const uri1 = vscode.Uri.parse('ptt:/Gossiping/111.ptt');
    const uri2 = vscode.Uri.parse('ptt:/NBA/222.ptt');

    await tracker.startTracking(uri1);
    await tracker.startTracking(uri2);
    assert.strictEqual(tracker.getTrackingCount(), 2);

    tracker.stopAll();
    assert.strictEqual(tracker.getTrackingCount(), 0);
    assert.strictEqual(tracker.isTracking(uri1), false);
    assert.strictEqual(tracker.isTracking(uri2), false);
  });

  it('scrolls to bottom of editor with line and character range', () => {
    let revealedRange: vscode.Range | undefined;
    const mockEditor = {
      document: {
        lineCount: 15,
        lineAt: (n: number) => ({ text: `Line ${n} content` })
      },
      revealRange: (range: vscode.Range) => {
        revealedRange = range;
      }
    } as unknown as vscode.TextEditor;

    tracker.scrollToBottom(mockEditor);
    assert.ok(revealedRange);
    assert.strictEqual(revealedRange?.start.line, 14);
  });

  it('handles polling refresh of article content', async () => {
    mockPtt.articleDetails['Gossiping/12345'] = {
      lines: ['Initial line 1', 'Initial line 2']
    };

    const uri = vscode.Uri.parse('ptt:/Gossiping/12345.ptt');
    await provider.readFile(uri);

    let fileChangedCount = 0;
    provider.onDidChangeFile(() => {
      fileChangedCount++;
    });

    await tracker.startTracking(uri);

    // Mutate mock backend article content with a new push
    mockPtt.articleDetails['Gossiping/12345'] = {
      lines: ['Initial line 1', 'Initial line 2', '推 live: 即時推文來了！']
    };

    // Trigger provider refresh
    const changed = await provider.refreshArticle('Gossiping', '12345', uri);
    assert.strictEqual(changed, true);
    assert.strictEqual(fileChangedCount, 1);
  });
});
