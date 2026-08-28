export = EmitterSource;
declare function EmitterSource(writer: any, source: any, opts: any, ...args: any[]): void;
declare class EmitterSource {
    constructor(writer: any, source: any, opts: any, ...args: any[]);
    _register(): void;
    write: (...args: any[]) => any;
    end: (...args: any[]) => any;
    _resize: (...args: any[]) => any;
    kill: (...args: any[]) => any;
    resize(size: any): any;
}
declare namespace EmitterSource {
    function canHandle(source: any): boolean;
}
