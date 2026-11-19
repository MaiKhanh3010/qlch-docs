/**
 * Trợ lý AI soạn thảo tài liệu (Claude API).
 *
 * Luồng xử lý:
 *  1. Trình duyệt gửi hội thoại + bản nháp tài liệu hiện tại + ảnh đính kèm.
 *  2. Máy chủ gọi Claude với các "công cụ" (tools) để đọc/tìm/tạo/sửa trang.
 *  3. Mọi thay đổi chỉ được ghi vào BẢN SAO làm việc và trả về dạng "đề xuất"
 *     (operations) – người dùng xem trước rồi mới bấm Áp dụng trên giao diện.
 *
 * Cấu hình trong config.json -> "ai": { apiKey, model, maxTokens, baseUrl }
 * hoặc biến môi trường ANTHROPIC_API_KEY.
 */

const TOOLS = [
  {
    name: 'search_pages',
    description: 'Tìm các trang tài liệu liên quan theo từ khoá (không phân biệt dấu). Dùng để tìm những trang cần cập nhật theo yêu cầu.',
    input_schema: {
      type: 'object',
      properties: { query: { type: 'string', description: 'Từ khoá tìm kiếm, ví dụ: "báo vắng"' } },
      required: ['query'],
    },
  },
  {
    name: 'read_page',
    description: 'Đọc toàn bộ nội dung Markdown của một trang theo slug. Luôn đọc trang trước khi sửa.',
    input_schema: {
      type: 'object',
      properties: { slug: { type: 'string' } },
      required: ['slug'],
    },
  },
  {
    name: 'create_section',
    description: 'Tạo nhóm tài liệu mới (mục trên menu trái). Chỉ dùng khi không có nhóm nào phù hợp.',
    input_schema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Tên nhóm, ví dụ "Người mời họp · Báo cáo"' },
        description: { type: 'string', description: 'Mô tả ngắn hiển thị ở trang chủ' },
      },
      required: ['title'],
    },
  },
  {
    name: 'create_page',
    description: 'Tạo trang hướng dẫn mới cho một tính năng.',
    input_schema: {
      type: 'object',
      properties: {
        section_id: { type: 'string', description: 'id của nhóm chứa trang' },
        title: { type: 'string', description: 'Tên tính năng, ngắn gọn, bắt đầu bằng động từ. Ví dụ "Xuất báo cáo điểm danh"' },
        description: { type: 'string', description: 'Mục đích của tính năng – 1 đến 2 câu ngắn gọn' },
        content: { type: 'string', description: 'Nội dung trang bằng Markdown theo đúng cú pháp và bố cục chuẩn' },
        slug: { type: 'string', description: 'Không bắt buộc. a-z, 0-9, dấu gạch ngang' },
        after_slug: { type: 'string', description: 'Không bắt buộc. Đặt trang ngay sau trang này trong nhóm' },
      },
      required: ['section_id', 'title', 'description', 'content'],
    },
  },
  {
    name: 'update_page',
    description: 'Cập nhật một trang có sẵn. Chỉ truyền các trường cần đổi. Trường content phải là TOÀN BỘ nội dung mới của trang.',
    input_schema: {
      type: 'object',
      properties: {
        slug: { type: 'string' },
        title: { type: 'string' },
        description: { type: 'string' },
        content: { type: 'string' },
        section_id: { type: 'string', description: 'Chuyển trang sang nhóm khác' },
        reason: { type: 'string', description: 'Lý do thay đổi, 1 câu ngắn' },
      },
      required: ['slug', 'reason'],
    },
  },
  {
    name: 'edit_page_text',
    description: 'Sửa nhỏ: thay một đoạn văn bản xuất hiện ĐÚNG MỘT LẦN trong nội dung trang. Phù hợp khi chỉ cần chỉnh vài câu trong trang liên quan.',
    input_schema: {
      type: 'object',
      properties: {
        slug: { type: 'string' },
        find: { type: 'string', description: 'Đoạn văn bản gốc, chép chính xác từ read_page' },
        replace: { type: 'string', description: 'Đoạn văn bản thay thế' },
        reason: { type: 'string' },
      },
      required: ['slug', 'find', 'replace', 'reason'],
    },
  },
];

