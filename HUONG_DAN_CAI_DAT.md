# HƯỚNG DẪN CÀI ĐẶT & TRIỂN KHAI HỆ THỐNG KIỂM SOÁT HỒ SƠ CÔNG NHẬT (QĐNBC)
**Đơn vị phát triển:** Bộ phận Kiểm Soát Chi Phí (KSCP) / Ban QLDA Vincons  
**Phiên bản:** v1.0 Production Ready

---

## 🚀 CÁCH 1: KHỞI CHẠY 1-CLICK TRÊN MÁY TÍNH (WINDOWS / MAC / LINUX)

### Đối với Windows:
1. Tải về và giải nén thư mục mã nguồn.
2. Cài đặt **Node.js LTS** (nếu máy chưa có) tại: [https://nodejs.org/](https://nodejs.org/).
3. Nhấp đúp chuột vào file **`Chay_Phan_Mem.bat`**.
4. Trình duyệt web sẽ tự động mở lên tại địa chỉ `http://localhost:3000` với đầy đủ tính năng!

### Đối với macOS / Linux:
1. Mở Terminal tại thư mục phần mềm.
2. Cấp quyền thực thi và chạy:
   ```bash
   chmod +x Chay_Phan_Mem.sh
   ./Chay_Phan_Mem.sh
   ```

---

## 💻 CÁCH 2: CÀI ĐẶT DƯỚI DẠNG ỨNG DỤNG DESKTOP (PWA)
- Khi mở ứng dụng trên trình duyệt Chrome, Edge hoặc Cốc Cốc, nhấp vào biểu tượng **"Cài đặt ứng dụng"** trên thanh địa chỉ (hoặc bấm nút "Cài đặt Desktop" trong phần mềm).
- Ứng dụng sẽ được ghim vào Desktop & Taskbar máy tính của bạn như một phần mềm Windows độc lập (`.exe`), mở trong cửa sổ riêng, không có thanh địa chỉ trình duyệt.

---

## 📦 CÁCH 3: ĐÓNG GÓI THÀNH FILE CÀI ĐẶT INDEPENDENT (.EXE) QUA ELECTRON
Nếu muốn tạo file `.exe` cài đặt độc lập để phát cho các kỹ sư KSCP không rành kỹ thuật:
1. Cài đặt electron-packager hoặc electron-builder:
   ```bash
   npm install -D electron electron-builder
   ```
2. Chạy lệnh đóng gói:
   ```bash
   npm run build
   npx electron-builder --win
   ```
3. File cài đặt `KiemSoatCongNhat-Setup.exe` sẽ được tạo trong thư mục `dist/`.

---

## 🐙 CÁCH 4: ĐẨY LÊN GITHUB & ĐỒNG BỘ MÃ NGUỒN

### Đẩy trực tiếp từ giao diện Web:
1. Bấm nút **"Đẩy lên GitHub"** trên thanh Header của ứng dụng.
2. Dán đường dẫn GitHub Repository (ví dụ: `https://github.com/anhhoang81vn/kiem-soat-cong-nhat.git`).
3. Dán **GitHub Personal Access Token (PAT)** (Tạo tại: GitHub -> Settings -> Developer Settings -> Personal access tokens).
4. Nhấn **"Bắt đầu đẩy mã nguồn lên GitHub"**.

### Đẩy thủ công qua dòng lệnh (Terminal / PowerShell):
```bash
git init
git add .
git commit -m "Phiên bản Hệ thống Kiểm Soát Công Nhật QĐNBC v1.0"
git branch -M main
git remote add origin https://github.com/<tai_khoan_cua_ban>/<ten_repo>.git
git push -u origin main --force
```

---

## 🔍 GIẢI ĐÁP VỀ TESSERACT OCR (GOOGLE OPEN SOURCE)
- **Tính khả thi:** Hoàn toàn khả thi 100%! Động cơ nhận diện `tesseract.js` đã được tích hợp sẵn vào ứng dụng.
- **Ưu điểm:**
  - Hoàn toàn miễn phí, mã nguồn mở do Google phát triển.
  - Chạy 100% Offline / Cục bộ ngay trên máy tính hoặc máy chủ nội bộ Vincons, không gửi ảnh tài liệu công trình ra ngoài, bảo mật tối đa.
  - Trích xuất chữ in trên biên bản, con dấu, tọa độ và thời gian Timemark rất tốt.
- **Cách sử dụng:** Trong thanh tải lên hồ sơ, chuyển sang tùy chọn **"Tesseract OCR (Cục bộ)"** khi muốn quét offline mà không cần API Key Gemini hay Claude.
