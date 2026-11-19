/* Tiện ích giao diện dùng chung */
export function toast(msg, isError = false) {
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  if (isError) t.style.background = 'var(--danger)';
  document.body.appendChild(t);
  setTimeout(() => t.remove(), isError ? 4000 : 2000);
}

export async function copyText(text, msg) {
  try { await navigator.clipboard.writeText(text); }
  catch {
    const ta = document.createElement('textarea');
    ta.value = text; document.body.appendChild(ta); ta.select();
    document.execCommand('copy'); ta.remove();
  }
  if (msg) toast(msg);
}

export function toggleTheme() {
  const t = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = t;
  try { localStorage.setItem('theme', t); } catch { /* bỏ qua */ }
}

export function fmtDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return isNaN(d) ? '' : d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function truncate(s, n) {
  s = String(s || '');
  return s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s;
}

/** Bỏ dấu tiếng Việt, giữ nguyên độ dài chuỗi (để tô sáng đúng vị trí) */
export function fold(s) {
  let o = '';
  for (const ch of String(s)) {
    let c = ch.normalize('NFD').replace(/[̀-ͯ]/g, '');
    if (c === 'đ' || c === 'Đ') c = 'd';
    c = (c || ch).toLowerCase();
    o += c.length === ch.length ? c : ch.toLowerCase().slice(0, ch.length).padEnd(ch.length, ' ');
  }
  return o;
}
