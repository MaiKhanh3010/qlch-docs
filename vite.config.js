import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { parseFrontmatter } from './src/lib/frontmatter.js';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const CONTENT = path.join(ROOT, 'content');

/**
 * Các bộ tài liệu tách riêng (mỗi bộ có site.json + nav.json trong content/guides/<id>/,
 * dùng chung các trang trong content/pages/). Build: vite build --mode <mode>
 */
const GUIDES = {
  onenova: { dir: 'nguoi-tham-gia', outDir: 'dist-onenova', fileName: 'huong-dan-nguoi-tham-gia-onenova.html' },
};
const guideDir = (guide) => (guide ? path.join(CONTENT, 'guides', guide.dir) : CONTENT);

/** Đọc toàn bộ nội dung để kiểm tra và tạo trang tĩnh */
function readContent(guide) {
  const nav = JSON.parse(fs.readFileSync(path.join(guideDir(guide), 'nav.json'), 'utf8'));
  const site = JSON.parse(fs.readFileSync(path.join(guideDir(guide), 'site.json'), 'utf8'));
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
  // Trang chỉ dùng trong bộ tài liệu tách riêng thì không cảnh báo
  const inGuides = new Set(Object.values(GUIDES).flatMap((g) => readContent(g).nav.sections.flatMap((s) => s.pages)));
  for (const s of nav.sections) {
    for (const slug of s.pages) {
      if (inNav.has(slug)) errors.push(`nav.json: trang "${slug}" bị khai báo 2 lần`);
      inNav.add(slug);
      if (!pages[slug]) errors.push(`nav.json: không tìm thấy file content/pages/${slug}.md`);
    }
  }
  for (const [slug, { data, body }] of Object.entries(pages)) {
    if (!inNav.has(slug) && !inGuides.has(slug)) warnings.push(`content/pages/${slug}.md chưa được thêm vào nav.json nên sẽ không hiển thị`);
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

const MIME = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp', svg: 'image/svg+xml' };
const dataUri = (file) => `data:${MIME[path.extname(file).slice(1).toLowerCase()] || 'application/octet-stream'};base64,${fs.readFileSync(file).toString('base64')}`;

/**
 * Module ảo "virtual:inline-assets": bảng /uploads/... -> data URI.
 * Chỉ có dữ liệu khi build 1 file (chỉ nhúng ảnh thực sự được dùng trong nội dung + logo).
 */
function inlineAssetsPlugin(single, guide) {
  const ID = 'virtual:inline-assets';
  return {
    name: 'qlch-inline-assets',
    resolveId(id) { return id === ID ? '\0' + ID : null; },
    load(id) {
      if (id !== '\0' + ID) return null;
      if (!single) return 'export default {};';
      const { site, nav, pages } = readContent(guide);
      const used = new Set(site.logo ? [site.logo] : []);
      // Bản tách riêng: chỉ nhúng ảnh của các trang có trong menu của bộ đó
      const list = guide ? nav.sections.flatMap((s) => s.pages).map((slug) => pages[slug]).filter(Boolean) : Object.values(pages);
      for (const { body } of list) {
        for (const m of body.matchAll(/\((\/uploads\/[^)\s"]+)/g)) used.add(decodeURI(m[1]));
      }
      const map = {};
      for (const url of used) {
        const file = path.join(ROOT, 'public', url);
        if (fs.existsSync(file)) map[url] = dataUri(file);
      }
      return `export default ${JSON.stringify(map)};`;
    },
  };
}

/** Sau khi build 1 file: gộp CSS + JS + favicon vào index.html, xuất ra 1 file HTML duy nhất */
function singleFilePlugin(outDir, fileName, guide) {
  return {
    name: 'qlch-single-file',
    apply: 'build',
    closeBundle() {
      const dir = path.join(ROOT, outDir);
      const indexFile = path.join(dir, 'index.html');
      if (!fs.existsSync(indexFile)) throw new Error(`Không tìm thấy ${path.relative(ROOT, indexFile)} sau khi build`);
      let html = fs.readFileSync(indexFile, 'utf8');
      if (!/<script type="module"[^>]*src=/.test(html)) {
        throw new Error(`${path.relative(ROOT, indexFile)} không có script (${html.length} ký tự) – bản build bị lỗi`);
      }
      const read = (href) => fs.readFileSync(path.join(dir, href.replace(/^\.?\//, '')), 'utf8');
      const { site } = readContent(guide);

      html = html.replace(/<link rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/g, (_, href) => `<style>\n${read(href)}\n</style>`);
      html = html.replace(/<script type="module"[^>]*src="([^"]+)"[^>]*><\/script>/g,
        (_, src) => `<script type="module">\n${read(src).replace(/<\/script/gi, '<\\/script')}\n</script>`);
      html = html.replace(/<link rel="modulepreload"[^>]*>\s*/g, '');
      html = html.replace(/<link rel="icon"[^>]*>/, () => `<link rel="icon" type="image/svg+xml" href="${dataUri(path.join(ROOT, 'public', 'favicon.svg'))}">`);
      html = html.replace(/<title>[^<]*<\/title>/, () => `<title>${String(site.title || 'Hướng dẫn sử dụng').replace(/</g, '&lt;')}</title>`);

      fs.rmSync(dir, { recursive: true, force: true });
      fs.mkdirSync(dir, { recursive: true });
      const out = path.join(dir, fileName);
      fs.writeFileSync(out, html);
      if (fs.statSync(out).size === 0) throw new Error(`Ghi file ${path.relative(ROOT, out)} thất bại (0 byte)`);
      console.log(`\n  ✔ Đã xuất 1 file HTML: ${path.relative(ROOT, out)} (${(fs.statSync(out).size / 1024).toFixed(0)} KB)`);
    },
  };
}

export default defineConfig(({ mode }) => {
  const guide = GUIDES[mode];
  const single = mode === 'single' || !!guide;
  const singleOut = guide ? guide.outDir : 'dist-single';
  const gdir = guide && guideDir(guide).replace(/\\/g, '/');
  return {
    define: { __SINGLE_FILE__: JSON.stringify(single) },
    // Bản tách riêng: thay content/site.json và content/nav.json bằng cấu hình của bộ đó
    ...(guide && { resolve: { alias: [{ find: /^.*\/content\/(site|nav)\.json$/, replacement: `${gdir}/$1.json` }] } }),
    plugins: [
      react(),
      inlineAssetsPlugin(single, guide),
      single ? singleFilePlugin(singleOut, guide ? guide.fileName : 'huong-dan-qlch.html', guide) : contentPlugin(),
    ],
    server: { port: 5173, host: true },
    preview: { port: 4173, host: true },
    ...(single && {
      base: './',
      publicDir: false,
      build: {
        outDir: singleOut,
        emptyOutDir: true,
        assetsInlineLimit: Number.MAX_SAFE_INTEGER,
        cssCodeSplit: false,
        modulePreload: false,
        rollupOptions: { output: { inlineDynamicImports: true } },
      },
    }),
  };
});
