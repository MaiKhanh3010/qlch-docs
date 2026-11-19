import { useRef, useState } from 'react';
import { uploadImage } from '../lib/api.js';
import { toast } from '../lib/ui.js';

const FIELDS = ['title', 'tagline', 'homeTitle', 'homeSubtitle', 'accent', 'logo'];

export default function SettingsDialog({ site, onApply, onClose }) {
  const [form, setForm] = useState(() => Object.fromEntries(FIELDS.map((k) => [k, site[k] || (k === 'accent' ? '#1f4fa3' : '')])));
  const fileRef = useRef(null);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function onLogo(e) {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    try { const r = await uploadImage(file, 'site'); setForm((f) => ({ ...f, logo: r.url })); }
    catch (err) { toast(err.message, true); }
  }

  return (
    <div className="modal" onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}>
      <div className="modal-backdrop" onClick={onClose} />
      <form className="dialog" onSubmit={(e) => { e.preventDefault(); onApply(Object.fromEntries(Object.entries(form).map(([k, v]) => [k, v.trim()]))); }}>
        <h2>Cài đặt website</h2>
        <label>Tên website <input required value={form.title} onChange={set('title')} /></label>
        <label>Dòng giới thiệu nhỏ trên trang chủ <input value={form.tagline} onChange={set('tagline')} /></label>
        <label>Tiêu đề trang chủ <input value={form.homeTitle} onChange={set('homeTitle')} /></label>
        <label>Mô tả trang chủ (hỗ trợ **đậm**) <textarea rows={3} value={form.homeSubtitle} onChange={set('homeSubtitle')} /></label>
        <div className="row2">
          <label>Màu chủ đạo <input type="color" value={form.accent} onChange={set('accent')} /></label>
          <label>Logo
            <div className="logo-row">
              {form.logo && <img src={form.logo} alt="" />}
              <button className="btn sm" type="button" onClick={() => fileRef.current.click()}>Tải logo…</button>
              {form.logo && <button className="btn sm" type="button" onClick={() => setForm((f) => ({ ...f, logo: '' }))}>Bỏ logo</button>}
            </div>
          </label>
        </div>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={onLogo} />
        <div className="dialog-actions">
          <button className="btn" type="button" onClick={onClose}>Huỷ</button>
          <button className="btn primary" type="submit">Áp dụng</button>
        </div>
      </form>
    </div>
  );
}
