import EventEmitter from 'eventemitter3';
import type { PttConfig } from './config';
export declare class Socket extends EventEmitter {
    private _config;
    private _socket;
    private _data;
    private _timeoutHandler;
    constructor(config: PttConfig);
    connect(): void;
    disconnect(): void;
    send(data: Buffer | string): void;
    get readyState(): number;
}
export default Socket;
