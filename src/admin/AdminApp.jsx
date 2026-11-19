import { useEffect, useState } from 'react';
import { api, setUnauthorizedHandler } from '../lib/api.js';
import Login from './Login.jsx';
import Workspace from './Workspace.jsx';
import '../styles/admin.css';
import '../styles/ai.css';

export default function AdminApp() {
  const [auth, setAuth] = useState(null); // null = đang kiểm tra

  useEffect(() => {
    document.body.classList.add('admin');
    document.title = 'Quản trị tài liệu';
    setUnauthorizedHandler(() => setAuth(false));
    api('GET', '/api/me').then((r) => setAuth(r.authenticated)).catch(() => setAuth(false));
    return () => { document.body.classList.remove('admin'); setUnauthorizedHandler(null); };
  }, []);

  if (auth === null) return <div className="loading">Đang tải…</div>;
  if (!auth) return <Login onSuccess={() => setAuth(true)} />;
  return <Workspace onLogout={() => setAuth(false)} />;
}
