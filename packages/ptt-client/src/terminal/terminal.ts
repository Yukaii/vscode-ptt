import { TermState } from './state';

export class Terminal {
  public state: TermState;

  constructor(options: { rows?: number; columns?: number } = {}) {
    this.state = new TermState(options);
  }

  write(data: string): void {
    if (!data) {
      return;
    }
    let i = 0;
    const len = data.length;

    while (i < len) {
      const char = data[i];

      if (char === '\r') {
        this.state.setCursor(0, null);
        i++;
        continue;
      }

      if (char === '\n') {
        this.state.mvCursor(0, 1);
        i++;
        continue;
      }

      if (char === '\b') {
        this.state.mvCursor(-1, 0);
        i++;
        continue;
      }

      if (char === '\t') {
        const nextTab = (Math.floor(this.state.cursor.x / 8) + 1) * 8;
        this.state.setCursor(nextTab, null);
        i++;
        continue;
      }

      if (char === '\x1b') {
        const rest = data.slice(i);

        const csiMatch = rest.match(/^\u001B\[(\??)([0-9;]*)([A-Za-z`~@])/);
        if (csiMatch) {
          const mod = csiMatch[1];
          const args = csiMatch[2] === '' ? [] : csiMatch[2].split(';').map((n) => Number.parseInt(n, 10) || 0);
          const cmd = csiMatch[3];
          this.handleCsi(mod, args, cmd);
          i += csiMatch[0].length;
          continue;
        }

        const escMatch = rest.match(/^\u001B([A-Za-z0-9=><#%()[\]])/);
        if (escMatch) {
          this.handleEsc(escMatch[1]);
          i += escMatch[0].length;
          continue;
        }

        i++;
        continue;
      }

      const nextSpecial = data.indexOf('\x1b', i);
      const nextR = data.indexOf('\r', i);
      const nextN = data.indexOf('\n', i);
      const nextB = data.indexOf('\b', i);
      const nextT = data.indexOf('\t', i);

      const indices = [nextSpecial, nextR, nextN, nextB, nextT].filter((idx) => idx >= 0);
      const end = indices.length > 0 ? Math.min(...indices) : len;
      const text = data.slice(i, end);

      this.state.write(text);
      i = end;
    }
  }

  private handleCsi(_mod: string, args: number[], cmd: string): void {
    const n = args[0] || 0;
    const m = args[1] || 0;

    switch (cmd) {
      case 'A':
        this.state.mvCursor(0, -(n || 1));
        break;
      case 'B':
        this.state.mvCursor(0, n || 1);
        break;
      case 'C':
        this.state.mvCursor(n || 1, 0);
        break;
      case 'D':
        this.state.mvCursor(-(n || 1), 0);
        break;
      case 'H':
      case 'f':
        this.state.setCursor((m || 1) - 1, (n || 1) - 1);
        break;
      case 'G':
      case '`':
        this.state.setCursor((n || 1) - 1, null);
        break;
      case 'd':
        this.state.setCursor(null, (n || 1) - 1);
        break;
      case 'J':
        this.state.eraseInDisplay(n);
        break;
      case 'K':
        this.state.eraseInLine(n);
        break;
      default:
        break;
    }
  }

  private handleEsc(cmd: string): void {
    switch (cmd) {
      case 'M':
        this.state.mvCursor(0, -1);
        break;
      case 'c':
        this.state.eraseInDisplay(2);
        break;
      default:
        break;
    }
  }
}

export default Terminal;
