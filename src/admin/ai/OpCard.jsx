import { useMemo, useState } from 'react';
import { render, inline } from '../../lib/markdown.js';
import Markdown from '../../components/Markdown.jsx';
import { lineDiff } from './apply.js';

/** Chỉ giữ các dòng thay đổi + 2 dòng ngữ cảnh, gộp phần không đổi */
function collapse(lines, ctx = 2) {
  if (!lines.some((l) => l.t !== ' ')) return [];
  const keep = lines.map(() => false);
  lines.forEach((l, i) => { if (l.t !== ' ') for (let k = Math.max(0, i - ctx); k <= Math.min(lines.length - 1, i + ctx); k++) keep[k] = true; });
  const out = [];
  let skipped = 0;
  lines.forEach((l, i) => {
    if (keep[i]) { if (skipped) { out.push({ t: '…', n: skipped }); skipped = 0; } out.push(l); }
    else skipped++;
  });
  if (skipped) out.push({ t: '…', n: skipped });
  return out;
}

const LABEL = { create: 'Tạo trang mới', update: 'Cập nhật trang', create_section: 'Tạo nhóm mới' };

function changedFields(op) {
  if (op.type !== 'update') return [];
  const f = [];
  if (op.page.title !== op.before.title) f.push('tiêu đề');
  if ((op.page.description || '') !== op.before.description) f.push('mục đích');
  if (op.page.content !== op.before.content) f.push('nội dung');
  if (op.sectionId !== op.before.sectionId) f.push('nhóm');
  return f;
}

/** Thẻ đề xuất thay đổi của AI */
export default function OpCard({ op, conflict, onApply, onDismiss, onOpen }) {
  const [preview, setPreview] = useState(false);
  const fields = changedFields(op);
  const status = op.status || 'pending';

  return (
    <div className={`op-card op-${op.type} op-${status}`}>
      <div className="op-top">
        <span className="op-kind">{LABEL[op.type]}</span>
        {status === 'applied' && <span className="op-badge ok">Đã áp dụng</span>}
        {status === 'dismissed' && <span className="op-badge">Đã bỏ qua</span>}
      </div>
      {op.type === 'create_section' ? (
        <div className="op-title">{op.section.title}</div>
      ) : (
        <>
          <div className="op-title">{op.page.title}</div>
          <div className="op-meta">
            {op.sectionTitle && <span>Nhóm: {op.sectionTitle}</span>}
            {fields.length > 0 && <span>Thay đổi: {fields.join(', ')}</span>}
          </div>
          {op.reasons && op.reasons.length > 0 && <div className="op-reason">{op.reasons.join(' · ')}</div>}
          {conflict && status === 'pending' && (
            <div className="op-warn">Trang này đã được sửa sau khi AI đọc. Áp dụng sẽ ghi đè các thay đổi đó.</div>
          )}
        </>
      )}
      <div className="op-actions">
        {op.type !== 'create_section' && <button className="btn sm" onClick={() => setPreview(true)}>Xem trước</button>}
        {status === 'pending' && <button className="btn sm primary" onClick={onApply}>Áp dụng</button>}
        {status === 'pending' && <button className="btn sm" onClick={onDismiss}>Bỏ qua</button>}
        {status === 'applied' && op.type !== 'create_section' && <button className="btn sm" onClick={onOpen}>Mở trang</button>}
      </div>
      {preview && <PreviewDialog op={op} onClose={() => setPreview(false)} onApply={status === 'pending' ? () => { onApply(); setPreview(false); } : null} />}
    </div>
  );
}

function PreviewDialog({ op, onClose, onApply }) {
  const [tab, setTab] = useState('preview');
  const html = useMemo(() => render(op.page.content).html, [op]);
  const diff = useMemo(() => (op.type === 'update' ? collapse(lineDiff(op.before.content, op.page.content)) : null), [op]);

  return (
    <div className="modal" onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="dialog ai-preview">
        <div className="ai-preview-head">
          <h2>{op.type === 'create' ? 'Trang mới' : 'Thay đổi'}: {op.page.title}</h2>
          {diff && (
            <div className="view-switch">
              <button className={tab === 'preview' ? 'on' : ''} onClick={() => setTab('preview')}>Xem trước</button>
              <button className={tab === 'diff' ? 'on' : ''} onClick={() => setTab('diff')}>So sánh</button>
            </div>
          )}
        </div>
        <div className="ai-preview-body" onClickCapture={(e) => { if (e.target.closest('a')) e.preventDefault(); }}>
          {tab === 'preview' ? (
            <div className="article">
              <div className="crumb">{op.sectionTitle}</div>
              <h1>{op.page.title}</h1>
              {op.page.description && <p className="lead" dangerouslySetInnerHTML={{ __html: inline(op.page.description) }} />}
              <Markdown html={html} />
            </div>
          ) : (
            <>
              {op.page.title !== op.before.title && (
                <div className="diff-field"><b>Tiêu đề:</b> <del>{op.before.title}</del> → <ins>{op.page.title}</ins></div>
              )}
              {(op.page.description || '') !== op.before.description && (
                <div className="diff-field"><b>Mục đích:</b><div><del>{op.before.description || '(trống)'}</del></div><div><ins>{op.page.description}</ins></div></div>
              )}
              <pre className="diff">
                {diff.length === 0 && <div className="ai-muted">Nội dung không đổi.</div>}
                {diff.map((l, i) => (l.t === '…'
                  ? <div key={i} className="gap">⋯ {l.n} dòng không đổi</div>
                  : <div key={i} className={l.t === '+' ? 'add' : l.t === '-' ? 'del' : ''}>{l.t} {l.s}</div>))}
              </pre>
            </>
          )}
        </div>
        <div className="dialog-actions">
          <button className="btn" onClick={onClose}>Đóng</button>
          {onApply && <button className="btn primary" onClick={onApply}>Áp dụng</button>}
        </div>
      </div>
    </div>
  );
}
