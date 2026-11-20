import { useEffect, useMemo } from 'react';
import { useDocs } from '../lib/docs-context.jsx';
import { Link } from '../lib/router.jsx';
import { render, inline } from '../lib/markdown.js';
import { copyText, fmtDate } from '../lib/ui.js';
import { fullUrl } from '../lib/mode.js';
import Markdown from '../components/Markdown.jsx';
import Toc from '../components/Toc.jsx';
import { IconCopy, IconLink } from '../components/Icons.jsx';
import NotFound from './NotFound.jsx';

export default function DocPage({ slug, hash, onImage }) {
  const { docs, flat } = useDocs();
  const idx = flat.findIndex((x) => x.page.slug === slug);
  const entry = flat[idx];
  const rendered = useMemo(() => (entry ? render(entry.page.content) : null), [entry]);

  useEffect(() => {
    if (!entry) return;
    document.title = `${entry.page.title} · ${(docs.site && docs.site.title) || 'Hướng dẫn'}`;
  }, [entry, docs.site]);

  // Cuộn tới đầu trang hoặc tới #mục khi đổi trang
  useEffect(() => {
    if (!entry) return;
    const el = hash && document.getElementById(decodeURIComponent(hash.slice(1)));
    if (el) el.scrollIntoView(); else window.scrollTo(0, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  if (!entry) return <NotFound />;
  const { page, section } = entry;
  const prev = flat[idx - 1];
  const next = flat[idx + 1];

  return (
    <>
      <main className="main">
        <article className="article">
          <div className="crumb">{section.title}</div>
          <h1>{page.title}</h1>
          {page.description && <p className="lead" dangerouslySetInnerHTML={{ __html: inline(page.description) }} />}
          <div className="page-actions">
            <button className="chip-btn" onClick={() => copyText(`# ${page.title}\n\n${page.description ? page.description + '\n\n' : ''}${page.content}`, 'Đã sao chép nội dung trang')}>
              <IconCopy />Sao chép nội dung
            </button>
            <button className="chip-btn" onClick={() => copyText(fullUrl(`/docs/${page.slug}`), 'Đã sao chép liên kết')}>
              <IconLink />Sao chép liên kết
            </button>
          </div>

          <Markdown html={rendered.html} onImageClick={onImage} />

          <div className="page-meta">
            <span>{page.updatedAt ? `Cập nhật lần cuối: ${fmtDate(page.updatedAt)}` : ''}</span>
          </div>
          <nav className="pager">
            {prev && (
              <Link className="prev" to={`/docs/${prev.page.slug}`}>
                <small>← Trang trước</small><span>{prev.page.title}</span>
              </Link>
            )}
            {next && (
              <Link className="next" to={`/docs/${next.page.slug}`}>
                <small>Trang tiếp theo →</small><span>{next.page.title}</span>
              </Link>
            )}
          </nav>
        </article>
      </main>
      <Toc headings={rendered.headings} />
    </>
  );
}
