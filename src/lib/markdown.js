/*
 * Bộ chuyển Markdown -> HTML gọn nhẹ (không phụ thuộc thư viện).
 * Hỗ trợ: tiêu đề, đoạn văn, **đậm**, *nghiêng*, `code`, liên kết, ảnh (kèm chú thích),
 * danh sách lồng nhau, bảng, trích dẫn, khối code, đường kẻ,
 * và các khối mở rộng:  :::note | :::tip | :::warning | :::info | :::success | :::steps | :::cards
 */

import { resolveUrl } from './mode.js';

const CALLOUT_TITLES = { note: 'Lưu ý', tip: 'Mẹo', warning: 'Cảnh báo', info: 'Thông tin', success: 'Kết quả', danger: 'Quan trọng' };

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function slugify(s) {
  return String(s || '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd').replace(/Đ/g, 'D')
    .toLowerCase().replace(/<[^>]+>/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}
function safeUrl(u) {
  u = String(u || '').trim();
  if (/^(javascript|vbscript|data):/i.test(u) && !/^data:image\//i.test(u)) return '#';
  return resolveUrl(u);
}

// ---------------------------------------------------------------- inline
function inline(src) {
  const slots = [];
  const keep = (html) => `\u0000${slots.push(html) - 1}\u0000`;
  let s = String(src);
  s = s.replace(/`([^`]+)`/g, (_, c) => keep(`<code>${esc(c)}</code>`));
  s = s.replace(/!\[([^\]]*)\]\(\s*([^)\s]+)(?:\s+"([^"]*)")?\s*\)/g, (_, alt, url, title) =>
    keep(`<img src="${esc(safeUrl(url))}" alt="${esc(alt)}"${title ? ` title="${esc(title)}"` : ''} loading="lazy">`));
  s = s.replace(/\[([^\]]+)\]\(\s*([^)\s]+)(?:\s+"([^"]*)")?\s*\)/g, (_, text, url) => {
    const u = safeUrl(url);
    const ext = /^https?:\/\//i.test(u);
    return keep(`<a href="${esc(u)}"${ext ? ' target="_blank" rel="noopener"' : ''}>${inlineNoLinks(text)}</a>`);
  });
  s = esc(s);
  s = fmt(s);
  s = s.replace(/ {2,}\n|\\\n/g, '<br>');
  return s.replace(/\u0000(\d+)\u0000/g, (_, i) => slots[+i]);
}
function inlineNoLinks(t) { return fmt(esc(t)); }
function fmt(s) {
  return s
    .replace(/\*\*([^*]+?)\*\*/g, '<strong>$1</strong>')
    .replace(/__([^_]+?)__/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*\s][^*]*?)\*/g, '$1<em>$2</em>')
    .replace(/~~([^~]+?)~~/g, '<del>$1</del>')
    .replace(/==([^=]+?)==/g, '<mark>$1</mark>');
}

// ---------------------------------------------------------------- blocks
const RE = {
  fence: /^\s*```\s*([\w-]*)\s*$/,
  heading: /^(#{1,6})\s+(.+?)\s*#*\s*$/,
  hr: /^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/,
  list: /^(\s*)([-*+]|\d+[.)])\s+(.*)$/,
  quote: /^\s*>\s?(.*)$/,
  container: /^\s*:::\s*([a-z]+)\s*(.*)$/,
  containerEnd: /^\s*:::\s*$/,
  tableSep: /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/,
  imageOnly: /^\s*!\[([^\]]*)\]\(\s*([^)\s]+)(?:\s+"([^"]*)")?\s*\)\s*$/,
};
const indentOf = (l) => l.match(/^\s*/)[0].replace(/\t/g, '  ').length;
const isBlank = (l) => !l || !l.trim();
function startsBlock(l) {
  return RE.fence.test(l) || RE.heading.test(l) || RE.hr.test(l) || RE.list.test(l) || RE.quote.test(l) || RE.container.test(l) || RE.containerEnd.test(l);
}

function render(md, opts) {
  opts = opts || {};
  const ctx = { headings: [], ids: Object.create(null) };
  const html = renderBlocks(String(md || '').replace(/\r\n?/g, '\n').split('\n'), ctx);
  return { html, headings: ctx.headings };
}

