/**
 * Nạp nội dung tài liệu từ thư mục content/:
 *   content/site.json      – thông tin website (tên, logo, trang chủ…)
 *   content/nav.json       – các nhóm trên menu và THỨ TỰ các trang (bản đầy đủ)
 *   content/guides/<id>/   – site.json + nav.json của từng bản theo vai trò (vd. Người tham gia)
 *   content/pages/*.md     – mỗi trang một file Markdown (tên file = đường dẫn /docs/<tên-file>)
 *
 * Người dùng chọn vai trò ở trang chủ; mỗi vai trò xem một "bản" (menu, trang chủ, tìm kiếm riêng).
 */
import site from '../../content/site.json';
import nav from '../../content/nav.json';
import participantSite from '../../content/guides/nguoi-tham-gia/site.json';
import participantNav from '../../content/guides/nguoi-tham-gia/nav.json';
import files from './content-files.js';
import { parseFrontmatter, isHiddenPage, stripHidden } from './frontmatter.js';

/** Các vai trò người dùng chọn được – thứ tự hiển thị trên màn hình chọn */
const ROLES = [
  {
    id: 'to-chuc',
    label: 'Người mời họp',
    hint: 'Người mời họp, Thư ký cuộc họp, Người chủ trì',
    desc: 'Quản lý cuộc họp trên QLCH, theo dõi tham gia, Biên bản họp và phê duyệt.',
    site, nav,
  },
  {
    id: 'nguoi-tham-gia',
    label: 'Người tham gia',
    hint: 'Người được mời tham dự cuộc họp',
    desc: 'Nhận thông báo, báo vắng, điểm danh, xác nhận tuân thủ và xem Biên bản họp trên One Nova.',
    site: participantSite, nav: participantNav,
  },
];

const raw = {};
for (const [file, text] of Object.entries(files)) {
  const slug = file.split('/').pop().replace(/\.md$/, '');
  const p = parseFrontmatter(text);
  if (isHiddenPage(p.data)) continue; // trang tạm ẩn
  raw[slug] = { data: p.data, body: stripHidden(p.body) };
}

function buildProfile(role) {
  // Liên kết tới trang không có trong menu của bản này -> chỉ giữ chữ
  const inNav = new Set(role.nav.sections.flatMap((s) => s.pages).filter((slug) => raw[slug]));
  const stripDeadLinks = (md) => md.replace(/(!?)\[([^\]]+)\]\(\/docs\/([a-z0-9-]+)[^)]*\)/g,
    (m, img, text, slug) => (img || inNav.has(slug) ? m : text));
  const page = (slug) => {
    const r = raw[slug];
    if (!r) return null;
    return {
      slug,
      title: r.data.title || slug,
      description: r.data.description || '',
      updatedAt: r.data.updated || '',
      content: stripDeadLinks(r.body),
    };
  };
  const sections = role.nav.sections.map((s) => ({
    id: s.id,
    title: s.title,
    description: s.description || '',
    pages: s.pages.map(page).filter(Boolean),
  }));
  return { id: role.id, site: role.site, sections };
}

export const roles = ROLES.map(({ id, label, hint, desc }) => ({ id, label, hint, desc }));
export const profiles = Object.fromEntries(ROLES.map((r) => [r.id, buildProfile(r)]));
export const defaultRole = ROLES[0].id;
