/**
 * Máy chủ production: phục vụ bản build React (dist/) + API + ảnh.
 *   npm run build && npm start   ->  http://localhost:3000
 */
import http from 'node:http';
import path from 'node:path';
import fs from 'node:fs';
import { createApi, loadConfig, serveFile, safeJoin, ROOT } from './api.js';

const config = loadConfig();
const DIST = path.join(ROOT, 'dist');
const api = createApi(config);

if (!fs.existsSync(path.join(DIST, 'index.html'))) {
  console.error('\n  ✖ Chưa có bản build. Hãy chạy:  npm run build   (hoặc dùng  npm run dev  khi phát triển)\n');
  process.exit(1);
}

const server = http.createServer((req, res) => {
  api(req, res, async () => {
    if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405); return res.end(); }
    let pathname;
    try { pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); } catch { res.writeHead(400); return res.end(); }
    if (pathname !== '/') {
      const p = safeJoin(DIST, pathname.slice(1));
      // file trong dist/assets có hash trong tên -> cache lâu
      if (p && (await serveFile(res, p, pathname.startsWith('/assets/') ? 31536000 : 0))) return;
      if (path.extname(pathname) && !pathname.startsWith('/docs/')) { res.writeHead(404); return res.end('Not found'); }
    }
    // SPA fallback: /, /docs/..., /admin -> index.html
    await serveFile(res, path.join(DIST, 'index.html'));
  });
});

server.listen(config.port, config.host, () => {
  console.log('\n  ✔ Website hướng dẫn sử dụng đang chạy');
  console.log(`    Trang tài liệu : http://localhost:${config.port}`);
  console.log(`    Trang quản trị : http://localhost:${config.port}/admin`);
  if (config.adminPassword === 'admin123') console.log('    ⚠ Đang dùng mật khẩu mặc định "admin123" – hãy đổi trong config.json');
  console.log('    Nhấn Ctrl + C để dừng.\n');
});
