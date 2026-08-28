"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Bot = exports.Condition = void 0;
const eventemitter3_1 = __importDefault(require("eventemitter3"));
const terminal_1 = __importDefault(require("./terminal/terminal"));
const socket_1 = __importDefault(require("./socket"));
const decode_1 = __importDefault(require("./utils/decode"));
const encode_1 = __importDefault(require("./utils/encode"));
const keymap_1 = __importDefault(require("./utils/keymap"));
const char_1 = require("./utils/char");
const config_1 = __importDefault(require("./config"));
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
class Condition {
    constructor(type, criteria) {
        switch (type) {
            case 'push':
                this.typeWord = 'Z';
                break;
            case 'author':
                this.typeWord = 'a';
                break;
            case 'title':
                this.typeWord = '/';
                break;
            default:
                throw new Error(`Invalid condition: ${type}`);
        }
        this.criteria = criteria;
    }
    toSearchString() {
        return `${this.typeWord}${this.criteria}`;
    }
}
exports.Condition = Condition;
class Bot extends eventemitter3_1.default {
    constructor(config = {}) {
        super();
        this._preventIdleHandler = null;
        this._commandQueue = Promise.resolve();
        this.getLine = (n) => {
            return this._term.state.getLine(n);
        };
        this.config = { ...config_1.default, ...config };
        this.currentCharset = this.config.charset || 'utf8';
        this.state = {
            connect: false,
            login: false,
            position: {
                boardname: '',
            },
        };
        this._state = this.state;
        this.searchCondition = {
            conditions: [],
            init: () => {
                this.searchCondition.conditions = [];
            },
            add: (type, criteria) => {
                this.searchCondition.conditions.push(new Condition(type, criteria));
            },
        };
        this.socket = new socket_1.default(this.config);
        this.init();
    }
    enqueue(task) {
        const next = this._commandQueue.then(task, task);
        this._commandQueue = next.then(() => { }, () => { });
        return next;
    }
    init() {
        this._term = new terminal_1.default(this.config.terminal);
        this._term.state.setMode('stringWidth', 'dbcs');
        this.socket.on('connect', () => {
            this._state.connect = true;
            this.emit('connect');
        });
        this.socket.on('disconnect', () => {
            this._state.connect = false;
            this._state.login = false;
            this.emit('disconnect');
            this.emit('stateChange', this.state);
        });
        this.socket.on('error', (err) => {
            this.emit('error', err);
        });
        this.socket.on('message', (data) => {
            const chunk = (0, decode_1.default)(data, this.currentCharset);
            this._term.write(chunk);
            this.emit('message', chunk);
        });
        this.socket.connect();
    }
    async send(msg, timeoutMs = 800) {
        if (this.config.preventIdleTimeout) {
            this.preventIdle(this.config.preventIdleTimeout);
        }
        if (!this.state.connect) {
            return;
        }
        return new Promise((resolve) => {
            let settled = false;
            const timer = setTimeout(() => {
                if (!settled) {
                    settled = true;
                    this.removeListener('message', onMsg);
                    resolve();
                }
            }, timeoutMs);
            const onMsg = () => {
                if (!settled) {
                    settled = true;
                    clearTimeout(timer);
                    resolve();
                }
            };
            this.once('message', onMsg);
            this.socket.send((0, encode_1.default)(msg, this.currentCharset));
        });
    }
    preventIdle(timeout) {
        if (this._preventIdleHandler) {
            clearTimeout(this._preventIdleHandler);
        }
        if (this.state.login) {
            this._preventIdleHandler = setTimeout(async () => {
                await this.send(keymap_1.default.CtrlU);
                await this.send(keymap_1.default.ArrowLeft);
            }, timeout * 1000);
        }
    }
    setSearchCondition(type, criteria) {
        this.searchCondition.add(type, criteria);
    }
    resetSearchCondition() {
        this.searchCondition.init();
    }
    isSearchConditionSet() {
        return this.searchCondition.conditions.length > 0;
    }
    async login(username = '', password = '', kick = true) {
        return this.enqueue(async () => {
            if (this.state.login) {
                return true;
            }
            let cleanUser = username.replace(/,/g, '');
            if (this.config.charset === 'utf8') {
                cleanUser += ',';
            }
            await this.send(`${cleanUser}${keymap_1.default.Enter}${password}${keymap_1.default.Enter}`);
            let ret = null;
            let attempts = 0;
            ret = await this._checkLogin(kick);
            while (ret === null && attempts < 30) {
                attempts++;
                await sleep(300);
                ret = await this._checkLogin(kick);
            }
            if (ret) {
                this._state.login = true;
                this._state.position = { boardname: '' };
                this.searchCondition.init();
                this.emit('stateChange', this.state);
            }
            return ret === true;
        });
    }
    async logout() {
        return this.enqueue(async () => {
            if (!this.state.login) {
                return true;
            }
            await this.send(`G${keymap_1.default.Enter}Y${keymap_1.default.Enter.repeat(2)}`);
            this._state.login = false;
            this.emit('stateChange', this.state);
            return true;
        });
    }
    async _checkLogin(kick) {
        const { getLine } = this;
        if (getLine(21).str.includes('密碼不對或無此帳號')) {
            this.emit('login.failed');
            return false;
        }
        if (getLine(23).str.includes('請稍後再試')) {
            this.emit('login.failed');
            return false;
        }
        if (getLine(22).str.includes('您想刪除其他重複登入的連線嗎')) {
            await this.send(`${keymap_1.default.Backspace}${kick ? 'y' : 'n'}${keymap_1.default.Enter}`);
            return null;
        }
        if (getLine(23).str.includes('請勿頻繁登入以免造成系統過度負荷')) {
            await this.send(keymap_1.default.Enter);
            return null;
        }
        if (getLine(23).str.includes('按任意鍵繼續') || getLine(22).str.includes('按任意鍵繼續')) {
            await this.send(' ');
            return null;
        }
        if (getLine(23).str.includes('您要刪除以上錯誤嘗試的記錄嗎')) {
            await this.send(`${keymap_1.default.Backspace}y${keymap_1.default.Enter}`);
            return null;
        }
        if ((getLine(22).str + getLine(23).str).toLowerCase().includes('y/n')) {
            await this.send(`${keymap_1.default.Backspace}y${keymap_1.default.Enter}`);
            return null;
        }
        if (getLine(23).str.includes('我是') ||
            getLine(0).str.includes('主功能表') ||
            getLine(1).str.includes('主功能表') ||
            getLine(2).str.includes('主功能表')) {
            this.emit('login.success');
            return true;
        }
        await this.send('q');
        return null;
    }
    _checkArticleWithHeader() {
        const authorArea = (0, char_1.substrWidth)('dbcs', this.getLine(0).str, 0, 6).trim();
        return authorArea === '作者';
    }
    async enterIndex() {
        await this.send(`${keymap_1.default.Enter} ${keymap_1.default.ArrowLeft.repeat(10)}`);
        return true;
    }
    async enterBoard(boardname) {
        await this.enterIndex();
        await this.send(`s${boardname}${keymap_1.default.Enter} ${keymap_1.default.Home}${keymap_1.default.End}`);
        const lowerBoard = boardname.toLowerCase();
        const { getLine } = this;
        if (getLine(23).str.includes('按任意鍵繼續') || getLine(22).str.includes('按任意鍵繼續')) {
            await this.send(' ');
        }
        if (getLine(0).str.toLowerCase().includes(lowerBoard)) {
            this._state.position.boardname = boardname;
            this.emit('stateChange', this.state);
            return true;
        }
        return false;
    }
    async enterFavorite(offsets = []) {
        await this.enterIndex();
        const enterOffsetMessage = offsets
            .map((offset) => `${offset}${keymap_1.default.Enter.repeat(2)}`)
            .join('');
        await this.send(`F${keymap_1.default.Enter}${keymap_1.default.Home}${enterOffsetMessage}`);
        return true;
    }
    async getFavorite(offsets = []) {
        return this.enqueue(async () => {
            await this.enterFavorite(offsets);
            await sleep(250);
            const { getLine } = this;
            const favorites = [];
            const seenKeys = new Set();
            while (true) {
                let stopLoop = false;
                let addedInThisPage = 0;
                for (let i = 3; i < 23; i++) {
                    const line = getLine(i).str;
                    if (line.trim() === '') {
                        stopLoop = true;
                        break;
                    }
                    const match = line.match(/^\s*[>●*]?\s*(\d+)\s+([A-Za-z0-9_.-]+)\s+(\S+)(?:\s+(.*))?$/);
                    if (!match) {
                        continue;
                    }
                    const bn = Number.parseInt(match[1], 10);
                    const boardname = match[2];
                    const category = match[3];
                    const rawTitle = (match[4] || '').trim();
                    const cleanTitle = rawTitle.replace(/\s+([爆\d!~HOT]+|\d+)\s*(\S+)?$/, '').trim();
                    let folder = false;
                    let divider = false;
                    if (boardname === 'MyFavFolder') {
                        folder = true;
                    }
                    else if (boardname === '------------') {
                        divider = true;
                    }
                    else {
                        if (bn <= 0 || !/^[A-Za-z0-9_.-]+$/.test(boardname)) {
                            continue;
                        }
                    }
                    const itemKey = `${bn}-${boardname}`;
                    if (!seenKeys.has(itemKey)) {
                        seenKeys.add(itemKey);
                        favorites.push({
                            bn,
                            read: true,
                            boardname,
                            category,
                            title: cleanTitle,
                            users: '',
                            admin: '',
                            folder,
                            divider,
                        });
                        addedInThisPage++;
                    }
                }
                if (stopLoop || addedInThisPage === 0) {
                    break;
                }
                const prevLines = [getLine(3).str, getLine(4).str, getLine(5).str].join('\n');
                await this.send(keymap_1.default.PgDown);
                let pageChanged = false;
                for (let t = 0; t < 4; t++) {
                    await sleep(150);
                    const curLines = [getLine(3).str, getLine(4).str, getLine(5).str].join('\n');
                    if (curLines !== prevLines) {
                        pageChanged = true;
                        break;
                    }
                }
                if (!pageChanged) {
                    break;
                }
            }
            await this.enterIndex();
            return favorites;
        });
    }
    async getArticles(boardname, offset = 0) {
        return this.enqueue(async () => {
            const entered = await this.enterBoard(boardname);
            if (!entered) {
                await this.enterIndex();
                return [];
            }
            if (this.isSearchConditionSet()) {
                const searchString = this.searchCondition.conditions
                    .map((c) => c.toSearchString())
                    .join(keymap_1.default.Enter);
                await this.send(`${searchString}${keymap_1.default.Enter}`);
            }
            let cleanOffset = offset | 0;
            if (cleanOffset > 0) {
                cleanOffset = Math.max(cleanOffset - 9, 1);
                await this.send(`${keymap_1.default.End}${keymap_1.default.End}${cleanOffset}${keymap_1.default.Enter}`);
            }
            const { getLine } = this;
            const articles = [];
            for (let i = 3; i <= 22; i++) {
                const line = getLine(i).str;
                const sn = Number.parseInt((0, char_1.substrWidth)('dbcs', line, 1, 7).trim(), 10) || 0;
                const push = (0, char_1.substrWidth)('dbcs', line, 9, 2).trim();
                const date = (0, char_1.substrWidth)('dbcs', line, 11, 5).trim();
                const author = (0, char_1.substrWidth)('dbcs', line, 17, 12).trim();
                const status = (0, char_1.substrWidth)('dbcs', line, 30, 2).trim();
                const title = (0, char_1.substrWidth)('dbcs', line, 32).trim();
                const fixed = (0, char_1.substrWidth)('dbcs', line, 1, 7).trim().includes('★');
                if (title.length > 0) {
                    articles.push({
                        sn,
                        push,
                        date,
                        author,
                        status,
                        title,
                        fixed,
                    });
                }
            }
            // Fix SN for non-fixed posts if first is 0
            if (articles.length >= 2 && articles[0].sn === 0) {
                for (let i = 1; i < articles.length; i++) {
                    if (articles[i].sn !== 0) {
                        articles[0].sn = articles[i].sn - i;
                        break;
                    }
                }
                for (let i = 1; i < articles.length; i++) {
                    articles[i].sn = articles[i - 1].sn + 1;
                }
            }
            await this.enterIndex();
            return articles.reverse();
        });
    }
    async getArticle(boardname, sn) {
        return this.enqueue(async () => {
            const entered = await this.enterBoard(boardname);
            if (!entered) {
                await this.enterIndex();
                return {
                    sn,
                    author: '',
                    title: '',
                    timestamp: '',
                    lines: [],
                };
            }
            if (this.isSearchConditionSet()) {
                const searchString = this.searchCondition.conditions
                    .map((c) => c.toSearchString())
                    .join(keymap_1.default.Enter);
                await this.send(`${searchString}${keymap_1.default.Enter}`);
            }
            const { getLine } = this;
            await this.send(`${sn}${keymap_1.default.Enter}${keymap_1.default.Enter}`);
            const article = {
                sn,
                author: '',
                title: '',
                timestamp: '',
                lines: [],
            };
            if (this._checkArticleWithHeader()) {
                article.author = (0, char_1.substrWidth)('dbcs', getLine(0).str, 7, 50).trim();
                article.title = (0, char_1.substrWidth)('dbcs', getLine(1).str, 7).trim();
                article.timestamp = (0, char_1.substrWidth)('dbcs', getLine(2).str, 7).trim();
            }
            article.lines = await this.getLines();
            await this.enterIndex();
            return article;
        });
    }
    async getLines() {
        const { getLine } = this;
        const lines = [];
        lines.push(getLine(0).str);
        let attempts = 0;
        while (!getLine(23).str.includes('100%') && attempts < 100) {
            attempts++;
            for (let i = 1; i < 23; i++) {
                lines.push(getLine(i).str);
            }
            await this.send(keymap_1.default.PgDown);
        }
        const lastLine = lines[lines.length - 1];
        for (let i = 0; i < 23; i++) {
            if (getLine(i).str === lastLine) {
                for (let j = i + 1; j < 23; j++) {
                    lines.push(getLine(j).str);
                }
                break;
            }
        }
        while (lines.length > 0 && lines[lines.length - 1].length === 0) {
            lines.pop();
        }
        return lines;
    }
}
exports.Bot = Bot;
exports.default = Bot;
//# sourceMappingURL=bot.js.map