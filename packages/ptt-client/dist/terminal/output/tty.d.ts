export = TtyOutput;
declare function TtyOutput(state: any, writer: any, target: any, opts: any): void;
declare class TtyOutput {
    constructor(state: any, writer: any, target: any, opts: any);
    ansi: AnsiOutput;
    removeLine(number: any, view: any): any;
    changeLine(number: any, view: any, line: any, cursor: any): any;
    insertLine(number: any, view: any, line: any, cursor: any, ...args: any[]): any;
    changeLed(l1: any, l2: any, l3: any, l4: any): void;
    setCursor(x: any, y: any): void;
    resize(size: any): void;
    commit(): void;
}
declare namespace TtyOutput {
    function canHandle(target: any): any;
}
import AnsiOutput = require("./ansi.js");
