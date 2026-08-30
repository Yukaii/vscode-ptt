import assert from 'node:assert';
import * as vscode from 'vscode';
import PttHoverProvider, { getImagePreviewUrl, extractUrlsWithRange } from '../../hoverProvider';

describe('PttHoverProvider & Image Link Tests', () => {
  describe('getImagePreviewUrl', () => {
    it('resolves direct imgur image URLs with extensions', () => {
      assert.strictEqual(
        getImagePreviewUrl('https://i.imgur.com/AbCdEfG.jpg'),
        'https://i.imgur.com/AbCdEfG.jpg'
      );
      assert.strictEqual(
        getImagePreviewUrl('https://i.imgur.com/AbCdEfG.png'),
        'https://i.imgur.com/AbCdEfG.png'
      );
      assert.strictEqual(
        getImagePreviewUrl('https://i.imgur.com/AbCdEfG.gif'),
        'https://i.imgur.com/AbCdEfG.gif'
      );
      assert.strictEqual(
        getImagePreviewUrl('https://i.imgur.com/AbCdEfG.gifv'),
        'https://i.imgur.com/AbCdEfG.gif'
      );
      assert.strictEqual(
        getImagePreviewUrl('https://i.imgur.com/AbCdEfG.webp'),
        'https://i.imgur.com/AbCdEfG.webp'
      );
    });

    it('resolves imgur web / mobile / http URLs without extension to direct image URLs', () => {
      assert.strictEqual(
        getImagePreviewUrl('https://imgur.com/AbCdEfG'),
        'https://i.imgur.com/AbCdEfG.jpg'
      );
      assert.strictEqual(
        getImagePreviewUrl('http://imgur.com/AbCdEfG'),
        'https://i.imgur.com/AbCdEfG.jpg'
      );
      assert.strictEqual(
        getImagePreviewUrl('https://m.imgur.com/AbCdEfG'),
        'https://i.imgur.com/AbCdEfG.jpg'
      );
      assert.strictEqual(
        getImagePreviewUrl('https://i.imgur.com/AbCdEfG'),
        'https://i.imgur.com/AbCdEfG.jpg'
      );
      assert.strictEqual(
        getImagePreviewUrl('https://imgur.com/AbCdEfG.png'),
        'https://i.imgur.com/AbCdEfG.png'
      );
    });

    it('resolves imgur albums and galleries', () => {
      assert.strictEqual(
        getImagePreviewUrl('https://imgur.com/a/AbCdEfG'),
        'https://i.imgur.com/AbCdEfG.jpg'
      );
      assert.strictEqual(
        getImagePreviewUrl('https://imgur.com/gallery/AbCdEfG'),
        'https://i.imgur.com/AbCdEfG.jpg'
      );
      assert.strictEqual(
        getImagePreviewUrl('https://m.imgur.com/a/AbCdEfG'),
        'https://i.imgur.com/AbCdEfG.jpg'
      );
    });

    it('ignores non-image imgur system paths', () => {
      assert.strictEqual(getImagePreviewUrl('https://imgur.com/'), null);
      assert.strictEqual(getImagePreviewUrl('https://imgur.com/about'), null);
      assert.strictEqual(getImagePreviewUrl('https://imgur.com/blog'), null);
      assert.strictEqual(getImagePreviewUrl('https://imgur.com/signin'), null);
      assert.strictEqual(getImagePreviewUrl('https://imgur.com/register'), null);
      assert.strictEqual(getImagePreviewUrl('https://imgur.com/upload'), null);
      assert.strictEqual(getImagePreviewUrl('https://imgur.com/tools'), null);
      assert.strictEqual(getImagePreviewUrl('https://imgur.com/rules'), null);
      assert.strictEqual(getImagePreviewUrl('https://imgur.com/privacy'), null);
      assert.strictEqual(getImagePreviewUrl('https://imgur.com/tos'), null);
      assert.strictEqual(getImagePreviewUrl('https://imgur.com/help'), null);
    });

    it('resolves other image hosts and direct image URLs', () => {
      assert.strictEqual(
        getImagePreviewUrl('https://images.plurk.com/5u9F8x.jpg'),
        'https://images.plurk.com/5u9F8x.jpg'
      );
      assert.strictEqual(
        getImagePreviewUrl('https://i.meee.com.tw/xyz123.png'),
        'https://i.meee.com.tw/xyz123.png'
      );
      assert.strictEqual(
        getImagePreviewUrl('https://pbs.twimg.com/media/xyz?format=jpg&name=orig'),
        'https://pbs.twimg.com/media/xyz?format=jpg&name=orig'
      );
      assert.strictEqual(
        getImagePreviewUrl('https://gyazo.com/abcdef123456'),
        'https://i.gyazo.com/abcdef123456.png'
      );
      assert.strictEqual(
        getImagePreviewUrl('https://upload.wikimedia.org/wikipedia/commons/test.svg'),
        'https://upload.wikimedia.org/wikipedia/commons/test.svg'
      );
    });

    it('returns null for non-image URLs', () => {
      assert.strictEqual(getImagePreviewUrl('https://www.ptt.cc/bbs/C_Chat/M.12345.A.678.html'), null);
      assert.strictEqual(getImagePreviewUrl('https://github.com/Yukaii/vscode-ptt'), null);
      assert.strictEqual(getImagePreviewUrl('https://google.com'), null);
      assert.strictEqual(getImagePreviewUrl('not-a-valid-url'), null);
    });
  });

  describe('extractUrlsWithRange', () => {
    it('extracts URL with correct range on single line', () => {
      const line = '推 user123: https://imgur.com/AbCdEfG 推薦這張圖 08/30 14:00';
      const results = extractUrlsWithRange(line, 5);

      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].url, 'https://imgur.com/AbCdEfG');
      assert.strictEqual(results[0].range.start.line, 5);
      assert.strictEqual(results[0].range.start.character, 11);
      assert.strictEqual(results[0].range.end.character, 11 + 'https://imgur.com/AbCdEfG'.length);
    });

    it('trims trailing punctuation and brackets from URLs', () => {
      const line = '圖在此 [https://i.imgur.com/AbCdEfG.jpg], 還有 (https://imgur.com/XyZ123.)!';
      const results = extractUrlsWithRange(line, 2);

      assert.strictEqual(results.length, 2);
      assert.strictEqual(results[0].url, 'https://i.imgur.com/AbCdEfG.jpg');
      assert.strictEqual(results[1].url, 'https://imgur.com/XyZ123');
    });

    it('handles lines with multiple URLs', () => {
      const line = 'https://imgur.com/aaa https://i.imgur.com/bbb.png';
      const results = extractUrlsWithRange(line, 0);

      assert.strictEqual(results.length, 2);
      assert.strictEqual(results[0].url, 'https://imgur.com/aaa');
      assert.strictEqual(results[1].url, 'https://i.imgur.com/bbb.png');
    });
  });

  describe('PttHoverProvider', () => {
    const createMockDocument = (lines: string[]) => ({
      lineAt: (lineIndex: number) => ({
        text: lines[lineIndex] || ''
      })
    }) as unknown as vscode.TextDocument;

    it('returns hover with preview markdown when hovering over imgur link', () => {
      const provider = new PttHoverProvider();
      const doc = createMockDocument(['推 user: https://imgur.com/AbCdEfG 太棒了']);
      const position = new vscode.Position(0, 15);

      const hover = provider.provideHover(doc, position) as vscode.Hover;
      assert.ok(hover);
      assert.ok(hover.contents);

      const markdownString = hover.contents as unknown as vscode.MarkdownString;
      assert.strictEqual(markdownString.isTrusted, true);
      assert.strictEqual(markdownString.supportHtml, true);
      assert.ok(markdownString.value.includes('https://imgur.com/AbCdEfG'));
      assert.ok(markdownString.value.includes('https://i.imgur.com/AbCdEfG.jpg'));
      assert.ok(markdownString.value.includes('<img src="https://i.imgur.com/AbCdEfG.jpg" width="320" />'));
    });

    it('uses unconstrained markdown image when previewImageWidth is set to 0', () => {
      const workspaceWithConfig = vscode.workspace as unknown as {
        getConfiguration: () => { get: (key: string, defaultValue?: unknown) => unknown };
      };
      const originalGetConfig = workspaceWithConfig.getConfiguration;
      workspaceWithConfig.getConfiguration = () => ({
        get: (key: string, defaultValue?: unknown) => {
          if (key === 'previewImageWidth') {
            return 0;
          }
          return defaultValue;
        }
      });

      try {
        const provider = new PttHoverProvider();
        const doc = createMockDocument(['https://imgur.com/AbCdEfG']);
        const position = new vscode.Position(0, 5);

        const hover = provider.provideHover(doc, position) as vscode.Hover;
        assert.ok(hover);
        const markdownString = hover.contents as unknown as vscode.MarkdownString;
        assert.ok(markdownString.value.includes('![](https://i.imgur.com/AbCdEfG.jpg)'));
      } finally {
        workspaceWithConfig.getConfiguration = originalGetConfig;
      }
    });

    it('returns hover when hovering over direct image link', () => {
      const provider = new PttHoverProvider();
      const doc = createMockDocument(['https://images.plurk.com/5u9F8x.jpg']);
      const position = new vscode.Position(0, 5);

      const hover = provider.provideHover(doc, position) as vscode.Hover;
      assert.ok(hover);
      const markdownString = hover.contents as unknown as vscode.MarkdownString;
      assert.ok(markdownString.value.includes('https://images.plurk.com/5u9F8x.jpg'));
      assert.ok(markdownString.value.includes('<img src="https://images.plurk.com/5u9F8x.jpg" width="320" />'));
    });

    it('returns null when hovering outside the URL range', () => {
      const provider = new PttHoverProvider();
      const doc = createMockDocument(['推 user: https://imgur.com/AbCdEfG 太棒了']);
      const positionBefore = new vscode.Position(0, 2); // on "user"
      const positionAfter = new vscode.Position(0, 45); // on "太棒了"

      assert.strictEqual(provider.provideHover(doc, positionBefore), null);
      assert.strictEqual(provider.provideHover(doc, positionAfter), null);
    });

    it('returns null when hovering over a non-image URL', () => {
      const provider = new PttHoverProvider();
      const doc = createMockDocument(['※ 文章網址: https://www.ptt.cc/bbs/C_Chat/M.12345.A.html']);
      const position = new vscode.Position(0, 20);

      assert.strictEqual(provider.provideHover(doc, position), null);
    });

    it('returns null when previewImages configuration is disabled', () => {
      const workspaceWithConfig = vscode.workspace as unknown as {
        getConfiguration: () => { get: (key: string, defaultValue?: unknown) => unknown };
      };
      const originalGetConfig = workspaceWithConfig.getConfiguration;
      workspaceWithConfig.getConfiguration = () => ({
        get: (key: string, defaultValue?: unknown) => {
          if (key === 'previewImages') {
            return false;
          }
          return defaultValue;
        }
      });

      try {
        const provider = new PttHoverProvider();
        const doc = createMockDocument(['https://imgur.com/AbCdEfG']);
        const position = new vscode.Position(0, 5);

        assert.strictEqual(provider.provideHover(doc, position), null);
      } finally {
        workspaceWithConfig.getConfiguration = originalGetConfig;
      }
    });
  });
});
