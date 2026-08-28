import EventEmitter from 'eventemitter3';
import Socket from './socket';
import { type PttConfig } from './config';
import type { ArticleListItem, ArticleDetail, FavoriteBoardItem, PttState } from './types';
export declare class Condition {
    typeWord: string;
    criteria: string;
    constructor(type: string, criteria: string);
    toSearchString(): string;
}
export declare class Bot extends EventEmitter {
    config: PttConfig;
    state: PttState;
    _state: PttState;
    currentCharset: string;
    socket: Socket;
    _term: {
        state: {
            setMode: (mode: string, val: string) => void;
            getLine: (n: number) => {
                str: string;
            };
        };
        write: (data: string) => void;
    };
    searchCondition: {
        conditions: Condition[];
        init: () => void;
        add: (type: string, criteria: string) => void;
    };
    private _preventIdleHandler;
    private _commandQueue;
    constructor(config?: Partial<PttConfig>);
    private enqueue;
    private init;
    getLine: (n: number) => {
        str: string;
    };
    send(msg: string, timeoutMs?: number): Promise<void>;
    preventIdle(timeout: number): void;
    setSearchCondition(type: string, criteria: string): void;
    resetSearchCondition(): void;
    isSearchConditionSet(): boolean;
    login(username?: string, password?: string, kick?: boolean): Promise<boolean>;
    logout(): Promise<boolean>;
    private _checkLogin;
    private _checkArticleWithHeader;
    enterIndex(): Promise<boolean>;
    enterBoard(boardname: string): Promise<boolean>;
    enterFavorite(offsets?: (number | string)[]): Promise<boolean>;
    getFavorite(offsets?: (number | string)[]): Promise<FavoriteBoardItem[]>;
    getArticles(boardname: string, offset?: number): Promise<ArticleListItem[]>;
    getArticle(boardname: string, sn: number | string): Promise<ArticleDetail>;
    private getLines;
}
export default Bot;