const STYLE_GUIDE = `
## Bố cục chuẩn cho trang hướng dẫn một tính năng
- title: tên tính năng (không có chữ "Tính năng:").
- description: MỤC ĐÍCH, 1–2 câu, ngắn gọn, bắt đầu bằng động từ (ví dụ "Theo dõi ...", "Cho phép người tham gia ...").
- content (Markdown), theo thứ tự:
  1. Ảnh minh hoạ chính: ![Mô tả](URL "Chú thích ngắn dưới ảnh")  – chỉ dùng URL ảnh được cung cấp.
  2. "## Các bước thực hiện" với khối :::steps (danh sách đánh số; tên nút/trường/tab in đậm và đặt trong ngoặc kép “...”).
  3. "## Kết quả" (gạch đầu dòng hoặc bảng), hoặc khối :::success nếu kết quả chỉ 1–2 câu.
  4. Thông tin dạng bảng (trạng thái, chỉ số, quy tắc) -> dùng bảng Markdown.
  5. Lưu ý -> khối :::note ; điều kiện nghiêm trọng/không thể hoàn tác -> :::warning ; mẹo -> :::tip.
  6. Nếu có trang liên quan: thêm liên kết dạng [Tên trang](/docs/slug).

## Cú pháp Markdown được hỗ trợ (KHÔNG dùng HTML)
## / ### tiêu đề · **đậm** · *nghiêng* · ==tô sáng== · \`mã\` · [liên kết](/docs/slug) · bảng | a | b |
![alt](url "chú thích")   ảnh nằm riêng một dòng sẽ hiển thị dạng khung có chú thích
:::steps            :::note [tiêu đề tuỳ chọn]      (cũng có :::tip :::warning :::info :::success)
1. Bước một         Nội dung
2. Bước hai         :::
:::
:::cards
- [Tên trang](/docs/slug) Mô tả ngắn
:::
:::columns
### Cột 1
- ...
+++
### Cột 2
- ...
:::

## Ví dụ một trang chuẩn
title: Đổi người phê duyệt vắng mặt
description: Thay đổi người phê duyệt cho từng yêu cầu báo vắng khi cần chuyển sang người có thẩm quyền phù hợp.
content:
![Đổi người duyệt cho yêu cầu vắng mặt](/uploads/doi-nguoi-phe-duyet-vang-mat/man-hinh.png "Đổi người duyệt cho yêu cầu vắng mặt")

## Các bước thực hiện

:::steps
1. Tại danh sách **“Yêu cầu vắng mặt”**, chọn yêu cầu cần thay đổi.
2. Chọn **“Đổi người duyệt”**.
3. Chọn người phê duyệt mới và xác nhận.
:::

## Kết quả

- Yêu cầu chuyển đến người duyệt mới; các yêu cầu khác không bị ảnh hưởng.

:::note
Chỉ đổi được khi yêu cầu ở trạng thái **“Chờ phê duyệt”** hoặc **“Chờ chỉ định người duyệt”**.
:::
`;

function systemPrompt(docs, currentSlug) {
  const outline = docs.sections.map((s) =>
    `- [section_id: ${s.id}] ${s.title}\n` +
    s.pages.map((p) => `    - ${p.slug} | ${p.title}${p.hidden ? ' (đang ẩn)' : ''} — ${(p.description || '').slice(0, 140)}`).join('\n'),
  ).join('\n');
  let current = '';
  if (currentSlug) {
    const f = find(docs, currentSlug);
    if (f) current = `\n# Trang người dùng ĐANG MỞ trong trình soạn thảo\nslug: ${f.page.slug}\ntitle: ${f.page.title}\ndescription: ${f.page.description || ''}\ncontent:\n${f.page.content}\n`;
  }
  return `Bạn là trợ lý biên soạn tài liệu hướng dẫn sử dụng cho website "${docs.site?.title || 'Hướng dẫn sử dụng'}" (hệ thống Quản lý cuộc họp – QLCH, ứng dụng One Nova, Outlook, Teams, E-Office).
Người dùng là quản trị viên tài liệu. Họ mô tả tính năng, các bước thực hiện và gửi ảnh chụp màn hình; bạn soạn nội dung, sắp xếp bố cục, tạo trang mới hoặc sửa các trang liên quan bằng công cụ.

# Nguyên tắc
- Luôn viết tiếng Việt, văn phong hướng dẫn: ngắn gọn, rõ ràng, nhất quán với các trang hiện có.
- KHÔNG bịa chức năng, tên nút, quy tắc hay số liệu mà người dùng không cung cấp và không thấy trong ảnh. Có thể đọc chữ trên ảnh chụp màn hình để lấy đúng tên nút/trường. Nếu thiếu thông tin quan trọng, vẫn soạn phần đã chắc chắn và hỏi lại phần còn thiếu ở câu trả lời.
- Ảnh: chỉ dùng đúng URL được cung cấp ở dạng [Ảnh n: URL]. Ảnh nào phù hợp nhất đặt đầu trang; ảnh từng bước có thể đặt ngay sau bước tương ứng hoặc sau khối steps.
- Chọn nhóm (section) phù hợp theo vai trò (Người mời họp / Người tham gia / Người chủ trì...). Dùng đúng thuật ngữ hiện hành: "người mời họp" (không dùng "Thư ký"), "One Nova" (có dấu cách). Đặt trang mới ở vị trí hợp lý (after_slug).
- Khi tạo tính năng mới, hãy search_pages để tìm trang liên quan; nếu trang khác cần nhắc tới tính năng mới (ví dụ trang tổng quan, thẻ :::cards, liên kết "Xem thêm"), hãy cập nhật chúng.
- Khi sửa: read_page trước. Sửa nhỏ dùng edit_page_text; viết lại nhiều dùng update_page với toàn bộ content mới. Giữ nguyên ảnh và phần không liên quan.
- Mọi thay đổi chỉ là ĐỀ XUẤT, người dùng sẽ xem trước và bấm Áp dụng. Không cần hỏi xin phép trước khi dùng công cụ.
- Nếu người dùng chỉ hỏi/nhờ góp ý mà không yêu cầu thay đổi, chỉ trả lời, không gọi công cụ tạo/sửa.
- Kết thúc bằng một tóm tắt ngắn (gạch đầu dòng) những gì đã đề xuất và câu hỏi nếu còn thiếu thông tin.
${STYLE_GUIDE}
# Cấu trúc tài liệu hiện tại (slug | tiêu đề — mô tả)
${outline}
${current}`;
}

