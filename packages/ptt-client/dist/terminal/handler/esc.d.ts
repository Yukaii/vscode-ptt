export = esc;
/**
 * *
 */
type esc = Function | string;
/**
* esc command handlers
* Currently we ignore all DCS codes
* @enum {Function|string}
* @readonly
* @this refers to calling {@link Terminal}
*/
declare var esc: {
    /**
    * ESC c<br>
    * Full Reset (RIS)
    */
    c: (cmd: any, chunk: any) => number;
    /**
    * ESC D<br>
    * Index (IND is 0x84)
    * Moves cursor down one line in same column.
    * If cursor is at bottom margin, screen performs a scroll-up.
    */
    D: (cmd: any, chunk: any) => number;
    /**
    * ESC E<br>
    * Next Line (NEL is 0x85)
    * This sequence causes the active position to move to the first position on
    * the next line downward
    * If the active position is at the bottom margin, a scroll up is performed
    */
    E: (cmd: any, chunk: any) => number;
    /**
    * ESC F<br>
    * Start of Selected Area to be sent to auxiliary output device (SSA)
    */
    /**
    * ESC G<br>
    * End of Selected Area to be sent to auxiliary output device (SSA)
    */
    /**
    * ESC H<br>
    * Tab Set (HTS is 0x88)
    */
    H: (cmd: any, chunk: any) => number;
    /**
    * ESC I<br>
    * Horizontal Tab Justify, moves string to next tab position (HTJ)
    */
    /**
    * ESC J<br>
    * Vertical Tabulation Set at current line (VTS)
    */
    /**
    * ESC K<br>
    * Partial Line Down (subscript) (PLD)
    */
    /**
    * ESC L<br>
    * Partial Line Up (superscript) (PLU)
    */
    /**
    * ESC M<br>
    * Reverse Index (RI is 0x8d)
    * Move the active position to the same horizontal position on the preceding line.
    * If the active position is at the top margin, a scroll down is performed
    */
    M: (cmd: any, chunk: any) => number;
    /**
    * ESC N<br>
    * Single Shift Select of G2 Character Set (SS2 is 0x8e). This affects next character only
    */
    N: (cmd: any, chunk: any) => number;
    /**
    * ESC O<br>
    * Single Shift Select of G3 Character Set (SS3 is 0x8f). This affects next character only
    */
    O: (cmd: any, chunk: any) => number;
    /**
    * ESC P<br>
    * Device Control String (DCS is 0x90)
    * @todo function should return errors if it detects garbaged DCS sequences
    */
    P: (cmd: any, chunk: any) => any;
    /**
    * ESC Q<br>
    * Private Use 1 (PU1)
    */
    Q: (cmd: any, chunk: any) => number;
    /**
    * ESC R<br>
    * Private Use 2 (PU2)
    */
    R: (cmd: any, chunk: any) => number;
    /**
    * ESC S<br>
    * Set Transmit State (STS)
    */
    S: (cmd: any, chunk: any) => number;
    /**
    * ESC T<br>
    * Cancel Character, ignore previous character (CCH)
    * @todo implement
    */
    T: (cmd: any, chunk: any) => number;
    /**
    * ESC U<br>
    * Message Waiting, turns on an indicator on the terminal (MW)
    */
    U: (cmd: any, chunk: any) => number;
    /**
    * ESC V<br>
    * Start of Protected Area (SPA)
    */
    V: (cmd: any, chunk: any) => number;
    /**
    * ESC W<br>
    * End of Protected Area (EPA)
    */
    W: (cmd: any, chunk: any) => number;
    /**
    * ESC X<br>
    * Reserved
    */
    X: (cmd: any, chunk: any) => number;
    /**
    * ESC Y<br>
    * Reserved
    */
    Y: (cmd: any, chunk: any) => number;
    /**
    * ESC Z<br>
    * DECID Dec Private identification
    * The kernel returns the string ESC [ ? 6 c , claiming it is a VT102
    */
    Z: (cmd: any, chunk: any) => number;
    /**
    * ESC n<br>
    * Invoke the G2 Character Set as GL (LS2)
    */
    n: (cmd: any, chunk: any) => number;
    /**
    * ESC o<br>
    * Invoke the G3 Character Set as GL (LS3)
    */
    o: (cmd: any, chunk: any) => number;
    /**
    * ESC 7<br>
    * Save Cursor (DECSC)
    */
    "7": (cmd: any, chunk: any) => number;
    /**
    * ESC 8<br>
    * Restore Cursor (DECRC)
    */
    "8": (cmd: any, chunk: any) => number;
    /**
    * ESC |<br>
    * Invoke the G3 Character Set as GR (LS3R)
    */
    "|": (cmd: any, chunk: any) => number;
    /**
    * ESC [<br>
    * Control sequence introducer (CSI)
    * @todo function should return errors if it detects garbaged CSI sequences
    */
    "[": (cmd: any, chunk: any) => any;
    /**
    * ESC \<br>
    * 7-bit - File Separator (FS)
    * 8-bit - String Terminator (VT125 exits graphics) (ST)
    */
    "\\": (cmd: any, chunk: any) => number;
    /**
    * ESC ]<br>
    * 7-bit - Group Separator (GS)
    * 8-bit - Operating System Command (OSC is 0x9d)
    * @todo function should return errors if it detects garbaged OSC sequences
    */
    "]": (cmd: any, chunk: any) => any;
    /**
    * ESC ^<br>
    * Privacy Message (password verification), terminaed by ST
    * (PM is 0x9e) (PM)
    */
    "^": (cmd: any, chunk: any) => number;
    /**
    * ESC _<br>
    * Application Program Command (to word processor), term by ST
    * (APC is 0x9f) (APC)
    */
    _: (cmd: any, chunk: any) => number;
    /**
    * ESC %<br>
    * Select default/utf-8 character set.
    * @ = default, G = utf-8; 8 (Obsolete)
    */
    "%": (cmd: any, chunk: any) => 0 | 3;
    /**
    * ESC }<br>
    * Invoke the G2 Character Set as GR (LS2R)
    */
    "}": (cmd: any, chunk: any) => number;
    /**
    * ESC ~<br>
    * Invoke the G1 Character Set as GR (LS1R)
    */
    "~": (cmd: any, chunk: any) => number;
    /**
    * ESC ( ) * + - . /<br>
    */
    "(": string;
    ")": string;
    "*": string;
    "+": string;
    "-": string;
    ".": string;
    "/": (cmd: any, chunk: any) => 0 | 3 | 4;
    /**
    * ESC #<br>
    * 3 DEC line height/width
    */
    "#": (cmd: any, chunk: any) => 0 | 3;
    /**
    * ESC g<br>
    * Visual Bell
    */
    g: (cmd: any, chunk: any) => number;
    /**
    * ESC &lt;<br>
    * The terminal interprets all sequences according to ANSI standards X3.64-1979 and X3.41-1974.
    * The VT52 escape sequences described in this chapter are not recognized.
    * (DECANM)
    */
    "<": (cmd: any, chunk: any) => number;
    /**
    * ESC &gt;<br>
    * (set numeric keypad mode?)
    * Normal Keypad (DECPNM)
    */
    ">": (cmd: any, chunk: any) => number;
    /**
    * ESC =<br>
    * Application Keypad (DECPAM)
    * Serial port requested application keyboard
    */
    "=": (cmd: any, chunk: any) => number;
};
