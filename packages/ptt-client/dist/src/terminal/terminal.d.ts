import { TermState } from './state';
export declare class Terminal {
    state: TermState;
    private incompleteChunk;
    constructor(options?: {
        rows?: number;
        columns?: number;
    });
    write(incomingData: string): void;
    private handleCsi;
    private handleEsc;
}
export default Terminal;
