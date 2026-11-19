/* Bộ icon SVG dùng chung */
const S = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' };

export const IconSearch = ({ size = 16 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} {...S}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
);
export const IconMenu = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" {...S}><path d="M4 6h16M4 12h16M4 18h16" /></svg>
);
export const IconSun = () => (
  <svg className="i-sun" viewBox="0 0 24 24" width="18" height="18" {...S}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
);
export const IconMoon = () => (
  <svg className="i-moon" viewBox="0 0 24 24" width="18" height="18" {...S}><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" /></svg>
);
export const IconCopy = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" {...S}><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" /></svg>
);
export const IconLink = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" {...S}><path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" /></svg>
);
export const IconList = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" {...S}><path d="M4 6h16M4 12h10M4 18h13" /></svg>
);
