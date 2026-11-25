import { useEffect } from 'react';
import { useDocs } from '../lib/docs-context.jsx';
import { Link } from '../lib/router.jsx';
import { inline } from '../lib/markdown.js';
import { truncate } from '../lib/ui.js';
import { IconSearch } from '../components/Icons.jsx';

/** Màn hình đầu tiên: người dùng chọn vai trò để xem bản hướng dẫn phù hợp */
function RolePicker() {
  const { roles, setRole, docs } = useDocs();
  const site = docs.site || {};
  useEffect(() => { document.title = site.title || 'Hướng dẫn sử dụng'; }, [site.title]);
  return (
    <>
      <main className="main">
        <div className="article">
          <section className="hero">
            <div className="crumb">{site.tagline || 'Tài liệu hướng dẫn'}</div>
            <h1>{site.homeTitle || site.title || 'Hướng dẫn sử dụng'}</h1>
            <p>Chọn vai trò của bạn để xem hướng dẫn phù hợp. Bạn có thể đổi vai trò bất cứ lúc nào bằng nút trên thanh tiêu đề.</p>
          </section>
          <section className="home-section">
            <h2>Bạn là ai?</h2>
            <div className="role-grid">
              {roles.map((r) => (
                <button key={r.id} type="button" className="role-card" onClick={() => setRole(r.id)}>
                  <span className="role-name">{r.label}</span>
                  <span className="role-hint">{r.hint}</span>
                  <span className="role-desc">{r.desc}</span>
                  <span className="role-go">Xem hướng dẫn →</span>
                </button>
              ))}
            </div>
          </section>
        </div>
      </main>
      <aside className="toc" />
    </>
  );
}

export default function HomePage({ onSearch }) {
  const { docs, chosen, roles, role, setRole } = useDocs();
  const site = docs.site || {};
  useEffect(() => { document.title = site.title || 'Hướng dẫn sử dụng'; }, [site.title]);
  if (!chosen) return <RolePicker />;
  const sections = docs.sections.filter((s) => s.pages.some((p) => !p.hidden));
  const current = roles.find((r) => r.id === role);

  return (
    <>
      <main className="main">
        <div className="article">
          <section className="hero">
            <div className="crumb">{site.tagline || 'Tài liệu hướng dẫn'}</div>
            <h1>{site.homeTitle || site.title || 'Hướng dẫn sử dụng'}</h1>
            {site.homeSubtitle && <p dangerouslySetInnerHTML={{ __html: inline(site.homeSubtitle) }} />}
            <button className="search-trigger" type="button" onClick={onSearch}>
              <IconSearch /><span>Bạn cần tìm hướng dẫn gì?</span><kbd>Ctrl K</kbd>
            </button>
          </section>
          <div className="role-current">
            Bạn đang xem hướng dẫn dành cho <strong>{current && current.label}</strong>.
            <button type="button" className="chip-btn" onClick={() => setRole(null)}>Đổi vai trò</button>
          </div>
          {sections.map((s) => (
            <section className="home-section" key={s.id || s.title}>
              <h2>{s.title}</h2>
              {s.description && <p dangerouslySetInnerHTML={{ __html: inline(s.description) }} />}
              <div className="cards">
                {s.pages.filter((p) => !p.hidden).map((p) => (
                  <Link className="card" key={p.slug} to={`/docs/${p.slug}`}>
                    <span className="card-title">{p.title}</span>
                    {p.description && <span className="card-desc">{truncate(p.description, 110)}</span>}
                    <span className="card-arrow">→</span>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>
      <aside className="toc" />
    </>
  );
}
