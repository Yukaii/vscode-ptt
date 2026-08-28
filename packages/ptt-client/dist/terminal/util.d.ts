export function extend(o: any, ...args: any[]): any;
export function objSplice(obj: any, length: any, start: any, end: any, replace: any): void;
export function indexOf(...args: any[]): any;
export function repeat(str: any, n: any): string;
/**
* calculate width of string.
* @params {string} str - string to calculate
* @params {boolean} stringWidth - calculate width by wcwidth or String.length
*/
export function getWidth(stringWidth: any, str: any): any;
/**
* calculate the position that the prefix of string is a specific width
* @params {string} str - string to calculate
* @params {number} width - the width of target string
* @params {boolean} stringWidth - calculate width by wcwidth or String.length
*/
export function indexOfWidth(stringWidth: any, str: any, width: any): any;
/**
* extract parts of string, beginning at the character at the specified position,
* and returns the specified width of characters. if the character is incomplete,
* it will be replaced by space.
* @params {string} str - string to calculate
* @params {number} start - the beginning position of string
* @params {number} width - the width of target string
* @params {boolean} stringWidth - calculate width by wcwidth or String.length
*/
export function substrWidth(stringWidth: any, str: any, startWidth: any, width: any): string;
