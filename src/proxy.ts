const http = require('http');
const httpProxy = require('http-proxy');

const config = {
  server: {
    host: '127.0.0.1',
    port: 9770,
  },
  silent: false,
};

const logging = config.silent ? (...args) => {} : console.log;

const proxy = httpProxy.createProxyServer({
  ws: true,
  target: 'wss://ws.ptt.cc/bbs',
  changeOrigin: true,
  headers: {
    origin: 'https://www.ptt.cc',
  }
});

const proxyServer = http.createServer((req, res) => {
  proxy.ws(req, res);
}).listen(config.server);

proxyServer
  .on('upgrade', (req, socket, head) => {
    const remoteAddress =
      req.headers['x-forwarded-for'] ||
      socket.remoteAddress;
    logging(`connection from ${remoteAddress}`);
    proxy.ws(req, socket, head);
  })
  .on('listening', () => {
    logging(`listening on ${config.server.host}:${config.server.port}`);
  })
  .on('error', (err) => {
    logging(err);
  });
