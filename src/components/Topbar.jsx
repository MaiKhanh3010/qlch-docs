import { Link, navigate } from '../lib/router.jsx';
import { useDocs } from '../lib/docs-context.jsx';
import { IconMenu, IconSearch } from './Icons.jsx';
import ThemeToggle from './ThemeToggle.jsx';
import { assetUrl } from '../lib/mode.js';

export default function Topbar({ onMenu, onSearch }) {
  const { docs, roles, role, chosen, setRole } = useDocs();
  const site = (docs && docs.site) || {};
  const current = roles.find((r) => r.id === role);
  // Đổi vai trò: quay về trang chủ và hiện màn hình chọn
  const changeRole = () => { setRole(null); navigate('/'); };
  return (
    <header className="topbar">
      <button className="icon-btn menu-btn" onClick={onMenu} aria-label="Mở menu"><IconMenu /></button>
      <Link className="brand" to="/">
        {site.logo && <img src={assetUrl(site.logo)} alt="" />}
        <span>{site.title || 'Hướng dẫn sử dụng'}</span>
      </Link>
      <button className="search-trigger" type="button" onClick={onSearch}>
        <IconSearch /><span>Tìm kiếm tài liệu…</span><kbd>Ctrl K</kbd>
      </button>
      <div className="topbar-right">
        {chosen && current && (
          <button type="button" className="role-switch" onClick={changeRole} title="Đổi vai trò">
            <span className="role-switch-label">Vai trò:</span> {current.label} <span aria-hidden="true">⇄</span>
          </button>
        )}
        <ThemeToggle />
      </div>
    </header>
  );
}
