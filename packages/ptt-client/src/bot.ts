import EventEmitter from 'eventemitter3';
import Terminal from './terminal/terminal';
import Socket from './socket';
import decode from './utils/decode';
import encode from './utils/encode';
import keymap from './utils/keymap';
import { substrWidth } from './utils/char';
import defaultConfig, { type PttConfig } from './config';
import type {
  ArticleListItem,
  ArticleDetail,
  FavoriteBoardItem,
  PttState,
} from './types';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export class Condition {
  public typeWord: string;
  public criteria: string;

  constructor(type: string, criteria: string) {
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

  toSearchString(): string {
    return `${this.typeWord}${this.criteria}`;
  }
}

export class Bot extends EventEmitter {
  public config: PttConfig;
  public state: PttState;
  public _state: PttState;
  public currentCharset: string;
  public socket: Socket;
  public _term: { state: { setMode: (mode: string, val: string) => void; getLine: (n: number) => { str: string } }; write: (data: string) => void };
  public searchCondition: {
    conditions: Condition[];
    init: () => void;
    add: (type: string, criteria: string) => void;
  };

  private _preventIdleHandler: NodeJS.Timeout | null = null;
  private _commandQueue: Promise<unknown> = Promise.resolve();

  constructor(config: Partial<PttConfig> = {}) {
    super();
    this.config = { ...defaultConfig, ...config };
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
      add: (type: string, criteria: string) => {
        this.searchCondition.conditions.push(new Condition(type, criteria));
      },
    };

    this.socket = new Socket(this.config);
    this.init();
  }

  private enqueue<T>(task: () => Promise<T>): Promise<T> {
    const next = this._commandQueue.then(task, task);
    this._commandQueue = next.then(() => {}, () => {});
    return next;
  }

  private init(): void {
    this._term = new Terminal(this.config.terminal);
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

    this.socket.on('error', (err: Error) => {
      this.emit('error', err);
    });

    this.socket.on('message', (data: number[]) => {
      const chunk = decode(data, this.currentCharset);
      this._term.write(chunk);
      this.emit('message', chunk);
    });

    this.socket.connect();
  }

  public getLine = (n: number): { str: string } => {
    return this._term.state.getLine(n);
  };

  public async send(msg: string, timeoutMs = 800): Promise<void> {
    if (this.config.preventIdleTimeout) {
      this.preventIdle(this.config.preventIdleTimeout);
    }
    if (!this.state.connect) {
      return;
    }

    return new Promise<void>((resolve) => {
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
      this.socket.send(encode(msg, this.currentCharset));
    });
  }

  public preventIdle(timeout: number): void {
    if (this._preventIdleHandler) {
      clearTimeout(this._preventIdleHandler);
    }
    if (this.state.login) {
      this._preventIdleHandler = setTimeout(async () => {
        await this.send(keymap.CtrlU);
        await this.send(keymap.ArrowLeft);
      }, timeout * 1000);
    }
  }

  public setSearchCondition(type: string, criteria: string): void {
    this.searchCondition.add(type, criteria);
  }

  public resetSearchCondition(): void {
    this.searchCondition.init();
  }

  public isSearchConditionSet(): boolean {
    return this.searchCondition.conditions.length > 0;
  }

  public async login(username = '', password = '', kick = true): Promise<boolean> {
    return this.enqueue(async () => {
      if (this.state.login) {
        return true;
      }
      let cleanUser = username.replace(/,/g, '');
      if (this.config.charset === 'utf8') {
        cleanUser += ',';
      }

      await this.send(`${cleanUser}${keymap.Enter}${password}${keymap.Enter}`);

      let ret: boolean | null = null;
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

  public async logout(): Promise<boolean> {
    return this.enqueue(async () => {
      if (!this.state.login) {
        return true;
      }
      await this.send(`G${keymap.Enter}Y${keymap.Enter.repeat(2)}`);
      this._state.login = false;
      this.emit('stateChange', this.state);
      return true;
    });
  }

  private async _checkLogin(kick: boolean): Promise<boolean | null> {
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
      await this.send(`${keymap.Backspace}${kick ? 'y' : 'n'}${keymap.Enter}`);
      return null;
    }
    if (getLine(23).str.includes('請勿頻繁登入以免造成系統過度負荷')) {
      await this.send(keymap.Enter);
      return null;
    }
    if (getLine(23).str.includes('按任意鍵繼續') || getLine(22).str.includes('按任意鍵繼續')) {
      await this.send(' ');
      return null;
    }
    if (getLine(23).str.includes('您要刪除以上錯誤嘗試的記錄嗎')) {
      await this.send(`${keymap.Backspace}y${keymap.Enter}`);
      return null;
    }
    if ((getLine(22).str + getLine(23).str).toLowerCase().includes('y/n')) {
      await this.send(`${keymap.Backspace}y${keymap.Enter}`);
      return null;
    }
    if (
      getLine(23).str.includes('我是') ||
      getLine(0).str.includes('主功能表') ||
      getLine(1).str.includes('主功能表') ||
      getLine(2).str.includes('主功能表')
    ) {
      this.emit('login.success');
      return true;
    }

    await this.send('q');
    return null;
  }

  private _checkArticleWithHeader(): boolean {
    const authorArea = substrWidth('dbcs', this.getLine(0).str, 0, 6).trim();
    return authorArea === '作者';
  }

  public async enterIndex(): Promise<boolean> {
    await this.send(keymap.ArrowLeft.repeat(10));
    return true;
  }

  public async enterBoard(boardname: string): Promise<boolean> {
    await this.enterIndex();
    await this.send(`s${boardname}${keymap.Enter} ${keymap.Home}${keymap.End}`);
    const lowerBoard = boardname.toLowerCase();
    const { getLine } = this;

    for (let t = 0; t < 6; t++) {
      if (getLine(23).str.includes('按任意鍵繼續') || getLine(22).str.includes('按任意鍵繼續')) {
        await this.send(' ');
      }
      if (getLine(0).str.toLowerCase().includes(lowerBoard)) {
        this._state.position.boardname = boardname;
        this.emit('stateChange', this.state);
        return true;
      }
      await sleep(100);
    }

    return false;
  }

  public async enterFavorite(offsets: (number | string)[] = []): Promise<boolean> {
    await this.enterIndex();
    const enterOffsetMessage = offsets
      .map((offset) => `${offset}${keymap.Enter.repeat(2)}`)
      .join('');
    await this.send(`F${keymap.Enter}${keymap.Home}${enterOffsetMessage}`);
    return true;
  }

  public async getFavorite(offsets: (number | string)[] = []): Promise<FavoriteBoardItem[]> {
    return this.enqueue(async () => {
      await this.enterFavorite(offsets);
      await sleep(250);
      const { getLine } = this;

      const favorites: FavoriteBoardItem[] = [];
      const seenKeys = new Set<string>();

      while (true) {
        let stopLoop = false;
        let addedInThisPage = 0;

        for (let i = 3; i < 23; i++) {
          const line = getLine(i).str;
          if (line.trim() === '') {
            stopLoop = true;
            break;
          }

          const match = line.match(/^\s*[●>─*]?\s*(\d+)\s+ˇ?\s*([A-Za-z0-9_.-]+)\s+(\S+)(?:\s+(.*))?$/);
          if (!match) {
            continue;
          }

          const bn = Number.parseInt(match[1], 10);
          const boardname = match[2];
          const category = match[3];
          const rawTitle = (match[4] || '').replace(/\s+([爆\d!~HOT]+|\d+)\s*\S*$/, '').trim();
          let folder = false;
          let divider = false;

          if (boardname === 'MyFavFolder') {
            folder = true;
          } else if (boardname === '------------') {
            divider = true;
          } else {
            if (bn <= 0 || !/^[A-Za-z0-9_.-]+$/.test(boardname)) {
              continue;
            }
          }

          const itemKey = `${bn}-${boardname}`;
          if (!seenKeys.has(itemKey)) {
            seenKeys.add(itemKey);
            favorites.push({
              bn,
              read: !line.includes('ˇ'),
              boardname,
              category,
              title: rawTitle,
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
        await this.send(keymap.PgDown);

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

  public async getArticles(boardname: string, offset = 0): Promise<ArticleListItem[]> {
    return this.enqueue(async () => {
      const entered = await this.enterBoard(boardname);
      if (!entered) {
        await this.enterIndex();
        return [];
      }

      if (this.isSearchConditionSet()) {
        const searchString = this.searchCondition.conditions
          .map((c) => c.toSearchString())
          .join(keymap.Enter);
        await this.send(`${searchString}${keymap.Enter}`);
      }

      let cleanOffset = offset | 0;
      if (cleanOffset > 0) {
        cleanOffset = Math.max(cleanOffset - 9, 1);
        await this.send(`${keymap.End}${keymap.End}${cleanOffset}${keymap.Enter}`);
      }

      const { getLine } = this;
      const articles: ArticleListItem[] = [];

      for (let i = 3; i <= 22; i++) {
        const line = getLine(i).str;
        const sn = Number.parseInt(substrWidth('dbcs', line, 1, 7).trim(), 10) || 0;
        const push = substrWidth('dbcs', line, 9, 2).trim();
        const date = substrWidth('dbcs', line, 11, 5).trim();
        const author = substrWidth('dbcs', line, 17, 12).trim();
        const status = substrWidth('dbcs', line, 30, 2).trim();
        const title = substrWidth('dbcs', line, 32).trim();
        const fixed = substrWidth('dbcs', line, 1, 7).trim().includes('★');

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

  public async getArticle(boardname: string, sn: number | string): Promise<ArticleDetail> {
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
          .join(keymap.Enter);
        await this.send(`${searchString}${keymap.Enter}`);
      }

      const { getLine } = this;
      await this.send(`${sn}${keymap.Enter}${keymap.Enter}`);

      const article: ArticleDetail = {
        sn,
        author: '',
        title: '',
        timestamp: '',
        lines: [],
      };

      if (this._checkArticleWithHeader()) {
        article.author = substrWidth('dbcs', getLine(0).str, 7, 50).trim();
        article.title = substrWidth('dbcs', getLine(1).str, 7).trim();
        article.timestamp = substrWidth('dbcs', getLine(2).str, 7).trim();
      }

      article.lines = await this.getLines();

      await this.enterIndex();
      return article;
    });
  }

  private async getLines(): Promise<string[]> {
    const { getLine } = this;
    const lines: string[] = [];

    lines.push(getLine(0).str);

    let attempts = 0;
    while (!getLine(23).str.includes('100%') && attempts < 100) {
      attempts++;
      for (let i = 1; i < 23; i++) {
        lines.push(getLine(i).str);
      }
      await this.send(keymap.PgDown);
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

export default Bot;
