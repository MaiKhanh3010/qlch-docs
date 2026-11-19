# Hướng dẫn soạn nội dung

## Mẫu một trang tính năng

File `content/pages/<slug>.md`:

```markdown
---
title: "Tên tính năng"
description: "Mục đích – 1 đến 2 câu ngắn gọn, nói tính năng giúp làm gì."
updated: 2026-11-19
---

![Mô tả ảnh](/uploads/<slug>/man-hinh.png "Chú thích dưới ảnh")

## Các bước thực hiện

:::steps
1. Mở **Chi tiết cuộc họp**.
2. Tại trường **“Tên trường”**, chọn …
3. Nhấn **“Tên nút”**.
:::

## Kết quả

- Hệ thống …

:::note
Điều kiện hoặc giới hạn cần lưu ý.
:::
```

Quy ước:

- Tên nút/trường/tab: **in đậm** và đặt trong ngoặc kép “…”.
- Thuật ngữ: **người mời họp**, **người tham gia**, **người chủ trì**, **One Nova** (có dấu cách), **QLCH**, **E-Office**.
- Kết quả ngắn 1–2 câu dùng khối `:::success`; nhiều trạng thái dùng bảng.
- Thao tác không hoàn tác được dùng `:::warning`; mẹo dùng `:::tip`.
- Liên kết sang trang khác: `[Tên trang](/docs/slug)`; tới một mục: `/docs/faq#ten-muc`.

## Cú pháp hỗ trợ

| Cú pháp | Kết quả |
|---|---|
| `## Tiêu đề` / `### Tiêu đề phụ` | Tiêu đề mục (hiện ở mục lục bên phải) |
| `**đậm**` `*nghiêng*` `==tô sáng==` `` `mã` `` | Định dạng chữ |
| `- mục` / `1. mục` | Danh sách |
| `![alt](/uploads/x.png "Chú thích")` (riêng một dòng) | Ảnh có khung + chú thích, bấm để phóng to |
| `\| a \| b \|` | Bảng |
| `:::steps` … `:::` | Danh sách các bước có đánh số dạng timeline |
| `:::note [tiêu đề]` / `:::tip` / `:::warning` / `:::info` / `:::success` | Khung thông báo |
| `:::cards` + `- [Tên](/docs/slug) Mô tả` | Lưới thẻ liên kết |
| `:::columns` … `+++` … `:::` | Chia cột |

## Nhóm trên menu (`content/nav.json`)

```json
{
  "sections": [
    {
      "id": "nguoi-moi-hop-quan-ly",
      "title": "Người mời họp · Quản lý cuộc họp",
      "description": "Mô tả hiển thị ở trang chủ",
      "pages": ["tong-quan-chuc-nang-nguoi-moi-hop", "xem-danh-sach-cuoc-hop"]
    }
  ]
}
```
