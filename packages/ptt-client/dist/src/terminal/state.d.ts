export interface TermLine {
    str: string;
}
export declare class TermState {
    rows: number;
    columns: number;
    cursor: {
        x: number;
        y: number;
    };
    lines: string[];
    modes: Record<string, string>;
    constructor(options?: {
        rows?: number;
        columns?: number;
    });
    setMode(mode: string, val: string): void;
    getLine(n: number): TermLine;
    setCursor(x: number | null, y: number | null): void;
    mvCursor(dx: number, dy: number): void;
    write(text: string): void;
    eraseInLine(param: number): void;
    eraseInDisplay(param: number): void;
    scroll(lines: number): void;
}
