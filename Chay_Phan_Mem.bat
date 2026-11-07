@echo off
chcp 65001 > nul
title HE THONG KIEM SOAT HO SO CONG NHAT - VINCONS KSCP
echo =========================================================================
echo    HE THONG KIEM SOAT HO SO CONG NHAT DOI TRU XAY DUNG (QD некоторых)
echo    Phát triển: Bộ phận Kiểm Soát Chi Phí (KSCP) / Ban QLDA Vincons
echo =========================================================================
echo.
echo Đang kiểm tra môi trường Node.js trên máy tính...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [!] CHUA CO NODE.JS!
    echo Vui long tai va cai dat Node.js LTS mien phi tu: https://nodejs.org/
    echo Sau khi cai dat xong, hay nhap dup lai vao file Chay_Phan_Mem.bat nay.
    echo.
    pause
    exit /b
)

echo [OK] Da tim thay Node.js:
node -v
echo.

if not exist node_modules (
    echo [i] Phat hien chay lan dau. Dang cai dat thu vien ung dung...
    call npm install
)

echo.
echo [i] Dang khoi chay He thong Kiem soat Cong nhat tai http://localhost:3000 ...
echo [i] Trinh duyet se tu dong mo len trong giay lat...
echo.
echo =========================================================================
echo    LUU Y: Giu nguyen cua so nay trong khi su dung phan mem.
echo    De tat phan mem: Dong cua so nay hoac an to hop phim Ctrl + C.
echo =========================================================================
echo.

timeout /t 3 >nul
start http://localhost:3000
npm run dev
pause
