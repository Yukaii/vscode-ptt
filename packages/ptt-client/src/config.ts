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

const defaultConfig: PttConfig = {
  name: 'PTT',
  url: 'wss://ws.ptt.cc/bbs',
  charset: 'utf8',
  origin: 'https://www.ptt.cc',
  protocol: 'websocket',
  timeout: 200,
  blobSize: 1024,
  preventIdleTimeout: 30,
  terminal: {
    columns: 80,
    rows: 24,
  },
};

export default defaultConfig;
