import * as vscode from 'vscode';
import type PttFileSystemProvider from './provider';
import logger from './logger';

export interface LiveTrackingSession {
  uri: vscode.Uri;
  boardname: string;
  sn: string;
  timer: NodeJS.Timeout;
  isFetching: boolean;
}

export class LiveTracker implements vscode.Disposable {
  private activeSessions = new Map<string, LiveTrackingSession>();
  private statusBarItem: vscode.StatusBarItem;
  private disposables: vscode.Disposable[] = [];

  constructor(
    private contentProvider: PttFileSystemProvider,
    private checkLogin: () => boolean
  ) {
    this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    this.statusBarItem.command = 'ptt.toggle-live-tracking';
    this.disposables.push(this.statusBarItem);

    this.disposables.push(
      vscode.window.onDidChangeActiveTextEditor((editor) => {
        this.updateUiForActiveEditor(editor);
      })
    );

    this.disposables.push(
      vscode.workspace.onDidCloseTextDocument((doc) => {
        const key = this.getKeyFromUri(doc.uri);
        if (key && this.activeSessions.has(key)) {
          this.stopTracking(doc.uri, true);
        }
      })
    );

    this.disposables.push(
      vscode.workspace.onDidChangeTextDocument((event) => {
        const key = this.getKeyFromUri(event.document.uri);
        if (key && this.activeSessions.has(key)) {
          this.scrollDocumentToBottom(event.document.uri);
        }
      })
    );
  }

  public getKeyFromUri(uri?: vscode.Uri): string | null {
    const parsed = this.parseUri(uri);
    if (!parsed) {
      return null;
    }
    return `${parsed.boardname}/${parsed.sn}`;
  }

