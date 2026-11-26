# DanmaChat - Chrome Web Store Listing Metadata

**Last Updated:** 2026-11-25  
**Extension Version:** 1.3.0  
**Manifest Version:** Manifest V3  
**Item ID:** `eapcgaoflonkgkhaeidekcnkaoniajad` (unchanged by the rename; users, ratings and old links carry over)

---

## 1. Name and summary come from `_locales`

The store reads the name and the short description (summary) from the package, so they can only change with a new package version. They live in `_locales/<locale>/messages.json`:

| Key | Used for | Limit |
| --- | --- | --- |
| `appName` | Store title and browser name (Chrome) | 75 |
| `appNameFirefox` | Name of the Firefox build (`scripts/build.js`) | 50 (AMO) |
| `appShortName` | `short_name`, toolbar tooltip | 12 |
| `appDesc` | Store summary and manifest `description` | 132 |

`npm test` (`tests/locales.test.mjs`) fails if a locale goes over a limit or misses a key.

| Locale | Store title |
| --- | --- |
| en (default) | DanmaChat – Fullscreen Live Chat Overlay & Danmaku for YouTube™ |
| vi | DanmaChat – Chat toàn màn hình & Bình luận bay cho YouTube™ |
| ja | DanmaChat – YouTube™ ライブチャットを全画面表示・弾幕コメント |
| zh_CN | DanmaChat – YouTube™ 全屏直播聊天浮窗与弹幕 |
| zh_TW | DanmaChat – YouTube™ 全螢幕直播聊天室浮窗與彈幕 |
| ko | DanmaChat – YouTube™ 전체화면 라이브 채팅 오버레이 & 탄막 |

Because the package now has `_locales`, the dashboard shows one listing tab per locale. Each tab takes its own detailed description, screenshots and promo video. Fill English and Vietnamese with the texts below; for the other locales paste the text below and have a native speaker read it first.

- **Category:** Entertainment
- **Search keywords covered:** fullscreen live chat, live chat overlay, chat in fullscreen, transparent / floating chat, Danmaku, bullet comments, scrolling comments, Niconico-style comments, Super Chat, chat replay, VTuber streams.
- Keep each keyword to a natural number of mentions (the spam policy flags a keyword repeated unnaturally more than 5 times).

---

## 2. Detailed descriptions (paste into each locale's Description box)

### English (en)

```text
Watch YouTube™ live streams in fullscreen without losing the live chat. DanmaChat puts the chat in a transparent overlay you can drag and resize on top of the player, or sends every new message across the video as Danmaku (bullet comments).

FULLSCREEN LIVE CHAT OVERLAY
• Transparent chat window over the player in normal, theater and fullscreen view
• Drag it anywhere on the video and resize it from the bottom-right corner
• Remembers its position and size
• Collapses to a small "Live Chat" badge and reopens with one click
• Background opacity from 0 to 100% and text size from 11 to 24 px
• Your own colours for usernames and messages
• Optional: hide the header and border, the row backgrounds and the input box
• Hides the side chat panel in theater and fullscreen view so the video gets the full width

DANMAKU / BULLET COMMENTS
• New messages scroll from right to left across the video, Niconico and Bilibili style
• Shows sender avatars, Super Chat amounts and membership messages
• Scroll time from 4 to 20 seconds, text size from 14 to 38 px, opacity from 20 to 100%
• Display area: top third, top half, top three quarters or the whole video
• Text colour, outline and shadow
• Pauses together with the video
• Off by default; switch it on in the popup

WORKS GREAT FOR
VTuber and gaming streams, premieres, live chat replays, watching on a second monitor, or any stream where you want the chat without shrinking the video.

LANGUAGES
The settings popup is available in English and Vietnamese.

PRIVACY
Chat messages are read from the page you are watching and shown on your own screen only. Settings are saved in your browser's local storage. No account, no analytics, no ads, and nothing is sent to the developer or any third party.

Free and open source (MIT): https://github.com/khanhnkq/youtube-chat-enhance

YouTube is a trademark of Google LLC. Use of this trademark is subject to Google Permissions. This extension is not affiliated with or endorsed by Google or YouTube.
```

### Tiếng Việt (vi)

