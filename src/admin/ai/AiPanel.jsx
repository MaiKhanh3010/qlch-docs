import { useEffect, useMemo, useRef, useState } from 'react';
import { api, uploadImage } from '../../lib/api.js';
import { imageForAI } from '../../lib/image.js';
import { render } from '../../lib/markdown.js';
import { toast } from '../../lib/ui.js';
import Markdown from '../../components/Markdown.jsx';
import OpCard from './OpCard.jsx';
import { hasConflict } from './apply.js';
import { findPage } from '../doc-utils.js';

const NEW_FEATURE_TEMPLATE = `Tạo trang hướng dẫn cho tính năng:
Vai trò sử dụng: Người mời họp
Mục đích:
Các bước thực hiện:
1.
2.
3.
Kết quả sau khi thực hiện:
Lưu ý: `;

const SUGGESTIONS = [
  { label: 'Tạo trang cho tính năng mới', text: NEW_FEATURE_TEMPLATE, needsPage: false },
  { label: 'Viết lại trang đang mở cho rõ ràng, đúng bố cục chuẩn', needsPage: true },
  { label: 'Soát chính tả và thống nhất thuật ngữ trang đang mở', needsPage: true },
  { label: 'Tìm và cập nhật các trang liên quan đến trang đang mở', needsPage: true },
];

let uid = 0;
const nextId = () => `m${Date.now()}-${uid++}`;

function AssistantText({ text }) {
  const html = useMemo(() => render(text).html, [text]);
  return (
    <div onClickCapture={(e) => { if (e.target.closest('a')) e.preventDefault(); }}>
      <Markdown html={html} className="prose ai-prose" />
    </div>
  );
}

