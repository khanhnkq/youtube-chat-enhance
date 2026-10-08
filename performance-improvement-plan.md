# Kế Hoạch Cải Tiến Hiệu Năng (Performance Improvement Plan)
**Dự án**: YouTube Custom Chat & Danmaku (Chrome Extension MV3)

---

## 🎯 Mục Tiêu Chính
Tối ưu hóa mức tiêu thụ CPU, GPU và RAM của extension khi xem livestream YouTube (đặc biệt là các stream có lượng chat cực lớn):
1. **Giảm 50-70% CPU/GPU idle**: Ngừng vòng lặp canvas render khi không có comment hoặc khi video tạm dừng/ẩn tab.
2. **Loại bỏ hiện tượng giật khung hình (frame drops / layout thrashing)**: Tối ưu Canvas Danmaku và chuyển đổi cơ chế kéo thả/resize sang GPU transform.
3. **Giảm 50% RAM & Network của Chat**: Tránh chạy song song 2 iframe YouTube Live Chat gây trùng lặp network và parser.
4. **Dọn sạch rò rỉ bộ nhớ (Memory Leaks)** khi chuyển video trên YouTube (SPA Navigation).

---

## 📋 Danh Sách Hạng Mục Cải Tiến (Actionable Tasks)

### 1. Tối ưu Danmaku Render Loop (Zero Idle Overhead)
*File ảnh hưởng*: `content/danmaku-engine.js`
- [x] **Task 1.1 - Smart RAF Loop (Sleep/Wakeup)**:
  - Chỉ duy trì `requestAnimationFrame` khi danh sách `comments.length > 0`.
  - Tự động dừng loop (`stopLoop()`) khi hết comment, canvas ẩn, hoặc video đang tạm dừng (`video.paused`).
  - Đánh thức loop (`startLoop()`) khi có comment mới được đẩy vào qua `addComment()`.
  - Lắng nghe `document.visibilityState` và sự kiện `pause`/`play` của thẻ `<video>` để đóng/bật loop tiết kiệm pin.
  - *Xác minh*: Mở Performance Monitor trong DevTools; khi không có comment hoặc pause video, CPU usage của tab YouTube giảm về mức gốc, không còn gọi `clearRect` liên tục 60/120Hz.

### 2. Tối ưu Canvas Rendering & Cắt giảm Chi Phí Vẽ Avatar / Text
*File ảnh hưởng*: `content/danmaku-engine.js`
- [x] **Task 2.1 - Cache Avatar bo tròn bằng Offscreen Canvas / ImageBitmap**:
  - Hiện tại mỗi frame đều chạy: `ctx.save() -> ctx.beginPath() -> ctx.arc() -> ctx.clip() -> ctx.drawImage() -> ctx.restore()` cho từng avatar (rất tốn GPU pass).
  - Cải tiến: Khi load avatar xong, vẽ bo tròn 1 lần duy nhất lên một canvas nhỏ (32x32) hoặc tạo pattern, lưu vào cache. Khi render mỗi frame chỉ cần `drawImage(cachedCircularAvatar, x, y, size, size)`.
  - *Xác minh*: Profiler không còn thấy bottleneck tại `clip()` và `restore()` của Canvas2D context.
- [x] **Task 2.2 - Pre-calculate Text & Badge Metrics**:
  - Chuyển việc đo kích thước SuperChat badge (`measureText(badgeText)`) từ hàm `render()` sang tính 1 lần duy nhất trong `addComment()`.
  - Giới hạn DPR tối đa (ví dụ `Math.min(window.devicePixelRatio || 1, 2)`) để tránh canvas 4K/5K phình to hàng chục triệu pixel trên màn hình Retina.
  - Tối ưu hiệu ứng `shadowBlur` và `strokeText`: gom nhóm `ctx.fillStyle`, `ctx.strokeStyle`, tránh gán thuộc tính canvas liên tục giữa các comment cùng loại.
  - *Xác minh*: Frame time của `render()` giảm xuống dưới 4ms ngay cả khi có 50-100 danmaku bay cùng lúc.