```text
Xem livestream YouTube™ toàn màn hình mà vẫn theo dõi được chat. DanmaChat đặt khung chat trong suốt ngay trên trình phát, kéo thả và đổi kích thước tùy ý, hoặc cho từng tin nhắn mới chạy ngang qua video dưới dạng bình luận bay (Danmaku).

CHAT TOÀN MÀN HÌNH, KHUNG CHAT NỔI
• Khung chat trong suốt nằm trên video ở chế độ thường, rạp chiếu phim và toàn màn hình
• Kéo đến bất kỳ vị trí nào trên video, đổi kích thước ở góc dưới bên phải
• Tự nhớ vị trí và kích thước
• Thu gọn thành nhãn "Live Chat" nhỏ, bấm một lần để mở lại
• Độ mờ nền từ 0 đến 100%, cỡ chữ từ 11 đến 24 px
• Tự chọn màu tên người gửi và màu tin nhắn
• Tùy chọn ẩn tiêu đề và viền, nền từng dòng, ô nhập tin nhắn
• Ẩn khung chat bên cạnh ở chế độ rạp chiếu phim và toàn màn hình để video rộng hết cỡ

BÌNH LUẬN BAY (DANMAKU)
• Tin nhắn mới chạy từ phải sang trái trên video, giống Niconico và Bilibili
• Hiện ảnh đại diện người gửi, số tiền Super Chat và tin nhắn hội viên
• Thời gian chạy từ 4 đến 20 giây, cỡ chữ từ 14 đến 38 px, độ mờ từ 20 đến 100%
• Vùng hiển thị: 1/3 trên, nửa trên, 3/4 trên hoặc toàn video
• Màu chữ, viền chữ và bóng chữ
• Tạm dừng cùng lúc với video
• Mặc định tắt; bật trong popup

PHÙ HỢP KHI
Xem VTuber, stream game, công chiếu, xem lại chat của buổi live, xem trên màn hình phụ, hay bất kỳ lúc nào bạn muốn đọc chat mà không thu nhỏ video.

NGÔN NGỮ
Bảng cài đặt có tiếng Anh và tiếng Việt.

QUYỀN RIÊNG TƯ
Tin nhắn chat được đọc từ trang bạn đang xem và chỉ hiển thị trên màn hình của bạn. Cài đặt lưu trong bộ nhớ cục bộ của trình duyệt. Không tài khoản, không phân tích, không quảng cáo, không gửi dữ liệu cho nhà phát triển hay bên thứ ba.

Miễn phí và mã nguồn mở (MIT): https://github.com/khanhnkq/youtube-chat-enhance

YouTube là nhãn hiệu của Google LLC. Tiện ích này không liên kết với và không được Google hay YouTube bảo trợ.
```

### 日本語 (ja) — needs native review

```text
YouTube™ のライブ配信を全画面で見ながら、ライブチャットも読めます。DanmaChat はチャットを透明なオーバーレイとしてプレーヤーの上に表示し、ドラッグで移動・サイズ変更できます。新しいメッセージをニコニコ風の弾幕コメントとして動画の上に流すこともできます。

全画面チャットオーバーレイ
• 通常・シアター・全画面モードで、プレーヤー上に透明なチャットを表示
• 好きな位置にドラッグ、右下の角でサイズ変更。位置とサイズは自動で保存
• 小さな「Live Chat」バッジに折りたたみ、ワンクリックで再表示
• 背景の不透明度 0〜100%、文字サイズ 11〜24 px、名前とメッセージの色を変更可能

弾幕コメント
• 新しいメッセージが右から左へ流れます
• アイコン、スーパーチャットの金額、メンバーシップのメッセージも表示
• 速度 4〜20 秒、文字サイズ 14〜38 px、不透明度、表示エリア、縁取りと影を調整可能
• 動画を一時停止すると弾幕も止まります

VTuber やゲーム配信、チャットリプレイ、サブモニターでの視聴におすすめです。

プライバシー：チャットはあなたの画面にのみ表示され、設定はブラウザ内に保存されます。アカウント不要、解析・広告なし、外部へのデータ送信は一切ありません。

無料・オープンソース (MIT)：https://github.com/khanhnkq/youtube-chat-enhance

YouTube は Google LLC の商標です。本拡張機能は Google および YouTube とは提携しておらず、承認も受けていません。
```

### 简体中文 (zh_CN) — needs native review

```text
全屏观看 YouTube™ 直播时也能看聊天。DanmaChat 把直播聊天变成播放器上方的透明浮窗，可随意拖动和调整大小；也可以把每条新消息变成从右向左滚动的弹幕。

全屏聊天浮窗
• 在普通、影院和全屏模式下，聊天以透明窗口覆盖在视频上
• 拖到任意位置，右下角调整大小，自动记住位置和大小
• 可收起为小小的 "Live Chat" 标签，一键展开
• 背景透明度 0–100%，字号 11–24 px，可自定义用户名和消息颜色

弹幕
• 新消息从右向左滚过视频（类似 B 站 / Niconico）
• 显示头像、Super Chat 金额和会员消息
• 可调滚动时间 4–20 秒、字号 14–38 px、透明度、显示区域、描边和阴影
• 视频暂停时弹幕同步暂停

适合 VTuber、游戏直播、聊天回放和副屏观看。

隐私：聊天内容只显示在你自己的屏幕上，设置保存在浏览器本地。无需账号，无统计，无广告，不向任何人发送数据。

免费开源 (MIT)：https://github.com/khanhnkq/youtube-chat-enhance

YouTube 是 Google LLC 的商标。本扩展与 Google 或 YouTube 无关联，也未获其认可。
```

