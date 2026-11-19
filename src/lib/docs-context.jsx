import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { buildIndex } from './search.js';

const DocsContext = createContext(null);

export function DocsProvider({ children }) {
  const [docs, setDocs] = useState(null);
  const [error, setError] = useState(null);

  const reload = useCallback(async () => {
    try {
      const r = await fetch('/api/docs', { cache: 'no-store' });
      if (!r.ok) throw new Error(`Lỗi ${r.status}`);
      setDocs(await r.json());
      setError(null);
    } catch (e) {
      setError(e.message);
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const value = useMemo(() => {
    const flat = [];
    if (docs) for (const s of docs.sections) for (const p of s.pages) if (!p.hidden) flat.push({ page: p, section: s });
    return { docs, setDocs, reload, error, flat, index: buildIndex(flat) };
  }, [docs, error, reload]);

  return <DocsContext.Provider value={value}>{children}</DocsContext.Provider>;
}

export const useDocs = () => useContext(DocsContext);
