"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Socket = void 0;
const eventemitter3_1 = __importDefault(require("eventemitter3"));
const ws_1 = __importDefault(require("ws"));
class Socket extends eventemitter3_1.default {
    constructor(config) {
        super();
        this._socket = null;
        this._data = [];
        this._timeoutHandler = null;
        this._config = config;
    }
    connect() {
        const WS = typeof ws_1.default !== 'undefined' ? ws_1.default : globalThis.WebSocket;
        if (!WS) {
            throw new Error(`'WebSocket' is undefined.`);
        }
        const options = {};
        if (this._config.origin) {
            options.origin = this._config.origin;
        }
        const socket = new WS(this._config.url || 'wss://ws.ptt.cc/bbs', options);
        socket.binaryType = 'arraybuffer';
        socket.on('open', () => this.emit('connect'));
        socket.on('close', () => this.emit('disconnect'));
        socket.on('error', (err) => this.emit('error', err));
        socket.on('message', (currData) => {
            if (this._timeoutHandler) {
                clearTimeout(this._timeoutHandler);
            }
            const bytes = new Uint8Array(currData);
            for (let i = 0; i < bytes.length; i++) {
                this._data.push(bytes[i]);
            }
            this._timeoutHandler = setTimeout(() => {
                const payload = this._data;
                this._data = [];
                this.emit('message', payload);
            }, this._config.timeout || 100);
        });
        this._socket = socket;
    }
    disconnect() {
        if (this._socket) {
            this._socket.close();
            this._socket = null;
        }
    }
    send(data) {
        if (this._socket && this._socket.readyState === 1 /* OPEN */) {
            this._socket.send(data);
        }
    }
    get readyState() {
        return this._socket ? this._socket.readyState : 3 /* CLOSED */;
    }
}
exports.Socket = Socket;
exports.default = Socket;
//# sourceMappingURL=socket.js.map