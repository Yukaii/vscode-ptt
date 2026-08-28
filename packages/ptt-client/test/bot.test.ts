import assert from 'node:assert';
import http from 'node:http';
import WebSocket, { WebSocketServer } from 'ws';
import { Bot, Condition } from '../src/bot';
import keymap from '../src/utils/keymap';
import encode from '../src/utils/encode';

describe('ptt-client Bot & E2E Tests', () => {
  let server: http.Server;
  let wss: WebSocketServer;
  let port: number;

  before((done) => {
    server = http.createServer();
    wss = new WebSocketServer({ server });
    server.listen(0, () => {
      const addr = server.address();
      if (addr && typeof addr === 'object') {
        port = addr.port;
      }
      done();
    });
  });

  after((done) => {
    for (const client of wss.clients) {
      client.terminate();
    }
    wss.close(() => {
      server.close(() => {
        done();
      });
    });
  });

  it('instantiates Condition and formats search string', () => {
    const condPush = new Condition('push', '50');
    assert.strictEqual(condPush.toSearchString(), 'Z50');

    const condAuthor = new Condition('author', 'admin');
    assert.strictEqual(condAuthor.toSearchString(), 'aadmin');

    const condTitle = new Condition('title', 'test');
    assert.strictEqual(condTitle.toSearchString(), '/test');
  });

  it('connects to mock server, executes login, and fetches favorites', async function () {
    this.timeout(5000);
    let receivedData = '';

    wss.once('connection', (ws) => {
      ws.on('message', (msg: Buffer) => {
        const text = msg.toString('utf8');
        receivedData += text;

        if (text.includes('testuser') && text.includes('testpass')) {
          // Send login success screen
          ws.send(encode('\u001B[24;1H我是 testuser (測試者)\r\n', 'utf8'));
        } else if (text.includes('F')) {
          // Send favorites page
          const favScreen =
            '\u001B[1;1H【 我的最愛清單 】\r\n' +
            '\u001B[2;1H  編號  看板名稱      類別  中文敘述                  人氣 板主\r\n' +
            '\u001B[3;1H--------------------------------------------------------------------\r\n' +
            '\u001B[4;1H>   1   Gossiping      綜合 ◎八卦板                  爆!admin\r\n' +
            '\u001B[5;1H    2   C_Chat         動漫 ◎希洽板                  50 admin\r\n' +
            '\u001B[6;1H\r\n';
          ws.send(encode(favScreen, 'utf8'));
        }
      });
    });

    const bot = new Bot({
      url: `ws://127.0.0.1:${port}`,
      timeout: 50,
    });

    await new Promise<void>((resolve) => {
      bot.once('connect', () => resolve());
    });

    assert.strictEqual(bot.state.connect, true);

    const loggedIn = await bot.login('testuser', 'testpass');
    assert.strictEqual(loggedIn, true);
    assert.strictEqual(bot.state.login, true);

    const favorites = await bot.getFavorite();
    assert.strictEqual(favorites.length, 2);
    assert.strictEqual(favorites[0].boardname, 'Gossiping');
    assert.strictEqual(favorites[0].title, '◎八卦板');
    assert.strictEqual(favorites[1].boardname, 'C_Chat');
    assert.strictEqual(favorites[1].title, '◎希洽板');

    await bot.logout();
    assert.strictEqual(bot.state.login, false);
    bot.socket.disconnect();
  });

  it('send() resolves on timeout when server sends 0 bytes and does not hang', async () => {
    const bot = new Bot({
      url: `ws://127.0.0.1:${port}`,
      timeout: 50,
    });

    await new Promise<void>((resolve) => {
      bot.once('connect', () => resolve());
    });

    // Sending without server responding should resolve cleanly via timeout
    const start = Date.now();
    await bot.send(keymap.PgDown, 200);
    const elapsed = Date.now() - start;

    assert.ok(elapsed >= 150, `Elapsed ${elapsed}ms should be around timeout`);
    bot.socket.disconnect();
  });
});
