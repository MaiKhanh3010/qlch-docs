import { useState } from 'react';
import { api } from '../lib/api.js';

export default function Login({ onSuccess }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError(''); setBusy(true);
    try { await api('POST', '/api/login', { password }); onSuccess(); }
    catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }

  return (
    <div className="login">
      <form className="login-card" onSubmit={submit}>
        <h1>Quản trị tài liệu</h1>
        <p>Nhập mật khẩu quản trị để thêm, sửa tính năng và tải ảnh minh hoạ.</p>
        <input type="password" placeholder="Mật khẩu" autoComplete="current-password" required autoFocus
          value={password} onChange={(e) => setPassword(e.target.value)} />
        <button className="btn primary" type="submit" disabled={busy}>{busy ? 'Đang đăng nhập…' : 'Đăng nhập'}</button>
        <div className="login-err">{error}</div>
        <a href="/" className="login-back">← Về trang tài liệu</a>
      </form>
    </div>
  );
}
