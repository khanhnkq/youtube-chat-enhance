# YouTube Custom Chat & Danmaku - Chrome Web Store Listing Metadata

**Last Updated:** 2026-07-22  
**Extension Version:** 1.0.0  
**Manifest Version:** Manifest V3  

---

## 1. Store Metadata

- **Extension Name:** YouTube Custom Chat & Danmaku (Tùy chỉnh Khung Chat YouTube)
- **Short Description:** Tùy chỉnh khung chat YouTube: Nền trong suốt đè video full màn, tùy chỉnh kích thước/vị trí, và chế độ Danmaku (chữ chạy ngang màn hình).
- **Category:** Entertainment / Productivity
- **Language:** Vietnamese (Primary), English

---

## 2. Detailed Description (Mô tả chi tiết)

Nâng cao trải nghiệm xem Livestream và Video trên YouTube với extension tùy chỉnh khung chat đa năng:

✨ **TÍNH NĂNG NỔI BẬT:**
1. **Khung Chat Nổi Trong Suốt Overlays Video:**
   - Hiển thị khung chat ngay trên màn hình video khi bật chế độ Fullscreen (Toàn màn hình) hoặc Theatre Mode.
   - Điều chỉnh độ trong suốt linh hoạt từ trong suốt hoàn toàn (0%) đến trong mờ / kính mờ (Glassmorphism 100%).
2. **Tùy Bổn Vị Trí & Kích Thước (Draggable & Resizable):**
   - Kéo thả di chuyển khung chat đến bất kỳ góc nào trên màn hình.
   - Thay đổi chiều rộng, chiều cao khung chat bằng thao tác kéo chuột góc dưới.
   - Tự động ghi nhớ vị trí và kích thước đã tùy chỉnh cho các lần xem tiếp theo.
3. **Chế Độ Danmaku (Chữ Chạy Ngang Màn Hình):**
   - Đọc tin nhắn live chat và cho chạy chuyển động mượt mà ngang video giống như trên Bilibili / Douyu.
   - Tùy chỉnh tốc độ chạy (4s - 20s), kích thước chữ (14px - 38px), độ mờ chữ và vùng hiển thị (1/3 màn hình, nửa màn hình hoặc full màn).

---

## 3. Permissions Justification (Giải trình quyền)

| Permission / Host Permission | Purpose / Justification |
| --- | --- |
| `storage` | Lưu trữ cấu hình người dùng (vị trí/kích thước khung chat, độ trong suốt, tốc độ Danmaku). |
| `https://www.youtube.com/*` | Nhúng content scripts tùy chỉnh giao diện khung chat và hiển thị Danmaku trên trang YouTube. |

---

## 4. Privacy & Data Disclosures

- **Data Collection:** Extension **KHÔNG** thu thập, ghi lại hoặc gửi bất kỳ thông tin cá nhân hay dữ liệu người dùng nào ra ngoài.
- **Local State:** Tất cả cấu hình giao diện chỉ lưu trực tiếp trong trình duyệt người dùng thông qua `chrome.storage.local`.
