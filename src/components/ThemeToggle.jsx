import { toggleTheme } from '../lib/ui.js';
import { IconMoon, IconSun } from './Icons.jsx';

export default function ThemeToggle() {
  return (
    <button className="icon-btn" onClick={toggleTheme} aria-label="Đổi giao diện sáng/tối" title="Đổi giao diện sáng/tối">
      <IconSun /><IconMoon />
    </button>
  );
}
