export = mode;
/**
 * *
 */
type mode = Function | string;
/**
* handlers for Mode escape characters
* @enum {Function|string}
* @readonly
* @this refers to calling {@link Terminal}
*/
declare var mode: {
    "1": (cmd: any, value: any) => void;
    "4": (cmd: any, value: any) => void;
    "?5": (cmd: any, value: any) => void;
    "7": (cmd: any, value: any) => void;
    "?12": (cmd: any, value: any) => void;
    "20": (cmd: any, value: any) => void;
    "?25": (cmd: any, value: any) => void;
    "?47": (cmd: any, value: any) => void;
    "?1000": (cmd: any, value: any) => void;
    "?1002": (cmd: any, value: any) => void;
    "?1006": (cmd: any, value: any) => void;
    "?1047": (cmd: any, value: any) => void;
    "?1048": (cmd: any, v: any) => void;
    "?1049": (cmd: any, v: any) => void;
};
