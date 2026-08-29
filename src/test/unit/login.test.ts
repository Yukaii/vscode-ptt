import * as assert from 'assert';
import * as vscode from 'vscode';
import {
  login,
  getLoginCredential,
  checkLogin,
  setPttClient,
  setPttClientFactory,
  setExtensionContext,
  setPttProvider
} from '../../extension';
import { MockPttClient } from './mockPttClient';
import { PttTreeDataProvider } from '../../pttDataProvider';
import { mockVscode } from './setup';

describe('Login Unit Tests', () => {
  let mockContext: vscode.ExtensionContext;
  let globalStore: Record<string, any>;
  let mockPtt: MockPttClient;
  let mockProvider: PttTreeDataProvider;
  let messages: { info: string[]; warning: string[] };

  beforeEach(() => {
    globalStore = {};
    mockContext = {
      globalState: {
        get: (key: string) => globalStore[key],
        update: (key: string, value: any) => {
          globalStore[key] = value;
          return Promise.resolve();
        }
      }
    } as unknown as vscode.ExtensionContext;

    mockPtt = new MockPttClient(false);
    mockProvider = new PttTreeDataProvider(mockPtt, mockContext);

    messages = { info: [], warning: [] };
    mockVscode.window.showInformationMessage = async (msg: string) => {
      messages.info.push(msg);
      return undefined;
    };
    mockVscode.window.showWarningMessage = async (msg: string) => {
      messages.warning.push(msg);
      return undefined;
    };

    setPttClient(mockPtt);
    setPttClientFactory(() => Promise.resolve(mockPtt));
    setExtensionContext(mockContext);
    setPttProvider(mockProvider);
  });

  describe('getLoginCredential', () => {
    it('returns stored credentials if present (normal user)', async () => {
      globalStore['username'] = 'testuser';
      globalStore['password'] = 'testpass';

      const creds = await getLoginCredential(false);
      assert.strictEqual(creds.username, 'testuser');
      assert.strictEqual(creds.password, 'testpass');
    });

    it('returns stored guest credentials even if password is empty', async () => {
      globalStore['username'] = 'guest';
      globalStore['password'] = '';

      const creds = await getLoginCredential(false);
      assert.strictEqual(creds.username, 'guest');
      assert.strictEqual(creds.password, '');
    });

    it('prompts and skips password input when username is guest', async () => {
      let passwordPrompted = false;
      mockVscode.window.showInputBox = async (options: any) => {
        if (options.placeHolder === '帳號') {
          return 'guest';
        }
        if (options.placeHolder === '密碼') {
          passwordPrompted = true;
          return 'should_not_be_called';
        }
        return undefined;
      };

      const creds = await getLoginCredential(false);
      assert.strictEqual(creds.username, 'guest');
      assert.strictEqual(creds.password, '');
      assert.strictEqual(passwordPrompted, false);
    });

    it('prompts and skips password input when username is Guest (case insensitive)', async () => {
      let passwordPrompted = false;
      mockVscode.window.showInputBox = async (options: any) => {
        if (options.placeHolder === '帳號') {
          return 'Guest';
        }
        if (options.placeHolder === '密碼') {
          passwordPrompted = true;
          return 'should_not_be_called';
        }
        return undefined;
      };

      const creds = await getLoginCredential(false);
      assert.strictEqual(creds.username, 'Guest');
      assert.strictEqual(creds.password, '');
      assert.strictEqual(passwordPrompted, false);
    });

    it('prompts for both username and password for normal accounts', async () => {
      mockVscode.window.showInputBox = async (options: any) => {
        if (options.placeHolder === '帳號') {
          return 'myaccount';
        }
        if (options.placeHolder === '密碼') {
          return 'mypassword';
        }
        return undefined;
      };

      const creds = await getLoginCredential(false);
      assert.strictEqual(creds.username, 'myaccount');
      assert.strictEqual(creds.password, 'mypassword');
    });

    it('returns empty if username prompt is cancelled', async () => {
      mockVscode.window.showInputBox = async () => undefined;

      const creds = await getLoginCredential(false);
      assert.deepStrictEqual(creds, {});
    });

    it('returns empty if password prompt is cancelled for non-guest', async () => {
      mockVscode.window.showInputBox = async (options: any) => {
        if (options.placeHolder === '帳號') {
          return 'myaccount';
        }
        return undefined; // Password cancelled
      };

      const creds = await getLoginCredential(false);
      assert.deepStrictEqual(creds, {});
    });
  });

  describe('login flow', () => {
    it('successfully logs in with guest account and empty password', async () => {
      mockVscode.window.showInputBox = async (options: any) => {
        if (options.placeHolder === '帳號') {
          return 'guest';
        }
        return undefined;
      };

      await login(false);

      assert.strictEqual(checkLogin(), true);
      assert.strictEqual(globalStore['username'], 'guest');
      assert.strictEqual(globalStore['password'], '');
      assert.ok(messages.info.some(msg => msg.includes('guest 登入成功')));
    });

    it('successfully logs in with normal account', async () => {
      mockVscode.window.showInputBox = async (options: any) => {
        if (options.placeHolder === '帳號') {
          return 'pttuser';
        }
        if (options.placeHolder === '密碼') {
          return 'secretpass';
        }
        return undefined;
      };

      await login(false);

      assert.strictEqual(checkLogin(), true);
      assert.strictEqual(globalStore['username'], 'pttuser');
      assert.strictEqual(globalStore['password'], 'secretpass');
      assert.ok(messages.info.some(msg => msg.includes('pttuser 登入成功')));
    });

    it('shows warning message when login credentials are missing and not silent', async () => {
      mockVscode.window.showInputBox = async () => undefined;

      await login(false);

      assert.strictEqual(checkLogin(), false);
      assert.ok(messages.warning.some(msg => msg.includes('需要帳密才能使用')));
    });

    it('does not prompt or warn during silent login when no credentials exist', async () => {
      let prompted = false;
      mockVscode.window.showInputBox = async () => {
        prompted = true;
        return undefined;
      };

      await login(true);

      assert.strictEqual(checkLogin(), false);
      assert.strictEqual(prompted, false);
      assert.strictEqual(messages.warning.length, 0);
    });

    it('performs silent auto-login on startup when guest credentials exist in globalState', async () => {
      globalStore['username'] = 'guest';
      globalStore['password'] = '';

      await login(true);

      assert.strictEqual(checkLogin(), true);
      assert.strictEqual(messages.info.length, 0); // silent = true so no info popup
    });

    it('treats non-boolean arguments as manual login (e.g. from VS Code command)', async () => {
      mockVscode.window.showInputBox = async (options: any) => {
        if (options.placeHolder === '帳號') {
          return 'commanduser';
        }
        if (options.placeHolder === '密碼') {
          return 'commandpass';
        }
        return undefined;
      };

      await (login as any)({});

      assert.strictEqual(checkLogin(), true);
      assert.strictEqual(globalStore['username'], 'commanduser');
      assert.strictEqual(globalStore['password'], 'commandpass');
    });

    it('prompts for new credentials if stored credentials fail during manual login', async () => {
      globalStore['username'] = 'olduser';
      globalStore['password'] = 'wrongpass';

      // First attempt with olduser will fail
      mockPtt.login = async (user?: string, pass?: string) => {
        if (user === 'correctuser' && pass === 'correctpass') {
          mockPtt.state.login = true;
          return true;
        }
        mockPtt.state.login = false;
        return false;
      };

      mockVscode.window.showInputBox = async (options: any) => {
        if (options.placeHolder === '帳號') {
          return 'correctuser';
        }
        if (options.placeHolder === '密碼') {
          return 'correctpass';
        }
        return undefined;
      };

      await login(false);

      assert.strictEqual(checkLogin(), true);
      assert.strictEqual(globalStore['username'], 'correctuser');
      assert.strictEqual(globalStore['password'], 'correctpass');
      assert.ok(messages.info.some(msg => msg.includes('correctuser 登入成功')));
    });

    it('shows warning when connection to PTT server is unavailable', async () => {
      mockPtt.state.connect = false;

      await login(false);

      assert.strictEqual(checkLogin(), false);
      assert.ok(messages.warning.some(msg => msg.includes('無法連線至 PTT 伺服器')));
    });

    it('updates ptt:loggedIn context key on login state change', async () => {
      let contextKey = '';
      let contextValue: any = null;
      mockVscode.commands.executeCommand = async (cmd: string, key: string, val: any) => {
        if (cmd === 'setContext') {
          contextKey = key;
          contextValue = val;
        }
      };

      mockVscode.window.showInputBox = async (options: any) => {
        if (options.placeHolder === '帳號') {
          return 'contextuser';
        }
        if (options.placeHolder === '密碼') {
          return 'contextpass';
        }
        return undefined;
      };

      await login(false);

      assert.strictEqual(contextKey, 'ptt:loggedIn');
      assert.strictEqual(contextValue, true);
    });

    it('deduplicates concurrent login calls and awaits single in-flight attempt', async () => {
      let loginCalls = 0;
      globalStore['username'] = 'concurrentUser';
      globalStore['password'] = 'concurrentPass';

      mockPtt.login = async () => {
        loginCalls++;
        await new Promise(r => setTimeout(r, 20));
        mockPtt.state.login = true;
        return true;
      };

      const [res1, res2] = await Promise.all([login(true), login(true)]);

      assert.strictEqual(res1, true);
      assert.strictEqual(res2, true);
      assert.strictEqual(loginCalls, 1);
      assert.strictEqual(checkLogin(), true);
    });
  });
});
