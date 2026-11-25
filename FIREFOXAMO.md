# DanmaChat - Firefox Add-ons (AMO) Listing Metadata

**Last Updated:** 2026-11-25  
**Extension Version:** 1.3.0  
**Manifest Version:** Manifest V3  
**Gecko Add-on ID:** `youtube-custom-chat@khanhnkq`  
**License:** MIT License  

---

## 1. AMO Store Metadata

- **Add-on Name:** DanmaChat: Fullscreen Chat & Danmaku for YouTube (from `appNameFirefox` in `_locales/<locale>/messages.json`; AMO allows 50 characters)
- **Summary (Max 250 characters):**  
  > Customize YouTube live chat: Transparent floating overlay on video, draggable & resizable window, and Danmaku mode (scrolling flying comments). *(146 characters)*
- **Categories:**
  - Primary: *Photos, Music & Media*
  - Secondary: *Feeds, News & Blogging*
- **Tags:** `youtube`, `live-chat`, `danmaku`, `floating-chat`, `transparent-chat`, `bilibili`
- **Support URL / Donation:** `https://khanhnkq.quizken.com/buy-me-a-coffee`

---

## 2. Detailed Description (Mô Tả Chi Tiết)

### English (Primary)

Elevate your YouTube livestream and video watching experience with **DanmaChat**!

✨ **KEY FEATURES:**

1. **Transparent Floating Chat Overlays Video:**
   - Displays live chat directly over the video player during Fullscreen, Theatre Mode, or Windowed mode.
   - Adjust background opacity smoothly from fully transparent (0%) to opaque (100%).
   - Customizable chat font size.

2. **Draggable & Resizable Floating Box:**
   - Drag and drop to position the chat window anywhere across the video player.
   - Resize width and height easily with the bottom-right corner resize handle.
   - Automatically saves and restores your preferred window position and dimensions.

3. **Danmaku Mode (Scrolling Flying Comments):**
   - Stream live chat comments smoothly across your video right-to-left in real-time (Bilibili / Niconico / Douyu style).
   - High-performance DOM/WAAPI renderer using compositor-only transforms.
   - Displays sender avatars, SuperChat badges, and customizable text colors/shadows.
   - Configurable scroll speed (4s - 20s), font size (14px - 38px), text opacity, and display area (Top 1/3, Top Half, Top 3/4, or Fullscreen).

4. **Multi-language Support:**
   - Seamlessly switch between English and Vietnamese with one click in the popup menu.

---

### Tiếng Việt

Nâng tầm trải nghiệm xem livestream và video YouTube với tiện ích **DanmaChat**!

✨ **TÍNH NĂNG NỔI BẬT:**

1. **Khung Chat Trong Suốt Nổi Trên Video:**
   - Hiển thị khung chat trực tiếp đè lên video ở cả chế độ Toàn màn hình (Fullscreen) và Rạp chiếu phim (Theatre Mode).
   - Tùy chỉnh độ mờ nền linh hoạt từ trong suốt hoàn toàn (0%) đến đặc (100%).
   - Tùy chỉnh kích thước chữ của khung chat.

2. **Kéo Thả & Đổi Kích Thước Tự Do:**
   - Kéo thả khung chat đến bất kỳ vị trí thuận tiện nào trên màn hình video.
   - Co giãn chiều rộng và chiều cao dễ dàng qua nút kéo ở góc dưới bên phải.
   - Tự động lưu và khôi phục vị trí khung chat cho các lần xem tiếp theo.

3. **Chế Độ Danmaku (Bình Luận Bay Ngang Màn Hình):**
   - Bình luận live chat bay mượt mà từ phải sang trái theo phong cách Bilibili / Niconico.
   - Renderer DOM/WAAPI hiệu năng cao, chuyển động bằng transform trên compositor.
   - Hiển thị avatar người gửi, huy hiệu SuperChat nổi bật.
   - Tùy chỉnh tốc độ bay, kích thước font chữ, màu sắc, viền chữ, bóng đổ và vùng hiển thị (1/3 trên, 1/2 trên, 3/4 trên hoặc toàn màn hình).

