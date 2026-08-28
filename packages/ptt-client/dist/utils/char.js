"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dbcswidth = dbcswidth;
exports.getWidth = getWidth;
exports.indexOfWidth = indexOfWidth;
exports.substrWidth = substrWidth;
const wcwidth_1 = __importDefault(require("wcwidth"));
function dbcswidth(str) {
    return str.split('').reduce((sum, c) => sum + (c.charCodeAt(0) > 255 ? 2 : 1), 0);
}
function getWidth(widthType, str) {
    switch (widthType) {
        case 'length':
            return str.length;
        case 'wcwidth':
            return (0, wcwidth_1.default)(str);
        case 'dbcs':
            return dbcswidth(str);
        default:
            return str.length;
    }
}
function indexOfWidth(widthType, str, width) {
    if (widthType === 'length') {
        return width;
    }
    for (let i = 0; i <= str.length; i++) {
        if (getWidth(widthType, str.substr(0, i)) > width) {
            return i - 1;
        }
    }
    return str.length;
}
function substrWidth(widthType, str, startWidth, width) {
    const ignoreWidth = typeof width === 'undefined';
    let length = width ?? str.length;
    let start = startWidth;
    let prefixSpace = 0;
    let suffixSpace = 0;
    if (widthType !== 'length') {
        start = indexOfWidth(widthType, str, startWidth);
        if (getWidth(widthType, str.substr(0, start)) < startWidth) {
            start += 1;
            prefixSpace = Math.max(getWidth(widthType, str.substr(0, start)) - startWidth, 0);
        }
        if (!ignoreWidth && width !== undefined) {
            length = indexOfWidth(widthType, str.substr(start), width - prefixSpace);
            suffixSpace = Math.max(0, Math.min(width, getWidth(widthType, str.substr(start))) -
                (prefixSpace + getWidth(widthType, str.substr(start, length))));
        }
    }
    const substr = ignoreWidth ? str.substr(start) : str.substr(start, length);
    return ' '.repeat(prefixSpace) + substr + ' '.repeat(suffixSpace);
}
//# sourceMappingURL=char.js.map