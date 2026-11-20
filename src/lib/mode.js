/**
 * Chế độ xuất bản:
 *  - Bình thường: đường dẫn dạng /docs/<slug>, ảnh lấy từ /uploads/...
 *  - Bản 1 file HTML (npm run build:single): chuyển trang bằng #/docs/<slug>,
 *    ảnh được nhúng thẳng vào file dưới dạng data URI.
 */
import inlineAssets from 'virtual:inline-assets';

// eslint-disable-next-line no-undef
export const SINGLE_FILE = typeof __SINGLE_FILE__ !== 'undefined' && __SINGLE_FILE__;

/** Đường dẫn nội bộ (/docs/x#muc) -> href dùng trong thẻ <a> */
export function toHref(path) {
  if (!SINGLE_FILE || !path || !path.startsWith('/')) return path;
  return '#' + path;
}

/** Ảnh /uploads/... -> data URI khi xuất 1 file */
export function assetUrl(url) {
  if (!SINGLE_FILE || !url) return url;
  return inlineAssets[decodeURI(url)] || url;
}

/** Chuẩn hoá URL trong nội dung Markdown */
export function resolveUrl(url) {
  if (!url || !url.startsWith('/')) return url;
  if (url.startsWith('/uploads/')) return assetUrl(url);
  return toHref(url);
}

/** Liên kết đầy đủ để sao chép/chia sẻ */
export function fullUrl(path) {
  if (SINGLE_FILE) return location.href.split('#')[0] + '#' + path;
  return location.origin + path;
}