4. **Hỗ Trợ Đa Ngôn Ngữ:**
   - Dễ dàng chuyển đổi giữa tiếng Anh và tiếng Việt trong menu popup.

---

## 3. Permissions Justification (Giải Trình Quyền Hạn Cho Reviewer AMO)

| Permission / Host Permission | Justification for Reviewer |
| :--- | :--- |
| `storage` | Storing user UI preferences locally (floating chat coordinates, opacity, font size, Danmaku speed, language). No data leaves the browser. |
| `https://www.youtube.com/*` | Injecting content scripts into YouTube watch/live pages and the YouTube live chat iframe to render the floating chat overlay and DOM/WAAPI Danmaku. |

---

## 4. Privacy & Data Collection Disclosure (Cam Kết Quyền Riêng Tư)

- **Data Collection:** The extension does **NOT** collect, track, store, or transmit any user personal data, account information, or browsing history.
- **Data Transmission:** **None.** No analytics, no telemetry, no remote servers.
- **Local Storage:** All user preferences are stored entirely locally on the client machine using `browser.storage.local`.
- **Manifest Declaration:**
  ```json
  "data_collection_permissions": {
    "required": ["none"]
  }
  ```

---

## 5. Reviewer Notes for Mozilla AMO (Ghi Chú Cho Kiểm Duyệt Viên)

```text
Dear Reviewer,

- This extension enhances the YouTube live chat experience by providing a transparent floating overlay and DOM/WAAPI Danmaku comments on YouTube video pages.
- The extension is written in pure vanilla JavaScript and CSS without minification, transpilation, or obfuscation.
- All source files inside the extension package are human-readable.
- No remote scripts or third-party tracking libraries are loaded.
- To test the extension:
  1. Load the add-on in Firefox via about:debugging.
  2. Navigate to any active YouTube livestream (or video with live chat replay) such as https://www.youtube.com/live or a live gaming stream.
  3. Observe the floating chat box and the Danmaku comments over the video.
  4. Click the extension icon in the toolbar to adjust opacity, font size, or switch between English and Vietnamese.
```

---

## 6. Hướng Dẫn Đóng Gói & Upload Lên AMO

### Bước 1: Build gói cài đặt Firefox
Chạy lệnh sau tại thư mục gốc của project:
```bash
npm run build
```
File đóng gói cho Firefox sẽ được tạo tại:
- `dist/DanmaChat-Firefox-v<version>.zip` (hoặc `dist/DanmaChat-Firefox-v<version>.xpi`), với `<version>` lấy từ `manifest.json`.

Gói cài đặt không được lưu trong repo; luôn build lại từ mã nguồn của phiên bản cần nộp.

### Bước 2: Kiểm tra tính hợp lệ trước khi upload
```bash
npm run lint:firefox
```
Đảm bảo kết quả trả về `0 errors, 0 new warnings`. Hai cảnh báo đã biết về `data_collection_permissions` (liệt kê trong `scripts/firefox-lint-known-warnings.json`) được chấp nhận.

### Bước 3: Nộp lên Mozilla Add-ons (AMO)
1. Đăng nhập vào [AMO Developer Hub](https://addons.mozilla.org/developers/).
2. Nhấn nút **Submit a New Add-on** (hoặc **Submit a New Version** nếu cập nhật).
3. Chọn kênh phân phối: **On this site** (Phát hành công khai trên kho tiện ích Mozilla).
4. Upload file `dist/DanmaChat-Firefox-v<version>.zip`.
5. Hệ thống sẽ quét tự động (Automated validation) và xác nhận hợp lệ.
6. Copy các thông tin từ mục **1. AMO Store Metadata**, **2. Detailed Description**, và **5. Reviewer Notes** ở trên dán vào các trường tương ứng.
7. Nhấn **Submit Version** để hoàn tất nộp cho kiểm duyệt viên.
