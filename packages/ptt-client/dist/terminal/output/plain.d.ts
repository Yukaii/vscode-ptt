export = PlainOutput;
declare function PlainOutput(state: any, opts: any, ...args: any[]): void;
declare class PlainOutput {
    constructor(state: any, opts: any, ...args: any[]);
    toString(): string;
}
declare namespace PlainOutput {
    function canHandle(target: any): boolean;
}
