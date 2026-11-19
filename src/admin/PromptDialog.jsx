import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Hộp thoại nhập liệu dạng Promise.
 *   const [dialog, ask] = usePrompt();
 *   const values = await ask('Tiêu đề', [{ label: 'Tên', required: true }]);  // null nếu huỷ
 */
export function usePrompt() {
  const [state, setState] = useState(null);
  const ask = useCallback((title, fields, okText = 'Đồng ý') =>
    new Promise((resolve) => setState({ title, fields, okText, resolve })), []);
  const close = (val) => { state.resolve(val); setState(null); };
  const element = state ? <PromptDialog {...state} onDone={close} /> : null;
  return [element, ask];
}

function PromptDialog({ title, fields, okText, onDone }) {
  const [values, setValues] = useState(() => fields.map((f) => f.value || ''));
  const firstRef = useRef(null);
  useEffect(() => { if (firstRef.current) { firstRef.current.focus(); if (firstRef.current.select) firstRef.current.select(); } }, []);
  const set = (i, v) => setValues((vs) => vs.map((x, k) => (k === i ? v : x)));

  return (
    <div className="modal" onKeyDown={(e) => { if (e.key === 'Escape') onDone(null); }}>
      <div className="modal-backdrop" onClick={() => onDone(null)} />
      <form className="dialog small" onSubmit={(e) => { e.preventDefault(); onDone(values.map((v) => v.trim())); }}>
        <h2>{title}</h2>
        {fields.map((f, i) => (
          <label key={i}>
            {f.label}
            {f.type === 'select' ? (
              <select ref={i === 0 ? firstRef : null} value={values[i]} onChange={(e) => set(i, e.target.value)}>
                {f.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            ) : f.type === 'textarea' ? (
              <textarea ref={i === 0 ? firstRef : null} rows={3} value={values[i]} onChange={(e) => set(i, e.target.value)} />
            ) : (
              <input ref={i === 0 ? firstRef : null} value={values[i]} required={f.required}
                placeholder={f.placeholder || ''} onChange={(e) => set(i, e.target.value)} />
            )}
          </label>
        ))}
        <div className="dialog-actions">
          <button className="btn" type="button" onClick={() => onDone(null)}>Huỷ</button>
          <button className="btn primary" type="submit">{okText}</button>
        </div>
      </form>
    </div>
  );
}
