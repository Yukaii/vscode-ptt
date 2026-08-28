"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const uao_js_1 = require("uao-js");
const encode = (str, charset) => {
    let buffer;
    switch (charset.toLowerCase()) {
        case 'utf8':
        case 'utf-8':
            buffer = Buffer.from(str, 'utf8');
            break;
        case 'big5':
            buffer = Buffer.from((0, uao_js_1.encodeSync)(str), 'binary');
            break;
        default:
            throw new TypeError(`Unknown charset: ${charset}`);
    }
    return buffer;
};
exports.default = encode;
//# sourceMappingURL=encode.js.map