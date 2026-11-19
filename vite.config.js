import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { parseFrontmatter } from './src/lib/frontmatter.js';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const CONTENT = path.join(ROOT, 'content');

/** Đọc toàn bộ nội dung để kiểm tra và tạo trang tĩnh */
function readContent() {
  const nav = JSON.parse(fs.readFileSync(path.join(CONTENT, 'nav.json'), 'utf8'));
  const site = JSON.parse(fs.readFileSync(path.join(CONTENT, 'site.json'), 'utf8'));
  const pages = {};
  for (const f of fs.readdirSync(path.join(CONTENT, 'pages'))) {
    if (!f.endsWith('.md')) continue;
    pages[f.slice(0, -3)] = parseFrontmatter(fs.readFileSync(path.join(CONTENT, 'pages', f), 'utf8'));
  }
  return { nav, site, pages };
}

/**
 * Kiểm tra nội dung khi chạy dev/build:
 *  - trang khai báo trong nav.json phải có file .md (lỗi)
 *  - file .md chưa có trong nav.json (cảnh báo – trang sẽ không hiển thị)
 *  - liên kết /docs/... và ảnh /uploads/... phải tồn tại (cảnh báo)
 */
function checkContent() {
  const { nav, pages } = readContent();
  const errors = [];
  const warnings = [];
  const inNav = new Set();
  for (const s of nav.sections) {
    for (const slug of s.pages) {
      if (inNav.has(slug)) errors.push(`nav.json: trang "${slug}" bị khai báo 2 lần`);
      inNav.add(slug);
      if (!pages[slug]) errors.push(`nav.json: không tìm thấy file content/pages/${slug}.md`);
    }
  }
  for (const [slug, { data, body }] of Object.entries(pages)) {
    if (!inNav.has(slug)) warnings.push(`content/pages/${slug}.md chưa được thêm vào nav.json nên sẽ không hiển thị`);
    if (!data.title) warnings.push(`${slug}.md: thiếu "title"`);
    for (const m of body.matchAll(/\]\((\/[^)\s#"]+)/g)) {
      const url = decodeURI(m[1]);
      if (url.startsWith('/docs/') && !pages[url.slice(6).replace(/\/$/, '')]) warnings.push(`${slug}.md: liên kết hỏng ${url}`);
      if (url.startsWith('/uploads/') && !fs.existsSync(path.join(ROOT, 'public', url))) warnings.push(`${slug}.md: thiếu ảnh public${url}`);
    }
  }
  return { errors, warnings };
}

function contentPlugin() {
  let outDir;
  const report = (ctx) => {
    const { errors, warnings } = checkContent();
    warnings.forEach((w) => (ctx ? ctx.warn(w) : console.warn('⚠ ' + w)));
    if (errors.length) {
      const msg = 'Nội dung tài liệu có lỗi:\n  - ' + errors.join('\n  - ');
      if (ctx) ctx.error(msg); else console.error('✖ ' + msg);
    }
  };
  return {
    name: 'qlch-content',
    configResolved(c) { outDir = path.resolve(c.root, c.build.outDir); },
    buildStart() { report(this); },
    configureServer(server) {
      report(null);
      server.watcher.add(CONTENT);
      server.watcher.on('change', (f) => { if (f.startsWith(CONTENT)) report(null); });
    },
    /** Tạo sẵn file HTML cho từng trang (/docs/<slug>/index.html) để chạy được trên mọi web server tĩnh */
    closeBundle() {
      if (!outDir || !fs.existsSync(path.join(outDir, 'index.html'))) return;
      const { nav, site, pages } = readContent();
      const base = fs.readFileSync(path.join(outDir, 'index.html'), 'utf8');
      const esc = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
      const withMeta = (title, desc) => base
        .replace(/<title>[^<]*<\/title>/, `<title>${esc(title)}</title>${desc ? `\n  <meta name="description" content="${esc(desc)}">` : ''}`);
      fs.writeFileSync(path.join(outDir, 'index.html'), withMeta(site.title, site.homeSubtitle && site.homeSubtitle.replace(/\*\*/g, '')));
      let n = 0;
      for (const s of nav.sections) {
        for (const slug of s.pages) {
          const p = pages[slug];
          if (!p) continue;
          const dir = path.join(outDir, 'docs', slug);
          fs.mkdirSync(dir, { recursive: true });
          fs.writeFileSync(path.join(dir, 'index.html'), withMeta(`${p.data.title} · ${site.title}`, p.data.description));
          n++;
        }
      }
      fs.writeFileSync(path.join(outDir, '404.html'), withMeta(`Không tìm thấy trang · ${site.title}`));
      console.log(`\n  ✔ Đã tạo ${n} trang tĩnh trong ${path.relative(ROOT, outDir)}/docs/`);
    },
  };
}

export default defineConfig({
  plugins: [react(), contentPlugin()],
  server: { port: 5173, host: true },
  preview: { port: 4173, host: true },
});
