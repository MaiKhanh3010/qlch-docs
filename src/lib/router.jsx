/* Bộ định tuyến tối giản dựa trên History API (không cần react-router) */
import { useSyncExternalStore } from 'react';

const listeners = new Set();
function emit() { listeners.forEach((fn) => fn()); }
function subscribe(fn) {
  listeners.add(fn);
  window.addEventListener('popstate', fn);
  return () => { listeners.delete(fn); window.removeEventListener('popstate', fn); };
}
const snapshot = () => location.pathname + location.search + location.hash;

export function navigate(to, { replace = false } = {}) {
  const u = new URL(to, location.href);
  const next = u.pathname + u.search + u.hash;
  if (next === snapshot()) return;
  history[replace ? 'replaceState' : 'pushState'](null, '', next);
  emit();
}

export function useLocation() {
  const href = useSyncExternalStore(subscribe, snapshot, () => '/');
  const u = new URL(href, 'http://x');
  return { pathname: decodeURI(u.pathname), search: u.search, hash: u.hash, href };
}

/** Bắt sự kiện click trên thẻ <a> nội bộ để chuyển trang không tải lại */
export function handleLinkClick(e) {
  const a = e.target.closest && e.target.closest('a');
  if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return false;
  if (a.target === '_blank' || a.hasAttribute('download')) return false;
  const href = a.getAttribute('href');
  if (!href || href.startsWith('mailto:') || href.startsWith('tel:')) return false;
  const u = new URL(href, location.href);
  if (u.origin !== location.origin || u.pathname.startsWith('/uploads/') || u.pathname.startsWith('/api/')) return false;
  e.preventDefault();
  if (u.pathname === location.pathname && u.hash) {
    history.pushState(null, '', u.hash);
    const el = document.getElementById(decodeURIComponent(u.hash.slice(1)));
    if (el) el.scrollIntoView({ behavior: 'smooth' });
    emit();
    return true;
  }
  navigate(u.pathname + u.search + u.hash);
  return true;
}

export function Link({ to, children, onClick, ...rest }) {
  return (
    <a href={to} onClick={(e) => { if (onClick) onClick(e); handleLinkClick(e); }} {...rest}>
      {children}
    </a>
  );
}
