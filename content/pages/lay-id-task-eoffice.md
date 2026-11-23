---
title: "Lấy ID task, ID project trên E-Office"
description: "Lấy ID task hoặc ID project trên E-Office để khai báo vào cột “ID task cha”, “ID project” hoặc “Link task EOffice” trong tab Biên bản họp, giúp nội dung chỉ đạo được gắn đúng task/project."
updated: 2026-11-20
---

## Khi nào nhập vào cột nào?

Mỗi nội dung chỉ đạo trong tab **“Biên bản họp”** có thể gắn với E-Office theo 1 trong 3 cách:

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
4. Dán ID vào cột tương ứng (**“ID task cha”** hoặc **“Link task EOffice”**) trong tab **“Biên bản họp”**.
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
4. Dán ID vào cột **“ID project”** trong tab **“Biên bản họp”**.
:::

![ID project nằm trên đường dẫn](/uploads/lay-id-task-eoffice/id-project-tren-url.png "ID project là dãy số sau ID= trên đường dẫn project, ví dụ: 10247")

Ví dụ: đường dẫn `https://eoffice.novagroup.vn/apps/work-project-project/view?ID=10247&name=visual-work&tab=work` → ID project là **10247**.

:::note Không dùng mã dự án
ID project là số trên **đường dẫn**, không phải mã đứng trước tên dự án (ví dụ “3491 - Nghiệp vụ thư ký” có mã 3491, nhưng ID project là 10247).
:::

## Nhập ID vào Biên bản họp

Sau khi đã lấy được ID task hoặc ID project, nhập ID vào **1 trong 3 cột** tương ứng trên dòng chỉ đạo trong Biên bản họp.

:::steps
1. Trên QLCH, mở **chi tiết cuộc họp** và chọn tab **“Biên bản họp”**.
2. Tại dòng nội dung chỉ đạo cần gắn với E-Office, kéo thanh cuộn ngang sang phải đến 3 cột **“ID task cha”**, **“ID Project”** và **“Link task EOffice”**.
3. Dán ID vào **một** cột phù hợp (xem bảng [Khi nào nhập vào cột nào?](#khi-nao-nhap-vao-cot-nao)): ID task nhập vào **“ID task cha”** (tạo task con) hoặc **“Link task EOffice”** (cập nhật task đã có); ID project nhập vào **“ID Project”**.
4. Sau khi nhập, 2 cột còn lại tự động bị khóa. Hoàn tất các thông tin khác của dòng chỉ đạo và **lưu** biên bản họp.
:::

![3 cột nhập ID trong tab Biên bản họp](/uploads/lay-id-task-eoffice/nhap-id-bien-ban-hop.png "3 cột “ID task cha”, “ID Project” và “Link task EOffice” nằm ở cuối bảng Biên bản họp")

:::tip Không thấy 3 cột?
Bảng Biên bản họp có nhiều cột; dùng thanh cuộn ngang bên dưới bảng để kéo sang phải đến cuối bảng.
:::

:::note Thời điểm công việc được đồng bộ
Nhập ID và lưu chưa đồng bộ ngay sang E-Office. Công việc chỉ được đồng bộ **sau khi Biên bản họp được duyệt** (xem [Gửi duyệt Biên bản họp](/docs/gui-duyet-bien-ban-hop)).
:::
