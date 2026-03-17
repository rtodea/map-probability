import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const PORT = process.env.PORT || 3000;

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.wasm': 'application/wasm',
};

const serveStatic = async (res, filePath) => {
  try {
    const data = await readFile(filePath);
    const ext = extname(filePath);
    res.writeHead(200, {
      'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
    });
    res.end(data);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
  }
};

const loadHandler = async (handlerPath) => {
  try {
    const mod = await import(handlerPath);
    return mod.default;
  } catch {
    return null;
  }
};

const parseBody = (req) =>
  new Promise((resolve) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks).toString()));
  });

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = url.pathname;

  // CORS headers for all responses
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // API routes: /api/*
  if (pathname.startsWith('/api/')) {
    const handlerName = pathname.replace('/api/', '').split('/')[0];
    const handlerPath = join(__dirname, 'api', `${handlerName}.js`);
    const handler = await loadHandler(handlerPath);
    if (handler) {
      const body = req.method === 'POST' ? await parseBody(req) : null;
      await handler(req, res, { url, body, __dirname });
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: `Unknown endpoint: ${pathname}` }));
    }
    return;
  }

  // Data routes: /data/*
  if (pathname.startsWith('/data/')) {
    if (pathname === '/data/console') {
      return serveStatic(res, join(__dirname, 'public', 'console.html'));
    }
    if (pathname.startsWith('/data/download')) {
      const handler = await loadHandler(join(__dirname, 'data', 'download.js'));
      if (handler) {
        await handler(req, res, { url, __dirname });
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Download handler not found' }));
      }
      return;
    }
  }

  // Static files from public/
  let filePath = join(__dirname, 'public', pathname === '/' ? 'index.html' : pathname);

  // Try exact path first, then with .html extension
  try {
    await stat(filePath);
  } catch {
    if (!extname(filePath)) {
      filePath += '.html';
    }
  }

  return serveStatic(res, filePath);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Dev server running at http://0.0.0.0:${PORT}`);
});
