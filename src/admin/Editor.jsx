import { useDeferredValue, useMemo, useRef, useState } from 'react';
import { render, esc } from '../lib/markdown.js';
import { uploadImage } from '../lib/api.js';
import { toast } from '../lib/ui.js';
import Markdown from '../components/Markdown.jsx';
import MediaPanel from './MediaPanel.jsx';
import { PLACEHOLDER_IMG } from './doc-utils.js';

const SYNTAX_HELP = `## Tiêu đề mục            ### Tiêu đề phụ
**chữ đậm**   *nghiêng*   ==tô sáng==   \`mã\`
- gạch đầu dòng            1. danh sách đánh số
[Tên liên kết](/docs/slug-trang)

![Mô tả ảnh](/uploads/thu-muc/anh.png "Chú thích dưới ảnh")

:::steps                   :::note Tiêu đề tuỳ chọn
1. Bước một                Nội dung lưu ý
2. Bước hai                :::
:::                        (cũng có :::tip  :::warning  :::info  :::success)

:::cards
- [Tên trang](/docs/slug) Mô tả ngắn hiển thị dạng thẻ
:::

:::columns
### Cột 1
- ...
+++
### Cột 2
- ...
:::

| Cột 1 | Cột 2 |
|-------|-------|
| A     | B     |`;

function readView() { try { return localStorage.getItem('adminView') || 'split'; } catch { return 'split'; } }

