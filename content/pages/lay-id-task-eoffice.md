---
title: "Lấy ID task, ID project trên E-Office"
description: "Lấy ID task hoặc ID project trên E-Office để khai báo vào cột “ID task cha”, “ID project” hoặc “Link task EOffice” trong tab BBH, giúp nội dung chỉ đạo được gắn đúng task/project."
updated: 2026-11-20
---

## Khi nào nhập vào cột nào?

Mỗi nội dung chỉ đạo trong tab **“BBH”** có thể gắn với E-Office theo 1 trong 3 cách:

| Cột | Nhập khi muốn… | Loại ID cần lấy |
|---|---|---|
| **“ID task cha”** | Tạo task theo chỉ đạo là **task con** của một task đã có trên E-Office. | ID task |
| **“ID project”** | Tạo task theo chỉ đạo trong cuộc họp là task **thuộc một project đã có sẵn**. | ID project |
| **“Link task EOffice”** | Khai báo chỉ đạo này gắn với **task đã tồn tại**; nội dung chỉ đạo dùng để **cập nhật** cho task đó (không tạo task mới). | ID task |

:::warning Chỉ nhập 1 trong 3 cột
Khi đã nhập dữ liệu vào một cột, hệ thống tự động **khóa 2 cột còn lại**. Muốn đổi sang cột khác, xóa dữ liệu ở cột đã nhập trước.
:::

## Lấy ID task

Dùng cho cột **“ID task cha”** và **“Link task EOffice”**.

:::steps
1. Vào **E-Office**, mở task đã tồn tại.
2. Nếu task đang mở dạng cửa sổ nổi, nhấn **“Chi tiết”** → **“Xem chi tiết”** để mở trang chi tiết task.
3. Trên thanh địa chỉ, lấy dãy số sau `ID=` trong đường dẫn task.
4. Dán ID vào cột tương ứng (**“ID task cha”** hoặc **“Link task EOffice”**) trong tab **“BBH”**.
:::

![Mở trang chi tiết task từ cửa sổ nổi](/uploads/lay-id-task-eoffice/xem-chi-tiet-task.png "Nhấn “Chi tiết” → “Xem chi tiết” để mở trang chi tiết task")

![ID task nằm trên đường dẫn](/uploads/lay-id-task-eoffice/id-task-tren-url.png "ID task là dãy số sau ID= trên đường dẫn, ví dụ: 2167285")

Ví dụ: đường dẫn `https://eoffice.novagroup.vn/apps/work-normal-normal/view?ID=2167285` → ID task là **2167285**.

:::note Không dùng “Mã công việc”
ID task là số trên **đường dẫn**, không phải trường **“Mã công việc”** hiển thị trong trang (ví dụ trên ảnh: ID task là 2167285, còn Mã công việc là 599811).
:::

## Lấy ID project

Dùng cho cột **“ID project”**. Cách lấy tương tự như ID task.

:::steps
1. Vào **E-Office**, chọn **“Dự án”** ở menu bên trái.
2. Mở project cần gắn task.
3. Trên thanh địa chỉ, lấy dãy số sau `ID=` (trước dấu `&`) trong đường dẫn project.
4. Dán ID vào cột **“ID project”** trong tab **“BBH”**.
:::

![ID project nằm trên đường dẫn](/uploads/lay-id-task-eoffice/id-project-tren-url.png "ID project là dãy số sau ID= trên đường dẫn project, ví dụ: 10247")

Ví dụ: đường dẫn `https://eoffice.novagroup.vn/apps/work-project-project/view?ID=10247&name=visual-work&tab=work` → ID project là **10247**.

:::note Không dùng mã dự án
ID project là số trên **đường dẫn**, không phải mã đứng trước tên dự án (ví dụ “3491 - Nghiệp vụ thư ký” có mã 3491, nhưng ID project là 10247).
:::
