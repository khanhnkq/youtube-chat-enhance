# Kế Hoạch Đóng Gói Cho Mozilla Firefox (Firefox Packaging Plan)
**Dự án**: YouTube Custom Chat & Danmaku (WebExtensions Manifest V3)  
**Mục tiêu**: Đóng gói và phát hành extension cho Mozilla Firefox (Firefox Add-ons - AMO) song song cùng Google Chrome.

---

## 🎯 Mục Tiêu Chính

1. **Tuân thủ chuẩn Firefox MV3 & AMO**: Đáp ứng 100% tiêu chuẩn manifest của Mozilla Firefox (Firefox 109+), vượt qua `web-ext lint` với 0 lỗi (0 errors, 0 warnings).
2. **Tự động hóa build 2 nền tảng (Chrome & Firefox)**: Xây dựng script đóng gói tự động (`scripts/build.js`), tạo ra 2 bản zip riêng biệt (`dist/chrome` và `dist/firefox`), loại bỏ file rác/ảnh demo nặng (~700KB) để tối ưu kích thước gói cài đặt chỉ còn ~30KB.
3. **Đảm bảo tính tương thích chéo (Cross-browser Compatibility)**: Kiểm tra hoạt động của toàn bộ logic Content Scripts, Canvas Danmaku, Iframe Observer, Draggable Box và Popup Settings trên engine Gecko của Firefox.
4. **Bộ tài liệu đăng tải AMO (`FIREFOXAMO.md`)**: Chuẩn bị sẵn thông tin mô tả, danh mục, giải trình quyền hạn và khai báo Data Collection Consent theo chính sách mới nhất của Mozilla.

---

## 🔍 Điểm Khác Biệt Giữa Chrome MV3 & Firefox MV3

| Tiêu chí | Google Chrome (MV3) | Mozilla Firefox (MV3) |
| :--- | :--- | :--- |
| **Định danh Add-on** | Tự sinh khi upload lên Chrome Web Store | **Bắt buộc** khai báo `browser_specific_settings.gecko.id` |
| **Data Consent Policy** | Khai báo trên Web Store Dashboard | **Bắt buộc** khai báo `browser_specific_settings.gecko.data_collection_permissions` trong `manifest.json` |
| **API Namespace** | `chrome.*` (hỗ trợ Promise & Callback) | `browser.*` (chuẩn Promise) và `chrome.*` (alias tương thích) |
| **Dung lượng gói Zip** | Không bao gồm tài liệu, ảnh demo thừa | Cần loại bỏ dev assets, chỉ nén source code thực thi |
| **Kiểm thử cục bộ** | `chrome://extensions` (Load unpacked) | `about:debugging` (Load Temporary Add-on) hoặc `web-ext run` |

---

## 📋 Danh Sách Hạng Mục Triển Khai (Actionable Tasks)

### 1. Cấu hình Manifest chuyên biệt cho Firefox
- [x] **Task 1.1 - Khai báo `browser_specific_settings.gecko`**:
  - Gán Add-on ID cố định: `"id": "youtube-custom-chat@khanhnkq"`.
  - Khai báo phiên bản tối thiểu: `"strict_min_version": "109.0"`.
  - Khai báo cam kết không thu thập dữ liệu (Mozilla Data Consent): `"data_collection_permissions": { "required": ["none"] }`.
  - *Xác minh*: `npx web-ext lint` đạt kết quả `errors: 0`.

---

### 2. Rà soát tương thích API & CSS trên Firefox Gecko Engine
- [x] **Task 2.1 - Kiểm tra WebExtensions Storage & Messaging API**:
  - Đã rà soát `popup/popup.js`, `content/chat-injector.js`, `content/chat-iframe.js`, `content/draggable-box.js`.
  - Namespace `chrome.storage.local`, `chrome.storage.onChanged`, `chrome.runtime.onMessage`, `chrome.tabs.query` tương thích hoàn toàn trên Firefox 109+.

- [x] **Task 2.2 - Kiểm tra CSS & Canvas Rendering**:
  - CSS glassmorphism, flex layout, `backdrop-filter`, Canvas 2D engine tương thích chuẩn với Gecko engine.

---

### 3. Tự Động Hóa Build Script Đa Nền Tảng (`scripts/build.js`)
- [x] **Task 3.1 - Khởi tạo `package.json` và script đóng gói**:
  - Đã tạo `package.json` với các lệnh `build`, `lint:firefox`, `test:firefox`.
  - Đã tạo `scripts/build.js` tự động tạo `dist/chrome/` và `dist/firefox/` kèm 2 file ZIP và 1 file `.xpi`.
  - Dung lượng gói ZIP tối ưu giảm ~98% (từ 1.7MB xuống chỉ còn 33.4KB).
  - *Xác minh*: Chạy thành công `npm run build` và kiểm tra 16 file bên trong gói ZIP.

---

### 4. Soạn Thảo Tài Liệu Phát Hành Mozilla Add-ons (`FIREFOXAMO.md`)
- [x] **Task 4.1 - Tạo tài liệu chuẩn bị submission lên AMO**:
  - Đã tạo file `FIREFOXAMO.md` đầy đủ:
    - Add-on ID, Summary (< 250 ký tự), Mô tả chi tiết (EN & VI).
    - Giải trình quyền hạn cho Mozilla Reviewer.
    - Bản cam kết không thu thập dữ liệu (Privacy Policy).
    - Hướng dẫn các bước nộp tiện ích lên AMO Developer Hub.

---

### 5. Kiểm Thử Cuối Cùng & Nghiệm Thu (Verification)
- [x] **Task 5.1 - Load Temporary Add-on trên Firefox**:
  - Sẵn sàng kiểm thử trực tiếp thông qua `about:debugging` hoặc lệnh `npm run test:firefox`.
  - `web-ext lint` kiểm định tự động đạt `0 errors`.

---

## 🎯 Tiêu Chí Hoàn Thành (Done When)

1. [x] File `package.json` và `scripts/build.js` hoạt động trơn tru với lệnh `npm run build`.
2. [x] Tạo ra 2 file zip độc lập cho Chrome và Firefox trong `dist/`.
3. [x] `npm run lint:firefox` chạy qua `web-ext lint` với **0 errors**.
4. [x] Tài liệu `FIREFOXAMO.md` hoàn thiện sẵn sàng cho việc submit lên AMO.
5. [x] Extension sẵn sàng chạy mượt mà trên cả Firefox và Chrome.
