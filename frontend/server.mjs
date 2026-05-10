import http from 'node:http';
import net from 'node:net';
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
  const targetPath = req.url?.startsWith('/bevox')
    ? (req.url.replace(/^\/bevox/, '') || '/')
    : (req.url || '/');

  console.log(`[bevox] upgrade ${req.url} → ${target.host}${targetPath}`);

  const proxyPort = Number(target.port) || (target.protocol === 'https:' ? 443 : 80);
  const proxySocket = net.connect(proxyPort, target.hostname);

  proxySocket.on('connect', () => {
    console.log('[bevox] connected to BeVox');
    const headerLines = Object.entries(req.headers)
      .filter(([k]) => k !== 'host')
      .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
      .join('\r\n');

    proxySocket.write(
      `${req.method} ${targetPath} HTTP/1.1\r\n` +
      `host: ${target.host}\r\n` +
      (headerLines ? headerLines + '\r\n' : '') +
      '\r\n'
    );
    if (head && head.length) proxySocket.write(head);
  });

  proxySocket.pipe(socket, { end: false });
  socket.pipe(proxySocket, { end: false });

  proxySocket.on('data', d => console.log('[bevox] BeVox→client:', d.slice(0, 80).toString().replace(/\r\n/g, '\\r\\n')));
  socket.on('data', d => console.log('[bevox] client→BeVox:', d.slice(0, 80).toString().replace(/\r\n/g, '\\r\\n')));
  proxySocket.on('end', () => { console.log('[bevox] BeVox closed'); socket.end(); });
  socket.on('end', () => { console.log('[bevox] client closed'); proxySocket.end(); });
  proxySocket.on('error', e => { console.log('[bevox] BeVox error:', e.message); socket.write('HTTP/1.1 502 Bad Gateway\r\n\r\n'); socket.destroy(); });
  socket.on('error', e => { console.log('[bevox] client error:', e.message); proxySocket.destroy(); });
}

await app.prepare();

const server = http.createServer((req, res) => {
  handle(req, res);
});

server.on('upgrade', (req, socket, head) => {
  if (req.url?.startsWith('/bevox/') || req.url?.startsWith('/ws/')) {
    proxyBevoxUpgrade(req, socket, head);
    return;
  }
  socket.destroy();
});

server.listen(port, hostname, () => {
  console.log(`W-Edu frontend ready on http://${hostname}:${port}`);
});
