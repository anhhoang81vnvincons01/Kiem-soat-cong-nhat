#!/bin/bash
echo "========================================================================="
echo "   HỆ THỐNG KIỂM SOÁT HỒ SƠ CÔNG NHẬT ĐỐI TRỪ XÂY DỰNG (QĐNBC)"
echo "   Phát triển: Bộ phận Kiểm Soát Chi Phí (KSCP) / Ban QLDA Vincons"
echo "========================================================================="
echo ""

if ! command -v node &> /dev/null; then
    echo "[!] CHƯA CÀI ĐẶT NODE.JS!"
    echo "Vui lòng cài đặt Node.js LTS từ: https://nodejs.org/"
    exit 1
fi

echo "[OK] Đã tìm thấy Node.js: $(node -v)"

if [ ! -d "node_modules" ]; then
    echo "[i] Đang cài đặt thư viện phần mềm lần đầu..."
    npm install
fi

echo "[i] Đang khởi động hệ thống tại http://localhost:3000..."
(sleep 2 && (open http://localhost:3000 || xdg-open http://localhost:3000)) &
npm run dev
