# ptt-client

A modernized TypeScript client for interacting with PTT BBS over WebSockets.

---

## Tribute & Credits

This package is a modernized fork and rewrite based on the original work by:
- **Kevin Lin** ([kevinptt0323/ptt-client](https://github.com/kevinptt0323/ptt-client) & [kevinptt0323/terminal.js](https://github.com/kevinptt0323/terminal.js))
- **Enno Boland (Gottox)** ([Gottox/terminal.js](https://github.com/Gottox/terminal.js))

We express deep gratitude to the original authors for laying the foundation of WebSocket-based PTT BBS clients in Node.js.

---

## Additions & Key Improvements

This modernized version includes several critical enhancements, bug fixes, and architectural upgrades:

### 1. 100% Pure TypeScript & Clean Modern Toolchain
- Replaced the legacy 2019 Babel build with pure TypeScript definitions and compilation.
- Complete, strict TypeScript interfaces for all BBS data models (`FavoriteBoardItem`, `ArticleListItem`, `ArticleDetail`, `PttState`, `PttConfig`).

### 2. Built-in ANSI / VT100 DBCS Terminal Emulator
- Inlined and modernized the terminal screen state emulator directly in TypeScript.
- Native DBCS (Double-Byte Character Set) visual width calculations and full Big5/UAO-250 & UTF-8 character support without unmaintained external git dependencies.

### 3. Guaranteed `send()` Timeouts (No Hanging)
- The original client attached indefinite `once('message')` listeners on socket writes. When PTT returned 0 bytes (e.g. at the end of a list or on certain prompt screens), promises hung forever.
- Added timeout fallbacks (default 800ms) to ensure commands always resolve safely.

### 4. Built-in Async Command Queue
- Stateful telnet/BBS terminal sessions over a single WebSocket connection cannot execute parallel commands without corrupting the terminal buffer.
- Added a built-in FIFO command queue so calls to `login()`, `logout()`, `getFavorite()`, `getArticles()`, and `getArticle()` run sequentially without terminal race conditions.

### 5. Complete Multi-Page Favorites Scanning
- Replaced the legacy 1-page ~17 item limit and fragile sequence break checks with robust screen diffing and deduplication to scan all pages (100+ favorite items).
- Handled PTT unread caron markers (`ˇ`) and divider lines (`------------`) without corrupting board names.

### 6. Robust Navigation & Splash Screen Dismissal
- Automatically handles and dismisses post-login daily quotes, board entrance banners, and draft auto-recovery prompts (`【 編輯器自動復原 】`).

### 7. Unit & Mock WebSocket E2E Test Suites
- Comprehensive test coverage including character width slicing, terminal ANSI parsing, and end-to-end WebSocket simulation with mock PTT server flows.

---

## Usage

```typescript
import Bot, { keymap } from 'ptt-client';

async function main() {
  const bot = new Bot({
    origin: 'https://term.ptt.cc',
    url: 'wss://ws.ptt.cc/bbs',
    timeout: 200
  });

  bot.on('connect', () => console.log('Connected to PTT WebSocket'));

  // Single login attempt with kick duplicate option
  const loggedIn = await bot.login('username', 'password', true);
  if (!loggedIn) {
    console.error('Login failed');
    return;
  }

  // Fetch all favorite boards across all pages
  const favorites = await bot.getFavorite();
  console.log(`Loaded ${favorites.length} favorite boards`);

  // Fetch the latest 20 articles from a board
  const articles = await bot.getArticles('Gossiping');
  console.log(`Loaded ${articles.length} articles`);

  if (articles.length > 0) {
    // Open full article details
    const article = await bot.getArticle('Gossiping', articles[0].sn);
    console.log('Title:', article.title);
    console.log('Author:', article.author);
    console.log('Lines count:', article.lines.length);
  }

  await bot.logout();
  bot.socket.disconnect();
}
```

---

## License

[MIT](LICENSE)
