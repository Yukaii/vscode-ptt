export = HtmlOutput;
declare function HtmlOutput(state: any, opts: any, ...args: any[]): void;
declare class HtmlOutput {
    constructor(state: any, opts: any, ...args: any[]);
    _defOpts: {
        cssClass: boolean;
        cursorBg: string;
        cursorFg: string;
    };
    colors: any;
    _cssPrefix(css: any): string;
    _mkCssProperties(attr: any): string;
    escapeHtml(str: any): any;
    _mkAttr(attr: any, type: any, e: any): string;
    _renderLine(line: any, cursor: any): string;
    toString(): string;
    _genColumnsString(): string;
}
declare namespace HtmlOutput {
    function canHandle(target: any): boolean;
}
