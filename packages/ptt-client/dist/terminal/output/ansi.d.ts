export = AnsiOutput;
declare function AnsiOutput(state: any, opts: any, ...args: any[]): void;
declare class AnsiOutput {
    constructor(state: any, opts: any, ...args: any[]);
    _mkSgr(attr: any, extra: any): string;
    _renderLine(line: any, cursor: any): string;
    toString(): string;
}
declare namespace AnsiOutput {
    function canHandle(target: any): boolean;
}