/** Khung chat trợ lý AI trong trang quản trị */
export default function AiPanel({ open, onClose, draft, current, onApplyOp, onOpenPage }) {
  const [status, setStatus] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [files, setFiles] = useState([]); // [{file, preview}]
  const [busy, setBusy] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [useCurrent, setUseCurrent] = useState(true);
  const [dragOver, setDragOver] = useState(false);
  const listRef = useRef(null);
  const fileRef = useRef(null);
  const taRef = useRef(null);

  const currentPage = current ? findPage(draft, current) : null;

  useEffect(() => {
    if (open && !status) api('GET', '/api/ai/status').then(setStatus).catch(() => setStatus({ enabled: false }));
  }, [open, status]);
  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, busy]);
  useEffect(() => {
    if (!busy) return undefined;
    setElapsed(0);
    const t = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [busy]);
  useEffect(() => () => files.forEach((f) => URL.revokeObjectURL(f.preview)), []); // eslint-disable-line

  function addFiles(list) {
    const imgs = [...(list || [])].filter((f) => f.type.startsWith('image/'));
    if (!imgs.length) return;
    setFiles((fs) => [...fs, ...imgs.map((file) => ({ file, preview: URL.createObjectURL(file) }))].slice(0, 10));
  }
  function removeFile(i) {
    setFiles((fs) => { URL.revokeObjectURL(fs[i].preview); return fs.filter((_, k) => k !== i); });
  }

  /** Chuyển lịch sử chat sang dạng gửi máy chủ */
  function toPayload(list) {
    return list.map((m, i) => {
      if (m.role === 'assistant') {
        let t = m.text || '';
        if (m.ops && m.ops.length) {
          t += '\n\n[Trạng thái các đề xuất: ' + m.ops.map((o) => `${o.type === 'create_section' ? o.section.title : o.page.title} – ${o.status === 'applied' ? 'người dùng ĐÃ áp dụng' : o.status === 'dismissed' ? 'người dùng đã bỏ qua' : 'chưa áp dụng'}`).join('; ') + ']';
        }
        if (m.error) t = '';
        return { role: 'assistant', text: t };
      }
      const last = i === list.length - 1;
      return { role: 'user', text: m.text, images: (m.images || []).map((im) => ({ url: im.url, name: im.name, data: last ? im.data : undefined })) };
    });
  }

  async function send(overrideText) {
    const content = (overrideText ?? text).trim();
    if ((!content && !files.length) || busy) return;
    setBusy(true);
    try {
      // 1. Tải ảnh lên máy chủ (để dùng trong trang) + chuẩn bị bản thu nhỏ gửi AI
      const images = [];
      for (const f of files) {
        const [up, data] = await Promise.all([uploadImage(f.file, 'ai-anh'), imageForAI(f.file)]);
        images.push({ url: up.url, name: f.file.name, data, preview: up.url });
      }
      const pageNote = useCurrent && currentPage ? `\n\n(Trang đang mở: ${currentPage.page.title} – slug: ${currentPage.page.slug})` : '';
      const userMsg = { id: nextId(), role: 'user', text: content, images, note: pageNote };
      const next = [...messages, userMsg];
      setMessages(next);
      setText('');
      files.forEach((f) => URL.revokeObjectURL(f.preview));
      setFiles([]);

      const payload = toPayload(next);
      payload[payload.length - 1].text += pageNote;
      const res = await api('POST', '/api/ai/chat', {
        messages: payload, docs: draft, currentSlug: useCurrent && currentPage ? current : null,
      });
      setMessages((ms) => [...ms, {
        id: nextId(), role: 'assistant', text: res.reply,
        ops: res.operations.map((o, k) => ({ ...o, key: k, status: 'pending' })), usage: res.usage,
      }]);
    } catch (e) {
      setMessages((ms) => [...ms, { id: nextId(), role: 'assistant', text: `⚠️ ${e.message}`, error: true }]);
    } finally {
      setBusy(false);
      setTimeout(() => taRef.current && taRef.current.focus(), 0);
    }
  }

  function setOpStatus(msgId, key, patch) {
    setMessages((ms) => ms.map((m) => (m.id !== msgId ? m : { ...m, ops: m.ops.map((o) => (o.key === key ? { ...o, ...patch } : o)) })));
  }
  function apply(msg, op) {
    // Áp dụng nhóm mới trước nếu trang thuộc nhóm do AI tạo
    if (op.type === 'create') {
      const secOp = msg.ops.find((o) => o.type === 'create_section' && o.sectionId === op.sectionId && o.status === 'pending');
      if (secOp) apply(msg, secOp);
    }
    try {
      const slug = onApplyOp(op);
      setOpStatus(msg.id, op.key, { status: 'applied', appliedSlug: slug || op.slug });
    } catch (e) {
      toast(e.message, true);
    }
  }
  function applyAll(msg) {
    msg.ops.filter((o) => o.status === 'pending' && o.type === 'create_section').forEach((o) => apply(msg, o));
    // dùng trạng thái mới nhất của msg sau khi áp dụng nhóm
    msg.ops.filter((o) => o.status === 'pending' && o.type !== 'create_section').forEach((o) => apply({ ...msg, ops: msg.ops.map((x) => (x.type === 'create_section' ? { ...x, status: 'applied' } : x)) }, o));
    toast('Đã áp dụng – nhớ bấm Lưu thay đổi');
  }

  function pickSuggestion(s) {
    if (s.text) { setText(s.text); setTimeout(() => { const ta = taRef.current; if (ta) { ta.focus(); ta.setSelectionRange(43, 43); } }, 0); }
    else send(s.label);
  }

  return (
    <aside className={'ai-panel' + (open ? ' open' : '')} aria-hidden={!open}
      onDragOver={(e) => { if ([...e.dataTransfer.types].includes('Files')) { e.preventDefault(); setDragOver(true); } }}
      onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setDragOver(false); }}
      onDrop={(e) => { if (e.dataTransfer.files.length) { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); } }}>
      <div className="ai-head">
        <div>
          <strong>✨ Trợ lý soạn thảo AI</strong>
          {status && status.enabled && <div className="ai-model">{status.model}</div>}
        </div>
        <div className="ai-head-actions">
          {messages.length > 0 && <button className="btn sm" disabled={busy} onClick={() => { if (confirm('Bắt đầu hội thoại mới? Các đề xuất chưa áp dụng sẽ mất.')) setMessages([]); }}>Hội thoại mới</button>}
          <button className="t-tool" title="Đóng" onClick={onClose}>✕</button>
        </div>
      </div>

      {status && !status.enabled ? (
        <div className="ai-setup">
          <h3>Chưa bật trợ lý AI</h3>
          <p>Để dùng trợ lý, cần có API key của Claude:</p>
          <ol>
            <li>Tạo API key tại <a href="https://console.anthropic.com" target="_blank" rel="noreferrer">console.anthropic.com</a> (mục API Keys).</li>
            <li>Mở file <code>config.json</code>, điền key vào <code>"ai": {'{'} "apiKey": "sk-ant-..." {'}'}</code>.</li>
            <li>Tắt và chạy lại <code>npm run dev</code> (hoặc <code>npm start</code>).</li>
          </ol>
          <p className="ai-muted">Hoặc đặt biến môi trường <code>ANTHROPIC_API_KEY</code> thay vì ghi vào file.</p>
        </div>
      ) : (
        <>
          <div className="ai-messages" ref={listRef}>
            {messages.length === 0 && (
              <div className="ai-empty">
                <p>Mô tả tính năng, các bước thực hiện và đính kèm ảnh chụp màn hình. AI sẽ soạn nội dung, sắp xếp bố cục, tạo trang mới hoặc sửa các trang liên quan.</p>
                <p className="ai-muted">Mọi thay đổi đều hiện dưới dạng đề xuất để bạn xem trước và bấm <b>Áp dụng</b>.</p>
                <div className="ai-suggest">
                  {SUGGESTIONS.filter((s) => !s.needsPage || currentPage).map((s) => (
                    <button key={s.label} onClick={() => pickSuggestion(s)} disabled={busy}>{s.label}</button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((m) => (
              <div key={m.id} className={`ai-msg ${m.role}` + (m.error ? ' error' : '')}>
                {m.role === 'user' ? (
                  <div className="bubble">
                    {m.images && m.images.length > 0 && (
                      <div className="ai-thumbs">{m.images.map((im) => <img key={im.url} src={im.preview} alt="" />)}</div>
                    )}
                    {m.text && <div className="ai-user-text">{m.text}</div>}
                  </div>
                ) : (
                  <>
                    {m.text && <AssistantText text={m.text} />}
                    {m.ops && m.ops.length > 0 && (
                      <div className="ai-ops">
                        {m.ops.map((op) => (
                          <OpCard key={op.key} op={op}
                            conflict={op.status === 'pending' && hasConflict(draft, op)}
                            onApply={() => apply(m, op)}
                            onDismiss={() => setOpStatus(m.id, op.key, { status: 'dismissed' })}
                            onOpen={() => onOpenPage(op.appliedSlug || op.slug)} />
                        ))}
                        {m.ops.filter((o) => o.status === 'pending').length > 1 && (
                          <button className="btn sm primary ai-apply-all" onClick={() => applyAll(m)}>Áp dụng tất cả</button>
                        )}
                      </div>
                    )}
                    {m.usage && <div className="ai-usage">{m.usage.input_tokens.toLocaleString('vi-VN')} token vào · {m.usage.output_tokens.toLocaleString('vi-VN')} token ra</div>}
                  </>
                )}
              </div>
            ))}
            {busy && <div className="ai-msg assistant"><div className="ai-typing"><span /><span /><span /> AI đang soạn… {elapsed}s</div></div>}
          </div>

          <div className={'ai-composer' + (dragOver ? ' dragover' : '')}>
            {currentPage && (
              <label className="ai-context">
                <input type="checkbox" checked={useCurrent} onChange={(e) => setUseCurrent(e.target.checked)} />
                Dựa trên trang đang mở: <b>{currentPage.page.title}</b>
              </label>
            )}
            {files.length > 0 && (
              <div className="ai-attach">
                {files.map((f, i) => (
                  <div key={f.preview} className="ai-attach-item">
                    <img src={f.preview} alt="" />
                    <button title="Bỏ ảnh" onClick={() => removeFile(i)}>×</button>
                  </div>
                ))}
              </div>
            )}
            <textarea ref={taRef} rows={4} value={text} disabled={busy}
              placeholder="Mô tả tính năng / yêu cầu chỉnh sửa… (Enter để gửi, Shift+Enter xuống dòng, Ctrl+V để dán ảnh)"
              onChange={(e) => setText(e.target.value)}
              onPaste={(e) => { if (e.clipboardData.files.length) { e.preventDefault(); addFiles(e.clipboardData.files); } }}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); send(); } }} />
            <div className="ai-composer-bar">
              <button className="btn sm" onClick={() => fileRef.current.click()} disabled={busy}>📎 Đính kèm ảnh</button>
              <span className="ai-muted">{files.length ? `${files.length} ảnh` : ''}</span>
              <button className="btn sm primary" onClick={() => send()} disabled={busy || (!text.trim() && !files.length)}>Gửi</button>
            </div>
            <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }} />
          </div>
        </>
      )}
    </aside>
  );
}
