import { useEffect } from 'react';
import { useDocs } from '../lib/docs-context.jsx';
import { Link } from '../lib/router.jsx';
import { inline } from '../lib/markdown.js';
import { truncate } from '../lib/ui.js';
import { IconSearch } from '../components/Icons.jsx';

export default function HomePage({ onSearch }) {
  const { docs } = useDocs();
  const site = docs.site || {};
  useEffect(() => { document.title = site.title || 'Hướng dẫn sử dụng'; }, [site.title]);
  const sections = docs.sections.filter((s) => s.pages.some((p) => !p.hidden));

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