function uniqueId(ctx, text) {
  let base = slugify(text) || 'muc';
  let id = base, n = 2;
  while (ctx.ids[id]) id = `${base}-${n++}`;
  ctx.ids[id] = true;
  return id;
}

function renderBlocks(lines, ctx) {
  let out = '';
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (isBlank(line)) { i++; continue; }
    let m;

    // code fence
    if ((m = RE.fence.exec(line))) {
      const buf = [];
      i++;
      while (i < lines.length && !RE.fence.test(lines[i])) buf.push(lines[i++]);
      i++;
      out += `<pre class="code"><code${m[1] ? ` data-lang="${esc(m[1])}"` : ''}>${esc(buf.join('\n'))}</code></pre>`;
      continue;
    }

    // ::: containers (hỗ trợ lồng nhau)
    if ((m = RE.container.exec(line))) {
      const type = m[1];
      const title = m[2].trim();
      const buf = [];
      let depth = 1;
      i++;
      while (i < lines.length) {
        if (RE.container.test(lines[i])) depth++;
        else if (RE.containerEnd.test(lines[i]) && --depth === 0) break;
        buf.push(lines[i++]);
      }
      i++;
      out += renderContainer(type, title, buf, ctx);
      continue;
    }

    if ((m = RE.heading.exec(line))) {
      const level = m[1].length;
      const text = m[2];
      const id = uniqueId(ctx, text);
      if (level >= 2 && level <= 3) ctx.headings.push({ level, id, text: text.replace(/[*_`]/g, '') });
      out += `<h${level} id="${id}"><a class="anchor" href="#${id}" aria-label="Liên kết tới mục">#</a>${inline(text)}</h${level}>`;
      i++;
      continue;
    }

    if (RE.hr.test(line)) { out += '<hr>'; i++; continue; }

    // table
    if (line.includes('|') && i + 1 < lines.length && RE.tableSep.test(lines[i + 1])) {
      const rows = [];
      const head = splitRow(line);
      const aligns = splitRow(lines[i + 1]).map((c) => (/^:-+:$/.test(c) ? 'center' : /-+:$/.test(c) ? 'right' : ''));
      i += 2;
      while (i < lines.length && !isBlank(lines[i]) && lines[i].includes('|')) rows.push(splitRow(lines[i++]));
      const al = (k) => (aligns[k] ? ` style="text-align:${aligns[k]}"` : '');
      out += '<div class="table-wrap"><table><thead><tr>' + head.map((c, k) => `<th${al(k)}>${inline(c)}</th>`).join('') + '</tr></thead><tbody>' +
        rows.map((r) => '<tr>' + head.map((_, k) => `<td${al(k)}>${inline(r[k] || '')}</td>`).join('') + '</tr>').join('') +
        '</tbody></table></div>';
      continue;
    }

    if (RE.quote.test(line)) {
      const buf = [];
      while (i < lines.length && RE.quote.test(lines[i])) buf.push(RE.quote.exec(lines[i++])[1]);
      out += `<blockquote>${renderBlocks(buf, ctx)}</blockquote>`;
      continue;
    }

    if (RE.list.test(line)) {
      const res = parseList(lines, i, indentOf(line));
      out += listHtml(res.list, ctx);
      i = res.i;
      continue;
    }

    // image on its own line -> figure
    if ((m = RE.imageOnly.exec(line))) {
      const cap = m[3] || m[1];
      out += `<figure class="shot"><img src="${esc(safeUrl(m[2]))}" alt="${esc(m[1])}" loading="lazy">${cap ? `<figcaption>${inline(cap)}</figcaption>` : ''}</figure>`;
      i++;
      continue;
    }

    // paragraph
    const buf = [line];
    i++;
    while (i < lines.length && !isBlank(lines[i]) && !startsBlock(lines[i]) && !RE.imageOnly.test(lines[i])) buf.push(lines[i++]);
    out += `<p>${inline(buf.join('\n'))}</p>`;
  }
  return out;
}

function splitRow(l) {
  let s = l.trim();
  if (s.startsWith('|')) s = s.slice(1);
  if (s.endsWith('|')) s = s.slice(0, -1);
  return s.split(/(?<!\\)\|/).map((c) => c.trim().replace(/\\\|/g, '|'));
}

function parseList(lines, i, indent) {
  const first = RE.list.exec(lines[i]);
  const ordered = /\d/.test(first[2]);
  const list = { ordered, start: ordered ? parseInt(first[2], 10) : 1, items: [] };
  let cur = null;
  while (i < lines.length) {
    const l = lines[i];
    if (isBlank(l)) {
      let j = i + 1;
      while (j < lines.length && isBlank(lines[j])) j++;
      if (j < lines.length && cur && (indentOf(lines[j]) > indent || (RE.list.test(lines[j]) && indentOf(lines[j]) === indent && /\d/.test(RE.list.exec(lines[j])[2]) === ordered))) {
        if (indentOf(lines[j]) > indent && !RE.list.test(lines[j])) cur.lines.push('');
        i = j;
        continue;
      }
      break;
    }
    const m = RE.list.exec(l);
    const ind = indentOf(l);
    if (m && ind === indent) {
      if (/\d/.test(m[2]) !== ordered) break;
      cur = { lines: [m[3]], children: [] };
      list.items.push(cur);
      i++;
    } else if (m && ind > indent && cur) {
      const sub = parseList(lines, i, ind);
      cur.children.push({ list: sub.list });
      i = sub.i;
    } else if (!m && cur && (ind > indent || !startsBlock(l))) {
      if (ind <= indent && isBlank(lines[i - 1])) break;
      cur.children.push({ text: l.trim() });
      i++;
    } else break;
  }
  return { list, i };
}

function listHtml(list, ctx, cls) {
  const tag = list.ordered ? 'ol' : 'ul';
  const start = list.ordered && list.start !== 1 ? ` start="${list.start}"` : '';
  let h = `<${tag}${start}${cls ? ` class="${cls}"` : ''}>`;
  for (const it of list.items) {
    h += '<li>' + inline(it.lines.join('\n'));
    let para = [];
    const flush = () => { if (para.length) { h += `<p>${inline(para.join('\n'))}</p>`; para = []; } };
    for (const c of it.children) {
      if (c.list) { flush(); h += listHtml(c.list, ctx); }
      else if (c.text === '') flush();
      else if (RE.imageOnly.test(c.text)) { flush(); h += renderBlocks([c.text], ctx); }
      else para.push(c.text);
    }
    flush();
    h += '</li>';
  }
  return h + `</${tag}>`;
}

function renderContainer(type, title, buf, ctx) {
  if (type === 'steps') {
    // Mỗi mục của danh sách đánh số là một bước
    const inner = renderBlocks(buf, ctx).replace(/^<ol(\s[^>]*)?>/, (m0) => m0.replace('<ol', '<ol class="steps"'));
    return `<div class="steps-wrap">${title ? `<div class="steps-title">${inline(title)}</div>` : ''}${inner}</div>`;
  }
  if (type === 'cards') {
    const cards = [];
    for (const l of buf) {
      const m = /^\s*[-*]\s+\[([^\]]+)\]\(([^)]+)\)\s*[—–:-]?\s*(.*)$/.exec(l);
      if (m) cards.push(`<a class="card" href="${esc(safeUrl(m[2]))}"><span class="card-title">${inlineNoLinks(m[1])}</span>${m[3] ? `<span class="card-desc">${inline(m[3])}</span>` : ''}<span class="card-arrow">→</span></a>`);
    }
    return `<div class="cards">${cards.join('')}</div>`;
  }
  if (type === 'columns') {
    const cols = buf.join('\n').split(/\n\s*\+\+\+\s*\n/);
    return `<div class="columns">${cols.map((c) => `<div class="col">${renderBlocks(c.split('\n'), ctx)}</div>`).join('')}</div>`;
  }
  const kind = CALLOUT_TITLES[type] ? type : 'note';
  const t = title || CALLOUT_TITLES[kind];
  return `<div class="callout callout-${kind}"><div class="callout-title">${inline(t)}</div><div class="callout-body">${renderBlocks(buf, ctx)}</div></div>`;
}

/** Lấy văn bản thuần (phục vụ tìm kiếm) */
function toPlain(md) {
  return String(md || '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/^\s*:::.*$/gm, ' ')
    .replace(/[#>*_`|~=]+/g, ' ')
    .replace(/^\s*(?:[-+]|\d+[.)])\s+/gm, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export { render, inline, esc, slugify, toPlain };
