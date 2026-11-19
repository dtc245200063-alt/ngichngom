# 🎬 VietAnh Sub Studio - AI Video Translation, Dubbing & Subtitle Suite

Bản tùy chỉnh từ [AutoSub Studio của Duymanh206](https://github.com/Duymanh206/dichAI).

<p align="center">
  <img src="https://img.shields.io/badge/Version-2.2.0-gold?style=for-the-badge" alt="Version">
  <img src="https://img.shields.io/badge/Python-3.10%20%7C%203.11%20%7C%203.12%20%7C%203.13-blue?style=for-the-badge" alt="Python">
  <img src="https://img.shields.io/badge/React-19%20%2B%20Vite-61dafb?style=for-the-badge" alt="React">
  <img src="https://img.shields.io/badge/FastAPI-Modern%20Async-009688?style=for-the-badge" alt="FastAPI">
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="License">
</p>

**VietAnh Sub Studio (dichAI)** là bộ công cụ desktop/web all-in-one chuyên nghiệp dành cho biên tập viên video, reup phim, dịch truyện tranh chuyển động (manhua/anime), tóm tắt phim và sáng tạo nội dung đa ngôn ngữ.

Hệ thống tự động hóa hoàn toàn quy trình:
> **Nhận diện giọng nói (AI ASR) / Quét sub cứng (OCR)** ➔ **Dịch thuật ngữ cảnh bằng AI (Gemini / OpenAI / DeepSeek)** ➔ **Lồng tiếng thuyết minh (CapCut & Edge-TTS)** ➔ **Xóa phụ đề cũ (Smart Blur Box)** ➔ **Render video thành phẩm chuẩn tỉ lệ**.

---

## 🌟 Tính năng nổi bật

### 1. 🎙️ Nhận diện giọng nói đỉnh cao (AI Audio ASR)
- **Bóc băng chính xác 100% không bỏ sót câu**: Thuật toán chia nhỏ phân đoạn âm thanh chuẩn ($\le$ 25s kèm 3.5s overlap) giúp mô hình Gemini duy trì độ tập trung tối đa, không bị trôi câu thoại ở giữa video.
- **Bộ lọc dải tần giọng nói người (Vocal Bandpass 120Hz – 7.5kHz)**: Loại bỏ tạp âm trầm, tiếng nổ, tiếng bass nền, làm nổi bật giọng nhân vật kể cả khi nhân vật nói nhỏ, thì thầm hoặc nói trên nền nhạc phim hành động gay cấn.
- **AI Quét bổ sung câu bị bỏ lỡ (`🔍 Recover Missing`)**: Tự động phát hiện các khoảng trống timeline chưa có phụ đề và kích hoạt AI bóc băng vét lại tự động.
- **Hỗ trợ quét chữ sub cứng (OCR)**: Sử dụng RapidOCR / PP-OCRv4 nhận dạng chữ tiếng Trung, tiếng Anh trực tiếp từ khung hình.

### 2. 🤖 Dịch thuật AI chuẩn văn phong phim ảnh
- **Hỗ trợ đa nền tảng**: Google Gemini (Flash / Pro), OpenAI ChatGPT, DeepSeek, Groq.
- **Kho phong cách dịch chuyên sâu**:
  - *Tiên hiệp / Cổ trang*: Chuẩn xưng hô môn phái (Huynh, Muội, Sư tôn, Bản tọa, Thiếu chủ...).
  - *Đô thị / Hiện đại*: Ngôn từ tự nhiên, trẻ trung, đời thường.
  - *Hài hước / Hoạt hình*: Hóm hỉnh, bắt trend.
  - *Tóm tắt / Review phim*: Ngắn gọn, súc tích, dồn dập.
- **Hồ sơ nhân vật & Từ điển phát âm**: Ghi nhớ tên riêng và cách phát âm từ mượn tiếng nước ngoài.

### 3. 🔊 Lồng tiếng thông minh & Chống dính câu thoại
- **Đọc trọn vẹn từng câu thoại (No Audio Cutting)**: Giữ subtitle hiển thị khớp theo thời lượng thực tế của file âm thanh, cam kết không bị ngắt quãng giữa chừng khi nghe thử hoặc xuất video.
- **Tự động co giãn thời lượng (`Auto-fit atempo` lên đến 1.45x)**: Tự động điều chỉnh tốc độ đọc vừa vặn với độ dài khung cảnh, giúp câu thoại không bị đè sang câu kế tiếp.
- **Chế độ Tắt/Bật lồng tiếng linh hoạt**: Cho phép người dùng tắt giọng đọc chỉ bằng 1 cú nhấp chuột để dùng studio như một công cụ chuyên bóc băng và dịch văn bản phụ đề thuần túy.
- **Kho giọng phong phú**: Microsoft Edge-TTS (Hoài My, Nam Minh) và giọng đọc CapCut (Dễ Thương, Duy Bắc, Anh Dũng...).

### 4. 🎛️ Timeline đa rãnh phong cách CapCut & Premiere
- **Thu phóng liên tục đến 25x**: Kéo dãn timeline thoải mái để căn chỉnh từng mili-giây câu thoại hoặc lướt nhanh tổng quan video.
- **Kéo xê dịch phụ đề trực quan (Drag & Drop)**: Nhấp chuột trực tiếp lên màn hình video để kéo chữ phụ đề dịch và khung làm mờ sub cũ đến bất kỳ vị trí mong muốn.
- **Chỉnh sửa toàn diện**: Thêm câu mới, Tách câu tại vị trí con trỏ chuột, Xóa câu, Đổi giọng đọc từng câu riêng biệt.

### 5. 🎞️ Xóa sub gốc (De-sub) & Xuất video Full HD/2K
- **Làm mờ thông minh (Gaussian Blur / Mosaic)**: Tự động chỉ bật làm mờ khi phụ đề xuất hiện, bảo toàn tối đa vẻ đẹp của khung hình gốc.
- **Đốt phụ đề chuẩn typography (ASS)**: Đồng bộ tỉ lệ font chữ `PlayResX` / `PlayResY` chính xác 100% giữa màn hình Preview và file MP4 xuất ra.
- **Tách và cân bằng âm lượng (BGM Ducking)**: Tự động hạ nhạc nền xuống 20% khi nhân vật cất tiếng thuyết minh.

---

## 📁 Cấu trúc thư mục

```
dichAI/
├── backend/
│   ├── core/
│   │   ├── ffmpeg_utils.py       # Quản lý binary FFmpeg, ffprobe, trích xuất âm thanh
│   │   ├── gemini_asr.py         # Nhận diện âm thanh đa phân đoạn bằng Gemini
│   │   ├── ocr_engine.py         # Nhận diện phụ đề cứng bằng RapidOCR / ONNX
│   │   ├── render_engine.py      # Đốt sub ASS, tạo blur box, hòa âm lồng tiếng & xuất MP4
│   │   ├── smart_aligner.py      # Thuật toán chống dính timeline & vét câu thoại bỏ sót
│   │   ├── translation_engine.py # Prompting dịch thuật theo thể loại phim
│   │   └── tts_engine.py         # Động cơ lồng tiếng Edge-TTS / CapCut / gTTS
│   └── main.py                   # FastAPI Server, REST APIs & WebSocket tiến trình
├── frontend/
│   ├── src/
│   │   ├── App.jsx               # Toàn bộ giao diện Studio (React 19 + Tailwind CSS)
│   │   ├── index.css             # Theme Obsidian & Gold Dark UI
│   │   └── main.jsx
│   ├── dist/                     # Bản build nén phục vụ trực tiếp qua FastAPI
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
├── uploads/                      # Thư mục lưu trữ video gốc tải lên
├── exports/                      # Thư mục lưu trữ video thành phẩm xuất ra
├── temp/                         # File tạm (audio TTS, thumbnails, cache timeline)
├── run_app.bat                   # File khởi chạy 1-click cho Windows
├── run_app.py                    # Script chạy Python tự động dọn port và mở trình duyệt
├── .gitignore                    # Loại trừ file rác, cache và video nặng khi đẩy Git
└── README.md
```

---

## 🚀 Hướng dẫn cài đặt & Khởi chạy

### Yêu cầu hệ thống:
- Hệ điều hành: Windows 10/11, macOS, hoặc Linux.
- Python: Phiên bản 3.10 trở lên (khuyên dùng 3.11 hoặc 3.12/3.13).
- Node.js: Phiên bản 18 trở lên (để phát triển Frontend nếu cần).
- FFmpeg: Đã được cấu hình trong PATH hoặc đặt tại thư mục hệ thống.

---

### Khởi chạy nhanh (Chỉ 1 bước):

**Trên Windows:**
Nhấp đúp chuột vào file:
```cmd
run_app.bat
```

**Hoặc chạy qua dòng lệnh Terminal:**
```powershell
python run_app.py
```

Ứng dụng sẽ:
1. Tự động kiểm tra và giải phóng cổng `8000`.
2. Khởi chạy máy chủ Backend FastAPI.
3. Tự động bật trình duyệt web tại địa chỉ: `http://127.0.0.1:8000`.

---

## 💡 Hướng dẫn sử dụng cơ bản

1. **Tải video lên**: Kéo thả file video (`.mp4`, `.mkv`, `.webm`) vào khung tải lên hoặc chọn từ danh sách video có sẵn.
2. **Cấu hình API Key**: Nhập khóa Google Gemini API Key tại cột bên trái (Khóa được tự động lưu vào trình duyệt cho các lần sau).
3. **Bóc băng & Dịch thuật**:
   - Chọn chế độ **`Gemini Audio ASR (Siêu nhanh 10x)`** ➔ Nhấn **`Quét phụ đề`**.
   - Nếu còn phân đoạn nào chưa quét hết, nhấn **`🔍 AI Quét bổ sung câu bị bỏ lỡ`** trên thanh timeline.
4. **Tạo giọng đọc (TTS)**:
   - Chọn giọng thuyết minh mong muốn (Hoài My, Nam Minh, CapCut...).
   - Nhấn **`Tạo giọng cho tất cả câu`**.
   - *(Tùy chọn)*: Nhấn nút **`🔇 Tắt lồng tiếng`** trên thanh công cụ nếu bạn chỉ muốn giữ lại phụ đề chữ và nhạc gốc.
5. **Căn chỉnh vị trí chữ & Xóa sub cũ**:
   - Kéo trực tiếp khung chữ vàng và khung làm mờ màu xanh trên màn hình xem thử đến vị trí mong muốn.
6. **Xuất video**:
   - Nhấn **`Xuất video`** ở góc trên bên phải.
   - Chọn thư mục lưu trên máy tính và bấm **`Bắt đầu xuất video`**.

---

## 📄 Bản quyền & Đóng góp
Dự án được xây dựng và phát triển mã nguồn mở phục vụ cộng đồng dịch phim và sáng tạo nội dung AI.
Mọi đóng góp, báo lỗi hoặc yêu cầu tính năng xin vui lòng mở Issue hoặc gửi Pull Request tại:
👉 **Repository**: [https://github.com/Duymanh206/dichAI.git](https://github.com/Duymanh206/dichAI.git)