### 繁體中文 (zh_TW) — needs native review

```text
全螢幕觀看 YouTube™ 直播也能看聊天室。DanmaChat 把聊天室變成播放器上方的透明浮窗，可隨意拖曳與調整大小；也可以把每則新訊息變成由右至左捲動的彈幕。

全螢幕聊天浮窗
• 在一般、劇院和全螢幕模式下，聊天室以透明視窗覆蓋在影片上
• 拖曳到任意位置，右下角調整大小，自動記住位置與大小
• 可收合為小小的「Live Chat」標籤，一鍵展開
• 背景透明度 0–100%，字級 11–24 px，可自訂使用者名稱與訊息顏色

彈幕
• 新訊息由右至左捲過影片
• 顯示頭像、超級留言金額與會員訊息
• 可調捲動時間 4–20 秒、字級 14–38 px、透明度、顯示區域、描邊與陰影
• 影片暫停時彈幕同步暫停

適合 VTuber、遊戲直播、聊天室重播與副螢幕觀看。

隱私：聊天內容只顯示在你自己的螢幕上，設定儲存在瀏覽器本機。無需帳號、無分析、無廣告，不傳送任何資料。

免費開源 (MIT)：https://github.com/khanhnkq/youtube-chat-enhance

YouTube 是 Google LLC 的商標。本擴充功能與 Google 或 YouTube 無關，亦未獲其認可。
```

### 한국어 (ko) — needs native review

```text
YouTube™ 라이브를 전체화면으로 보면서도 채팅을 볼 수 있습니다. DanmaChat은 라이브 채팅을 플레이어 위의 투명한 오버레이로 띄워 드래그와 크기 조절이 가능하며, 새 메시지를 영상 위로 흐르는 탄막 댓글로 보여줄 수도 있습니다.

전체화면 채팅 오버레이
• 일반, 영화관, 전체화면 모드에서 영상 위에 투명한 채팅 창 표시
• 원하는 위치로 드래그, 오른쪽 아래 모서리로 크기 조절, 위치와 크기 자동 저장
• 작은 "Live Chat" 배지로 접고 한 번 클릭으로 다시 열기
• 배경 투명도 0–100%, 글자 크기 11–24 px, 이름과 메시지 색상 변경

탄막 댓글
• 새 메시지가 오른쪽에서 왼쪽으로 흐릅니다
• 프로필 사진, 슈퍼챗 금액, 멤버십 메시지 표시
• 흐르는 시간 4–20초, 글자 크기 14–38 px, 투명도, 표시 영역, 외곽선과 그림자 조절
• 영상을 일시정지하면 탄막도 멈춥니다

버튜버, 게임 방송, 채팅 다시보기, 보조 모니터 시청에 잘 맞습니다.

개인정보: 채팅은 내 화면에만 표시되고 설정은 브라우저에만 저장됩니다. 계정, 분석, 광고가 없으며 어떤 데이터도 전송하지 않습니다.

무료 오픈소스 (MIT): https://github.com/khanhnkq/youtube-chat-enhance

YouTube는 Google LLC의 상표입니다. 이 확장 프로그램은 Google 또는 YouTube와 제휴하거나 보증받지 않았습니다.
```

---

## 3. Permissions Justification

| Permission / Host Permission | Purpose / Justification |
| --- | --- |
| `storage` | Save user preferences (chat window position/size, opacity, Danmaku speed & font size). |
| `https://www.youtube.com/*` | Inject content scripts to customize YouTube live chat layout and render DOM/WAAPI Danmaku over the video player. |

---

## 4. Privacy & Data Disclosures

- **Privacy policy URL:** https://khanhnkq.github.io/youtube-chat-enhance/privacy/
- **Data Collection:** The extension does **NOT** collect, track, store, or transmit any user personal data or browsing activity.
- **Local State:** All user preferences and visual configurations are stored locally in the browser via `chrome.storage.local`.

---

## 5. Package to Upload

Packages are built, not stored in the repository:
```bash
npm ci
npm run build
```
Upload `dist/DanmaChat-Chrome-v<version>.zip` (the version comes from `manifest.json`). The version must be higher than the last uploaded package (1.2.0).
