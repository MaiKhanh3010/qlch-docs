/**
 * Nạp nội dung tài liệu từ thư mục content/:
 *   content/site.json      – thông tin website (tên, logo, trang chủ…)
 *   content/nav.json       – các nhóm trên menu và THỨ TỰ các trang
 *   content/pages/*.md     – mỗi trang một file Markdown (tên file = đường dẫn /docs/<tên-file>)
 */
import site from '../../content/site.json';
import nav from '../../content/nav.json';
import files from './content-files.js';
import { parseFrontmatter } from './frontmatter.js';

function buildDocs() {
  const pages = {};
  for (const [file, raw] of Object.entries(files)) {
    const slug = file.split('/').pop().replace(/\.md$/, '');
    const { data, body } = parseFrontmatter(raw);
    pages[slug] = {
      slug,
      title: data.title || slug,
      description: data.description || '',
      updatedAt: data.updated || '',
      content: body,
    };
  }
  const sections = nav.sections.map((s) => ({
    id: s.id,
    title: s.title,
    description: s.description || '',
    pages: s.pages.map((slug) => pages[slug]).filter(Boolean),
  }));
  return { site, sections };
}

export const docs = buildDocs();
