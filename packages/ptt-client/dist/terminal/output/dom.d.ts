export = DomOutput;
declare function DomOutput(state: any, writer: any, target: any, opts: any, ...args: any[]): void;
declare class DomOutput {
    constructor(state: any, writer: any, target: any, opts: any, ...args: any[]);
    html: HtmlOutput;
    spacer: any;
    cursorView: any;
    createView(): any;
    removeLine(number: any, view: any): any;
    changeLine(number: any, view: any, line: any, cursor: any): void;
    insertLine(number: any, view: any, line: any, cursor: any): any;
    changeLed(l1: any, l2: any, l3: any, l4: any): void;
    setCursor(x: any, y: any): void;
    resize(size: any): void;
    commit(): void;
}
declare namespace DomOutput {
    function canHandle(target: any): boolean;
}
import HtmlOutput = require("./html.js");
