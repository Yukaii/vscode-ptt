export = DomInput;
declare function DomInput(target: any, buffer: any, opts: any, ...args: any[]): void;
declare class DomInput {
    constructor(target: any, buffer: any, opts: any, ...args: any[]);
    _addListener(elem: any, name: any, cb: any): void;
    getKeyCode(ev: any): any;
    _mousemove(ev: any): void;
    _click(ev: any): void;
    _cancelEvent(ev: any): boolean;
    _contextmenu(ev: any): void;
    _paste(ev: any): boolean;
    _keypress(ev: any): boolean;
    _keydown(ev: any): boolean;
}
declare namespace DomInput {
    let canHandle: (target: any) => boolean;
}
