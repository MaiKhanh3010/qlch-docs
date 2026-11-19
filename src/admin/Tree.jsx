import { useRef, useState } from 'react';
import { slugify } from '../lib/markdown.js';

/** Cột trái: cấu trúc nhóm / trang, sắp xếp, kéo thả */
export default function Tree({ docs, current, onSelect, actions }) {
  const [filter, setFilter] = useState('');
  const [dropAt, setDropAt] = useState(null); // { si, before }
  const dragSlug = useRef(null);
  const q = slugify(filter);

  const onDragOver = (e, si, before) => {
    if (!dragSlug.current) return;
    e.preventDefault();
    e.stopPropagation();
    if (!dropAt || dropAt.si !== si || dropAt.before !== before) setDropAt({ si, before });
  };
  const onDrop = (e) => {
    if (!dragSlug.current || !dropAt) return;
    e.preventDefault();
    e.stopPropagation();
    actions.dropPage(dragSlug.current, dropAt.si, dropAt.before);
    dragSlug.current = null;
    setDropAt(null);
  };

  return (
    <aside className="tree-panel">
      <div className="tree-head">
        <strong>Cấu trúc tài liệu</strong>
        <button className="btn sm" onClick={actions.addSection}>+ Nhóm</button>
      </div>
      <input className="tree-filter" placeholder="Lọc trang…" value={filter} onChange={(e) => setFilter(e.target.value)} />

      {docs.sections.map((s, si) => (
        <div key={s.id} className={'t-section' + (dropAt && dropAt.si === si && !dropAt.before ? ' drop-target' : '')}>
          <div className="t-sec-head">
            <div className="t-sec-title">{s.title}</div>
            <div className="t-tools">
              <button className="t-tool" title="Đưa nhóm lên" onClick={() => actions.moveSection(si, -1)}>↑</button>
              <button className="t-tool" title="Đưa nhóm xuống" onClick={() => actions.moveSection(si, 1)}>↓</button>
              <button className="t-tool" title="Sửa nhóm" onClick={() => actions.editSection(si)}>✎</button>
              <button className="t-tool" title="Xoá nhóm" onClick={() => actions.deleteSection(si)}>✕</button>
            </div>
          </div>
          <div className="t-pages" onDragOver={(e) => onDragOver(e, si, null)} onDrop={onDrop}>
            {s.pages.map((p, pi) => {
              if (q && !slugify(p.title).includes(q) && !p.slug.includes(q)) return null;
              const cls = ['t-page'];
              if (p.slug === current) cls.push('active');
              if (p.hidden) cls.push('hidden-page');
              if (dropAt && dropAt.si === si && dropAt.before === p.slug) cls.push('drop-before');
              return (
                <div key={p.slug} className={cls.join(' ')} draggable
                  onClick={() => onSelect(p.slug)}
                  onDragStart={(e) => { dragSlug.current = p.slug; e.dataTransfer.effectAllowed = 'move'; try { e.dataTransfer.setData('text/plain', p.slug); } catch { /* */ } }}
                  onDragEnd={() => { dragSlug.current = null; setDropAt(null); }}
                  onDragOver={(e) => onDragOver(e, si, p.slug)}
                  onDrop={onDrop}>
                  <span className="grip">⋮⋮</span>
                  <span className="name">{p.title}</span>
                  <span className="t-tools">
                    <button className="t-tool" title="Lên" onClick={(e) => { e.stopPropagation(); actions.movePageStep(si, pi, -1); }}>↑</button>
                    <button className="t-tool" title="Xuống" onClick={(e) => { e.stopPropagation(); actions.movePageStep(si, pi, 1); }}>↓</button>
                  </span>
                </div>
              );
            })}
            <button className="t-add-page" onClick={() => actions.addPage(si)}>+ Trang</button>
          </div>
        </div>
      ))}
      <p className="tree-hint">Kéo thả trang để sắp xếp hoặc chuyển nhóm.</p>
    </aside>
  );
}