  public parseUri(uri?: vscode.Uri): { boardname: string; sn: string; uri: vscode.Uri } | null {
    if (!uri) {
      return null;
    }
    // Support ptt scheme URIs
    if (uri.scheme !== 'ptt') {
      return null;
    }
    const cleanPath = uri.path.replace(/^\//, '');
    const match = cleanPath.match(/^([^/]+)\/(\d+)(?:\.ptt)?$/);
    if (!match) {
      return null;
    }
    return {
      boardname: match[1],
      sn: match[2],
      uri
    };
  }

  public isTracking(uri?: vscode.Uri): boolean {
    const targetUri = uri || vscode.window.activeTextEditor?.document.uri;
    const key = this.getKeyFromUri(targetUri);
    return Boolean(key && this.activeSessions.has(key));
  }

  public getTrackingCount(): number {
    return this.activeSessions.size;
  }

  public async startTracking(targetUri?: vscode.Uri): Promise<boolean> {
    const activeEditor = vscode.window.activeTextEditor;
    const uri = targetUri || activeEditor?.document.uri;
    const parsed = this.parseUri(uri);

    if (!parsed) {
      vscode.window.showWarningMessage('請先開啟 PTT 文章再使用即時追推文功能。');
      return false;
    }

    if (!this.checkLogin()) {
      vscode.window.showWarningMessage('請先登入 PTT 才能使用即時追推文。');
      return false;
    }

    const { boardname, sn } = parsed;
    const key = `${boardname}/${sn}`;

    if (this.activeSessions.has(key)) {
      return true;
    }

    const config = vscode.workspace.getConfiguration();
    const intervalSec = Math.max(1, config.get<number>('liveTrackingInterval') ?? 3);

    const session: LiveTrackingSession = {
      uri: parsed.uri,
      boardname,
      sn,
      timer: null as unknown as NodeJS.Timeout,
      isFetching: false
    };

    session.timer = setInterval(async () => {
      if (session.isFetching) {
        return;
      }
      if (!this.checkLogin()) {
        this.stopTracking(parsed.uri, true);
        return;
      }
      session.isFetching = true;
      try {
        await this.contentProvider.refreshArticle(boardname, sn, parsed.uri);
      } catch (err) {
        logger.error(`[LiveTracking] Error refreshing ${key}:`, err);
      } finally {
        session.isFetching = false;
      }
    }, intervalSec * 1000);

    this.activeSessions.set(key, session);
    this.updateUiForActiveEditor(vscode.window.activeTextEditor);

    // Scroll to bottom immediately upon starting
    this.scrollDocumentToBottom(parsed.uri);

    vscode.window.showInformationMessage(`開始即時追推文 (${boardname} #${sn})，每 ${intervalSec} 秒自動更新`);
    return true;
  }

  public stopTracking(targetUri?: vscode.Uri, silent = false): boolean {
    const activeEditor = vscode.window.activeTextEditor;
    const uri = targetUri || activeEditor?.document.uri;
    const parsed = this.parseUri(uri);

    if (!parsed) {
      return false;
    }

    const { boardname, sn } = parsed;
    const key = `${boardname}/${sn}`;
    const session = this.activeSessions.get(key);

    if (!session) {
      return false;
    }

    clearInterval(session.timer);
    this.activeSessions.delete(key);
    this.updateUiForActiveEditor(vscode.window.activeTextEditor);

    if (!silent) {
      vscode.window.showInformationMessage(`已停止即時追推文 (${boardname} #${sn})`);
    }
    return true;
  }

  public async toggle(targetUri?: vscode.Uri): Promise<boolean> {
    const activeEditor = vscode.window.activeTextEditor;
    const uri = targetUri || activeEditor?.document.uri;
    if (this.isTracking(uri)) {
      return this.stopTracking(uri);
    }
    return this.startTracking(uri);
  }

  public stopAll() {
    for (const session of this.activeSessions.values()) {
      clearInterval(session.timer);
    }
    this.activeSessions.clear();
    this.updateUiForActiveEditor(vscode.window.activeTextEditor);
  }

  public scrollDocumentToBottom(uri: vscode.Uri) {
    const autoScroll = vscode.workspace.getConfiguration().get<boolean>('liveTrackingAutoScroll') ?? true;
    if (!autoScroll) {
      return;
    }
    const visibleEditors = (vscode.window.visibleTextEditors || []).filter(
      (editor) => editor.document?.uri?.toString() === uri.toString()
    );
    for (const editor of visibleEditors) {
      this.scrollToBottom(editor);
    }
  }

  public scrollToBottom(editor: vscode.TextEditor) {
    if (!editor?.document) {
      return;
    }
    const lineCount = editor.document.lineCount;
    if (lineCount > 0) {
      const lastLine = lineCount - 1;
      const lastChar = editor.document.lineAt(lastLine).text.length;
      const pos = new vscode.Position(lastLine, lastChar);
      const range = new vscode.Range(pos, pos);
      editor.revealRange(range, vscode.TextEditorRevealType.Default);
    }
  }

  public updateUiForActiveEditor(editor?: vscode.TextEditor) {
    const uri = editor?.document?.uri;
    const key = this.getKeyFromUri(uri);
    const isTracking = Boolean(key && this.activeSessions.has(key));

    vscode.commands.executeCommand('setContext', 'ptt:isLiveTracking', isTracking);

    if (isTracking && key) {
      const intervalSec = Math.max(1, vscode.workspace.getConfiguration().get<number>('liveTrackingInterval') ?? 3);
      this.statusBarItem.text = `$(radio-tower) PTT 追推文中 (${intervalSec}s)`;
      this.statusBarItem.tooltip = `PTT 即時追推文中 (${key}) - 點擊以停止追蹤`;
      this.statusBarItem.show();
    } else if (this.activeSessions.size > 0) {
      this.statusBarItem.text = `$(radio-tower) PTT 追推文 (${this.activeSessions.size} 篇進行中)`;
      this.statusBarItem.tooltip = `點擊切換當前文章即時追推文 (目前共 ${this.activeSessions.size} 篇追蹤中)`;
      this.statusBarItem.show();
    } else {
      this.statusBarItem.hide();
    }
  }

  public dispose() {
    this.stopAll();
    for (const disposable of this.disposables) {
      disposable.dispose();
    }
    this.disposables = [];
  }
}
