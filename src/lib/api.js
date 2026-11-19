/* Gọi API máy chủ */
let onUnauthorized = null;
export function setUnauthorizedHandler(fn) { onUnauthorized = fn; }

export async function api(method, url, body) {
  const r = await fetch(url, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'same-origin',
    cache: 'no-store',
  });
  let data = {};
  try { data = await r.json(); } catch { /* bỏ qua */ }
  if (r.status === 401 && url !== '/api/login') {
    if (onUnauthorized) onUnauthorized();
    throw new Error('Phiên đăng nhập đã hết hạn');
  }
  if (!r.ok) throw new Error(data.error || `Lỗi ${r.status}`);
  return data;
}

export function readAsDataURL(file) {
  return new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onload = () => res(fr.result);
    fr.onerror = rej;
    fr.readAsDataURL(file);
  });
}

export async function uploadImage(file, folder) {
  const data = await readAsDataURL(file);
  const name = file.name && file.name !== 'image.png' ? file.name : `anh-${Date.now()}.png`;
  return api('POST', '/api/upload', { folder, filename: name, data });
}
