import { substrWidth, getWidth } from '../utils/char';

export interface TermLine {
  str: string;
}

export class TermState {
  public rows: number;
  public columns: number;
  public cursor: { x: number; y: number };
  public lines: string[];
  public modes: Record<string, string>;

  constructor(options: { rows?: number; columns?: number } = {}) {
    this.rows = options.rows || 24;
    this.columns = options.columns || 80;
    this.cursor = { x: 0, y: 0 };
    this.lines = Array.from({ length: this.rows }, () => '');
    this.modes = { stringWidth: 'dbcs' };
  }

  setMode(mode: string, val: string): void {
    this.modes[mode] = val;
  }

  getLine(n: number): TermLine {
    if (n < 0 || n >= this.rows) {
      return { str: '' };
    }
    return { str: this.lines[n] || '' };
  }

  setCursor(x: number | null, y: number | null): void {
    if (x !== null) {
      this.cursor.x = Math.max(0, Math.min(this.columns - 1, x));
    }
    if (y !== null) {
      this.cursor.y = Math.max(0, Math.min(this.rows - 1, y));
    }
  }

  mvCursor(dx: number, dy: number): void {
    this.setCursor(this.cursor.x + dx, this.cursor.y + dy);
  }

  write(text: string): void {
    if (!text) {
      return;
    }
    const y = this.cursor.y;
    let curLine = this.lines[y] || '';
    const curWidth = getWidth('dbcs', curLine);

    if (curWidth < this.cursor.x) {
      curLine += ' '.repeat(this.cursor.x - curWidth);
    }

    const before = substrWidth('dbcs', curLine, 0, this.cursor.x);
    const textWidth = getWidth('dbcs', text);
    const after = substrWidth('dbcs', curLine, this.cursor.x + textWidth);

    this.lines[y] = before + text + after;
    this.cursor.x += textWidth;
    if (this.cursor.x >= this.columns) {
      this.cursor.x = 0;
      if (this.cursor.y < this.rows - 1) {
        this.cursor.y++;
      }
    }
  }

  eraseInLine(param: number): void {
    const y = this.cursor.y;
    const line = this.lines[y] || '';
    if (param === 0) {
      this.lines[y] = substrWidth('dbcs', line, 0, this.cursor.x);
    } else if (param === 1) {
      const after = substrWidth('dbcs', line, this.cursor.x);
      this.lines[y] = ' '.repeat(this.cursor.x) + after;
    } else if (param === 2) {
      this.lines[y] = '';
    }
  }

  eraseInDisplay(param: number): void {
    if (param === 0) {
      this.eraseInLine(0);
      for (let y = this.cursor.y + 1; y < this.rows; y++) {
        this.lines[y] = '';
      }
    } else if (param === 1) {
      for (let y = 0; y < this.cursor.y; y++) {
        this.lines[y] = '';
      }
      this.eraseInLine(1);
    } else if (param === 2) {
      this.lines = Array.from({ length: this.rows }, () => '');
      this.cursor = { x: 0, y: 0 };
    }
  }

  scroll(lines: number): void {
    if (lines > 0) {
      this.lines.splice(0, lines);
      while (this.lines.length < this.rows) {
        this.lines.push('');
      }
    } else if (lines < 0) {
      const count = Math.abs(lines);
      for (let i = 0; i < count; i++) {
        this.lines.unshift('');
      }
      this.lines.splice(this.rows);
    }
  }
}
