import { encodeSync } from 'uao-js';

const encode = (str: string, charset: string): Buffer => {
  let buffer: Buffer;
  switch (charset.toLowerCase()) {
    case 'utf8':
    case 'utf-8':
      buffer = Buffer.from(str, 'utf8');
      break;
    case 'big5':
      buffer = Buffer.from(encodeSync(str), 'binary');
      break;
    default:
      throw new TypeError(`Unknown charset: ${charset}`);
  }
  return buffer;
};

export default encode;
