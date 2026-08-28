"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const uao_js_1 = require("uao-js");
const decode = (data, charset) => {
    let str = '';
    switch (charset.toLowerCase()) {
        case 'utf8':
        case 'utf-8':
            str = Buffer.from(data).toString('utf8');
            break;
        case 'big5':
            str = (0, uao_js_1.decodeSync)(String.fromCharCode(...data));
            break;
        default:
            throw new TypeError(`Unknown charset: ${charset}`);
    }
    return str;
};
exports.default = decode;
//# sourceMappingURL=decode.js.map