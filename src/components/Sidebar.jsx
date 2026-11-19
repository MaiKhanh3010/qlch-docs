import { useEffect, useRef } from 'react';
import { Link } from '../lib/router.jsx';
import { useDocs } from '../lib/docs-context.jsx';

export default function Sidebar({ activeSlug, onNavigate }) {
  const { docs } = useDocs();
  const ref = useRef(null);

  // Cuộn mục đang chọn vào vùng nhìn thấy
  useEffect(() => {
    const el = ref.current && ref.current.querySelector('.nav-link.active');
    if (!el) return;
    const r = el.getBoundingClientRect(), sr = ref.current.getBoundingClientRect();
    if (r.top < sr.top + 40 || r.bottom > sr.bottom - 40) el.scrollIntoView({ block: 'center' });
  }, [activeSlug]);

  return (
    <aside className="sidebar" ref={ref}>
      <nav>
        {docs.sections.map((s) => {
          const pages = s.pages.filter((p) => !p.hidden);
          if (!pages.length) return null;
          return (
            <div className="nav-section" key={s.id || s.title}>
              <div className="nav-section-title">{s.title}</div>
              {pages.map((p) => (
                <Link key={p.slug} to={`/docs/${p.slug}`} onClick={onNavigate}
                  className={'nav-link' + (p.slug === activeSlug ? ' active' : '')}>
                  {p.title}
                </Link>
              ))}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
