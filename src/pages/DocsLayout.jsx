import { useCallback, useEffect, useState } from 'react';
import { useDocs } from '../lib/docs-context.jsx';
import Topbar from '../components/Topbar.jsx';
import Sidebar from '../components/Sidebar.jsx';
import SearchModal from '../components/SearchModal.jsx';
import Lightbox from '../components/Lightbox.jsx';
import HomePage from './HomePage.jsx';
import DocPage from './DocPage.jsx';
import NotFound from './NotFound.jsx';

export default function DocsLayout({ location }) {
  const { docs, error } = useDocs();
  const [navOpen, setNavOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [image, setImage] = useState(null);
  const openSearch = useCallback(() => setSearchOpen(true), []);
  const closeSearch = useCallback(() => setSearchOpen(false), []);
  const closeImage = useCallback(() => setImage(null), []);

  // Phím tắt: Ctrl+K hoặc "/" để tìm kiếm
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setSearchOpen(true); }
      else if (e.key === '/' && !/input|textarea|select/i.test(document.activeElement.tagName)) { e.preventDefault(); setSearchOpen(true); }
      else if (e.key === 'Escape') setNavOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => { document.body.classList.toggle('nav-open', navOpen); }, [navOpen]);
  useEffect(() => { setNavOpen(false); }, [location.pathname]);

  useEffect(() => {
    if (docs && docs.site && docs.site.accent) document.documentElement.style.setProperty('--accent', docs.site.accent);
  }, [docs]);

  if (error) return <div className="notfound">Không tải được dữ liệu ({error}). Hãy kiểm tra máy chủ đã chạy chưa.</div>;
  if (!docs) return <div className="loading">Đang tải…</div>;

  const m = /^\/docs\/([a-z0-9-]+)\/?$/.exec(location.pathname);
  let content;
  if (m) content = <DocPage slug={m[1]} hash={location.hash} onImage={setImage} />;
  else if (location.pathname === '/' || location.pathname === '') content = <HomePage onSearch={openSearch} />;
  else content = <NotFound />;

  return (
    <>
      <Topbar onMenu={() => setNavOpen((v) => !v)} onSearch={openSearch} />
      <div className="layout">
        <Sidebar activeSlug={m ? m[1] : null} onNavigate={() => setNavOpen(false)} />
        <div className="scrim" onClick={() => setNavOpen(false)} />
        {content}
      </div>
      <SearchModal open={searchOpen} onClose={closeSearch} />
      <Lightbox image={image} onClose={closeImage} />
    </>
  );
}
