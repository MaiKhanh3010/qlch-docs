import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { copyText } from '../lib/ui.js';

/** Danh sách ảnh minh hoạ của trang (thư mục uploads/<slug>/) */
export default function MediaPanel({ slug, content, refreshKey, progress, onUploadClick, onInsert }) {
  const [files, setFiles] = useState(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let alive = true;
    api('GET', '/api/uploads?folder=' + encodeURIComponent(slug))
      .then((r) => { if (alive) setFiles(r.files); })
      .catch(() => { if (alive) setFiles([]); });
    return () => { alive = false; };
  }, [slug, refreshKey, tick]);

  async function remove(f) {
    const used = content.includes(f.url);
    if (!confirm(used ? 'Ảnh này đang được dùng trong nội dung. Vẫn xoá?' : 'Xoá ảnh này?')) return;
    await api('DELETE', '/api/uploads?path=' + encodeURIComponent(f.path));
    setTick((t) => t + 1);
  }

  return (
    <section className="media">
      <div className="media-head">
        <div>
          <h3>Ảnh minh hoạ của trang</h3>
          <p>Lưu tại <code>uploads/{slug}/</code>. Có thể kéo thả hoặc dán (Ctrl+V) ảnh trực tiếp vào ô soạn thảo.</p>
        </div>
        <div>
          <span className="upload-progress">{progress}</span>{' '}
          <button className="btn sm" onClick={onUploadClick}>Tải ảnh lên…</button>
        </div>
      </div>
      {files && files.length === 0 && (
        <div className="media-empty">Chưa có ảnh nào cho trang này. Bấm “Tải ảnh lên…” hoặc kéo thả ảnh vào ô soạn thảo.</div>
      )}
      {files && files.length > 0 && (
        <div className="media-grid">
          {files.map((f) => (
            <div key={f.path} className={'media-item' + (content.includes(f.url) ? ' used' : '')} title={content.includes(f.url) ? 'Đang được dùng trong nội dung' : ''}>
              <img src={f.url} alt="" loading="lazy" onClick={() => window.open(f.url, '_blank')} />
              <div className="mi-name" title={f.path}>{f.path.split('/').pop()} · {Math.round(f.size / 1024)} KB</div>
              <div className="mi-actions">
                <button onClick={() => onInsert(f.url)}>Chèn</button>
                <button onClick={() => copyText(f.url, 'Đã chép đường dẫn ảnh')}>Chép link</button>
                <button onClick={() => remove(f)}>Xoá</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
