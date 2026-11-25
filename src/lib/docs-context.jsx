import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { profiles, roles, defaultRole } from './content.js';
import { buildIndex } from './search.js';

const KEY = 'qlch-role';
const readRole = () => {
  try { const r = localStorage.getItem(KEY); return profiles[r] ? r : null; } catch { return null; }
};

// Dữ liệu dựng sẵn cho từng vai trò: danh sách phẳng (trang trước/sau) + chỉ mục tìm kiếm
const built = {};
for (const [id, docs] of Object.entries(profiles)) {
  const flat = [];
  for (const section of docs.sections) for (const page of section.pages) flat.push({ page, section });
  built[id] = { docs, flat, index: buildIndex(flat) };
}

const DocsContext = createContext(null);

export function DocsProvider({ children }) {
  // chosen = null: người dùng chưa chọn vai trò -> trang chủ hiển thị màn hình chọn
  const [chosen, setChosen] = useState(readRole);
  const role = chosen || defaultRole;
  const setRole = useCallback((r) => {
    setChosen(r);
    try { if (r) localStorage.setItem(KEY, r); else localStorage.removeItem(KEY); } catch { /* bỏ qua */ }
  }, []);
  const value = useMemo(() => ({
    ...built[role], role, chosen, roles, setRole, error: null,
    /** Tìm vai trò khác có trang này (khi mở liên kết tới trang không thuộc vai trò đang chọn) */
    roleOf: (slug) => Object.keys(built).find((id) => built[id].flat.some((x) => x.page.slug === slug)),
  }), [role, chosen, setRole]);
  return <DocsContext.Provider value={value}>{children}</DocsContext.Provider>;
}

export const useDocs = () => useContext(DocsContext);
