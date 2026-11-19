import { useEffect, useState } from 'react';
import { handleLinkClick } from '../lib/router.jsx';
import { IconList } from './Icons.jsx';

/** Mục lục "Trên trang này" + tự đánh dấu mục đang đọc */
export default function Toc({ headings }) {
  const [active, setActive] = useState(null);

  useEffect(() => {
    if (!headings || headings.length < 2) return undefined;
    const onScroll = () => {
      let cur = headings[0].id;
      for (const h of headings) {
        const el = document.getElementById(h.id);
        if (el && el.getBoundingClientRect().top < 130) cur = h.id;
      }
      if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 4) cur = headings[headings.length - 1].id;
      setActive(cur);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [headings]);

  if (!headings || headings.length < 2) return <aside className="toc" />;
  return (
    <aside className="toc">
      <div className="toc-title"><IconList />Trên trang này</div>
      {headings.map((h) => (
        <a key={h.id} href={`#${h.id}`} onClick={handleLinkClick}
          className={`lvl-${h.level}` + (active === h.id ? ' active' : '')}>
          {h.text}
        </a>
      ))}
    </aside>
  );
}
