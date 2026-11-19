# Website hướng dẫn sử dụng hệ thống QLCH

Website tài liệu hướng dẫn sử dụng **Hệ thống Quản lý cuộc họp và Điểm danh trên One Nova** – bố cục 3 cột (menu – nội dung – mục lục), tìm kiếm nhanh (Ctrl+K, gõ không dấu), giao diện sáng/tối.

- **Website tĩnh** dựng bằng React 19 + Vite 7 – không cần máy chủ, không có trang quản trị.
- **Nội dung nằm trong code**: mỗi trang là một file Markdown trong `content/pages/`. Tạo/sửa trang = sửa file rồi commit lên git.

---

## 1. Chạy trên máy

Yêu cầu: [Node.js](https://nodejs.org) **20.19+**.

```bash
npm install      # lần đầu
npm run dev      # http://localhost:5173 – sửa nội dung là trang tự cập nhật
```

Windows: nhấp đúp `dev.bat`.

## 2. Build & triển khai

```bash
npm run build    # tạo thư mục dist/
npm run preview  # xem thử bản build tại http://localhost:4173
```

Thư mục `dist/` là website tĩnh hoàn chỉnh – chép lên bất kỳ web server nào (IIS, Nginx, Apache, SharePoint/Azure Static Web Apps, GitHub Pages…). Mỗi trang đã có sẵn file `dist/docs/<slug>/index.html` nên **không cần cấu hình rewrite**.

> Website cần được đặt ở **gốc tên miền** (ví dụ `https://huongdan.congty.vn/`), vì ảnh và liên kết dùng đường dẫn bắt đầu bằng `/`.

---

## 3. Cấu trúc nội dung

```
content/
├── site.json            Tên website, logo, màu chủ đạo, nội dung trang chủ
├── nav.json             Các nhóm trên menu trái và THỨ TỰ các trang
└── pages/
    ├── gioi-thieu.md    Mỗi trang 1 file – tên file = đường dẫn /docs/gioi-thieu
    └── ...
public/
└── uploads/<slug>/      Ảnh minh hoạ của từng trang
```

### Thêm một trang mới

1. Tạo `content/pages/<slug>.md` (slug: chữ thường không dấu, nối bằng `-`).
2. Thêm `<slug>` vào mảng `pages` của nhóm phù hợp trong `content/nav.json` (vị trí trong mảng = thứ tự trên menu).
3. Đặt ảnh vào `public/uploads/<slug>/`.
4. `npm run build` – bước build sẽ **báo lỗi** nếu `nav.json` trỏ tới trang không tồn tại, và **cảnh báo** liên kết `/docs/...` hỏng, ảnh thiếu, hoặc file `.md` chưa được đưa vào menu.

Chi tiết cú pháp và bố cục chuẩn: xem [`HUONG-DAN-SOAN-NOI-DUNG.md`](HUONG-DAN-SOAN-NOI-DUNG.md).

---

## 4. Cấu trúc mã nguồn

```
src/
├── main.jsx, App.jsx
├── lib/
│   ├── content.js        Nạp content/ (site.json, nav.json, pages/*.md)
│   ├── frontmatter.js    Đọc phần đầu file .md (title, description, updated)
│   ├── markdown.js       Chuyển Markdown -> HTML (kèm :::steps, :::note, :::cards…)
│   ├── search.js         Tìm kiếm không dấu
│   └── router.jsx        Điều hướng trang
├── components/           Topbar, Sidebar, Toc, SearchModal, Markdown, Lightbox…
├── pages/                DocsLayout, HomePage, DocPage, NotFound
└── styles/docs.css
vite.config.js            Kiểm tra nội dung + tạo trang tĩnh khi build
```
