import React, { useState, useEffect } from 'react';
import {
  X,
  Download,
  Monitor,
  Package,
  CheckCircle2,
  FileCode,
  Terminal,
  Cpu,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';

interface InstallPackageModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstallPackageModal: React.FC<InstallPackageModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'windows' | 'pwa' | 'electron'>('windows');
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalledPwa, setIsInstalledPwa] = useState(false);

  useEffect(() => {
    // Lắng nghe sự kiện cài đặt PWA
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalledPwa(true);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (!isOpen) return null;

  const handleDownloadZip = async () => {
    setIsDownloading(true);
    setDownloadSuccess(false);
    try {
      const response = await fetch('/api/export/installer-bundle');
      if (!response.ok) {
        throw new Error('Lỗi từ máy chủ khi đóng gói bộ cài');
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Bo_Cai_Dat_Kiem_Soat_Cong_Nhat_QDNBC_${new Date().toISOString().slice(0, 10)}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setDownloadSuccess(true);
    } catch (err: any) {
      alert('Không thể tải bộ cài: ' + (err.message || 'Lỗi mạng'));
    } finally {
      setIsDownloading(false);
    }
  };

  const handleInstallPWA = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalledPwa(true);
      }
      setDeferredPrompt(null);
    } else {
      alert(
        'Trình duyệt của bạn có thể đã cài đặt ứng dụng hoặc bạn có thể nhấp vào biểu tượng Cài đặt (Install) ở góc phải thanh địa chỉ của Chrome/Edge/Cốc Cốc.'
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header Modal */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 border border-blue-400/30 rounded-xl">
              <Package className="w-5 h-5 text-blue-300" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">Xuất Bộ Cài Đặt Phần Mềm QĐNBC</h3>
              <p className="text-xs text-blue-200/80">Khởi chạy 1-Click trên máy tính hoặc cài đặt Desktop App</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab chuyển đổi phương thức cài đặt */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 px-6 pt-3 gap-2">
          <button
            onClick={() => setActiveTab('windows')}
            className={`pb-3 px-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'windows'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700'
            }`}
          >
            <Download className="w-4 h-4" />
            Bộ cài 1-Click Windows (.zip)
          </button>
          <button
            onClick={() => setActiveTab('pwa')}
            className={`pb-3 px-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'pwa'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700'
            }`}
          >
            <Monitor className="w-4 h-4" />
            Cài Desktop App (PWA)
          </button>
          <button
            onClick={() => setActiveTab('electron')}
            className={`pb-3 px-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'electron'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700'
            }`}
          >
            <Terminal className="w-4 h-4" />
            Đóng gói .exe độc lập
          </button>
        </div>

        {/* Nội dung từng Tab */}
        <div className="p-6 overflow-y-auto space-y-4">
          {activeTab === 'windows' && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 rounded-xl flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <div className="text-xs text-blue-900 dark:text-blue-200 space-y-1">
                  <p className="font-semibold text-sm">Bộ cài đặt trọn gói Offline (Khuyến nghị cho KSCP):</p>
                  <p>
                    Gói nén `.zip` đã được cấu hình sẵn file thực thi <strong>`Chay_Phan_Mem.bat`</strong> (Windows) và <strong>`Chay_Phan_Mem.sh`</strong> (Mac/Linux). Người dùng chỉ cần tải về, giải nén và nhấp đúp là phần mềm tự động khởi chạy không cần gõ lệnh.
                  </p>
                </div>
              </div>

              <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3 bg-white dark:bg-slate-900">
                <h4 className="font-semibold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-indigo-500" />
                  Các tệp có trong bộ cài:
                </h4>
                <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1.5 list-disc pl-5">
                  <li><strong>Chay_Phan_Mem.bat</strong>: Khởi chạy 1-Click trên mọi máy tính Windows.</li>
                  <li><strong>Chay_Phan_Mem.sh</strong>: Khởi chạy trên MacBook hoặc máy tính Linux.</li>
                  <li><strong>HUONG_DAN_CAI_DAT.md</strong>: Hướng dẫn sử dụng chi tiết bằng tiếng Việt.</li>
                  <li><strong>Mã nguồn hoàn chỉnh</strong>: Frontend React, Backend Server, Bộ kiểm soát 9 quy tắc QĐNBC, Tesseract OCR, Gemini & Claude Pro.</li>
                </ul>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleDownloadZip}
                  disabled={isDownloading}
                  className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all"
                >
                  {isDownloading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Đang đóng gói file ZIP bộ cài...
                    </>
                  ) : downloadSuccess ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-emerald-300" />
                      Đã tải xong bộ cài (.zip)! Nhấp để tải lại
                    </>
                  ) : (
                    <>
                      <Download className="w-5 h-5" />
                      Tải Xuống Bộ Cài Đặt Trọn Gói (.zip)
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'pwa' && (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl flex items-start gap-3">
                <Monitor className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-xs text-emerald-900 dark:text-emerald-200 space-y-1">
                  <p className="font-semibold text-sm">Cài đặt trực tiếp thành ứng dụng Desktop:</p>
                  <p>
                    Ứng dụng sẽ được cài thành biểu tượng riêng trên màn hình Desktop máy tính, mở trong cửa sổ độc lập y hệt phần mềm `.exe` mà không cần cài đặt Node.js hay dòng lệnh nào!
                  </p>
                </div>
              </div>

              <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3 bg-white dark:bg-slate-900">
                <h4 className="font-semibold text-sm text-slate-900 dark:text-white">Cách cài đặt:</h4>
                <ol className="text-xs text-slate-600 dark:text-slate-300 space-y-2 list-decimal pl-5">
                  <li>Bấm nút <strong>"Cài đặt ứng dụng vào máy tính"</strong> ngay bên dưới.</li>
                  <li>Nếu trình duyệt hỏi xác nhận, nhấn <strong>"Cài đặt (Install)"</strong>.</li>
                  <li>Hoặc bấm vào biểu tượng <strong>Cài đặt (Install icon)</strong> ở phía bên phải thanh địa chỉ của Google Chrome / Microsoft Edge.</li>
                </ol>
              </div>

              <button
                onClick={handleInstallPWA}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                <Monitor className="w-5 h-5" />
                {isInstalledPwa ? 'Ứng dụng đã được cài đặt trên máy tính' : 'Cài Đặt Ứng Dụng Vào Máy Tính Ngay'}
              </button>
            </div>
          )}

          {activeTab === 'electron' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-100 dark:bg-slate-800/60 rounded-xl space-y-2 text-xs text-slate-700 dark:text-slate-300">
                <p className="font-semibold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-purple-500" />
                  Đóng gói thành file cài đặt độc lập (.exe Windows / .dmg Mac):
                </p>
                <p>
                  Nếu Ban QLDA cần phát hành 1 file duy nhất `KiemSoatCongNhat-Setup.exe` cho nhân viên kỹ thuật cài đặt như phần mềm Word/Excel, bạn chỉ cần chạy lệnh đóng gói Electron:
                </p>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-xl text-slate-200 font-mono text-xs overflow-x-auto space-y-1">
                <p className="text-slate-500"># 1. Cài đặt công cụ đóng gói Electron</p>
                <p className="text-emerald-400">npm install -D electron electron-builder</p>
                <p className="text-slate-500 mt-2"># 2. Biên dịch và xuất file .exe cài đặt</p>
                <p className="text-emerald-400">npm run build && npx electron-builder --win</p>
              </div>

              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                File `.exe` thành phẩm sẽ xuất hiện trong thư mục `dist/` để bạn gửi qua Zalo/Email cho các phòng ban sử dụng.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
