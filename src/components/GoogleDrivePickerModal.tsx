import React, { useState, useEffect } from 'react';
import { 
  FolderDown, 
  Search, 
  X, 
  FileText, 
  Loader2, 
  CheckCircle2, 
  RefreshCw, 
  AlertCircle,
  ExternalLink,
  HardDrive
} from 'lucide-react';
import { 
  listGoogleDrivePdfFiles, 
  downloadGoogleDriveFile, 
  GoogleDriveFile,
  getAccessToken 
} from '../services/googleDriveAuth';

interface GoogleDrivePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectFiles: (files: File[]) => void;
  onRequestLogin: () => void;
  isLoggedIn: boolean;
  userEmail?: string | null;
}

export const GoogleDrivePickerModal: React.FC<GoogleDrivePickerModalProps> = ({
  isOpen,
  onClose,
  onSelectFiles,
  onRequestLogin,
  isLoggedIn,
  userEmail,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [files, setFiles] = useState<GoogleDriveFile[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && isLoggedIn && getAccessToken()) {
      fetchFiles();
    }
  }, [isOpen, isLoggedIn]);

  const fetchFiles = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const items = await listGoogleDrivePdfFiles(searchTerm);
      setFiles(items);
    } catch (err: any) {
      setError(err.message || 'Không thể tải tệp từ Google Drive.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchFiles();
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === files.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(files.map((f) => f.id)));
    }
  };

  const handleConfirmDownloadAndImport = async () => {
    if (selectedIds.size === 0) return;
    const targets = files.filter((f) => selectedIds.has(f.id));
    setIsDownloading(true);
    setError(null);
    const downloadedFiles: File[] = [];

    try {
      for (let i = 0; i < targets.length; i++) {
        const item = targets[i];
        setDownloadProgress(`Đang tải (${i + 1}/${targets.length}): ${item.name}...`);
        const file = await downloadGoogleDriveFile(item.id, item.name);
        downloadedFiles.push(file);
      }
      onSelectFiles(downloadedFiles);
      onClose();
      setSelectedIds(new Set());
    } catch (err: any) {
      setError(err.message || 'Lỗi trong quá trình nạp tệp từ Google Drive.');
    } finally {
      setIsDownloading(false);
      setDownloadProgress('');
    }
  };

  const formatFileSize = (bytesStr?: string) => {
    if (!bytesStr) return '—';
    const bytes = parseInt(bytesStr, 10);
    if (isNaN(bytes)) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-semibold text-slate-100 text-base sm:text-lg">
                  Chọn hồ sơ PDF từ Google Drive
                </h3>
                <span className="text-xs bg-blue-500/20 text-blue-300 font-medium px-2 py-0.5 rounded-full border border-blue-500/30">
                  Drive API
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {userEmail ? `Tài khoản: ${userEmail}` : 'Kết nối với Google Drive của bạn để nạp hồ sơ kiểm tra'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {!isLoggedIn || !getAccessToken() ? (
          <div className="p-8 text-center flex flex-col items-center justify-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <FolderDown className="w-8 h-8" />
            </div>
            <div className="max-w-md">
              <h4 className="text-base font-semibold text-slate-200 mb-1">
                Yêu cầu cấp quyền Google Drive
              </h4>
              <p className="text-sm text-slate-400 leading-relaxed">
                Để đọc và chọn các file PDF biên bản công nhật từ Google Drive, vui lòng kết nối tài khoản Google của bạn.
              </p>
            </div>
            <button
              onClick={onRequestLogin}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm shadow-lg shadow-blue-600/30 transition flex items-center space-x-2"
            >
              <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Đăng nhập Google Drive</span>
            </button>
          </div>
        ) : (
          <div className="flex-1 flex flex-col p-4 sm:p-5 overflow-hidden">
            {/* Search & Actions Bar */}
            <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 mb-4">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm file PDF trong Drive (vd: QDNBC, thang_10, bien_ban...)"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-950/70 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-xl border border-slate-700 transition"
              >
                Tìm
              </button>
              <button
                type="button"
                onClick={fetchFiles}
                disabled={isLoading}
                title="Làm mới"
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 rounded-xl border border-slate-700 transition"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </form>

            {error && (
              <div className="mb-3 p-3 bg-red-950/40 border border-red-800/60 rounded-xl flex items-start space-x-2 text-xs text-red-300">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="flex-1">{error}</div>
              </div>
            )}

            {/* Selection info */}
            <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-slate-800 mb-2">
              <div className="flex items-center space-x-2">
                <span>Tìm thấy {files.length} tệp PDF</span>
                {files.length > 0 && (
                  <button
                    onClick={handleSelectAll}
                    className="text-blue-400 hover:text-blue-300 font-medium ml-2"
                  >
                    {selectedIds.size === files.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                  </button>
                )}
              </div>
              <span>Đã chọn: <strong className="text-blue-400 font-semibold">{selectedIds.size}</strong> tệp</span>
            </div>

            {/* File List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {isLoading ? (
                <div className="py-12 flex flex-col items-center justify-center text-slate-400 space-y-2">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
                  <p className="text-xs">Đang tìm tệp PDF trên Google Drive của bạn...</p>
                </div>
              ) : files.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-sm">
                  Không tìm thấy tệp PDF nào phù hợp. Vui lòng thử từ khóa khác.
                </div>
              ) : (
                files.map((file) => {
                  const isSelected = selectedIds.has(file.id);
                  return (
                    <div
                      key={file.id}
                      onClick={() => toggleSelect(file.id)}
                      className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition ${
                        isSelected
                          ? 'bg-blue-600/10 border-blue-500/50 text-slate-100'
                          : 'bg-slate-950/40 border-slate-800/80 hover:bg-slate-800/50 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center space-x-3 min-w-0 flex-1">
                        <div
                          className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition ${
                            isSelected
                              ? 'bg-blue-600 border-blue-500 text-white'
                              : 'border-slate-700 bg-slate-900'
                          }`}
                        >
                          {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                        </div>
                        <FileText className="w-5 h-5 text-red-400 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{file.name}</p>
                          <p className="text-[11px] text-slate-500">
                            {formatFileSize(file.size)} • {file.modifiedTime ? new Date(file.modifiedTime).toLocaleDateString('vi-VN') : ''}
                          </p>
                        </div>
                      </div>

                      {file.webViewLink && (
                        <a
                          href={file.webViewLink}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          title="Xem tệp trên Google Drive"
                          className="ml-2 p-1.5 text-slate-500 hover:text-slate-300 hover:bg-slate-800 rounded-lg transition"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        {isLoggedIn && getAccessToken() && (
          <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between">
            <div className="text-xs text-slate-400">
              {isDownloading ? (
                <span className="flex items-center text-blue-400">
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                  {downloadProgress || 'Đang tải file...'}
                </span>
              ) : (
                'Các tệp tải về sẽ được phân tích trực tiếp theo mẫu QĐNBC'
              )}
            </div>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isDownloading}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmDownloadAndImport}
                disabled={selectedIds.size === 0 || isDownloading}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium shadow-lg shadow-blue-600/30 transition flex items-center space-x-1.5"
              >
                {isDownloading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang nạp...</span>
                  </>
                ) : (
                  <>
                    <FolderDown className="w-4 h-4" />
                    <span>Nạp {selectedIds.size} tệp vào kiểm soát</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