export default function Editor({ docs, page, section, actions, ask }) {
  const taRef = useRef(null);
  const fileRef = useRef(null);
  const [view, setView] = useState(readView);
  const [slugInput, setSlugInput] = useState(page.slug);
  const [dragOver, setDragOver] = useState(false);
  const [progress, setProgress] = useState('');
  const [mediaKey, setMediaKey] = useState(0);
  const deferred = useDeferredValue(page.content);
  const preview = useMemo(() => render(deferred).html, [deferred]);
  const slug = page.slug;

  const changeView = (v) => { setView(v); try { localStorage.setItem('adminView', v); } catch { /* */ } };
  const setContent = (v) => actions.setField(slug, 'content', v);

  // ---------------------------------------------------------------- chèn văn bản
  function insertAtCursor(text, selFrom, selTo) {
    const ta = taRef.current;
    const v = ta.value;
    const s = ta.selectionStart, e = ta.selectionEnd;
    setContent(v.slice(0, s) + text + v.slice(e));
    requestAnimationFrame(() => {
      ta.focus();
      if (selFrom != null) ta.setSelectionRange(s + selFrom, s + selTo);
      else ta.setSelectionRange(s + text.length, s + text.length);
    });
  }
  function wrapSel(before, after, placeholder) {
    const ta = taRef.current;
    const sel = ta.value.slice(ta.selectionStart, ta.selectionEnd) || placeholder;
    insertAtCursor(before + sel + after, before.length, before.length + sel.length);
  }
  function blockInsert(text) {
    const ta = taRef.current;
    const before = ta.value.slice(0, ta.selectionStart);
    const pre = before && !before.endsWith('\n\n') ? (before.endsWith('\n') ? '\n' : '\n\n') : '';
    insertAtCursor(pre + text + '\n');
  }

  async function onTool(kind) {
    const ta = taRef.current;
    const selText = ta.value.slice(ta.selectionStart, ta.selectionEnd);
    switch (kind) {
      case 'h2': return blockInsert('## ' + (selText || 'Tiêu đề mục'));
      case 'h3': return blockInsert('### ' + (selText || 'Tiêu đề phụ'));
      case 'bold': return wrapSel('**', '**', 'chữ đậm');
      case 'italic': return wrapSel('*', '*', 'chữ nghiêng');
      case 'ul': return blockInsert((selText || 'Mục 1\nMục 2').split('\n').map((l) => '- ' + l).join('\n'));
      case 'steps': return blockInsert(':::steps\n' + (selText || 'Bước thứ nhất\nBước thứ hai\nBước thứ ba').split('\n').map((l, i) => `${i + 1}. ${l}`).join('\n') + '\n:::');
      case 'note': case 'tip': case 'warning': return blockInsert(`:::${kind}\n${selText || 'Nội dung'}\n:::`);
      case 'table': return blockInsert('| Cột 1 | Cột 2 |\n|-------|-------|\n| Nội dung | Nội dung |');
      case 'link': {
        const opts = docs.sections.flatMap((s) => s.pages.map((p) => ({ value: '/docs/' + p.slug, label: `${s.title} › ${p.title}` })));
        const sel = { start: ta.selectionStart, end: ta.selectionEnd };
        const r = await ask('Chèn liên kết', [
          { label: 'Chữ hiển thị', value: selText },
          { label: 'Liên kết tới trang', type: 'select', options: [{ value: '', label: '— Nhập địa chỉ bên dưới —' }, ...opts] },
          { label: 'Hoặc địa chỉ web (https://…)' },
        ], 'Chèn');
        if (!r) return undefined;
        const url = r[2] || r[1];
        if (!url) return undefined;
        ta.setSelectionRange(sel.start, sel.end);
        return insertAtCursor(`[${r[0] || url}](${url})`);
      }
      case 'image': return fileRef.current.click();
      default: return undefined;
    }
  }

  // ---------------------------------------------------------------- tải ảnh
  async function uploadFiles(files) {
    const out = [];
    for (let i = 0; i < files.length; i++) {
      setProgress(`Đang tải ${i + 1}/${files.length}…`);
      try { out.push(await uploadImage(files[i], slug)); }
      catch (e) { toast(`Lỗi tải "${files[i].name}": ${e.message}`, true); }
    }
    setProgress('');
    if (!out.length) return;
    const md = out.map((r) => `![Ảnh minh hoạ](${r.url} "Chú thích ảnh")`).join('\n\n');
    // Trang mới tạo từ mẫu: thay dòng ảnh mẫu bằng ảnh vừa tải
    if (PLACEHOLDER_IMG.test(taRef.current.value)) setContent(taRef.current.value.replace(PLACEHOLDER_IMG, md));
    else blockInsert(md);
    toast(`Đã tải lên ${out.length} ảnh`);
    setMediaKey((k) => k + 1);
  }
  const imagesOf = (list) => [...(list || [])].filter((f) => f.type.startsWith('image/'));

  const tools = [
    ['h2', <b key="b">H2</b>, 'Tiêu đề mục'], ['h3', <b key="b">H3</b>, 'Tiêu đề phụ'],
    ['bold', <b key="b">B</b>, 'In đậm'], ['italic', <i key="i">I</i>, 'In nghiêng'], 'sep',
    ['ul', '• Danh sách', 'Danh sách'], ['steps', '① Các bước', 'Các bước thực hiện'],
    ['note', 'Lưu ý', 'Khung lưu ý'], ['tip', 'Mẹo', 'Khung mẹo'], ['warning', 'Cảnh báo', 'Khung cảnh báo'],
    ['table', 'Bảng', 'Bảng'], ['link', 'Liên kết', 'Liên kết'], ['image', '🖼 Ảnh', 'Tải ảnh lên và chèn'],
  ];

  return (
    <>
      <div className="ed-head">
        <h2>{page.title || '(chưa có tiêu đề)'}</h2>
        <a className="btn sm" href={`/docs/${slug}`} target="_blank" rel="noreferrer">Xem trang ↗</a>
        <button className="btn sm danger" onClick={() => actions.deletePage(slug)}>Xoá trang</button>
      </div>

      <div className="ed-grid">
        <label>Tiêu đề (tên tính năng)
          <input value={page.title} onChange={(e) => actions.setField(slug, 'title', e.target.value)} />
        </label>
        <label>Đường dẫn (slug)
          <input value={slugInput} onChange={(e) => setSlugInput(e.target.value)}
            onBlur={() => setSlugInput(actions.setSlug(slug, slugInput))}
            onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }} />
        </label>
        <label>Thuộc nhóm
          <select value={section.id} onChange={(e) => actions.moveToSection(slug, e.target.value)}>
            {docs.sections.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
          </select>
        </label>
      </div>
      <div className="ed-desc">
        <label>Mục đích / mô tả ngắn (hiển thị dưới tiêu đề)
          <textarea rows={2} value={page.description || ''} onChange={(e) => actions.setField(slug, 'description', e.target.value)} />
        </label>
        <label className="check">
          <input type="checkbox" checked={!!page.hidden} onChange={(e) => actions.setField(slug, 'hidden', e.target.checked)} />
          Ẩn trang này khỏi website (bản nháp)
        </label>
      </div>

      <div className="toolbar">
        {tools.map((t, i) => (t === 'sep'
          ? <span className="sep" key={i} />
          : <button key={t[0]} title={t[2]} onClick={() => onTool(t[0])}>{t[1]}</button>))}
        <span className="spacer" />
        <div className="view-switch">
          {[['edit', 'Soạn'], ['split', 'Song song'], ['preview', 'Xem trước']].map(([v, l]) => (
            <button key={v} className={view === v ? 'on' : ''} onClick={() => changeView(v)}>{l}</button>
          ))}
        </div>
      </div>
      <div className={'split' + (view === 'edit' ? ' only-edit' : view === 'preview' ? ' only-preview' : '')}>
        <div className={'src' + (dragOver ? ' dragover' : '')}
          onDragOver={(e) => { if ([...e.dataTransfer.types].includes('Files')) { e.preventDefault(); setDragOver(true); } }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { setDragOver(false); const f = imagesOf(e.dataTransfer.files); if (f.length) { e.preventDefault(); uploadFiles(f); } }}>
          <textarea ref={taRef} spellCheck={false} value={page.content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Tab') { e.preventDefault(); insertAtCursor('  '); } }}
            onPaste={(e) => { const f = imagesOf(e.clipboardData && e.clipboardData.files); if (f.length) { e.preventDefault(); uploadFiles(f); } }} />
        </div>
        <div className="preview" onClickCapture={(e) => { if (e.target.closest('a')) e.preventDefault(); }}>
          <Markdown html={preview} />
        </div>
      </div>

      <MediaPanel slug={slug} content={page.content} refreshKey={mediaKey} progress={progress}
        onUploadClick={() => fileRef.current.click()}
        onInsert={(url) => blockInsert(`![Ảnh minh hoạ](${url} "Chú thích ảnh")`)} />

      <details className="help">
        <summary>Hướng dẫn cú pháp soạn thảo</summary>
        <pre dangerouslySetInnerHTML={{ __html: esc(SYNTAX_HELP) }} />
      </details>

      <input ref={fileRef} type="file" accept="image/*" multiple hidden
        onChange={(e) => { const f = imagesOf(e.target.files); e.target.value = ''; if (f.length) uploadFiles(f); }} />
    </>
  );
}
