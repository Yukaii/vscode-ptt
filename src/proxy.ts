import * as http from 'http';
import * as httpProxy from 'http-proxy';
import * as fp from 'find-free-port';

const logger = console;

interface IProxyConfig {
  server: any;
  silent: boolean;
}

function createProxy () {
  const proxy = httpProxy.createProxyServer({
    target: 'wss://ws.ptt.cc/bbs',
    changeOrigin: true,
    headers: {
      origin: 'https://www.ptt.cc',
    }
  });

  return proxy;
}

function startProxyServer (proxy: httpProxy, config: IProxyConfig) {
  const proxyServer = http.createServer((req, res) => {
    proxy.ws(req, res, undefined);
  }).listen(config.server);

  // TODO: handle proxy error restart
  proxyServer
    .on('upgrade', (req, socket, head) => {
      const remoteAddress =
        req.headers['x-forwarded-for'] ||
        socket.remoteAddress;
      logger.log(`connection from ${remoteAddress}`);
      proxy.ws(req, socket, head);
    })
    .on('listening', () => {
      logger.log(`listening on ${config.server.host}:${config.server.port}`);
    })
    .on('error', (err) => {
      logger.log(err);
    });

  return proxyServer;
}


export default async function () {
  const [port] = await fp(9700, 9800);
  const config: IProxyConfig = {
    server: {
      host: '127.0.0.1',
      port
    },
    silent: false
  };

  const proxy = createProxy();
  const server = startProxyServer(proxy, config);

  const address = `ws://127.0.0.1:${port}`;

  return {
    server,
    address
  };
}

