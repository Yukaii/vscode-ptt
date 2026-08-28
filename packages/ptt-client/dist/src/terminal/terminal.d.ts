import { TermState } from './state';
export declare class Terminal {
    state: TermState;
    constructor(options?: {
        rows?: number;
        columns?: number;
    });
    write(data: string): void;
    private handleCsi;
    private handleEsc;
}
export default Terminal;
