import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { extname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('../dist/', import.meta.url)));
const serverDir = join(root, 'server');
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

const entries = [];
async function collect(directory) {
  for (const item of await readdir(directory, { withFileTypes: true })) {
    const absolute = join(directory, item.name);
    if (absolute.startsWith(serverDir)) continue;
    if (item.isDirectory()) {
      await collect(absolute);
      continue;
    }
    const pathname = '/' + relative(root, absolute).split(sep).join('/');
    const body = await readFile(absolute);
    entries.push([
      pathname,
      {
        body: body.toString('base64'),
        type: mime[extname(item.name).toLowerCase()] || 'application/octet-stream',
      },
    ]);
  }
}

await collect(root);
const worker = `
const files = new Map(${JSON.stringify(entries)});
function decode(value) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index++) bytes[index] = binary.charCodeAt(index);
  return bytes;
}
function serve(pathname) {
  const file = files.get(pathname);
  if (!file) return null;
  const immutable = pathname.startsWith('/assets/');
  return new Response(decode(file.body), {
    headers: {
      'content-type': file.type,
      'cache-control': immutable ? 'public, max-age=31536000, immutable' : 'no-cache',
      'x-content-type-options': 'nosniff'
    }
  });
}
export default {
  async fetch(request) {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response('Method not allowed', { status: 405 });
    }
    const url = new URL(request.url);
    const exact = serve(url.pathname === '/' ? '/index.html' : url.pathname);
    if (exact) return request.method === 'HEAD' ? new Response(null, exact) : exact;
    if (!url.pathname.includes('.')) {
      const app = serve('/index.html');
      return request.method === 'HEAD' ? new Response(null, app) : app;
    }
    return new Response('Not found', { status: 404 });
  }
};
`;

await mkdir(serverDir, { recursive: true });
await writeFile(join(serverDir, 'index.js'), worker, 'utf8');
