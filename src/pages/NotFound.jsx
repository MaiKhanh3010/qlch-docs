import { Link } from '../lib/router.jsx';

export default function NotFound() {
  return (
    <>
      <main className="main">
        <div className="notfound">
          <h2>Không tìm thấy trang</h2>
          <p><Link to="/">Về trang chủ</Link></p>
        </div>
      </main>
      <aside className="toc" />
    </>
  );
}
