import { esc, toPlain } from './markdown.js';
import { fold, truncate } from './ui.js';

export function buildIndex(flat) {
  return flat.map(({ page, section }) => {
    const plain = toPlain(page.content);
    return { page, section, plain, fTitle: fold(page.title), fDesc: fold(page.description || ''), fPlain: fold(plain) };
  });
}

function highlight(text, ftext, terms) {
  const marks = [];
  for (const t of terms) {
    let i = 0;
    while ((i = ftext.indexOf(t, i)) >= 0) { marks.push([i, i + t.length]); i += t.length; }
  }
  marks.sort((a, b) => a[0] - b[0]);
  let out = '', last = 0;
  for (const [a, b] of marks) {
    if (a < last) continue;
    out += esc(text.slice(last, a)) + '<mark>' + esc(text.slice(a, b)) + '</mark>';
    last = b;
  }
  return out + esc(text.slice(last));
}

/** Trả về [{page, section, titleHtml, snipHtml}] */
export function search(index, q) {
  const fq = fold(q).trim();
  const terms = fq.split(/\s+/).filter(Boolean);
  if (!terms.length) {
    return index.slice(0, 8).map((it) => ({ ...it, titleHtml: esc(it.page.title), snipHtml: esc(truncate(it.page.description, 120)) }));
  }
  const res = [];
  for (const it of index) {
    const all = `${it.fTitle} ${it.fDesc} ${it.fPlain}`;
    if (!terms.every((t) => all.includes(t))) continue;
    let score = it.fTitle.includes(fq) ? 20 : 0;
    for (const t of terms) {
      if (it.fTitle.includes(t)) score += 10;
      if (it.fDesc.includes(t)) score += 4;
      score += Math.min(5, it.fPlain.split(t).length - 1);
    }
    let src = it.page.description || '', fsrc = it.fDesc;
    let pos = terms.map((t) => fsrc.indexOf(t)).find((p) => p >= 0);
    if (pos === undefined) {
      src = it.plain; fsrc = it.fPlain;
      pos = terms.map((t) => fsrc.indexOf(t)).find((p) => p >= 0) ?? 0;
    }
    const start = Math.max(0, pos - 50);
    const pre = start > 0 ? '…' : '';
    const post = start + 150 < src.length ? '…' : '';
    res.push({
      ...it, score,
      titleHtml: highlight(it.page.title, it.fTitle, terms),
      snipHtml: highlight(pre + src.slice(start, start + 150) + post, pre + fsrc.slice(start, start + 150) + post, terms),
    });
  }
  return res.sort((a, b) => b.score - a.score).slice(0, 20);
}
