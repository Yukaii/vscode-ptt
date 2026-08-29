import * as vscode from 'vscode';

function safeStringify(val: unknown): string {
  if (val === undefined) {
    return 'undefined';
  }
  if (val === null) {
    return 'null';
  }
  if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') {
    return String(val);
  }
  try {
    const seen = new WeakSet();
    return JSON.stringify(val, (_key, value) => {
      if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) {
          return '[Circular]';
        }
        seen.add(value);
      }
      return value;
    });
  } catch {
    return String(val);
  }
}

class Logger {
  private outputChannel?: vscode.OutputChannel;

  init(): void {
    if (!this.outputChannel && typeof vscode.window?.createOutputChannel === 'function') {
      this.outputChannel = vscode.window.createOutputChannel('PTT');
    }
  }

  log(message: string, ...args: unknown[]): void {
    const time = new Date().toLocaleTimeString();
    const formatted = args.length > 0 ? `${message} ${args.map(safeStringify).join(' ')}` : message;
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
