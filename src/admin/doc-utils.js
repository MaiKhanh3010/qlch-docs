/* Hàm thao tác trên dữ liệu tài liệu (dùng trong trang quản trị) */
import { slugify } from '../lib/markdown.js';

export function findPage(docs, slug) {
  for (const section of docs.sections) {
    const index = section.pages.findIndex((p) => p.slug === slug);
    if (index >= 0) return { section, page: section.pages[index], index };
  }
  return null;
}

export function uniqueSlug(docs, base, except) {
  const used = new Set(docs.sections.flatMap((s) => s.pages.map((p) => p.slug)));
  if (except) used.delete(except);
  const b = slugify(base) || 'trang-moi';
  let s = b, n = 2;
  while (used.has(s)) s = `${b}-${n++}`;
  return s;
}

export const newId = () => 's' + Math.random().toString(36).slice(2, 9);

export const PAGE_TEMPLATE = `![Màn hình tính năng](/uploads/... "Chú thích ảnh")

## Các bước thực hiện

:::steps
1. Mở **Chi tiết cuộc họp**.
2. Chọn ...
3. Bấm **Lưu**.
:::

## Kết quả

- Hệ thống ...

:::note
Ghi chú hoặc điều kiện cần lưu ý khi sử dụng tính năng.
:::
`;

export const PLACEHOLDER_IMG = /!\[[^\]]*\]\(\/uploads\/\.\.\.(?:\s+"[^"]*")?\)/;
