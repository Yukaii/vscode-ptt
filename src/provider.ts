import * as vscode from 'vscode';
import type { IPttClient } from './types';

export default class PttFileSystemProvider implements vscode.FileSystemProvider {
  static scheme = 'ptt';

  private _emitter = new vscode.EventEmitter<vscode.FileChangeEvent[]>();
  readonly onDidChangeFile: vscode.Event<vscode.FileChangeEvent[]> = this._emitter.event;

  private cache = new Map<string, Uint8Array>();
  private ensureLogin?: () => Promise<boolean>;

  constructor(private ptt: IPttClient, ensureLogin?: () => Promise<boolean>) {
    this.ensureLogin = ensureLogin;
  }

  setPtt(ptt: IPttClient) {
    this.ptt = ptt;
  }

  setEnsureLogin(ensureLogin: () => Promise<boolean>) {
    this.ensureLogin = ensureLogin;
  }

  clearCache(boardname?: string, sn?: string) {
    if (boardname && sn) {
      this.cache.delete(`${boardname}/${sn}`);
    } else if (boardname) {
      for (const key of this.cache.keys()) {
        if (key.startsWith(`${boardname}/`)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
  }

  watch(): vscode.Disposable {
    return new vscode.Disposable(() => {});
  }

  stat(uri: vscode.Uri): vscode.FileStat {
    const cleanPath = uri.path.replace(/^\//, '').replace(/\/$/, '');

    // Root directory
    if (!cleanPath) {
      return {
        type: vscode.FileType.Directory,
        ctime: 0,
        mtime: 0,
        size: 0
      };
    }

    const parts = cleanPath.split('/');

    // Board directory, e.g. /Gossiping
    if (parts.length === 1) {
      return {
        type: vscode.FileType.Directory,
        ctime: 0,
        mtime: 0,
        size: 0
      };
    }

    // Article file, e.g. /Gossiping/12345.ptt
    if (parts.length === 2) {
      const match = parts[1].match(/^(\d+)(?:\.ptt)?$/);
      if (match) {
        const key = `${parts[0]}/${match[1]}`;
        const cached = this.cache.get(key);
        return {
          type: vscode.FileType.File,
          ctime: 0,
          mtime: Date.now(),
          size: cached ? cached.length : 0,
          permissions: vscode.FilePermission.Readonly
        };
      }
    }

    throw vscode.FileSystemError.FileNotFound(uri);
  }

  readDirectory(uri: vscode.Uri): [string, vscode.FileType][] {
    const cleanPath = uri.path.replace(/^\//, '').replace(/\/$/, '');
    if (!cleanPath) {
      // Return unique boards currently cached
      const boards = new Set<string>();
      for (const key of this.cache.keys()) {
        const [board] = key.split('/');
        boards.add(board);
      }
      return Array.from(boards).map(b => [b, vscode.FileType.Directory]);
    }

    const parts = cleanPath.split('/');
    if (parts.length === 1) {
      const boardname = parts[0];
      const articles: [string, vscode.FileType][] = [];
      for (const key of this.cache.keys()) {
        const [board, sn] = key.split('/');
        if (board === boardname) {
          articles.push([`${sn}.ptt`, vscode.FileType.File]);
        }
      }
      return articles;
    }

    throw vscode.FileSystemError.FileNotFound(uri);
  }

  createDirectory(): void {
    throw vscode.FileSystemError.NoPermissions('Read-only file system');
  }

  writeFile(): void {
    throw vscode.FileSystemError.NoPermissions('Read-only file system');
  }

  delete(): void {
    throw vscode.FileSystemError.NoPermissions('Read-only file system');
  }

  rename(): void {
    throw vscode.FileSystemError.NoPermissions('Read-only file system');
  }

  async readFile(uri: vscode.Uri): Promise<Uint8Array> {
    const cleanPath = uri.path.replace(/^\//, '');
    const match = cleanPath.match(/^([^/]+)\/(\d+)(?:\.ptt)?$/);

    if (!match) {
      throw vscode.FileSystemError.FileNotFound(uri);
    }

    const [, boardname, sn] = match;
    const key = `${boardname}/${sn}`;

    const cached = this.cache.get(key);
    if (cached) {
      return cached;
    }

    if (this.ensureLogin) {
      await this.ensureLogin();
    }

    if (!this.ptt || !this.ptt.state?.login) {
      throw vscode.FileSystemError.Unavailable('PTT client not logged in');
    }

    try {
      const article = await this.ptt.getArticle(boardname, sn);
      if (!article || !article.lines) {
        throw vscode.FileSystemError.FileNotFound(uri);
      }

      const content = new TextEncoder().encode(article.lines.join('\n'));
      this.cache.set(key, content);
      return content;
    } catch (err: unknown) {
      if (err instanceof vscode.FileSystemError) {
        throw err;
      }
      const message = err instanceof Error ? err.message : 'Failed to fetch article from PTT';
      throw vscode.FileSystemError.Unavailable(message);
    }
  }
}
