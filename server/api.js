/**
 * API + phục vụ ảnh /uploads – dùng chung cho:
 *   - Vite dev server (npm run dev)   -> xem vite.config.js
 *   - Máy chủ production (npm start)  -> xem server/index.js
 * Không phụ thuộc thư viện ngoài.
 */
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { aiChat, aiStatus } from './ai.js';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA_DIR = path.join(ROOT, 'data');
const DATA_FILE = path.join(DATA_DIR, 'docs.json');
const BACKUP_DIR = path.join(DATA_DIR, 'backups');
export const UPLOAD_DIR = path.join(ROOT, 'uploads');
const CONFIG_FILE = path.join(ROOT, 'config.json');

export function loadConfig() {
  const cfg = Object.assign(
    { port: 3000, host: '0.0.0.0', adminPassword: 'admin123', maxUploadMB: 15, keepBackups: 30 },
    fs.existsSync(CONFIG_FILE) ? JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8')) : {},
  );
  if (process.env.PORT) cfg.port = Number(process.env.PORT);
  if (process.env.ADMIN_PASSWORD) cfg.adminPassword = process.env.ADMIN_PASSWORD;
  cfg.ai = { ...(cfg.ai || {}) };
  if (process.env.ANTHROPIC_API_KEY) cfg.ai.apiKey = process.env.ANTHROPIC_API_KEY;
  return cfg;
}

export const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.webp': 'image/webp', '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.map': 'application/json',
};
const IMAGE_EXT = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg']);

// ------------------------------------------------------------------ helpers
const err = (status, message) => Object.assign(new Error(message), { status });
function json(res, status, obj, headers = {}) {
  res.writeHead(status, { 'Content-Type': MIME['.json'], 'Cache-Control': 'no-store', ...headers });
  res.end(JSON.stringify(obj));
}
function readBody(req, limit) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > limit) { reject(err(413, 'Dữ liệu gửi lên quá lớn')); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}
async function readJson(req, limit = 2 * 1024 * 1024) {
  const raw = await readBody(req, limit);
  try { return JSON.parse(raw || '{}'); } catch { throw err(400, 'JSON không hợp lệ'); }
}
function parseCookies(req) {
  const out = {};
  (req.headers.cookie || '').split(';').forEach((p) => {
    const i = p.indexOf('=');
    if (i > 0) out[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim());
  });
  return out;
}
function safeEqual(a, b) {
  const ha = crypto.createHash('sha256').update(String(a)).digest();
  const hb = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
}
export function slugify(s) {
  return String(s || '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd').replace(/Đ/g, 'D')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
}
export function safeJoin(base, rel) {
  const p = path.normalize(path.join(base, rel));
  return p === base || p.startsWith(base + path.sep) ? p : null;
}
export async function serveFile(res, filePath, cacheSeconds = 0) {
  try {
    const st = await fsp.stat(filePath);
    if (!st.isFile()) return false;
    res.writeHead(200, {
      'Content-Type': MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream',
      'Content-Length': st.size,
      'Cache-Control': cacheSeconds ? `public, max-age=${cacheSeconds}` : 'no-cache',
      'X-Content-Type-Options': 'nosniff',
    });
    fs.createReadStream(filePath).pipe(res);
    return true;
  } catch {
    return false;
  }
}

// ------------------------------------------------------------------ data
function validateDocs(d) {
  if (!d || typeof d !== 'object' || !d.site || typeof d.site !== 'object') return 'Thiếu thông tin site';
  if (!Array.isArray(d.sections)) return 'sections phải là mảng';
  const slugs = new Set();
  for (const s of d.sections) {
    if (!s || typeof s.title !== 'string' || !Array.isArray(s.pages)) return 'Nhóm tài liệu không hợp lệ';
    for (const p of s.pages) {
      if (!p || typeof p.title !== 'string' || !p.title.trim()) return 'Trang thiếu tiêu đề';
      if (!/^[a-z0-9-]+$/.test(p.slug || '')) return `Slug "${p.slug}" không hợp lệ (chỉ dùng a-z, 0-9, -)`;
      if (slugs.has(p.slug)) return `Slug "${p.slug}" bị trùng`;
      slugs.add(p.slug);
      if (typeof p.content !== 'string') p.content = '';
    }
  }
  return null;
}
async function saveDocs(d, keep) {
  await fsp.mkdir(BACKUP_DIR, { recursive: true });
  if (fs.existsSync(DATA_FILE)) {
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    await fsp.copyFile(DATA_FILE, path.join(BACKUP_DIR, `docs-${stamp}.json`));
    const list = (await fsp.readdir(BACKUP_DIR)).filter((f) => f.endsWith('.json')).sort();
    for (const f of list.slice(0, Math.max(0, list.length - keep))) await fsp.unlink(path.join(BACKUP_DIR, f)).catch(() => {});
  }
  const tmp = DATA_FILE + '.tmp';
  await fsp.writeFile(tmp, JSON.stringify(d, null, 2), 'utf8');
  await fsp.rename(tmp, DATA_FILE);
}
async function listUploads(dir, base) {
  const out = [];
  let entries = [];
  try { entries = await fsp.readdir(dir, { withFileTypes: true }); } catch { return out; }
  for (const e of entries) {
    const rel = base ? `${base}/${e.name}` : e.name;
    if (e.isDirectory()) out.push(...(await listUploads(path.join(dir, e.name), rel)));
    else if (IMAGE_EXT.has(path.extname(e.name).toLowerCase())) {
      const st = await fsp.stat(path.join(dir, e.name));
      out.push({ path: rel, url: '/uploads/' + rel.split('/').map(encodeURIComponent).join('/'), size: st.size, mtime: st.mtimeMs });
    }
  }
  return out;
}

