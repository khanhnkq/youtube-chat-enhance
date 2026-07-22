# YouTube Chat Enhance 🚀

> **Chrome Extension (Manifest V3)** giúp nâng tầm trải nghiệm xem Livestream và Video trên YouTube với Khung Chat Nổi Trong Suốt, Tùy Biến Vị Trí/Kích Thước và Chế Độ Chữ Chạy Ngang Màn Hình (Danmaku).

---

## ✨ Tính Năng Nổi Bật (Features)

### 1. 💬 Khung Chat Nổi Trong Suốt (Transparent Floating Chat)
- **Hiển thị trực tiếp đè lên màn hình video** ở cả chế độ Toàn màn hình (Fullscreen) và Chế độ rạp phim (Theatre Mode).
- **Không đường viền & Nền trong suốt (Frameless Overlay):** Giao diện tinh gọn 100%, bỏ các thanh header đen và các đường viền che khuất video.
- **Tự động hiện công cụ khi rê chuột (Hover to Type):** 
  - Bình thường chỉ có luồng chữ nổi trong suốt đè lên video.
  - Khi rê chuột vào khung chat, **ô nhập tin nhắn (Input Panel)**, thanh kéo di chuyển và góc co giãn sẽ tự động hiện lên mượt mà (`opacity: 1`) giúp bạn gõ bình luận hoặc thả SuperChat.

### 2. 🎛️ Bộ Tùy Chỉnh Giao Diện Linh Hoạt (Realtime Control Panel)
- **Kéo thả di chuyển (Draggable):** Nắm giữ thanh tiêu đề để kéo khung chat tới bất kỳ vị trí nào trên màn hình.
- **Tùy chỉnh kích thước (Resizable):** Kéo góc dưới bên phải để mở rộng hoặc thu hẹp khung chat.
- **Nút thu nhỏ tinh gọn (`Live Chat`):** Bấm nút `-` để thu nhỏ khung chat thành một **Floating Badge (Nút nổi nhỏ `Live Chat`)** bo tròn góc màn hình. Bấm vào chữ `Live Chat` để mở lại khung chat đầy đủ bất kỳ lúc nào.
- **Bộ chọn màu sắc (Color Pickers):** Tự do thay đổi màu tên người dùng (`Author Color`), màu nội dung tin nhắn (`Message Text Color`) và màu chữ Danmaku.
- **Thanh trượt Opacity (0% - 100%):** Tùy chỉnh độ trong suốt nền khung chat.
- **Thanh trượt Cỡ chữ (11px - 24px):** Điều chỉnh cỡ chữ trong khung chat trực tiếp.

### 3. 🎆 Chế Độ Danmaku (Bullet Screen Comment)
- **Chữ chạy ngang màn hình:** Đọc tin nhắn live chat và hiển thị dòng chữ chạy ngang video từ phải sang trái mượt mà 60fps tương tự các nền tảng Bilibili / Douyu / Huya.
- **Thuật toán chia dòng (Track Management):** Tính toán dòng tự động giúp các bình luận chạy ngang không bao giờ đè chồng lên nhau.
- **Tùy chỉnh Danmaku:** Điều chỉnh tốc độ chạy (4s - 20s), kích thước chữ (14px - 38px), độ mờ chữ và vùng màn hình hiển thị (1/3 màn hình, nửa màn hình hoặc toàn màn hình).

### ⚡ 4. Tối Ưu Hiệu Năng Siêu Tốc (Zero-Lag Performance)
- **Tái sử dụng trực tiếp iframe chính chủ:** Nhúng trực tiếp URL live chat chính thức của YouTube theo Video ID, triệt tiêu 100% hiện tượng tải trùng lặp iframe.
- **Không sử dụng `backdrop-filter` ngốn GPU:** Loại bỏ các thuộc tính làm mờ nặng máy, đảm bảo video YouTube luôn phát mượt mà 60fps.
- **Pure Event-Driven:** Không chạy bất kỳ vòng lặp `setInterval` hay `MutationObserver` nặng máy trên `document.body`.

---

## 📦 Hướng Dẫn Cài Đặt (Installation)

1. **Tải mã nguồn dự án:**
   ```bash
   git clone https://github.com/khanhnkq/youtube-chat-enhance.git
   ```
2. **Nạp tiện ích vào trình duyệt Google Chrome (hoặc Brave / Edge):**
   - Mở trình duyệt và truy cập trang quản lý tiện ích: `chrome://extensions/`
   - Bật công tắc **Chế độ dành cho nhà phát triển (Developer mode)** ở góc trên bên phải.
   - Bấm nút **Tải tiện ích đã giải nén (Load unpacked)**.
   - Chọn thư mục dự án `youtube-chat-enhance`.
3. **Thưởng thức:** Mở bất kỳ trang YouTube Livestream nào và mở Popup Extension trên thanh công cụ để tùy chỉnh theo sở thích!

---

## 📂 Thư Mục Dự Án (Project Structure)

```
youtube-chat-enhance/
├── manifest.json         # Cấu hình Chrome Extension (Manifest V3)
├── popup/
│   ├── popup.html        # Giao diện điều khiển Extension Popup
│   ├── popup.css         # Styling giao diện Dark Mode / Glassmorphism
│   └── popup.js          # Đồng bộ cấu hình Realtime với trang YouTube
├── content/
│   ├── chat-injector.js  # Content script chính nhúng vào trang YouTube watch/live
│   ├── chat-iframe.js    # Content script nhúng vào iframe live chat (làm trong suốt nền & bóc tách message)
│   ├── draggable-box.js  # Quản lý kéo thả (Drag), co giãn (Resize) & thu nhỏ nút nổi
│   ├── danmaku-engine.js # Bộ dựng chữ chạy ngang màn hình (Danmaku Engine 60fps)
│   └── overlay.css       # CSS làm sạch viền, ẩn scrollbar và định dạng overlay
├── icons/                # Bộ Icon PNG (16x16, 48x48, 128x128)
└── README.md             # Hướng dẫn sử dụng & thông tin dự án
```

---

## 📝 License & Author

- **Tác giả:** [khanhnkq](https://github.com/khanhnkq)
- **Giấy phép:** MIT License. Mọi đóng góp (Pull Requests / Issues) luôn được hoan nghênh!
