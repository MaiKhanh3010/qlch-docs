import { lazy, Suspense } from 'react';
import { useLocation } from './lib/router.jsx';
import { DocsProvider } from './lib/docs-context.jsx';
import DocsLayout from './pages/DocsLayout.jsx';

// Trang quản trị được tải riêng (code-splitting) – người xem tài liệu không phải tải phần này
const AdminApp = lazy(() => import('./admin/AdminApp.jsx'));

export default function App() {
  const location = useLocation();
  if (location.pathname === '/admin' || location.pathname.startsWith('/admin/')) {
    return (
      <Suspense fallback={<div className="loading">Đang tải trang quản trị…</div>}>
        <AdminApp />
      </Suspense>
    );
  }
  return (
    <DocsProvider>
      <DocsLayout location={location} />
    </DocsProvider>
  );
}
