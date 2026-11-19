import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../lib/api.js';
import { toast } from '../lib/ui.js';
import { navigate } from '../lib/router.jsx';
import ThemeToggle from '../components/ThemeToggle.jsx';
import { usePrompt } from './PromptDialog.jsx';
import Tree from './Tree.jsx';
import Editor from './Editor.jsx';
import SettingsDialog from './SettingsDialog.jsx';
import AiPanel from './ai/AiPanel.jsx';
import { prepareApply } from './ai/apply.js';
import { findPage, newId, PAGE_TEMPLATE, uniqueSlug } from './doc-utils.js';

const now = () => new Date().toISOString();

export default function Workspace({ onLogout }) {
  const [draft, setDraft] = useState(null);
  const [current, setCurrent] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [savedAt, setSavedAt] = useState('');
  const [saving, setSaving] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [aiOpen, setAiOpen] = useState(() => { try { return localStorage.getItem('aiOpen') === '1'; } catch { return false; } });
  const [dialog, ask] = usePrompt();
  const draftRef = useRef(null);
  draftRef.current = draft;

  /** Sửa dữ liệu bất biến: fn nhận bản sao và thay đổi trực tiếp (phải là hàm thuần) */
  const mutate = useCallback((fn) => {
    setDraft((d) => { const c = structuredClone(d); fn(c); return c; });
    setDirty(true);
  }, []);

  // tải dữ liệu
  useEffect(() => {
    api('GET', '/api/docs').then((d) => {
      d.sections.forEach((s) => { if (!s.id) s.id = newId(); });
      setDraft(d);
      const m = /edit=([a-z0-9-]+)/.exec(location.hash);
      if (m && findPage(d, m[1])) setCurrent(m[1]);
    }).catch((e) => toast(e.message, true));
  }, []);

  useEffect(() => {
    if (draft && draft.site && draft.site.accent) document.documentElement.style.setProperty('--accent', draft.site.accent);
  }, [draft]);

  useEffect(() => {
    history.replaceState(null, '', current ? `/admin#edit=${current}` : '/admin');
  }, [current]);

  const save = useCallback(async () => {
    if (!draftRef.current) return;
    setSaving(true);
    try {
      await api('PUT', '/api/docs', draftRef.current);
      setDirty(false);
      setSavedAt('Đã lưu lúc ' + new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }));
      toast('Đã lưu thay đổi');
    } catch (e) {
      toast('Không lưu được: ' + e.message, true);
    } finally {
      setSaving(false);
    }
  }, []);

  // Ctrl+S, cảnh báo khi rời trang chưa lưu
  useEffect(() => {
    const onKey = (e) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); save(); } };
    const onLeave = (e) => { if (dirty) { e.preventDefault(); e.returnValue = ''; } };
    window.addEventListener('keydown', onKey);
    window.addEventListener('beforeunload', onLeave);
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('beforeunload', onLeave); };
  }, [save, dirty]);

  async function logout() {
    if (dirty && !confirm('Bạn có thay đổi chưa lưu. Vẫn đăng xuất?')) return;
    await api('POST', '/api/logout').catch(() => {});
    onLogout();
  }

  // ---------------------------------------------------------------- thao tác nhóm & trang
  const actions = {
    async addSection() {
      const r = await ask('Thêm nhóm tài liệu', [
        { label: 'Tên nhóm', placeholder: 'Ví dụ: Báo cáo & thống kê', required: true },
        { label: 'Mô tả (hiển thị ở trang chủ)', type: 'textarea' },
      ], 'Thêm');
      if (!r || !r[0]) return;
      const id = newId();
      mutate((d) => { d.sections.push({ id, title: r[0], description: r[1], pages: [] }); });
    },
    async editSection(si) {
      const sec = draft.sections[si];
      const r = await ask('Sửa nhóm', [
        { label: 'Tên nhóm', value: sec.title, required: true },
        { label: 'Mô tả (hiển thị ở trang chủ)', value: sec.description || '', type: 'textarea' },
      ], 'Lưu');
      if (r && r[0]) mutate((d) => { d.sections[si].title = r[0]; d.sections[si].description = r[1]; });
    },
    deleteSection(si) {
      const sec = draft.sections[si];
      if (sec.pages.length) return toast('Hãy chuyển hoặc xoá hết các trang trong nhóm trước khi xoá nhóm', true);
      if (confirm(`Xoá nhóm "${sec.title}"?`)) mutate((d) => { d.sections.splice(si, 1); });
    },
    moveSection(si, dir) {
      const to = si + dir;
      if (to < 0 || to >= draft.sections.length) return;
      mutate((d) => { [d.sections[si], d.sections[to]] = [d.sections[to], d.sections[si]]; });
    },
    movePageStep(si, pi, dir) {
      const to = pi + dir;
      if (to < 0 || to >= draft.sections[si].pages.length) return;
      mutate((d) => { const p = d.sections[si].pages; [p[pi], p[to]] = [p[to], p[pi]]; });
    },
    /** Kéo thả: chuyển trang `slug` vào nhóm `si`, đứng trước trang `beforeSlug` (hoặc cuối nhóm) */
    dropPage(slug, si, beforeSlug) {
      if (slug === beforeSlug) return;
      mutate((d) => {
        const f = findPage(d, slug);
        f.section.pages.splice(f.index, 1);
        const target = d.sections[si].pages;
        const idx = beforeSlug ? target.findIndex((p) => p.slug === beforeSlug) : -1;
        target.splice(idx < 0 ? target.length : idx, 0, f.page);
      });
    },
    async addPage(si) {
      const r = await ask('Thêm trang hướng dẫn', [
        { label: 'Tên tính năng / tiêu đề trang', placeholder: 'Ví dụ: Xuất báo cáo điểm danh', required: true },
        { label: 'Mục đích (mô tả ngắn)', type: 'textarea' },
      ], 'Tạo trang');
      if (!r || !r[0]) return;
      const slug = uniqueSlug(draft, r[0]);
      const t = now();
      mutate((d) => { d.sections[si].pages.push({ slug, title: r[0], description: r[1], content: PAGE_TEMPLATE, updatedAt: t }); });
      setCurrent(slug);
    },
  };

  // ---------------------------------------------------------------- thao tác trong editor
  const pageActions = {
    setField(slug, key, value) {
      const t = now();
      mutate((d) => { const f = findPage(d, slug); if (f) { f.page[key] = value; f.page.updatedAt = t; } });
    },
    setSlug(slug, wanted) {
      const fixed = uniqueSlug(draft, wanted, slug);
      if (!wanted || fixed === slug) return slug;
      if (fixed !== wanted) toast(`Slug đã tồn tại, đổi thành "${fixed}"`);
      const t = now();
      mutate((d) => { const f = findPage(d, slug); f.page.slug = fixed; f.page.updatedAt = t; });
      setCurrent(fixed);
      return fixed;
    },
    moveToSection(slug, sectionId) {
      const t = now();
      mutate((d) => {
        const f = findPage(d, slug);
        const target = d.sections.find((s) => s.id === sectionId);
        if (!target || target === f.section) return;
        f.section.pages.splice(f.index, 1);
        f.page.updatedAt = t;
        target.pages.push(f.page);
      });
    },
    deletePage(slug) {
      const f = findPage(draft, slug);
      if (!f || !confirm(`Xoá trang "${f.page.title}"? (Ảnh đã tải lên vẫn được giữ lại)`)) return;
      mutate((d) => { const g = findPage(d, slug); g.section.pages.splice(g.index, 1); });
      setCurrent(null);
      toast('Đã xoá trang – bấm Lưu thay đổi để áp dụng');
    },
  };

  useEffect(() => { try { localStorage.setItem('aiOpen', aiOpen ? '1' : '0'); } catch { /* */ } }, [aiOpen]);

  /** Áp dụng đề xuất của AI vào bản nháp, trả về slug trang liên quan */
  const applyAiOp = useCallback((op) => {
    const prepared = prepareApply(draftRef.current, op);
    mutate(prepared.run);
    if (prepared.slug && op.type === 'create') setCurrent(prepared.slug);
    return prepared.slug;
  }, [mutate]);

  if (!draft) return <div className="loading">Đang tải dữ liệu…</div>;
  const found = current ? findPage(draft, current) : null;

  return (
    <div className="admin-app">
      <header className="admin-top">
        <a className="brand" href="/" target="_blank" rel="noreferrer">
          <span>{draft.site.title || 'Tài liệu'}</span><span className="badge">Quản trị</span>
        </a>
        <div className="admin-top-actions">
          <span className={'save-state' + (dirty ? ' dirty' : '')}>{dirty ? '● Chưa lưu' : savedAt}</span>
          <button className={'btn ai-toggle' + (aiOpen ? ' on' : '')} onClick={() => setAiOpen((v) => !v)}>✨ Trợ lý AI</button>
          <button className="btn" onClick={() => setShowSettings(true)}>Cài đặt website</button>
          <button className="btn" onClick={() => { if (!dirty || confirm('Bạn có thay đổi chưa lưu. Vẫn rời trang quản trị?')) navigate(found ? `/docs/${found.page.slug}` : '/'); }}>
            Xem website
          </button>
          <button className="btn primary" disabled={!dirty || saving} onClick={save}>
            {saving ? 'Đang lưu…' : 'Lưu thay đổi'} <kbd>Ctrl S</kbd>
          </button>
          <ThemeToggle />
          <button className="btn" onClick={logout}>Đăng xuất</button>
        </div>
      </header>

      <div className={'admin-body' + (aiOpen ? ' with-ai' : '')}>
        <Tree docs={draft} current={current} onSelect={setCurrent} actions={actions} />
        <main className="editor-panel">
          {found ? (
            <Editor key={found.page.slug} docs={draft} page={found.page} section={found.section} actions={pageActions} ask={ask} />
          ) : (
            <div className="empty-state">
              <h2>Chọn một trang để chỉnh sửa</h2>
              <p>Hoặc bấm <b>+ Trang</b> ở một nhóm bên trái để thêm hướng dẫn cho tính năng mới.</p>
            </div>
          )}
        </main>
        <AiPanel open={aiOpen} onClose={() => setAiOpen(false)} draft={draft} current={current}
          onApplyOp={applyAiOp} onOpenPage={setCurrent} />
      </div>

      {showSettings && (
        <SettingsDialog site={draft.site} onClose={() => setShowSettings(false)}
          onApply={(site) => { mutate((d) => { d.site = { ...d.site, ...site }; }); setShowSettings(false); toast('Đã áp dụng – nhớ bấm Lưu thay đổi'); }} />
      )}
      {dialog}
    </div>
  );
}
