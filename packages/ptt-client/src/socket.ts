import EventEmitter from 'eventemitter3';
import WebSocket from 'ws';
import type { PttConfig } from './config';

export class Socket extends EventEmitter {
  private _config: PttConfig;
  private _socket: WebSocket | null = null;
  private _data: number[] = [];
  private _timeoutHandler: NodeJS.Timeout | null = null;

  constructor(config: PttConfig) {
    super();
    this._config = config;
  }

  connect(): void {
    const WS = typeof WebSocket !== 'undefined' ? WebSocket : (globalThis as unknown as { WebSocket: typeof WebSocket }).WebSocket;
    if (!WS) {
      throw new Error(`'WebSocket' is undefined.`);
    }

    const options: WebSocket.ClientOptions = {};
    if (this._config.origin) {
      options.origin = this._config.origin;
    }

    const socket = new WS(this._config.url || 'wss://ws.ptt.cc/bbs', options);
    socket.binaryType = 'arraybuffer';

    socket.on('open', () => this.emit('connect'));
    socket.on('close', () => this.emit('disconnect'));
    socket.on('error', (err: Error) => this.emit('error', err));

    socket.on('message', (currData: ArrayBuffer | Buffer) => {
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

  disconnect(): void {
    if (this._socket) {
      this._socket.close();
      this._socket = null;
    }
  }

  send(data: Buffer | string): void {
    if (this._socket && this._socket.readyState === 1 /* OPEN */) {
      this._socket.send(data);
    }
  }

  get readyState(): number {
    return this._socket ? this._socket.readyState : 3 /* CLOSED */;
  }
}

export default Socket;
