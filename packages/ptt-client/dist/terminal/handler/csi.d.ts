export = csi;
/**
 * *
 */
type csi = Function | string;
/**
* csi command handlers
* @enum {Function|string}
* @readonly
* @this refers to calling {@link Terminal}
*/
declare var csi: {
    /**
    * CSI Ps @ <br>
    * Insert Ps (Blank) Character(s) (default = 1) (ICH)
    */
    "@": (cmd: any, n: any, m: any, args: any, mod: any) => void;
    /**
    * CSI Ps A <br>
    * Cursor Up Ps Times (default = 1) (CUU)
    */
    A: (cmd: any, n: any, m: any, args: any, mod: any) => void;
    /**
    * CSI Ps B <br>
    * Cursor Down Ps Times (default = 1) (CUD)
    */
    B: (cmd: any, n: any, m: any, args: any, mod: any) => void;
    /**
    * CSI Ps C <br>
    * Cursor Forward Ps Times (default = 1) (CUF)
    */
    C: (cmd: any, n: any, m: any, args: any, mod: any) => void;
    /**
    * CSI Ps D <br>
    * Cursor backward Ps Times (default = 1) (CUB)
    */
    D: (cmd: any, n: any, m: any, args: any, mod: any) => void;
    /**
    * CSI Ps E <br>
    * Cursor down Ps Rows, to column 1 (default = 1) (CNL , NEL)
    */
    E: (cmd: any, n: any, m: any, args: any, mod: any) => void;
    /**
    * CSI Ps F <br>
    * Cursor Preceding Line PS Times (default = 1) (CPL)
    */
    F: (cmd: any, n: any, m: any, args: any, mod: any) => void;
    /**
    * CSI Ps G <br>
    * Cursor Character Absolute  [column] (default = [row,1]) (CHA)
    */
    G: (cmd: any, n: any, m: any, args: any, mod: any) => void;
    /**
    * CSI Ps ; Ps H <br>
    * Cursor Position [row;column] (default = [1,1]) (CUP)
    */
    H: (cmd: any, n: any, m: any, args: any, mod: any) => void;
    /**
    * CSI Ps I <br>
    * Cursor Forward Tabulation Ps tab stops (default = 1) (CHT)
    */
    I: (cmd: any, n: any, m: any, args: any, mod: any) => void;
    /**
    * CSI Ps J <br>
    * Erase in Display (default = 0) (ED)
    * <ul>
    * <li>J  - erase from cursor to end of display</li>
    * <li>0J - erase from cursor to end of display</li>
    * <li>1J - erase from start to cursor</li>
    * <li>2J - erase whole display</li>
    * </ul>
    */
    J: (cmd: any, n: any, m: any, args: any, mod: any) => void;
    /**
    * CSI Ps K <br>
    * Erase in Line (default = 0) (EL)
    * <ul>
    * <li>K  - erase from cursor to end of line</li>
    * <li>0K - erase from cursor to end of line</li>
    * <li>1K - erase from start of line to cursor</li>
    * <li>2K - erase whole line</li>
    * </ul>
    */
    K: (cmd: any, n: any, m: any, args: any, mod: any) => void;
    /**
    * CSI Ps L <br>
    * Insert Ps Line(s) (default = 1) (IL)
    */
    L: (cmd: any, n: any, m: any, args: any, mod: any) => void;
    /**
    * CSI Ps M <br>
    * Delete Ps Line(s) (default = 1) (DL)
    */
    M: (cmd: any, n: any, m: any, args: any, mod: any) => void;
    /**
    * CSI Ps P <br>
    * Delete Ps Character(s) (default = 1) (DCH)
    */
    P: (cmd: any, n: any, m: any, args: any, mod: any) => void;
    /**
    * CSI Pl ; Pc R <br>
    * Report cursor pAosition (CPR)<br>
    * <ul>
    * <li>Pl indicates what line the cursor is on</li>
    * <li>Pr indicated what row the cursor is on</li>
    * </ul>
    * @todo implement
    */
    R: (cmd: any, n: any, m: any, args: any, mod: any) => void;
    /**
    * CSI Ps S <br>
    * Scroll up Ps lines (default = 1) (SU)
    */
    S: (cmd: any, n: any, m: any, args: any, mod: any) => void;
    /**
    * CSI Ps T <br>
    * Scroll down Ps lines (default = 1) (SD) <br>
    * CSI Ps ; Ps ; Ps ; Ps ; Ps T <br>
    * Initiate highlight mouse tracking <br>
    * CSI > Ps; Ps T <br>
    * @todo handle ">" mode
    */
    T: (cmd: any, n: any, m: any, args: any, mod: any) => void;
    /**
    * CSI Ps X <br>
    * Erase Ps Character(s) (default = 1) (ECH)
    */
    X: (cmd: any, n: any, m: any, args: any, mod: any) => void;
    /**
    * CSI Ps Z <br>
    * Cursor Backward Tabulation Ps tab stops (default = 1) (CBT)
    */
    Z: (cmd: any, n: any, m: any, args: any, mod: any) => void;
    /**
    * CSI Ps a <br>
    * Move cursor right the indicated # of columns (default = 1) (HPR)
    */
    a: (cmd: any, n: any, m: any, args: any, mod: any) => void;
    /**
    * CSI Ps b <br>
    * Repeat the preceding graphic character Ps times (REP)
    */
    b: (cmd: any, n: any, m: any, args: any, mod: any) => void;
    /**
    * CSI P s c <br>
    * Send Device Attributes (Primary DA) <br>
    * CSI > P s c <br>
    * Send Device Attributes (Secondary DA) <br>
    */
    c: (cmd: any, n: any, m: any, args: any, mod: any) => void;
    /**
    * CSI Pm d <br>
    * Line Position Absolute  [row] (default = [1,column]) (VPA)
    */
    d: (cmd: any, n: any, m: any, args: any, mod: any) => void;
    /**
    * CSI Pm e <br>
    * Vertical position relative.
    * Move cursor down the indicated # of rows (default = 1) (VPR)
    */
    e: (cmd: any, n: any, m: any, args: any, mod: any) => void;
    /**
    * CSI Ps ; Ps f <br>
    * Horizontal and Vertical Position [row;column] (default =  [1,1]) (HVP)
    */
    f: (cmd: any, n: any, m: any, args: any, mod: any) => void;
    /**
    * CSI Ps g <br>
    * Tab Clear (default = 0) (TBC)
    */
    g: (cmd: any, n: any, m: any, args: any, mod: any) => void;
    /**
    * CSI Pm h <br>
    * Set Mode (SM) <br>
    * CSI ? Pm h - mouse escape codes, cursor escape codes <br>
    */
    h: (cmd: any, n: any, m: any, args: any, mod: any) => void;
    /**
    * CSI Pm i  Media Copy (MC) <br>
    * CSI ? Pm i <br>
    */
    i: (cmd: any, n: any, m: any, args: any, mod: any) => void;
    /**
    * CSI Pm l  Reset Mode (RM) <br>
    * CSI ? Pm l <br>
    */
    l: (cmd: any, n: any, m: any, args: any, mod: any) => void;
    /**
    * CSI Pm m <br>
    * Character Attributes (SGR) <br>
    * CSI > Ps; Ps m <br>
    */
    m: (cmd: any, n: any, m: any, args: any, mod: any) => void;
    /**
    * CSI Ps n  Device Status Report (DSR) <br>
    * CSI > Ps n <br>
    * <ul>
    * <li>5n - Device Status report</li>
    * <li>0n - Response: terminal is OK</li>
    * <li>3n - Response: terminal is not OK</li>
    * <li>6n - Request cursor position (CPR)</li>
    * </ul>
    * @todo implement
    */
    n: (cmd: any, n: any, m: any, args: any, mod: any) => void;
    /**
    * CSI > Ps p  Set pointer mode <br>
    * CSI ! p   Soft terminal reset (DECSTR) <br>
    * CSI Ps$ p <br>
    *   Request ANSI mode (DECRQM) <br>
    * CSI ? Ps$ p <br>
    * Request DEC private mode (DECRQM) <br>
    * CSI Ps ; Ps " p <br>
    */
    p: (cmd: any, n: any, m: any, args: any, mod: any) => void;
    /**
    * CSI Ps q <br>
    * Load LEDs (DECLL) <br>
    * CSI Ps SP q <br>
    * CSI Ps " q <br>
    * <ul>
    * <li>0q - turn off all four leds</li>
    * <li>1q - turn on Led #1</li>
    * <li>2q - turn on Led #2</li>
    * <li>3q - turn on Led #3</li>
    * <li>4q - turn on Led #4</li>
    * </ul>
    */
    q: (cmd: any, n: any, m: any, args: any, mod: any) => void;
    /**
    * CSI Ps ; Ps r <br>
    * Set Scrolling Region [top;bottom] (default = full size of window)
    * (DECSTBM) <br>
    * CSI ? Pm r <br>
    * CSI Pt; Pl; Pb; Pr; Ps$ r <br>
    */
    r: (cmd: any, n: any, m: any, args: any, mod: any) => void;
    /**
    * CSI ? Pm s <br>
    * Save cursor (ANSI.SYS)
    */
    s: (cmd: any, n: any, m: any, args: any, mod: any) => void;
    /**
    * CSI t <br>
    * unknown
    * @todo implement
    */
    t: (cmd: any, n: any, m: any, args: any, mod: any) => void;
    /**
    * CSI Ps SP u <br>
    * Restore cursor (ANSI.SYS)
    */
    u: (cmd: any, n: any, m: any, args: any, mod: any) => void;
    /**
    * CSI Pt; Pl; Pb; Pr; Pp; Pt; Pl; Pp$ v <br>
    * (DECCRA)
    * @todo implement
    */
    v: (cmd: any, n: any, m: any, args: any, mod: any) => void;
    /**
    * CSI Pt ; Pl ; Pb ; Pr " w <br>
    * (DECEFR)
    * @todo implement
    */
    w: (cmd: any, n: any, m: any, args: any, mod: any) => void;
    /**
    * CSI Ps x  Request Terminal Parameters (DECREQTPARM) <br>
    * CSI Ps x  Select Attribute Change Extent (DECSACE) <br>
    * CSI Pc; Pt; Pl; Pb; Pr$ x <br>
    * @todo implement
    */
    x: (cmd: any, n: any, m: any, args: any, mod: any) => void;
    /**
    * Request Checksum of Rectangular Area
    * DECRQCRA
    * @todo implement
    */
    y: (cmd: any, n: any, m: any, args: any, mod: any) => void;
    /**
    * CSI Ps ; Pu " z <br>
    * CSI Pt; Pl; Pb; Pr$ z <br>
    * (DECELR) / (DECERA)
    * Erase rectangular area
    */
    z: (cmd: any, n: any, m: any, args: any, mod: any) => void;
    /**
    * CSI Pm `  Character Position Absolute <br>
    *   [column] (default = [row,1]) (HPA)
    */
    "`": (cmd: any, n: any, m: any, args: any, mod: any) => void;
    /**
    * CSI Pm " { <br>
    * CSI Pt; Pl; Pb; Pr$ { <br>
    * Selectively erase retangular area (DECSLE) / (DECSERA)
    * @todo implement
    */
    "{": (cmd: any, n: any, m: any, args: any, mod: any) => void;
    /**
    * CSI Ps " | <br>
    * Request locator position (DECRQLP)
    * @todo implement
    */
    "|": (cmd: any, n: any, m: any, args: any, mod: any) => void;
    /**
    * CSI P m SP } <br>
    * Insert P s Column(s) (default = 1) (DECIC), VT420 and up
    * @todo implement
    */
    "}": (cmd: any, n: any, m: any, args: any, mod: any) => void;
    /**
    * CSI P m SP ~ <br>
    * Delete P s Column(s) (default = 1) (DECDC), VT420 and up
    * @todo implement
    */
    "~": (cmd: any, n: any, m: any, args: any, mod: any) => void;
};
