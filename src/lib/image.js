/* Thu nhỏ ảnh trước khi gửi cho AI (cạnh dài tối đa 1568px – mức Claude khuyến nghị) */
import { readAsDataURL } from './api.js';

export async function imageForAI(file, maxEdge = 1568) {
  const original = await readAsDataURL(file);
  const img = await new Promise((res, rej) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = rej;
    i.src = original;
  });
  const scale = Math.min(1, maxEdge / Math.max(img.naturalWidth, img.naturalHeight));
  const supported = /^data:image\/(png|jpeg|gif|webp);/.test(original);
  if (scale === 1 && supported && original.length < 3.5 * 1024 * 1024) return original;
  const c = document.createElement('canvas');
  c.width = Math.round(img.naturalWidth * scale);
  c.height = Math.round(img.naturalHeight * scale);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.drawImage(img, 0, 0, c.width, c.height);
  return c.toDataURL('image/jpeg', 0.88);
}
