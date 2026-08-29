import assert from 'node:assert';
import Terminal from '../src/terminal/terminal';
import { substrWidth, getWidth } from '../src/utils/char';
import encode from '../src/utils/encode';
import decode from '../src/utils/decode';

describe('ptt-client Terminal & Utilities Tests', () => {
  describe('char width and substrWidth', () => {
    it('calculates width correctly for ASCII and DBCS characters', () => {
      assert.strictEqual(getWidth('dbcs', 'Hello'), 5);
      assert.strictEqual(getWidth('dbcs', '八卦板'), 6);
      assert.strictEqual(getWidth('dbcs', 'Gossiping 八卦'), 14);
    });

    it('extracts substring by visual width properly', () => {
      const line = 'Gossiping 八卦板';
      assert.strictEqual(substrWidth('dbcs', line, 0, 9).trim(), 'Gossiping');
      assert.strictEqual(substrWidth('dbcs', line, 10).trim(), '八卦板');
    });
  });

  describe('encode & decode', () => {
    it('encodes and decodes utf8 and big5 cleanly', () => {
      const text = '批踢踢實業坊';
      const utf8Buf = encode(text, 'utf8');
      assert.strictEqual(decode(utf8Buf, 'utf8'), text);

      const big5Buf = encode(text, 'big5');
      assert.strictEqual(decode(big5Buf, 'big5'), text);
    });
  });

  describe('Terminal Emulator', () => {
    it('writes text to terminal buffer and moves cursor', () => {
      const term = new Terminal({ rows: 24, columns: 80 });
      term.write('Hello PTT\r\nLine 2');

      assert.strictEqual(term.state.getLine(0).str, 'Hello PTT');
      assert.strictEqual(term.state.getLine(1).str, 'Line 2');
    });

    it('handles ANSI cursor movement and clear line escape sequences', () => {
      const term = new Terminal({ rows: 24, columns: 80 });
      term.write('\u001B[1;1H【 主功能表 】\u001B[2;1H(F)avorite');

      assert.strictEqual(term.state.getLine(0).str, '【 主功能表 】');
      assert.strictEqual(term.state.getLine(1).str, '(F)avorite');

      // Clear line
      term.write('\u001B[2;1H\u001B[2K');
      assert.strictEqual(term.state.getLine(1).str, '');
    });
  });
});
