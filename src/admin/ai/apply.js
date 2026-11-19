/* Áp dụng một đề xuất của AI vào bản nháp */
import { findPage, uniqueSlug } from '../doc-utils.js';

/**
 * Chuẩn bị bản áp dụng (chạy NGOÀI mutate để có thể tính slug, kiểm tra lỗi).
 * Trả về { run(draft), slug } – run là hàm thuần dùng trong mutate().
 */
export function prepareApply(draft, op) {
  if (op.type === 'create_section') {
    return {
      slug: null,
      run(d) { if (!d.sections.some((s) => s.id === op.sectionId)) d.sections.push({ ...op.section, pages: [] }); },
    };
  }
  if (op.type === 'create') {
    const slug = findPage(draft, op.page.slug) ? uniqueSlug(draft, op.page.slug) : op.page.slug;
    return {
      slug,
      run(d) {
        let sec = d.sections.find((s) => s.id === op.sectionId);
        if (!sec) { sec = { id: op.sectionId, title: op.sectionTitle || 'Nhóm mới', description: '', pages: [] }; d.sections.push(sec); }
        const page = { ...structuredClone(op.page), slug };
        const i = op.afterSlug ? sec.pages.findIndex((p) => p.slug === op.afterSlug) : -1;
        sec.pages.splice(i >= 0 ? i + 1 : sec.pages.length, 0, page);
      },
    };
  }
  if (op.type === 'update') {
    if (!findPage(draft, op.slug)) throw new Error(`Trang "${op.slug}" không còn tồn tại`);
    return {
      slug: op.slug,
      run(d) {
        const f = findPage(d, op.slug);
        if (!f) return;
        Object.assign(f.page, {
          title: op.page.title, description: op.page.description, content: op.page.content, updatedAt: op.page.updatedAt,
        });
        if (op.sectionId && op.sectionId !== f.section.id) {
          const target = d.sections.find((s) => s.id === op.sectionId);
          if (target) { f.section.pages.splice(f.index, 1); target.pages.push(f.page); }
        }
      },
    };
  }
  throw new Error('Loại đề xuất không hỗ trợ');
}

/** Trang đã bị người dùng sửa sau khi AI đọc? */
export function hasConflict(draft, op) {
  if (op.type !== 'update') return false;
  const f = findPage(draft, op.slug);
  return !!f && (f.page.content !== op.before.content || f.page.title !== op.before.title || (f.page.description || '') !== op.before.description);
}

/** So sánh theo dòng (LCS) -> [{t: ' '|'+'|'-', s}] */
export function lineDiff(a, b) {
  const A = String(a || '').split('\n'), B = String(b || '').split('\n');
  const n = A.length, m = B.length;
  if (n * m > 4_000_000) return [...A.map((s) => ({ t: '-', s })), ...B.map((s) => ({ t: '+', s }))];
  const dp = Array.from({ length: n + 1 }, () => new Uint32Array(m + 1));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) dp[i][j] = A[i] === B[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const out = [];
  let i = 0, j = 0;
  while (i < n && j < m) {
    if (A[i] === B[j]) { out.push({ t: ' ', s: A[i] }); i++; j++; }
    else if (dp[i + 1][j] >= dp[i][j + 1]) out.push({ t: '-', s: A[i++] });
    else out.push({ t: '+', s: B[j++] });
  }
  while (i < n) out.push({ t: '-', s: A[i++] });
  while (j < m) out.push({ t: '+', s: B[j++] });
  return out;
}