// ------------------------------------------------------------------ helpers trên bản sao
function find(docs, slug) {
  for (const section of docs.sections) {
    const index = section.pages.findIndex((p) => p.slug === slug);
    if (index >= 0) return { section, page: section.pages[index], index };
  }
  return null;
}
function slugify(s) {
  return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
}
function uniqueSlug(docs, base) {
  const used = new Set(docs.sections.flatMap((s) => s.pages.map((p) => p.slug)));
  const b = slugify(base) || 'trang-moi';
  let s = b, n = 2;
  while (used.has(s)) s = `${b}-${n++}`;
  return s;
}
const fold = (s) => slugify(s).replace(/-/g, ' ');

/** Thực thi một tool trên bản sao `wc`, ghi lại thay đổi vào `ops` */
function runTool(name, input, wc, ops) {
  const now = new Date().toISOString();
  const recordUpdate = (f, reason) => {
    let op = ops.find((o) => o.slug === f.page.slug);
    if (!op) {
      op = {
        type: 'update', slug: f.page.slug, reasons: [],
        before: { title: f.page.title, description: f.page.description || '', content: f.page.content, sectionId: f.section.id },
      };
      ops.push(op);
    }
    if (reason && op.reasons) op.reasons.push(reason);
    return op;
  };
  const snapshot = (op) => {
    const f = find(wc, op.slug);
    op.page = structuredClone(f.page);
    op.sectionId = f.section.id;
    op.sectionTitle = f.section.title;
    if (op.type === 'create') {
      const i = f.section.pages.findIndex((p) => p.slug === op.slug);
      op.afterSlug = i > 0 ? f.section.pages[i - 1].slug : null;
    }
  };

  switch (name) {
    case 'search_pages': {
      const terms = fold(input.query).split(/\s+/).filter(Boolean);
      const hits = [];
      for (const s of wc.sections) for (const p of s.pages) {
        const hay = fold(`${p.title} ${p.description} ${p.content}`);
        const score = terms.reduce((n, t) => n + (hay.includes(t) ? 1 + (fold(p.title).includes(t) ? 2 : 0) : 0), 0);
        if (score) hits.push({ score, slug: p.slug, title: p.title, section: s.title, description: p.description });
      }
      hits.sort((a, b) => b.score - a.score);
      return hits.length ? JSON.stringify(hits.slice(0, 10).map(({ score, ...h }) => h)) : 'Không tìm thấy trang nào phù hợp.';
    }
    case 'read_page': {
      const f = find(wc, input.slug);
      if (!f) throw new Error(`Không có trang slug "${input.slug}"`);
      return JSON.stringify({ section_id: f.section.id, section: f.section.title, slug: f.page.slug, title: f.page.title, description: f.page.description, hidden: !!f.page.hidden, content: f.page.content });
    }
    case 'create_section': {
      const id = 'ai-' + slugify(input.title).slice(0, 30) + '-' + Math.random().toString(36).slice(2, 6);
      const sec = { id, title: input.title, description: input.description || '', pages: [] };
      wc.sections.push(sec);
      ops.push({ type: 'create_section', sectionId: id, section: { id, title: sec.title, description: sec.description } });
      return `Đã tạo nhóm. section_id: ${id}`;
    }
    case 'create_page': {
      const sec = wc.sections.find((s) => s.id === input.section_id);
      if (!sec) throw new Error(`Không có nhóm section_id "${input.section_id}"`);
      const slug = uniqueSlug(wc, input.slug || input.title);
      const page = { slug, title: input.title, description: input.description || '', content: input.content || '', updatedAt: now };
      let idx = sec.pages.length;
      if (input.after_slug) {
        const i = sec.pages.findIndex((p) => p.slug === input.after_slug);
        if (i >= 0) idx = i + 1;
      }
      sec.pages.splice(idx, 0, page);
      const op = { type: 'create', slug };
      ops.push(op);
      snapshot(op);
      return `Đã tạo trang (đề xuất). slug: ${slug}`;
    }
    case 'update_page': {
      const f = find(wc, input.slug);
      if (!f) throw new Error(`Không có trang slug "${input.slug}"`);
      const op = ops.find((o) => o.slug === f.page.slug && o.type === 'create') || recordUpdate(f, input.reason);
      for (const k of ['title', 'description', 'content']) if (typeof input[k] === 'string') f.page[k] = input[k];
      f.page.updatedAt = now;
      if (input.section_id && input.section_id !== f.section.id) {
        const target = wc.sections.find((s) => s.id === input.section_id);
        if (!target) throw new Error(`Không có nhóm section_id "${input.section_id}"`);
        f.section.pages.splice(f.index, 1);
        target.pages.push(f.page);
      }
      snapshot(op);
      return 'Đã cập nhật trang (đề xuất).';
    }
    case 'edit_page_text': {
      const f = find(wc, input.slug);
      if (!f) throw new Error(`Không có trang slug "${input.slug}"`);
      const count = f.page.content.split(input.find).length - 1;
      if (count === 0) throw new Error('Không tìm thấy đoạn "find" trong nội dung. Hãy read_page và chép chính xác.');
      if (count > 1) throw new Error(`Đoạn "find" xuất hiện ${count} lần – hãy lấy đoạn dài hơn để chỉ khớp 1 lần.`);
      const op = ops.find((o) => o.slug === f.page.slug && o.type === 'create') || recordUpdate(f, input.reason);
      f.page.content = f.page.content.replace(input.find, () => input.replace);
      f.page.updatedAt = now;
      snapshot(op);
      return 'Đã sửa đoạn văn bản (đề xuất).';
    }
    default:
      throw new Error(`Công cụ không tồn tại: ${name}`);
  }
}

