import * as vscode from 'vscode';

class Logger {
  private outputChannel?: vscode.OutputChannel;

  init(): void {
    if (!this.outputChannel && typeof vscode.window?.createOutputChannel === 'function') {
      this.outputChannel = vscode.window.createOutputChannel('PTT');
    }
  }

  log(message: string, ...args: unknown[]): void {
    const time = new Date().toLocaleTimeString();
    const formatted = args.length > 0 ? `${message} ${args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')}` : message;
    const line = `[${time}] ${formatted}`;
    console.log(`[PTT] ${line}`);
    this.outputChannel?.appendLine(line);
  }

  error(message: string, err?: unknown): void {
    const time = new Date().toLocaleTimeString();
    const errMsg = err instanceof Error ? err.stack || err.message : String(err || '');
    const line = `[${time}] [ERROR] ${message} ${errMsg}`.trim();
    console.error(`[PTT] ${line}`);
    this.outputChannel?.appendLine(line);
  }

  show(): void {
    this.outputChannel?.show(true);
  }
}

export const logger = new Logger();
export default logger;
