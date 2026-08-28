export = BaseInput;
declare function BaseInput(target: any, buffer: any, ...args: any[]): void;
declare class BaseInput {
    constructor(target: any, buffer: any, ...args: any[]);
    target: any;
    buffer: any;
    _appKeypad: boolean;
    _opts: any;
    getKey(key: any): string;
    _read(): void;
}