// ------------------------------------------------------------------ gọi Claude API
async function callClaude(ai, body) {
  const url = (ai.baseUrl || 'https://api.anthropic.com').replace(/\/+$/, '') + '/v1/messages';
  let r;
  try {
    r = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': ai.apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout((ai.timeoutSeconds || 300) * 1000),
    });
  } catch (e) {
    throw Object.assign(new Error(`Không kết nối được tới Claude API (${e.name === 'TimeoutError' ? 'quá thời gian chờ' : e.message}). Kiểm tra kết nối internet/proxy.`), { status: 502 });
  }
  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    const msg = data?.error?.message || `HTTP ${r.status}`;
    const hint = r.status === 401 ? ' – API key không hợp lệ, kiểm tra config.json'
      : r.status === 404 ? ' – tên model không đúng, kiểm tra "model" trong config.json'
      : r.status === 429 ? ' – vượt giới hạn tốc độ, thử lại sau ít phút'
      : r.status === 529 || r.status === 503 ? ' – dịch vụ đang quá tải, thử lại sau' : '';
    throw Object.assign(new Error(`Claude API lỗi: ${msg}${hint}`), { status: 502 });
  }
  return data;
}

/** Chuyển hội thoại từ trình duyệt sang định dạng Messages API */
function toApiMessages(history) {
  const msgs = [];
  history.forEach((m, i) => {
    const isLast = i === history.length - 1;
    if (m.role === 'assistant') {
      if (m.text) msgs.push({ role: 'assistant', content: m.text });
      return;
    }
    const content = [];
    (m.images || []).forEach((img, k) => {
      // Chỉ gửi dữ liệu ảnh ở tin nhắn mới nhất để tiết kiệm token; tin cũ chỉ nhắc URL
      const mm = isLast && /^data:(image\/(?:png|jpeg|gif|webp));base64,(.+)$/s.exec(img.data || '');
      if (mm) content.push({ type: 'image', source: { type: 'base64', media_type: mm[1], data: mm[2] } });
      content.push({ type: 'text', text: `[Ảnh ${k + 1}: ${img.url}]${img.name ? ` (tên file: ${img.name})` : ''}` });
    });
    content.push({ type: 'text', text: m.text || '(Không có mô tả – hãy dựa vào ảnh.)' });
    msgs.push({ role: 'user', content });
  });
  // API yêu cầu luân phiên user/assistant – gộp các tin liền nhau cùng vai
  const merged = [];
  for (const m of msgs) {
    const prev = merged[merged.length - 1];
    if (prev && prev.role === m.role) {
      const toArr = (c) => (typeof c === 'string' ? [{ type: 'text', text: c }] : c);
      prev.content = [...toArr(prev.content), ...toArr(m.content)];
    } else merged.push(m);
  }
  while (merged.length && merged[0].role !== 'user') merged.shift();
  return merged;
}

