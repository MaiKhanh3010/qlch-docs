import { createContext, useContext } from 'react';
import { docs } from './content.js';
import { buildIndex } from './search.js';

const flat = [];
for (const section of docs.sections) for (const page of section.pages) flat.push({ page, section });

const value = { docs, flat, index: buildIndex(flat), error: null };
const DocsContext = createContext(value);

export function DocsProvider({ children }) {
  return <DocsContext.Provider value={value}>{children}</DocsContext.Provider>;
}

export const useDocs = () => useContext(DocsContext);
