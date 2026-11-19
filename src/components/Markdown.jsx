import { handleLinkClick } from '../lib/router.jsx';

/**
 * Hiển thị HTML đã render từ Markdown (đã được escape an toàn trong lib/markdown.js).
 * - Liên kết nội bộ chuyển trang không tải lại
 * - Bấm ảnh để phóng to
 */
export default function Markdown({ html, onImageClick, className = 'prose' }) {
  function onClick(e) {
    const img = e.target.closest('img');
    if (img && onImageClick) {
      const fig = img.closest('figure');
      const cap = fig && fig.querySelector('figcaption');
      onImageClick({ src: img.src, caption: cap ? cap.textContent : img.alt });
      return;
    }
    handleLinkClick(e);
  }
  return <div className={className} onClick={onClick} dangerouslySetInnerHTML={{ __html: html }} />;
}
