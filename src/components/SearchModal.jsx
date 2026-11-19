import { useEffect, useMemo, useRef, useState } from 'react';
import { useDocs } from '../lib/docs-context.jsx';
import { navigate } from '../lib/router.jsx';
import { search } from '../lib/search.js';
import { IconSearch } from './Icons.jsx';

export default function SearchModal({ open, onClose }) {
  const { index } = useDocs();
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const results = useMemo(() => search(index, q), [index, q]);

  useEffect(() => {
    if (open) { setQ(''); setSel(0); setTimeout(() => inputRef.current && inputRef.current.focus(), 0); }
  }, [open]);
  useEffect(() => { setSel(0); }, [q]);
  useEffect(() => {
    const el = listRef.current && listRef.current.children[sel];
    if (el && el.scrollIntoView) el.scrollIntoView({ block: 'nearest' });
  }, [sel]);

  if (!open) return null;

  const go = (r) => { onClose(); navigate(`/docs/${r.page.slug}`); window.scrollTo(0, 0); };
  const onKey = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSel((s) => (s + 1) % Math.max(1, results.length)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSel((s) => (s - 1 + results.length) % Math.max(1, results.length)); }
    else if (e.key === 'Enter' && results[sel]) go(results[sel]);
    else if (e.key === 'Escape') onClose();
  };

  return (
    <div className="modal">
      <div className="modal-backdrop" onClick={onClose} />
      <div className="search-box" role="dialog" aria-label="Tìm kiếm">
        <div className="search-input-row">
          <IconSearch size={18} />
          <input ref={inputRef} type="search" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={onKey}
            placeholder="Nhập từ khoá, ví dụ: báo vắng, điểm danh, biên bản…" autoComplete="off" />
          <kbd onClick={onClose}>Esc</kbd>
        </div>
        <div className="search-results" ref={listRef}>
          {results.length === 0 && <div className="search-empty">Không tìm thấy kết quả cho “{q}”</div>}
          {results.map((r, i) => (
            <a key={r.page.slug} href={`/docs/${r.page.slug}`} className={'sr-item' + (i === sel ? ' sel' : '')}
              onMouseEnter={() => setSel(i)}
              onClick={(e) => { if (!e.ctrlKey && !e.metaKey) { e.preventDefault(); go(r); } }}>
              <div className="sr-sec">{r.section.title}</div>
              <div className="sr-title" dangerouslySetInnerHTML={{ __html: r.titleHtml }} />
              {r.snipHtml && <div className="sr-snip" dangerouslySetInnerHTML={{ __html: r.snipHtml }} />}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
