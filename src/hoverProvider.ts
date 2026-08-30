import * as vscode from 'vscode';

const RESERVED_IMGUR_PATHS = new Set([
  'about',
  'blog',
  'help',
  'apps',
  'jobs',
  'privacy',
  'tos',
  'rules',
  'signin',
  'register',
  'upload',
  'tools',
  'user',
  'account',
  't',
  'search',
  'gallery'
]);

export function getImagePreviewUrl(rawUrl: string): string | null {
  try {
    const parsed = new URL(rawUrl);
    const hostname = parsed.hostname.toLowerCase();
    const pathname = parsed.pathname;

    // 1. Imgur support
    if (hostname === 'imgur.com' || hostname.endsWith('.imgur.com')) {
      // Check for album or gallery: /a/{id} or /gallery/{id}
      const albumMatch = pathname.match(/^\/(?:a|gallery)\/([A-Za-z0-9]+)/i);
      if (albumMatch) {
        return `https://i.imgur.com/${albumMatch[1]}.jpg`;
      }

      // Check for single image with extension: /abc1234.jpg, /i/abc1234.png
      const singleImageWithExtMatch = pathname.match(/^\/(?:i\/)?([A-Za-z0-9]+)\.(jpg|jpeg|png|gif|webp|gifv)/i);
      if (singleImageWithExtMatch) {
        const id = singleImageWithExtMatch[1];
        let ext = singleImageWithExtMatch[2].toLowerCase();
        if (ext === 'gifv') {
          ext = 'gif';
        }
        return `https://i.imgur.com/${id}.${ext}`;
      }

      // Check for single image without extension: /abc1234, /i/abc1234
      const singleImageMatch = pathname.match(/^\/(?:i\/)?([A-Za-z0-9]+)\/?$/i);
      if (singleImageMatch) {
        const id = singleImageMatch[1];
        if (!RESERVED_IMGUR_PATHS.has(id.toLowerCase())) {
          return `https://i.imgur.com/${id}.jpg`;
        }
      }
    }

    // 2. Gyazo support
    if (hostname === 'gyazo.com' || hostname.endsWith('.gyazo.com')) {
      const match = pathname.match(/^\/([A-Za-z0-9]+)\/?$/i);
      if (match) {
        return `https://i.gyazo.com/${match[1]}.png`;
      }
    }

    // 3. Direct image extensions in pathname
    const imageExtRegex = /\.(jpe?g|png|gif|webp|bmp|svg|ico)$/i;
    if (imageExtRegex.test(pathname)) {
      return rawUrl;
    }

    // 4. Image hosts with format search parameters (e.g. Twitter/X images)
    if (hostname === 'pbs.twimg.com' && parsed.searchParams.has('format')) {
      return rawUrl;
    }

    return null;
  } catch {
    return null;
  }
}

export function extractUrlsWithRange(lineText: string, lineIndex: number): Array<{ url: string; range: vscode.Range }> {
  const urlRegex = /https?:\/\/[^\s<>"'`]+/g;
  const results: Array<{ url: string; range: vscode.Range }> = [];
  let match = urlRegex.exec(lineText);

  while (match !== null) {
    let rawUrl = match[0];
    const startChar = match.index;

    // Trim trailing punctuation that are unlikely to be part of the URL in normal text
    const trailingPunctuationRegex = /[.,;:!?)>\]]+$/;
    const trailingMatch = rawUrl.match(trailingPunctuationRegex);
    if (trailingMatch) {
      rawUrl = rawUrl.slice(0, -trailingMatch[0].length);
    }

    const endChar = startChar + rawUrl.length;
    const range = new vscode.Range(lineIndex, startChar, lineIndex, endChar);
    results.push({ url: rawUrl, range });

    match = urlRegex.exec(lineText);
  }

  return results;
}

export default class PttHoverProvider implements vscode.HoverProvider {
  public provideHover(
    document: vscode.TextDocument,
    position: vscode.Position,
    _token?: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.Hover> {
    const isEnabled = vscode.workspace.getConfiguration().get<boolean>('previewImages') ?? true;
    if (!isEnabled) {
      return null;
    }

    const lineText = document.lineAt(position.line).text;
    const urls = extractUrlsWithRange(lineText, position.line);

    for (const item of urls) {
      if (position.character >= item.range.start.character && position.character <= item.range.end.character) {
        const previewUrl = getImagePreviewUrl(item.url);
        if (previewUrl) {
          const previewWidth = vscode.workspace.getConfiguration().get<number>('previewImageWidth') ?? 320;
          const imageContent = previewWidth > 0
            ? `<img src="${previewUrl}" width="${previewWidth}" />`
            : `![](${previewUrl})`;

          const markdown = new vscode.MarkdownString(`[${item.url}](${item.url})\n\n${imageContent}`);
          markdown.isTrusted = true;
          markdown.supportHtml = true;
          return new vscode.Hover(markdown, item.range);
        }
      }
    }

    return null;
  }
}
