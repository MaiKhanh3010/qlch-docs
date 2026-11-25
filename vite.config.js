import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { parseFrontmatter, isHiddenPage, stripHidden } from './src/lib/frontmatter.js';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const CONTENT = path.join(ROOT, 'content');

/**
 * Bản hướng dẫn theo vai trò (người dùng chọn trên trang chủ): mỗi bản có nav.json riêng
 * trong content/guides/<id>/, dùng chung các trang trong content/pages/.
 */
const ROLE_GUIDES = ['nguoi-tham-gia'];
const readJson = (...p) => JSON.parse(fs.readFileSync(path.join(CONTENT, ...p), 'utf8'));

/** Đọc toàn bộ nội dung để kiểm tra và tạo trang tĩnh */
function readContent() {
  const nav = readJson('nav.json');
  const site = readJson('site.json');
  const guideNavs = ROLE_GUIDES.map((g) => readJson('guides', g, 'nav.json'));
  const pages = {};
  const hidden = new Set(); // trang có `hidden: true` – tạm ẩn
  for (const f of fs.readdirSync(path.join(CONTENT, 'pages'))) {
    if (!f.endsWith('.md')) continue;
    const p = parseFrontmatter(fs.readFileSync(path.join(CONTENT, 'pages', f), 'utf8'));
    if (isHiddenPage(p.data)) { hidden.add(f.slice(0, -3)); continue; }
    pages[f.slice(0, -3)] = { data: p.data, body: stripHidden(p.body) };
  }
  // Mọi trang (đang hiển thị) có trong menu của ít nhất một vai trò
  const allSlugs = [...new Set([nav, ...guideNavs].flatMap((n) => n.sections.flatMap((s) => s.pages)))]
    .filter((slug) => !hidden.has(slug));
  return { nav, site, guideNavs, pages, hidden, allSlugs };
}

/**
 * Kiểm tra nội dung khi chạy dev/build:
 *  - trang khai báo trong nav.json phải có file .md (lỗi)
 *  - file .md chưa có trong nav.json (cảnh báo – trang sẽ không hiển thị)
 *  - liên kết /docs/... và ảnh /uploads/... phải tồn tại (cảnh báo)
 */
function checkContent() {
  const { nav, guideNavs, pages, hidden, allSlugs } = readContent();
  const errors = [];
  const warnings = [];
  const inAny = new Set(allSlugs);
  [nav, ...guideNavs].forEach((n, i) => {
    const file = i === 0 ? 'nav.json' : `guides/${ROLE_GUIDES[i - 1]}/nav.json`;
    const seen = new Set();
    for (const s of n.sections) {
      for (const slug of s.pages) {
        if (seen.has(slug)) errors.push(`${file}: trang "${slug}" bị khai báo 2 lần`);
        seen.add(slug);
        if (!pages[slug] && !hidden.has(slug)) errors.push(`${file}: không tìm thấy file content/pages/${slug}.md`);
      }
    }
  });
  for (const [slug, { data, body }] of Object.entries(pages)) {
    if (!inAny.has(slug)) warnings.push(`content/pages/${slug}.md chưa được thêm vào nav.json nên sẽ không hiển thị`);
    if (!data.title) warnings.push(`${slug}.md: thiếu "title"`);
    for (const m of body.matchAll(/\]\((\/[^)\s#"]+)/g)) {
      const url = decodeURI(m[1]);
      const target = url.slice(6).replace(/\/$/, '');
      if (url.startsWith('/docs/') && !pages[target]) {
        warnings.push(hidden.has(target)
          ? `${slug}.md: liên kết tới trang đang ẩn ${url} (sẽ chỉ hiện chữ – nên bọc trong :::hidden)`
          : `${slug}.md: liên kết hỏng ${url}`);
      }
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
      const { site, pages, allSlugs } = readContent();
      const base = fs.readFileSync(path.join(outDir, 'index.html'), 'utf8');
      const esc = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
      const withMeta = (title, desc) => base
        .replace(/<title>[^<]*<\/title>/, `<title>${esc(title)}</title>${desc ? `\n  <meta name="description" content="${esc(desc)}">` : ''}`);
      fs.writeFileSync(path.join(outDir, 'index.html'), withMeta(site.title, site.homeSubtitle && site.homeSubtitle.replace(/\*\*/g, '')));
      let n = 0;
      for (const slug of allSlugs) {
        const p = pages[slug];
        if (!p) continue;
        const dir = path.join(outDir, 'docs', slug);
        fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(path.join(dir, 'index.html'), withMeta(`${p.data.title} · ${site.title}`, p.data.description));
        n++;
      }
      fs.writeFileSync(path.join(outDir, '404.html'), withMeta(`Không tìm thấy trang · ${site.title}`));
      console.log(`\n  ✔ Đã tạo ${n} trang tĩnh trong ${path.relative(ROOT, outDir)}/docs/`);
    },
  };
}

/**
 * Khi nạp file Markdown (?raw): bỏ hẳn nội dung tạm ẩn để không bị đóng gói vào bản build
 *  - trang `hidden: true` -> chỉ còn phần đầu đánh dấu ẩn
 *  - khối :::hidden … ::: -> bị xoá
 */
function hiddenContentPlugin() {
  return {
    name: 'qlch-hidden-content',
    enforce: 'pre',
    load(id) {
      const [file, query] = id.split('?');
      if (query !== 'raw' || !file.endsWith('.md') || !path.resolve(file).startsWith(path.join(CONTENT, 'pages'))) return null;
      const text = fs.readFileSync(file, 'utf8');
      const { data } = parseFrontmatter(text);
      const out = isHiddenPage(data) ? '---\nhidden: true\n---\n' : stripHidden(text.replace(/\r\n?/g, '\n'));
      return `export default ${JSON.stringify(out)};`;
    },
  };
}

const MIME = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp', svg: 'image/svg+xml' };
const dataUri = (file) => `data:${MIME[path.extname(file).slice(1).toLowerCase()] || 'application/octet-stream'};base64,${fs.readFileSync(file).toString('base64')}`;

/**
 * Module ảo "virtual:inline-assets": bảng /uploads/... -> data URI.
 * Chỉ có dữ liệu khi build 1 file (chỉ nhúng ảnh thực sự được dùng trong nội dung + logo).
 */
function inlineAssetsPlugin(single) {
  const ID = 'virtual:inline-assets';
  return {
    name: 'qlch-inline-assets',
    resolveId(id) { return id === ID ? '\0' + ID : null; },
    load(id) {
      if (id !== '\0' + ID) return null;
      if (!single) return 'export default {};';
      const { site, pages } = readContent();
      const used = new Set(site.logo ? [site.logo] : []);
      for (const { body } of Object.values(pages)) {
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
function singleFilePlugin(outDir, fileName) {
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
      const { site } = readContent();

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
  const single = mode === 'single';
  const singleOut = 'dist-single';
  return {
    define: { __SINGLE_FILE__: JSON.stringify(single) },
    plugins: [
      react(),
      hiddenContentPlugin(),
      inlineAssetsPlugin(single),
      single ? singleFilePlugin(singleOut, 'huong-dan-qlch.html') : contentPlugin(),
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
