/* Bộ định tuyến tối giản (không cần react-router)
 *  - Bình thường: dùng History API, đường dẫn /docs/<slug>
 *  - Bản 1 file HTML: dùng #hash, đường dẫn #/docs/<slug> (chạy được cả khi mở file trực tiếp hoặc nhúng iframe)
 */
import { useSyncExternalStore } from 'react';
import { SINGLE_FILE, toHref } from './mode.js';

const listeners = new Set();
function emit() { listeners.forEach((fn) => fn()); }
function subscribe(fn) {
  listeners.add(fn);
  const evt = SINGLE_FILE ? 'hashchange' : 'popstate';
  window.addEventListener(evt, fn);
  return () => { listeners.delete(fn); window.removeEventListener(evt, fn); };
}

/** Đường dẫn nội bộ hiện tại, luôn có dạng /docs/x?y#muc */
function current() {
  if (SINGLE_FILE) {
    const h = location.hash.slice(1);
    return h.startsWith('/') ? h : '/' + (h ? '#' + h : '');
  }
  return location.pathname + location.search + location.hash;
}
const snapshot = current;

function go(next, replace) {
  if (SINGLE_FILE) {
    const target = '#' + next;
    if (replace) location.replace(target); else location.hash = next;
    return; // sự kiện hashchange sẽ cập nhật giao diện
  }
  history[replace ? 'replaceState' : 'pushState'](null, '', next);
  emit();
}

export function navigate(to, { replace = false } = {}) {
  const u = new URL(to, 'http://x' + current());
  const next = u.pathname + u.search + u.hash;
  if (next === current()) return;
  go(next, replace);
}

export function useLocation() {
  const href = useSyncExternalStore(subscribe, snapshot, () => '/');
  const u = new URL(href, 'http://x');
  return { pathname: decodeURI(u.pathname), search: u.search, hash: u.hash, href };
}

/** href trong thẻ <a> -> đường dẫn nội bộ, hoặc null nếu là liên kết ngoài */
function internalPath(href) {
  if (SINGLE_FILE) {
    if (href.startsWith('#/')) return href.slice(1);
    if (href.startsWith('#')) { const cur = current().split('#')[0]; return cur + href; }
    if (href.startsWith('/') && !href.startsWith('/uploads/')) return href;
    return null;
  }
  const u = new URL(href, location.href);
  if (u.origin !== location.origin || u.pathname.startsWith('/uploads/')) return null;
  return u.pathname + u.search + u.hash;
}

/** Bắt sự kiện click trên thẻ <a> nội bộ để chuyển trang không tải lại */
export function handleLinkClick(e) {
  const a = e.target.closest && e.target.closest('a');
  if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return false;
  if (a.target === '_blank' || a.hasAttribute('download')) return false;
  const href = a.getAttribute('href');
  if (!href || href.startsWith('mailto:') || href.startsWith('tel:')) return false;
  const path = internalPath(href);
  if (path == null) return false;
  e.preventDefault();
  const u = new URL(path, 'http://x');
  const cur = new URL(current(), 'http://x');
  if (u.pathname === cur.pathname && u.hash) {
    // Cùng trang: chỉ cuộn tới mục
    // (bản 1 file dùng location.replace vì history API bị chặn khi mở file:// trên Chrome)
    if (SINGLE_FILE) location.replace('#' + u.pathname + u.hash);
    else { history.pushState(null, '', u.hash); emit(); }
    const el = document.getElementById(decodeURIComponent(u.hash.slice(1)));
    if (el) el.scrollIntoView({ behavior: 'smooth' });
    return true;
  }
  navigate(path);
  return true;
}

export function Link({ to, children, onClick, ...rest }) {
  return (
    <a href={toHref(to)} onClick={(e) => { if (onClick) onClick(e); handleLinkClick(e); }} {...rest}>
      {children}
    </a>
  );
}
