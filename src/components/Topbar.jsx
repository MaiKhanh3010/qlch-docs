import { Link } from '../lib/router.jsx';
import { useDocs } from '../lib/docs-context.jsx';
import { IconMenu, IconSearch } from './Icons.jsx';
import ThemeToggle from './ThemeToggle.jsx';

export default function Topbar({ onMenu, onSearch }) {
  const { docs } = useDocs();
  const site = (docs && docs.site) || {};
  return (
    <header className="topbar">
      <button className="icon-btn menu-btn" onClick={onMenu} aria-label="Mở menu"><IconMenu /></button>
      <Link className="brand" to="/">
        {site.logo && <img src={site.logo} alt="" />}
        <span>{site.title || 'Hướng dẫn sử dụng'}</span>
      </Link>
      <button className="search-trigger" type="button" onClick={onSearch}>
        <IconSearch /><span>Tìm kiếm tài liệu…</span><kbd>Ctrl K</kbd>
      </button>
      <div className="topbar-right">
        <ThemeToggle />
        <Link className="btn-ghost admin-link" to="/admin">Quản trị</Link>
      </div>
    </header>
  );
}
