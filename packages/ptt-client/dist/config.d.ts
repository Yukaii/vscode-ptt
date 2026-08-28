export interface PttConfig {
    name?: string;
    url?: string;
    charset?: string;
    origin?: string;
    protocol?: string;
    timeout?: number;
    blobSize?: number;
    preventIdleTimeout?: number;
    terminal?: {
        columns: number;
        rows: number;
    };
}
declare const defaultConfig: PttConfig;
export default defaultConfig;
