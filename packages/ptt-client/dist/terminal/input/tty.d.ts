export = TtyInput;
declare function TtyInput(target: any, buffer: any, opts: any, ...args: any[]): void;
declare class TtyInput {
    constructor(target: any, buffer: any, opts: any, ...args: any[]);
    target: any;
    doread(): void;
}
declare namespace TtyInput {
    function canHandle(target: any): any;
}
