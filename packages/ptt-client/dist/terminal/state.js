"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TermState = void 0;
const char_1 = require("../utils/char");
class TermState {
    constructor(options = {}) {
        this.rows = options.rows || 24;
        this.columns = options.columns || 80;
        this.cursor = { x: 0, y: 0 };
        this.lines = Array.from({ length: this.rows }, () => '');
        this.modes = { stringWidth: 'dbcs' };
    }
    setMode(mode, val) {
        this.modes[mode] = val;
    }
    getLine(n) {
        if (n < 0 || n >= this.rows) {
            return { str: '' };
        }
        return { str: this.lines[n] || '' };
    }
    setCursor(x, y) {
        if (x !== null) {
            this.cursor.x = Math.max(0, Math.min(this.columns - 1, x));
        }
        if (y !== null) {
            this.cursor.y = Math.max(0, Math.min(this.rows - 1, y));
        }
    }
    mvCursor(dx, dy) {
        this.setCursor(this.cursor.x + dx, this.cursor.y + dy);
    }
    write(text) {
        if (!text) {
            return;
        }
        const y = this.cursor.y;
        let curLine = this.lines[y] || '';
        const curWidth = (0, char_1.getWidth)('dbcs', curLine);
        if (curWidth < this.cursor.x) {
            curLine += ' '.repeat(this.cursor.x - curWidth);
        }
        const before = (0, char_1.substrWidth)('dbcs', curLine, 0, this.cursor.x);
        const textWidth = (0, char_1.getWidth)('dbcs', text);
        const after = (0, char_1.substrWidth)('dbcs', curLine, this.cursor.x + textWidth);
        this.lines[y] = before + text + after;
        this.cursor.x += textWidth;
        if (this.cursor.x >= this.columns) {
            this.cursor.x = 0;
            if (this.cursor.y < this.rows - 1) {
                this.cursor.y++;
            }
        }
    }
    eraseInLine(param) {
        const y = this.cursor.y;
        const line = this.lines[y] || '';
        if (param === 0) {
            this.lines[y] = (0, char_1.substrWidth)('dbcs', line, 0, this.cursor.x);
        }
        else if (param === 1) {
            const after = (0, char_1.substrWidth)('dbcs', line, this.cursor.x);
            this.lines[y] = ' '.repeat(this.cursor.x) + after;
        }
        else if (param === 2) {
            this.lines[y] = '';
        }
    }
    eraseInDisplay(param) {
        if (param === 0) {
            this.eraseInLine(0);
            for (let y = this.cursor.y + 1; y < this.rows; y++) {
                this.lines[y] = '';
            }
        }
        else if (param === 1) {
            for (let y = 0; y < this.cursor.y; y++) {
                this.lines[y] = '';
            }
            this.eraseInLine(1);
        }
        else if (param === 2) {
            this.lines = Array.from({ length: this.rows }, () => '');
            this.cursor = { x: 0, y: 0 };
        }
    }
    scroll(lines) {
        if (lines > 0) {
            this.lines.splice(0, lines);
            while (this.lines.length < this.rows) {
                this.lines.push('');
            }
        }
        else if (lines < 0) {
            const count = Math.abs(lines);
            for (let i = 0; i < count; i++) {
                this.lines.unshift('');
            }
            this.lines.splice(this.rows);
        }
    }
}
exports.TermState = TermState;
//# sourceMappingURL=state.js.map