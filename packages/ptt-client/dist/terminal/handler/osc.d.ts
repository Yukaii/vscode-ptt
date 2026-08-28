export = osc;
/**
 * *
 */
type osc = Function | string;
/**
* handlers for OSC escape characters
* @enum {Function|string}
* @readonly
* @this refers to calling {@link Terminal}
*/
declare var osc: {
    "": string;
    0: (cmd: any, args: any) => void;
    1: (cmd: any, arg: any) => void;
    2: (cmd: any, arg: any) => void;
    3: () => void;
    4: (cmd: any, arg: any) => void;
    5: (cmd: any, arg: any) => void;
    10: (cmd: any, arg: any) => void;
    11: (cmd: any, arg: any) => void;
    12: (cmd: any, arg: any) => void;
    13: (cmd: any, arg: any) => void;
    14: (cmd: any, arg: any) => void;
    15: (cmd: any, arg: any) => void;
    16: (cmd: any, arg: any) => void;
    17: (cmd: any, arg: any) => void;
    18: (cmd: any, arg: any) => void;
    19: (cmd: any, arg: any) => void;
    46: (cmd: any, arg: any) => void;
    50: (cmd: any, arg: any) => void;
    51: (cmd: any, arg: any) => void;
    52: () => void;
    104: (cmd: any, arg: any) => void;
    105: (cmd: any, arg: any) => void;
    110: (cmd: any, arg: any) => void;
    111: (cmd: any, arg: any) => void;
    112: (cmd: any, arg: any) => void;
    113: (cmd: any, arg: any) => void;
    114: (cmd: any, arg: any) => void;
    115: (cmd: any, arg: any) => void;
    116: (cmd: any, arg: any) => void;
    117: (cmd: any, arg: any) => void;
    118: (cmd: any, arg: any) => void;
    119: (cmd: any, arg: any) => void;
};
