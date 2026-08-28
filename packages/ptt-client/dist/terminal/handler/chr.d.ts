export = chr;
/**
 * *
 */
type chr = Function | string;
/**
* handlers for command characters
* @enum {Function|string}
* @readonly
* @this refers to calling {@link Terminal}
*/
declare var chr: {
    /**
    * BELL
    */
    "\u0007": (cmd: any, chunk: any) => void;
    /**
    * BACKSPACE
    */
    "\b": (cmd: any, chunk: any) => void;
    /**
    * TAB
    */
    "\t": (cmd: any, chunk: any) => void;
    /**
    * DELETE
    */
    "": (cmd: any, chunk: any) => void;
    /**
    * TABSET
    */
    "\u0088": (cmd: any, chunk: any) => void;
    /**
    * SO
    */
    "\u000E": () => void;
    /**
    * SI
    */
    "\u000F": () => void;
    /**
    * ESCAPE
    */
    "\u001B": (cmd: any, chunk: any) => any;
    /**
    * CARRIAGE RETURN
    */
    "\r": (cmd: any, chunk: any) => void;
};
