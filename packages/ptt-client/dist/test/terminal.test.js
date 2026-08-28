"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_assert_1 = __importDefault(require("node:assert"));
const terminal_1 = __importDefault(require("../src/terminal/terminal"));
const char_1 = require("../src/utils/char");
const encode_1 = __importDefault(require("../src/utils/encode"));
const decode_1 = __importDefault(require("../src/utils/decode"));
describe('ptt-client Terminal & Utilities Tests', () => {
    describe('char width and substrWidth', () => {
        it('calculates width correctly for ASCII and DBCS characters', () => {
            node_assert_1.default.strictEqual((0, char_1.getWidth)('dbcs', 'Hello'), 5);
            node_assert_1.default.strictEqual((0, char_1.getWidth)('dbcs', '八卦板'), 6);
            node_assert_1.default.strictEqual((0, char_1.getWidth)('dbcs', 'Gossiping 八卦'), 14);
        });
        it('extracts substring by visual width properly', () => {
            const line = 'Gossiping 八卦板';
            node_assert_1.default.strictEqual((0, char_1.substrWidth)('dbcs', line, 0, 9).trim(), 'Gossiping');
            node_assert_1.default.strictEqual((0, char_1.substrWidth)('dbcs', line, 10).trim(), '八卦板');
        });
    });
    describe('encode & decode', () => {
        it('encodes and decodes utf8 and big5 cleanly', () => {
            const text = '批踢踢實業坊';
            const utf8Buf = (0, encode_1.default)(text, 'utf8');
            node_assert_1.default.strictEqual((0, decode_1.default)(utf8Buf, 'utf8'), text);
            const big5Buf = (0, encode_1.default)(text, 'big5');
            node_assert_1.default.strictEqual((0, decode_1.default)(big5Buf, 'big5'), text);
        });
    });
    describe('Terminal Emulator', () => {
        it('writes text to terminal buffer and moves cursor', () => {
            const term = new terminal_1.default({ rows: 24, columns: 80 });
            term.write('Hello PTT\r\nLine 2');
            node_assert_1.default.strictEqual(term.state.getLine(0).str, 'Hello PTT');
            node_assert_1.default.strictEqual(term.state.getLine(1).str, 'Line 2');
        });
        it('handles ANSI cursor movement and clear line escape sequences', () => {
            const term = new terminal_1.default({ rows: 24, columns: 80 });
            term.write('\u001B[1;1H【 主功能表 】\u001B[2;1H(F)avorite');
            node_assert_1.default.strictEqual(term.state.getLine(0).str, '【 主功能表 】');
            node_assert_1.default.strictEqual(term.state.getLine(1).str, '(F)avorite');
            // Clear line
            term.write('\u001B[2;1H\u001B[2K');
            node_assert_1.default.strictEqual(term.state.getLine(1).str, '');
        });
    });
});
//# sourceMappingURL=terminal.test.js.map