// ------------------------------------------------------------------ middleware
/**
 * Trả về middleware dạng (req, res, next) – xử lý /api/* và /uploads/*, còn lại gọi next().
 */
export function createApi(config = loadConfig()) {
  const sessions = new Map();
  const SESSION_MS = 12 * 60 * 60 * 1000;
  const authed = (req) => {
    const t = parseCookies(req).qlch_session;
    const exp = t && sessions.get(t);
    if (!exp) return false;
    if (exp < Date.now()) { sessions.delete(t); return false; }
    return true;
  };

  async function handleApi(req, res, url) {
    const route = `${req.method} ${url.pathname}`;
    if (route === 'GET /api/docs') {
      res.writeHead(200, { 'Content-Type': MIME['.json'], 'Cache-Control': 'no-store' });
      return res.end(await fsp.readFile(DATA_FILE));
    }
    if (route === 'GET /api/me') return json(res, 200, { authenticated: authed(req) });
    if (route === 'POST /api/login') {
      const { password } = await readJson(req);
      if (!password || !safeEqual(password, config.adminPassword)) {
        await new Promise((r) => setTimeout(r, 600));
        return json(res, 401, { error: 'Mật khẩu không đúng' });
      }
      const token = crypto.randomBytes(24).toString('hex');
      sessions.set(token, Date.now() + SESSION_MS);
      return json(res, 200, { ok: true }, { 'Set-Cookie': `qlch_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${SESSION_MS / 1000}` });
    }
    if (route === 'POST /api/logout') {
      sessions.delete(parseCookies(req).qlch_session);
      return json(res, 200, { ok: true }, { 'Set-Cookie': 'qlch_session=; HttpOnly; Path=/; Max-Age=0' });
    }

    if (!authed(req)) return json(res, 401, { error: 'Cần đăng nhập quản trị' });

    if (route === 'GET /api/ai/status') return json(res, 200, aiStatus(config));
    if (route === 'POST /api/ai/chat') {
      const body = await readJson(req, 60 * 1024 * 1024);
      return json(res, 200, await aiChat(config, body));
    }
    if (route === 'PUT /api/docs') {
      const d = await readJson(req, 10 * 1024 * 1024);
      const e = validateDocs(d);
      if (e) return json(res, 400, { error: e });
      await saveDocs(d, config.keepBackups);
      return json(res, 200, { ok: true, savedAt: new Date().toISOString() });
    }
    if (route === 'POST /api/upload') {
      const limit = config.maxUploadMB * 1024 * 1024;
      const body = await readJson(req, Math.ceil(limit * 1.4) + 4096);
      const m = /^data:([\w/+.-]+);base64,(.+)$/s.exec(body.data || '');
      if (!m) return json(res, 400, { error: 'Dữ liệu ảnh không hợp lệ' });
      const ext0 = path.extname(body.filename || '').toLowerCase();
      const ext = IMAGE_EXT.has(ext0) ? ext0 : ({ 'image/png': '.png', 'image/jpeg': '.jpg', 'image/gif': '.gif', 'image/webp': '.webp' }[m[1]] || '');
      if (!IMAGE_EXT.has(ext)) return json(res, 400, { error: 'Chỉ hỗ trợ ảnh PNG, JPG, GIF, WEBP, SVG' });
      const buf = Buffer.from(m[2], 'base64');
      if (buf.length > limit) return json(res, 413, { error: `Ảnh vượt quá ${config.maxUploadMB}MB` });
      const folder = slugify(body.folder) || 'chung';
      const baseName = slugify(path.basename(body.filename || 'anh', ext0)) || 'anh';
      const dir = path.join(UPLOAD_DIR, folder);
      await fsp.mkdir(dir, { recursive: true });
      let name = `${baseName}${ext}`;
      for (let i = 2; fs.existsSync(path.join(dir, name)); i++) name = `${baseName}-${i}${ext}`;
      await fsp.writeFile(path.join(dir, name), buf);
      return json(res, 200, { ok: true, url: `/uploads/${folder}/${name}`, path: `${folder}/${name}` });
    }
    if (route === 'GET /api/uploads') {
      const folder = slugify(url.searchParams.get('folder'));
      const files = await listUploads(folder ? path.join(UPLOAD_DIR, folder) : UPLOAD_DIR, folder);
      files.sort((a, b) => b.mtime - a.mtime);
      return json(res, 200, { files });
    }
    if (route === 'DELETE /api/uploads') {
      const p = safeJoin(UPLOAD_DIR, url.searchParams.get('path') || '');
      if (!p || !IMAGE_EXT.has(path.extname(p).toLowerCase())) return json(res, 400, { error: 'Đường dẫn không hợp lệ' });
      await fsp.unlink(p).catch(() => {});
      return json(res, 200, { ok: true });
    }
    return json(res, 404, { error: 'Không tìm thấy API' });
  }

  return async function qlchMiddleware(req, res, next) {
    try {
      const url = new URL(req.url, 'http://localhost');
      if (url.pathname.startsWith('/api/')) return await handleApi(req, res, url);
      if (url.pathname.startsWith('/uploads/') && (req.method === 'GET' || req.method === 'HEAD')) {
        let rel;
        try { rel = decodeURIComponent(url.pathname.slice('/uploads/'.length)); } catch { rel = ''; }
        const p = rel && safeJoin(UPLOAD_DIR, rel);
        if (p && (await serveFile(res, p, 300))) return;
        res.writeHead(404); return res.end('Not found');
      }
      return next();
    } catch (e) {
      console.error(e);
      if (!res.headersSent) json(res, e.status || 500, { error: e.message || 'Lỗi máy chủ' });
      else res.end();
    }
  };
}
