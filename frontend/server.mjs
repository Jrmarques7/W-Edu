import http from 'node:http';
import https from 'node:https';
import next from 'next';

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || '0.0.0.0';
const port = Number(process.env.PORT || 3000);
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

function getBevoxTarget() {
  const raw = process.env.BEVOX_URL || process.env.NEXT_PUBLIC_BEVOX_URL || 'http://localhost:8001';
  return new URL(raw.replace(/^ws:/, 'http:').replace(/^wss:/, 'https:'));
}

function proxyBevoxUpgrade(req, socket, head) {
  const target = getBevoxTarget();
  const targetPath = req.url?.replace(/^\/bevox/, '') || '/';
  const headers = {
    ...req.headers,
    host: target.host,
  };

  const transport = target.protocol === 'https:' ? https : http;
  const proxyReq = transport.request({
    hostname: target.hostname,
    port: target.port || (target.protocol === 'https:' ? 443 : 80),
    path: targetPath,
    method: req.method,
    headers,
  });

  proxyReq.on('upgrade', (proxyRes, proxySocket, proxyHead) => {
    socket.write(`HTTP/${proxyRes.httpVersion} ${proxyRes.statusCode} ${proxyRes.statusMessage}\r\n`);
    for (const [key, value] of Object.entries(proxyRes.headers)) {
      if (Array.isArray(value)) {
        for (const item of value) socket.write(`${key}: ${item}\r\n`);
      } else if (value !== undefined) {
        socket.write(`${key}: ${value}\r\n`);
      }
    }
    socket.write('\r\n');

    if (proxyHead.length) socket.write(proxyHead);
    if (head.length) proxySocket.write(head);
    proxySocket.pipe(socket);
    socket.pipe(proxySocket);
  });

  proxyReq.on('error', () => {
    socket.write('HTTP/1.1 502 Bad Gateway\r\n\r\n');
    socket.destroy();
  });

  proxyReq.end();
}

await app.prepare();

const server = http.createServer((req, res) => {
  handle(req, res);
});

server.on('upgrade', (req, socket, head) => {
  if (req.url?.startsWith('/bevox/')) {
    proxyBevoxUpgrade(req, socket, head);
    return;
  }
  socket.destroy();
});

server.listen(port, hostname, () => {
  console.log(`W-Edu frontend ready on http://${hostname}:${port}`);
});
