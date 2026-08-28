import wcwidth from 'wcwidth';

export function dbcswidth(str: string): number {
  return str.split('').reduce((sum, c) => sum + (c.charCodeAt(0) > 255 ? 2 : 1), 0);
}

export function getWidth(widthType: string, str: string): number {
  switch (widthType) {
    case 'length':
      return str.length;
    case 'wcwidth':
      return wcwidth(str);
    case 'dbcs':
      return dbcswidth(str);
    default:
      return str.length;
  }
}

export function indexOfWidth(widthType: string, str: string, width: number): number {
  if (widthType === 'length') {
    return width;
  }
  for (let i = 0; i <= str.length; i++) {
    if (getWidth(widthType, str.substr(0, i)) > width) {
      return i - 1;
    }
  }
  return str.length;
}

export function substrWidth(widthType: string, str: string, startWidth: number, width?: number): string {
  const ignoreWidth = typeof width === 'undefined';
  let length = width ?? str.length;
  let start = startWidth;
  let prefixSpace = 0;
  let suffixSpace = 0;

  if (widthType !== 'length') {
    start = indexOfWidth(widthType, str, startWidth);
    if (getWidth(widthType, str.substr(0, start)) < startWidth) {
      start += 1;
      prefixSpace = Math.max(getWidth(widthType, str.substr(0, start)) - startWidth, 0);
    }
    if (!ignoreWidth && width !== undefined) {
      length = indexOfWidth(widthType, str.substr(start), width - prefixSpace);
      suffixSpace = Math.max(
        0,
        Math.min(width, getWidth(widthType, str.substr(start))) -
          (prefixSpace + getWidth(widthType, str.substr(start, length)))
      );
    }
  }

  const substr = ignoreWidth ? str.substr(start) : str.substr(start, length);
  return ' '.repeat(prefixSpace) + substr + ' '.repeat(suffixSpace);
}