### 3. Tối ưu Iframe Live Chat & Loại Bỏ Xử Lý Trùng Lặp (Deduplication & Single Scraper)
*File ảnh hưởng*: `content/chat-iframe.js`, `content/draggable-box.js`, `content/chat-injector.js`
- [x] **Task 3.1 - Phân vai trò Iframe (Master Scraper vs Floating View)**:
  - Hiện tại cả 2 iframe (gốc của YouTube và iframe nổi tự tạo) đều chạy `startChatObserver()` và đều gửi postMessage `YT_DANMAKU_BATCH`, ép `chat-injector.js` phải cache và deduplicate.
  - Cải tiến: Gán `frameSource` và dùng cờ `__ytProcessed` trực tiếp trên DOM node giúp loại bỏ trùng lặp $O(1)$ không tốn chi phí băm Set.
  - *Xác minh*: Không còn lượng postMessage trùng lặp gửi về tab chính; số lượng MutationObserver giảm 50%.
- [x] **Task 3.2 - Tối ưu MutationObserver của Chat List**:
  - Không observe `subtree: true` trên toàn bộ container chat nếu chỉ cần bắt các tin nhắn mới thêm vào danh sách (`childList: true` ở `#items`).
  - Thay vì gọi `node.querySelectorAll(...)` với mọi mutation con, chỉ kiểm tra trực tiếp `node.tagName` nếu mutation target là danh sách chat.
  - *Xác minh*: Khi livestream có chat bão (100+ msgs/giây), CPU của process iframe không bị giật lag hay treo trang.

### 4. Tối ưu Kéo Thả (Drag/Resize) & Khử Layout Thrashing
*File ảnh hưởng*: `content/draggable-box.js`, `content/overlay.css`
- [x] **Task 4.1 - Chuyển Drag sang CSS Transform thay vì `top`/`left`**:
  - Cache kích thước của `playerEl.getBoundingClientRect()` lúc `onDragStart` thay vì đo lại ở mỗi tick của requestAnimationFrame (khử triệt để layout thrashing).
  - Khi đang drag hoặc resize, áp dụng class `.is-dragging` / `.is-resizing` và tạm thời gỡ bỏ `transition` trên `.yt-custom-chat-overlay` để chuột phản hồi tức thì 1:1, không bị rubber-banding.
  - *Xác minh*: Kéo thả mượt mà 60/120 FPS, không có cảnh báo "Forced synchronous layout" trong Chrome DevTools Performance trace.

### 5. Dọn Dẹp Bộ Nhớ Khi Điều Hướng SPA (SPA Navigation Cleanup)
*File ảnh hưởng*: `content/chat-injector.js`, `content/danmaku-engine.js`, `content/draggable-box.js`
- [x] **Task 5.1 - Triệt để Cleanup & Event Unbinding**:
  - Sửa lỗi unbind `boundResize`, `boundVisibilityChange`, `boundVideoPlay`, `boundVideoPause` trong `danmaku-engine.js` bằng reference cố định.
  - Thêm phương thức `destroy()` cho `DanmakuEngine` và `DraggableChatBox`.
  - Disconnect `watchFlexyObserver`, clear `receivedMsgCache` và clear bình luận cũ trên video mới (`yt-navigate-finish`, `popstate`).
  - *Xác minh*: Chuyển đổi qua lại 10-20 video YouTube liên tục, theo dõi DevTools Memory tab (Heap Snapshot) không thấy DOM node rò rỉ (detached elements) hay bộ nhớ tăng mất kiểm soát.

---

## ⏱️ Lộ Trình Triển Khai Đề Xuất (Phases)

| Phase | Trọng tâm | Ước tính tác động |
|-------|-----------|-------------------|
| **Phase 1** | **Danmaku Idle Loop & Canvas Batching** (Task 1.1 + 2.1 + 2.2) | Giảm 60% GPU/CPU tiêu thụ khi xem video bình thường |
| **Phase 2** | **Chat Iframe & MutationObserver Streamlining** (Task 3.1 + 3.2) | Giảm 40% CPU spike trên các stream có chat đông |
| **Phase 3** | **GPU Transform Dragging & SPA Cleanup** (Task 4.1 + 5.1) | Trải nghiệm kéo thả siêu mượt, xóa sổ memory leaks |
| **Phase 4** | **Benchmark & Verification** | Đo đạc DevTools Performance & Memory trước/sau tối ưu |

---

## 🔍 Tiêu Chí Nghiệm Thu (Verification Criteria)
1. **Idle CPU**: Khi bật chế độ Danmaku nhưng không có chat (hoặc dừng video), CPU tiêu thụ của tab YouTube xấp xỉ như khi không cài extension.
2. **Stress Test 100 Danmaku/s**: Bắn tải mô phỏng hoặc stream đông, FPS duy trì ổn định 55-60 FPS (hoặc 120 FPS trên màn hình high-refresh).
3. **Memory Stability**: Xem stream trong 1-2 giờ không bị tăng RAM liên tục (không có heap leak).
