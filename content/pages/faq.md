---
title: "Câu hỏi thường gặp (FAQ)"
description: "Giải đáp 20 tình huống thường gặp khi sử dụng hệ thống QLCH và ứng dụng One Nova."
updated: 2026-11-03
---

## Đồng bộ cuộc họp và mã cuộc họp

### 1. Tôi đã tạo cuộc họp trên Outlook nhưng chưa thấy trên QLCH hoặc One Nova. Cần kiểm tra gì?

Kiểm tra tài khoản thư điện tử của người mời họp đã được khai báo trên QLCH chưa và cuộc họp có được tạo bằng tài khoản đó không (xem [Điều kiện đồng bộ cuộc họp](/docs/dieu-kien-dong-bo-cuoc-hop)). QLCH kiểm tra Outlook định kỳ 5 phút/lần; cuộc họp có thể chưa hiển thị ngay. Nếu vẫn chưa thấy sau chu kỳ kiểm tra, liên hệ bộ phận phụ trách hệ thống.

### 2. Thông tin cuộc họp thay đổi thì tôi cập nhật ở đâu?

Cập nhật lịch họp, thành phần hoặc chương trình họp trên **Outlook** — nguồn thông tin cuộc họp. QLCH tự động đồng bộ và cập nhật dữ liệu định kỳ 5 phút/lần. Nếu người mời họp muốn đồng bộ ngay thì nhấn nút **“Đồng bộ dữ liệu webhook”**. Sau đó kiểm tra lại thông tin trên QLCH; người tham gia theo dõi thông báo cập nhật trên One Nova.

### 3. Nếu tôi muốn đồng bộ cuộc họp mới tạo trên Outlook mà không cần đợi 5 phút thì sao?

Vào mục **“Meeting Sync”** để đồng bộ thủ công cuộc họp mới về QLCH.

### 4. Tại sao cuộc họp định kỳ chưa có mã? Nếu cần gửi chương trình họp sớm thì làm thế nào?

Cuộc họp định kỳ được tự động tạo mã trước 24 giờ so với thời điểm diễn ra. Nếu cần mã sớm hơn, người mời họp chọn **“Tạo mã cuộc họp”**. Với cuộc họp phát sinh/hội ý nhanh, mã được tạo khi cuộc họp đồng bộ từ Outlook về QLCH. Xem [Lấy mã cuộc họp để cập nhật Agenda](/docs/lay-ma-cuoc-hop-cap-nhat-agenda).

### 5. Đã có mã cuộc họp trên QLCH, tôi có cần cập nhật chương trình họp không?

**Có.** Người mời họp sao chép “Mã cuộc họp”, cập nhật vào tệp chương trình họp (Agenda), sau đó vào Outlook gửi lại chương trình họp cho người tham gia. Việc có mã trên QLCH không thay thế bước cập nhật tệp chương trình họp.

## Phê duyệt vắng mặt

### 6. Người chủ trì và Người được ủy quyền có phải là cùng một người không?

Đối với cuộc họp thông thường, “Người chủ trì” và “Người được ủy quyền” là cùng một người; người mời họp phải chọn người cho 2 trường này giống nhau. Tuy nhiên, đối với cuộc họp có chủ tịch thì chỉ định một [người được ủy quyền](/docs/chi-dinh-nguoi-duoc-uy-quyen) là “người được ủy quyền”.

### 7. Tôi đã gửi báo vắng thì có được xem là vắng có phép ngay không?

**Chưa.** Khi mới gửi, yêu cầu ở trạng thái “Chờ duyệt báo vắng”. Chỉ khi người phê duyệt chấp thuận, trạng thái mới là “Vắng mặt có phép”. Người tham gia kiểm tra kết quả tại màn hình chi tiết cuộc họp trên One Nova.

### 8. Tôi cần báo vắng hoặc người phê duyệt cần xử lý yêu cầu thì thao tác ở đâu?

Người tham gia chọn **“Báo vắng”** tại chi tiết cuộc họp trên One Nova, nhập lý do, đính kèm minh chứng nếu cần và chọn **“Xác nhận”**; cần gửi trước thời gian bắt đầu cuộc họp. Người phê duyệt xem thông báo trên Microsoft Teams và chọn **“Duyệt phép”** hoặc **“Từ chối”** (hoặc [xử lý trên One Nova](/docs/phe-duyet-vang-mat-qua-one-nova)).

### 9. Người phê duyệt được chỉ định chưa phù hợp. Người mời họp có thể chuyển yêu cầu cho người khác không?

**Có**, với yêu cầu ở trạng thái “Chờ phê duyệt” hoặc “Chờ chỉ định người duyệt”. Người mời họp chọn yêu cầu trong danh sách yêu cầu vắng mặt, chọn **“Đổi người duyệt”**, chọn người mới và xác nhận. Yêu cầu được chuyển đến người mới; các yêu cầu khác không bị ảnh hưởng.

### 10. Yêu cầu báo vắng đã được duyệt hoặc bị từ chối có đổi người duyệt được không?

