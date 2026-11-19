/**
 * Đọc phần đầu (front matter) của file Markdown:
 *   ---
 *   title: "Tiêu đề trang"
 *   description: "Mục đích..."
 *   updated: 2026-11-03
 *   ---
 * Dùng chung cho trình duyệt và vite.config.js (không phụ thuộc thư viện).
 */
export function parseFrontmatter(raw) {
  const text = String(raw).replace(/^﻿/, '').replace(/\r\n?/g, '\n');
  const m = /^---\n([\s\S]*?)\n---\n?/.exec(text);
  if (!m) return { data: {}, body: text };
  const data = {};
  for (const line of m[1].split('\n')) {
    const i = line.indexOf(':');
    if (i < 1) continue;
    const key = line.slice(0, i).trim();
    let val = line.slice(i + 1).trim();
    if (/^".*"$/.test(val)) { try { val = JSON.parse(val); } catch { val = val.slice(1, -1); } }
    else if (/^'.*'$/.test(val)) val = val.slice(1, -1);
    data[key] = val;
  }
  return { data, body: text.slice(m[0].length).replace(/^\n+/, '') };
}
