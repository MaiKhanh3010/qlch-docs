# Website hướng dẫn sử dụng hệ thống QLCH (React + Vite)

Website tài liệu hướng dẫn sử dụng hệ thống **Quản lý cuộc họp & Tham gia họp**, bố cục 3 cột (menu – nội dung – mục lục), tìm kiếm nhanh (Ctrl+K), sáng/tối, và **trang quản trị** để tự thêm tính năng mới, tải ảnh minh hoạ.

- Frontend: **React 19 + Vite 7** (không dùng thư viện UI/router ngoài)
- Backend: Node.js thuần (`server/api.js`) – lưu nội dung vào `data/docs.json`, ảnh vào `uploads/`
- **Trợ lý AI (Claude)** trong trang quản trị: mô tả tính năng + gửi ảnh → AI soạn nội dung, sắp xếp bố cục, tạo trang mới và sửa các trang liên quan
- Nội dung ban đầu: 36 trang, 31 ảnh màn hình lấy từ file *Hướng dẫn sử dụng hệ thống QLCH (03/09/2026)*

---

## 1. Cài đặt & chạy

**Yêu cầu:** [Node.js](https://nodejs.org) **20.19+** (khuyên dùng bản LTS mới nhất).

```bash
npm install        # cài thư viện (chỉ lần đầu)
npm run dev        # chế độ phát triển  -> http://localhost:5173
```

`npm run dev` chạy Vite **kèm luôn API** (đã gắn vào Vite qua plugin trong `vite.config.js`), nên chỉ cần một lệnh. Sửa code React sẽ tự cập nhật ngay trên trình duyệt (HMR).

### Chạy bản chính thức (production)

```bash
npm run build      # build ra thư mục dist/
npm start          # máy chủ Node phục vụ dist/ + API -> http://localhost:3000
```

Trên Windows có thể nhấp đúp: `dev.bat` (phát triển) hoặc `start.bat` (cài + build + chạy).

| Địa chỉ | Mô tả |
|---|---|
| `/` | Trang chủ tài liệu |
| `/docs/<slug>` | Một trang hướng dẫn |
| `/admin` | Trang quản trị – mật khẩu mặc định **`admin123`** |

> ⚠️ Đổi mật khẩu trong `config.json` (`adminPassword`) rồi khởi động lại.
> Đổi cổng production: `port` trong `config.json` hoặc biến môi trường `PORT`.

---

## 2. Thêm / sửa hướng dẫn cho tính năng mới

1. Vào `/admin`, đăng nhập.
2. Bấm **+ Trang** trong nhóm phù hợp (hoặc **+ Nhóm**).
3. Nhập tiêu đề, mục đích; soạn nội dung bên trái, xem trước bên phải. Trang mới có sẵn mẫu *Ảnh → Cách thực hiện → Kết quả → Lưu ý*.
4. **Ảnh minh hoạ:** bấm **🖼 Ảnh**, kéo thả ảnh vào ô soạn thảo, hoặc chụp màn hình rồi **Ctrl+V**. Ảnh lưu vào `uploads/<slug>/`; ảnh đầu tiên tự thay vào dòng ảnh mẫu.
5. **Lưu thay đổi** (Ctrl+S) – website cập nhật ngay, không cần build lại.

Ngoài ra: kéo thả để sắp xếp/chuyển nhóm, ẩn trang (bản nháp), **Cài đặt website** (tên, logo, màu chủ đạo, trang chủ).

### Cú pháp soạn thảo

```markdown
## Tiêu đề mục
**đậm**  *nghiêng*  ==tô sáng==  [liên kết](/docs/slug-trang)

![Mô tả ảnh](/uploads/thu-muc/anh.png "Chú thích dưới ảnh")

:::steps
1. Bước một
2. Bước hai
:::

:::note            (hoặc :::tip  :::warning  :::info  :::success)
Nội dung lưu ý
:::

:::cards
- [Tên trang](/docs/slug) Mô tả ngắn
:::

:::columns
### Cột 1
+++
### Cột 2
:::
```

---

## 3. Trợ lý AI soạn thảo

### Bật trợ lý

1. Tạo API key tại <https://console.anthropic.com> → **API Keys** (cần nạp credit; tính phí theo lượng sử dụng).
2. Điền vào `config.json`:

   ```json
   "ai": {
     "apiKey": "sk-ant-...",
     "model": "claude-sonnet-5-5",
     "maxTokens": 16000
   }
   ```

   Hoặc không ghi vào file mà đặt biến môi trường `ANTHROPIC_API_KEY` (an toàn hơn nếu đưa code lên Git).
3. Tắt và chạy lại `npm run dev` / `npm start`.

| Tuỳ chọn | Ý nghĩa |
|---|---|
| `model` | `claude-sonnet-5-5` (mặc định – nhanh, chi phí hợp lý) hoặc `claude-opus-5-5` (chất lượng cao hơn, đắt hơn) |
| `maxTokens` | Độ dài tối đa mỗi lượt trả lời |
| `maxSteps` | Số bước công cụ tối đa mỗi yêu cầu (mặc định 12) |
| `baseUrl` | Đổi khi đi qua proxy/cổng API nội bộ (mặc định `https://api.anthropic.com`) |

### Cách dùng

Trong `/admin`, bấm **✨ Trợ lý AI** (góc trên) để mở khung chat bên phải.

- **Tạo trang mới:** bấm gợi ý *“Tạo trang cho tính năng mới”*, điền tên tính năng, vai trò, các bước… rồi đính kèm ảnh chụp màn hình (📎, kéo thả, hoặc Ctrl+V). AI đọc chữ trên ảnh, chọn nhóm phù hợp, soạn theo bố cục chuẩn và đặt ảnh vào đúng chỗ.
- **Sửa trang:** mở trang trong trình soạn thảo, giữ tick *“Dựa trên trang đang mở”*, rồi yêu cầu, ví dụ: *“Thêm lưu ý: chỉ Thư ký mới thấy nút này”*, *“Viết lại phần các bước cho ngắn gọn”*.
- **Sửa các trang liên quan:** ví dụ *“Tính năng báo vắng giờ cho phép gửi sau khi họp bắt đầu 15 phút – cập nhật tất cả trang liên quan”*. AI tự tìm và đề xuất sửa từng trang.

Mỗi thay đổi hiện thành một **thẻ đề xuất**: *Xem trước* (giao diện trang hoặc *So sánh* trước/sau) → *Áp dụng* / *Bỏ qua*, hoặc *Áp dụng tất cả*. Áp dụng chỉ đưa vào bản nháp – bấm **Lưu thay đổi** để xuất bản.

> - AI được hướng dẫn **không bịa** tên nút/quy tắc ngoài mô tả và ảnh; nếu thiếu thông tin nó sẽ hỏi lại. Vẫn nên đọc lại trước khi lưu.
> - Ảnh gửi trong chat được lưu tại `uploads/ai-anh/` và được gửi tới Claude API để phân tích – không gửi ảnh chứa dữ liệu nhạy cảm nếu chính sách nội bộ không cho phép.
> - Chi phí tham khảo: mỗi yêu cầu tạo trang kèm 2–3 ảnh thường tốn vài chục nghìn token (xem số token dưới mỗi câu trả lời).

---

## 4. Cấu trúc dự án

```
qlch-docs/
├── index.html               Điểm vào của Vite
├── vite.config.js           Cấu hình Vite + plugin gắn API vào dev server
├── config.json              Cổng, mật khẩu quản trị, giới hạn ảnh
├── server/
│   ├── api.js               API: /api/docs, /api/login, /api/upload… + phục vụ /uploads
│   ├── ai.js                Trợ lý AI: gọi Claude API, công cụ đọc/tìm/tạo/sửa trang
│   └── index.js             Máy chủ production (dist/ + API)
├── data/
│   ├── docs.json            TOÀN BỘ nội dung (nhóm, trang, cài đặt site)
│   └── backups/             Tự sao lưu mỗi lần lưu (giữ 30 bản)
├── uploads/                 Ảnh minh hoạ – mỗi trang một thư mục
├── public/                  File tĩnh (favicon)
└── src/
    ├── main.jsx, App.jsx    Khởi động & điều hướng (trang tài liệu / quản trị)
    ├── lib/                 markdown.js, router.jsx, api.js, search.js, docs-context.jsx, ui.js
    ├── components/          Topbar, Sidebar, Toc, SearchModal, Markdown, Lightbox…
    ├── pages/               DocsLayout, HomePage, DocPage, NotFound
    ├── admin/               AdminApp, Workspace, Tree, Editor, MediaPanel, SettingsDialog…
    │   └── ai/              AiPanel (khung chat), OpCard (thẻ đề xuất, xem trước/so sánh), apply.js
    └── styles/              docs.css, admin.css, ai.css
```

- Trang quản trị được tách gói (lazy load) – người xem tài liệu không phải tải phần này.
- **Sao lưu / chuyển máy:** sao chép `data/` và `uploads/`.
- **Khôi phục bản cũ:** dừng server, chép một file trong `data/backups/` đè lên `data/docs.json`.

## 5. API

| Phương thức | Đường dẫn | Mô tả |
|---|---|---|
| GET | `/api/docs` | Lấy toàn bộ nội dung |
| GET | `/api/me` | Kiểm tra đã đăng nhập |
| POST | `/api/login` / `/api/logout` | Đăng nhập / đăng xuất |
| PUT | `/api/docs` | Lưu nội dung *(cần đăng nhập)* |
| POST | `/api/upload` | Tải ảnh `{folder, filename, data: dataURL}` *(cần đăng nhập)* |
| GET / DELETE | `/api/uploads?folder=` / `?path=` | Liệt kê / xoá ảnh *(cần đăng nhập)* |
| GET | `/api/ai/status` | Trợ lý AI đã bật chưa *(cần đăng nhập)* |
| POST | `/api/ai/chat` | Gửi hội thoại `{messages, docs, currentSlug}` → `{reply, operations}` *(cần đăng nhập)* |

## 6. Triển khai lên máy chủ nội bộ

```bash
npm ci && npm run build
npm i -g pm2
pm2 start server/index.js --name qlch-docs
pm2 save
```

Nên đặt sau reverse proxy (IIS/Nginx) có HTTPS nếu truy cập từ ngoài mạng nội bộ.
