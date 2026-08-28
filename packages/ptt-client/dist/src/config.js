"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const defaultConfig = {
    name: 'PTT',
    url: 'wss://ws.ptt.cc/bbs',
    charset: 'utf8',
    origin: 'https://www.ptt.cc',
    protocol: 'websocket',
    timeout: 200,
    blobSize: 1024,
    preventIdleTimeout: 30,
    terminal: {
        columns: 80,
        rows: 24,
    },
};
exports.default = defaultConfig;
//# sourceMappingURL=config.js.map