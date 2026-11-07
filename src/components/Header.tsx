import React from 'react';
import { 
  ShieldCheck, 
  FileSpreadsheet, 
  Moon, 
  Sun, 
  PlusCircle, 
  BookOpen, 
  HardDrive, 
  LogOut,
  RotateCcw,
  BookmarkPlus,
  History,
  Package,
  FolderGit2
} from 'lucide-react';

interface HeaderProps {
  activeTab: 'audit' | 'workers' | 'rules' | 'guide';
  setActiveTab: (tab: 'audit' | 'workers' | 'rules' | 'guide') => void;
  onExportExcel: () => void;
  onExportToGoogleDrive: () => void;
  onGoogleSignIn: () => void;
  onGoogleSignOut: () => void;
  isGoogleLoggedIn: boolean;
  googleUserEmail?: string | null;
  onNewScan: () => void;
  onResetData: () => void;
  onSaveToHistory: () => void;
  onOpenHistoryModal: () => void;
  onOpenInstallModal: () => void;
  onOpenGithubModal: () => void;
  savedHistoryCount: number;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  hasData: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onExportExcel,
  onExportToGoogleDrive,
  onGoogleSignIn,
  onGoogleSignOut,
  isGoogleLoggedIn,
  googleUserEmail,
  onNewScan,
  onResetData,
  onSaveToHistory,
  onOpenHistoryModal,
  onOpenInstallModal,
  onOpenGithubModal,
  savedHistoryCount,
  isDarkMode,
  toggleDarkMode,
  hasData,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-lg bg-blue-600 dark:bg-blue-500 text-white flex items-center justify-center shadow-sm">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold text-slate-900 dark:text-white tracking-tight whitespace-nowrap">
              QĐNBC · Kiểm Soát Công Nhật
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-normal">
              Vincons Cost Control System
            </span>
          </div>
        </div>

        {/* Zone 2: Single-line Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1.5">
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
              activeTab === 'audit'
                ? 'bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Hồ sơ kiểm tra
          </button>
          <button
            onClick={() => setActiveTab('workers')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
              activeTab === 'workers'
                ? 'bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Đối soát nhân sự & Trùng lặp
          </button>
          <button
            onClick={() => setActiveTab('rules')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
              activeTab === 'rules'
                ? 'bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Ma trận quy tắc
          </button>
          <button
            onClick={() => setActiveTab('guide')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
              activeTab === 'guide'
                ? 'bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Hướng dẫn & 9 Lỗi
          </button>
        </nav>

        {/* Zone 3: Primary Action & Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Lịch sử hồ sơ đã lưu */}
          <button
            onClick={onOpenHistoryModal}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
            title="Xem danh sách các hồ sơ cũ đã lưu trong kho"
          >
            <History className="w-3.5 h-3.5 text-indigo-500" />
            <span className="hidden sm:inline">Kho hồ sơ</span>
            {savedHistoryCount > 0 && (
              <span className="bg-indigo-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                {savedHistoryCount}
              </span>
            )}
          </button>

          {/* Lưu hồ sơ cũ đang xem */}
          {hasData && (
            <button
              onClick={onSaveToHistory}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/60 rounded-lg transition-colors whitespace-nowrap"
              title="Lưu bộ hồ sơ hiện tại vào bộ nhớ lưu trữ để tra cứu lại sau này"
            >
              <BookmarkPlus className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span className="hidden sm:inline">Lưu hồ sơ này</span>
            </button>
          )}

          {/* Nút Làm mới (để nhập hồ sơ từ đầu) */}
          <button
            onClick={onResetData}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 dark:hover:bg-rose-900/60 rounded-lg transition-colors whitespace-nowrap"
            title="Làm mới toàn bộ bảng để nạp hồ sơ mới từ đầu"
          >
            <RotateCcw className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
            <span>Làm mới</span>
          </button>

          {hasData && (
            <>
              <button
                onClick={onExportExcel}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors whitespace-nowrap"
                title="Tải file Excel báo cáo đầy đủ, đẹp và chuyên nghiệp về máy tính"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="hidden sm:inline">Xuất Excel</span>
              </button>

              <button
                onClick={onExportToGoogleDrive}
                className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors whitespace-nowrap"
                title="Lưu báo cáo kiểm soát thẳng vào Google Drive"
              >
                <HardDrive className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>Drive</span>
              </button>
            </>
          )}

          {/* Nút Xuất bộ cài đặt */}
          <button
            onClick={onOpenInstallModal}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors whitespace-nowrap"
            title="Xuất bộ cài đặt phần mềm 1-Click cho máy tính hoặc PWA Desktop"
          >
            <Package className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span className="hidden sm:inline">Xuất bộ cài</span>
          </button>

          {/* Nút Đẩy lên GitHub */}
          <button
            onClick={onOpenGithubModal}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors whitespace-nowrap"
            title="Đẩy toàn bộ mã nguồn lên kho lưu trữ GitHub"
          >
            <FolderGit2 className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
            <span className="hidden sm:inline">Đẩy GitHub</span>
          </button>

          <button
            onClick={toggleDarkMode}
            className="p-1.5 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 rounded-lg border border-slate-200 dark:border-slate-800 transition-colors"
            title={isDarkMode ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
            aria-label="Toggle theme"
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
};