Chức năng đổi người duyệt chỉ áp dụng cho yêu cầu “Chờ phê duyệt” hoặc “Chờ chỉ định người duyệt”. Hướng dẫn hiện chưa có thao tác đổi người duyệt đối với yêu cầu đã xử lý; nếu cần điều chỉnh, liên hệ bộ phận phụ trách hệ thống.

## Điểm danh

### 11. Tôi cần tìm cuộc họp và điểm danh trên One Nova như thế nào?

Chọn **“Lịch họp”** để xem các nhóm Đang diễn ra, Sắp diễn ra hoặc Đã kết thúc. Mở cuộc họp cần tham gia, chọn **“Điểm danh”**, chọn hình thức tham gia và thực hiện xác thực khuôn mặt. Hệ thống ghi nhận thời gian điểm danh thực tế.

### 12. Cuộc họp bắt đầu muộn nhưng người tham gia bị ghi nhận vào trễ thì xử lý thế nào?

Người mời họp nhập **“Thời gian bắt đầu thực tế”** tại màn hình chi tiết cuộc họp và xác nhận lưu, làm cơ sở kiểm tra các trường hợp bị ghi nhận “Vào trễ”. Cần kiểm tra lại kết quả và liên hệ bộ phận phụ trách nếu còn vướng mắc. Xem [Cập nhật thời gian họp thực tế](/docs/cap-nhat-thoi-gian-hop-thuc-te).

### 13. One Nova hiển thị “Quá hạn điểm danh”, tôi cần làm gì?

Chọn lý do vào trễ có sẵn hoặc nhập lý do khác, sau đó chọn **“Giải trình”**. Hệ thống lưu thông tin để người mời họp theo dõi. Hướng dẫn hiện không nêu việc gửi giải trình sẽ tự động xoá trạng thái vào trễ.

## Xác nhận tuân thủ

### 14. Người mời họp đã đóng yêu cầu xác nhận tuân thủ. Có bật lại để người chưa phản hồi xác nhận không?

**Không.** Yêu cầu chỉ được bật một lần và không thể bật lại sau khi đã đóng. Khi đóng yêu cầu, người chưa phản hồi bị ghi nhận vi phạm xác nhận tuân thủ. Vì vậy, người mời họp cần kiểm tra tình trạng phản hồi trước khi đóng.

### 15. Tôi chưa hiểu nội dung được phổ biến thì nên xác nhận như thế nào?

Không xác nhận đã hiểu khi còn chưa rõ. Chọn **“Chưa nắm rõ, cần phổ biến lại”** trên giao diện và đề nghị người mời họp phổ biến lại. Xem [Xác nhận tuân thủ phổ biến hướng dẫn](/docs/xac-nhan-tuan-thu-pho-bien-huong-dan).

### 16. Người mời họp đã chọn “Xác nhận đã phổ biến lại” thì người tham gia có cần xác nhận nữa không?

**Có.** Nhãn “Đã phổ biến lại” chỉ ghi nhận thao tác của người mời họp, không thay thế xác nhận đã hiểu của người tham gia. Sau khi được phổ biến lại, người tham gia cần thực hiện [xác nhận trên One Nova](/docs/xac-nhan-da-duoc-pho-bien-lai).

### 17. Người mời họp muốn kiểm tra ai đã phản hồi và lịch sử phổ biến lại thì xem ở đâu?

Mở tab **“Điểm danh”**. Tại người tham gia cần tra cứu, chọn biểu tượng thao tác rồi chọn **“Xem lịch sử”**. Hệ thống hiển thị lịch sử xác nhận tuân thủ, gồm các lần khởi tạo, phản hồi và phổ biến lại thông tin.

## Biên bản họp

### 18. Nhập xong biên bản và bấm “Lưu” thì công việc đã được đồng bộ sang E-Office chưa?

**Chưa.** Bước “Lưu” dùng để lưu nội dung đã nhập. Danh sách công việc được đồng bộ lên E-Office **sau khi Biên bản họp được duyệt**.

### 19. Trước khi gửi duyệt biên bản, thư ký cuộc họp cần hoàn tất những thông tin nào? Sau khi duyệt có kết quả gì?

Tại tab **“Biên bản họp”**, hoàn tất nội dung, hiện trạng/khó khăn, giải pháp, chỉ đạo, người chịu trách nhiệm và ngày hoàn thành; kiểm tra rồi chọn **“Gửi phê duyệt”**. Hệ thống gửi thông báo đến người chủ trì. Sau khi được duyệt, công việc được đồng bộ lên E-Office và hệ thống tạo tệp PDF tại “Tài liệu liên quan”, chờ xuất bản.

### 20. Biên bản đã được duyệt thì người tham gia đã nhận được chưa? Có thể gửi nhiều tệp cùng lúc không?

Biên bản được duyệt **vẫn chờ xuất bản**. Thư ký cuộc họp chọn tệp Biên bản đã trình ký, chọn hoặc tải thêm tệp cần gửi, rồi chọn **“Xuất bản & gửi mail”**. Hệ thống xuất bản trên One Nova và gửi thư đến người được mời. Chỉ hỗ trợ tải lên PDF; có thể chọn nhiều tệp PDF để gửi trong một thư duy nhất.