export function aiStatus(config) {
  const ai = config.ai || {};
  return { enabled: !!ai.apiKey, model: ai.model || 'claude-sonnet-5-5' };
}

/**
 * body: { messages: [{role, text, images:[{url, data, name}]}], docs, currentSlug }
 * trả về: { reply, operations, usage }
 */
export async function aiChat(config, body) {
  const ai = { model: 'claude-sonnet-5-5', maxTokens: 16000, maxSteps: 12, ...(config.ai || {}) };
  if (!ai.apiKey) throw Object.assign(new Error('Chưa cấu hình API key cho trợ lý AI (config.json -> ai.apiKey)'), { status: 400 });
  if (!body || !Array.isArray(body.messages) || !body.messages.length) throw Object.assign(new Error('Thiếu nội dung hội thoại'), { status: 400 });
  if (!body.docs || !Array.isArray(body.docs.sections)) throw Object.assign(new Error('Thiếu dữ liệu tài liệu'), { status: 400 });

  const wc = structuredClone(body.docs);
  wc.sections.forEach((s, i) => { if (!s.id) s.id = `section-${i + 1}`; });
  const ops = [];
  const system = systemPrompt(wc, body.currentSlug);
  const messages = toApiMessages(body.messages.slice(-20));
  const usage = { input_tokens: 0, output_tokens: 0 };
  const texts = [];

  for (let step = 0; step < ai.maxSteps; step++) {
    const res = await callClaude(ai, { model: ai.model, max_tokens: ai.maxTokens, system, tools: TOOLS, messages });
    usage.input_tokens += res.usage?.input_tokens || 0;
    usage.output_tokens += res.usage?.output_tokens || 0;
    // Giữ nguyên toàn bộ content (kể cả khối thinking) khi gửi lại trong vòng lặp tool
    messages.push({ role: 'assistant', content: res.content });
    const stepText = res.content.filter((b) => b.type === 'text').map((b) => b.text).join('\n').trim();
    if (stepText) texts.push(stepText);

    const calls = res.content.filter((b) => b.type === 'tool_use');
    if (res.stop_reason !== 'tool_use' || !calls.length) {
      if (res.stop_reason === 'max_tokens') texts.push('_(Câu trả lời bị cắt do vượt giới hạn độ dài – có thể tăng "maxTokens" trong config.json.)_');
      break;
    }
    const results = calls.map((c) => {
      try {
        return { type: 'tool_result', tool_use_id: c.id, content: runTool(c.name, c.input || {}, wc, ops) };
      } catch (e) {
        return { type: 'tool_result', tool_use_id: c.id, content: e.message, is_error: true };
      }
    });
    messages.push({ role: 'user', content: results });
    if (step === ai.maxSteps - 1) texts.push('_(Đã dừng vì đạt số bước tối đa.)_');
  }

  // Lời đáp cuối cùng là đoạn văn bản cuối; các đoạn trước là ghi chú trung gian
  const reply = texts.length ? texts[texts.length - 1] : (ops.length ? 'Tôi đã chuẩn bị các thay đổi bên dưới.' : '');
  return { reply, operations: ops, usage };
}
