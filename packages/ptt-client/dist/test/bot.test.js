"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_assert_1 = __importDefault(require("node:assert"));
const node_http_1 = __importDefault(require("node:http"));
const ws_1 = require("ws");
const bot_1 = require("../src/bot");
const keymap_1 = __importDefault(require("../src/utils/keymap"));
const encode_1 = __importDefault(require("../src/utils/encode"));
describe('ptt-client Bot & E2E Tests', () => {
    let server;
    let wss;
    let port;
    before((done) => {
        server = node_http_1.default.createServer();
        wss = new ws_1.WebSocketServer({ server });
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
        const condPush = new bot_1.Condition('push', '50');
        node_assert_1.default.strictEqual(condPush.toSearchString(), 'Z50');
        const condAuthor = new bot_1.Condition('author', 'admin');
        node_assert_1.default.strictEqual(condAuthor.toSearchString(), 'aadmin');
        const condTitle = new bot_1.Condition('title', 'test');
        node_assert_1.default.strictEqual(condTitle.toSearchString(), '/test');
    });
    it('connects to mock server, executes login, and fetches favorites', async function () {
        this.timeout(5000);
        let receivedData = '';
        wss.once('connection', (ws) => {
            ws.on('message', (msg) => {
                const text = msg.toString('utf8');
                receivedData += text;
                if (text.includes('testuser') && text.includes('testpass')) {
                    // Send login success screen
                    ws.send((0, encode_1.default)('\u001B[24;1H我是 testuser (測試者)\r\n', 'utf8'));
                }
                else if (text.includes('F')) {
                    // Send favorites page
                    const favScreen = '\u001B[1;1H【 我的最愛清單 】\r\n' +
                        '\u001B[2;1H  編號  看板名稱      類別  中文敘述                  人氣 板主\r\n' +
                        '\u001B[3;1H--------------------------------------------------------------------\r\n' +
                        '\u001B[4;1H>   1   Gossiping      綜合 ◎八卦板                  爆!admin\r\n' +
                        '\u001B[5;1H    2   C_Chat         動漫 ◎希洽板                  50 admin\r\n' +
                        '\u001B[6;1H\r\n';
                    ws.send((0, encode_1.default)(favScreen, 'utf8'));
                }
            });
        });
        const bot = new bot_1.Bot({
            url: `ws://127.0.0.1:${port}`,
            timeout: 50,
        });
        await new Promise((resolve) => {
            bot.once('connect', () => resolve());
        });
        node_assert_1.default.strictEqual(bot.state.connect, true);
        const loggedIn = await bot.login('testuser', 'testpass');
        node_assert_1.default.strictEqual(loggedIn, true);
        node_assert_1.default.strictEqual(bot.state.login, true);
        const favorites = await bot.getFavorite();
        node_assert_1.default.strictEqual(favorites.length, 2);
        node_assert_1.default.strictEqual(favorites[0].boardname, 'Gossiping');
        node_assert_1.default.strictEqual(favorites[0].title, '◎八卦板');
        node_assert_1.default.strictEqual(favorites[1].boardname, 'C_Chat');
        node_assert_1.default.strictEqual(favorites[1].title, '◎希洽板');
        await bot.logout();
        node_assert_1.default.strictEqual(bot.state.login, false);
        bot.socket.disconnect();
    });
    it('send() resolves on timeout when server sends 0 bytes and does not hang', async () => {
        const bot = new bot_1.Bot({
            url: `ws://127.0.0.1:${port}`,
            timeout: 50,
        });
        await new Promise((resolve) => {
            bot.once('connect', () => resolve());
        });
        // Sending without server responding should resolve cleanly via timeout
        const start = Date.now();
        await bot.send(keymap_1.default.PgDown, 200);
        const elapsed = Date.now() - start;
        node_assert_1.default.ok(elapsed >= 150, `Elapsed ${elapsed}ms should be around timeout`);
        bot.socket.disconnect();
    });
});
//# sourceMappingURL=bot.test.js.map