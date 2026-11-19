import { useEffect } from 'react';

export default function Lightbox({ image, onClose }) {
  useEffect(() => {
    if (!image) return undefined;
    const k = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [image, onClose]);
  if (!image) return null;
  return (
    <div className="lightbox" onClick={onClose}>
      <img src={image.src} alt="" />
      {image.caption && <div className="lightbox-cap">{image.caption}</div>}
    </div>
  );
}
