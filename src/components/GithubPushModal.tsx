import React, { useState } from 'react';
import {
  X,
  GitBranch,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
  KeyRound,
  FolderGit2,
} from 'lucide-react';

interface GithubPushModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GithubPushModal: React.FC<GithubPushModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [repoUrl, setRepoUrl] = useState('https://github.com/anhhoang81vnvincons01/Kiem-soat-cong-nhat.git');
  const [token, setToken] = useState('');
  const [branch, setBranch] = useState('main');
  const [commitMessage, setCommitMessage] = useState('Phiên bản Hệ thống Kiểm Soát Công Nhật QĐNBC v1.0 (Vincons KSCP)');
  const [isPushing, setIsPushing] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; details?: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'auto' | 'manual'>('auto');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handlePush = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoUrl.trim()) {
      alert('Vui lòng nhập đường dẫn GitHub Repository (ví dụ: https://github.com/username/ten-repo.git)');
      return;
    }
    if (!token.trim()) {
      alert('Vui lòng nhập GitHub Personal Access Token (PAT) để xác thực quyền đẩy mã nguồn.');
      return;
    }

    setIsPushing(true);
    setResult(null);

    try {
      const response = await fetch('/api/github/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repoUrl: repoUrl.trim(),
          token: token.trim(),
          branch: branch.trim() || 'main',
          commitMessage: commitMessage.trim(),
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Lỗi khi đẩy mã nguồn lên GitHub');
      }

      setResult({
        success: true,
        message: data.message || 'Đã đẩy toàn bộ mã nguồn lên GitHub thành công!',
        details: data.details,
      });
    } catch (err: any) {
      setResult({
        success: false,
        message: err.message || 'Không thể đẩy lên GitHub. Vui lòng kiểm tra lại Token hoặc quyền truy cập của Repo.',
      });
    } finally {
      setIsPushing(false);
    }
  };

  const manualCommands = `# 1. Khởi tạo Git & Nhánh chính
git init
git add .
git commit -m "Phiên bản Hệ thống Kiểm Soát Công Nhật QĐNBC v1.0"
git branch -M main

# 2. Kết nối tới Repository của bạn trên GitHub
git remote add origin ${repoUrl || 'https://github.com/<tai-khoan>/<ten-repo>.git'}

# 3. Đẩy toàn bộ mã nguồn lên
git push -u origin main --force`;

  const copyCommands = () => {
    navigator.clipboard.writeText(manualCommands);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-800 border border-slate-700 rounded-xl">
              <FolderGit2 className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">Đẩy Mã Nguồn Lên GitHub</h3>
              <p className="text-xs text-slate-300">Đồng bộ kho lưu trữ & Quản lý phiên bản trực tuyến</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab chuyển đổi */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 px-6 pt-3 gap-2">
          <button
            onClick={() => setActiveTab('auto')}
            className={`pb-3 px-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'auto'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700'
            }`}
          >
            <UploadCloud className="w-4 h-4" />
            Đẩy Tự Động (1-Click)
          </button>
          <button
            onClick={() => setActiveTab('manual')}
            className={`pb-3 px-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'manual'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700'
            }`}
          >
            <GitBranch className="w-4 h-4" />
            Lệnh Git Thủ Công
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {activeTab === 'auto' ? (
            <form onSubmit={handlePush} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  1. Đường dẫn GitHub Repository URL (HTTPS)
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://github.com/username/kiem-soat-cong-nhat.git"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-mono"
                />
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Tạo repository mới trên GitHub (public hoặc private), sau đó sao chép đường dẫn HTTPS dán vào đây.
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-amber-500" />
                    2. GitHub Personal Access Token (PAT)
                  </label>
                  <a
                    href="https://github.com/settings/tokens/new?scopes=repo&description=KiemSoatCongNhat"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1"
                  >
                    Tạo Token mới trên GitHub
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <input
                  type="password"
                  required
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxx hoặc github_pat_..."
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-mono"
                />
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Yêu cầu quyền tích vào ô <strong>`repo`</strong> (Full control of private repositories).
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Nhánh (Branch)
                  </label>
                  <input
                    type="text"
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Ghi chú Commit
                  </label>
                  <input
                    type="text"
                    value={commitMessage}
                    onChange={(e) => setCommitMessage(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                  />
                </div>
              </div>

              {result && (
                <div
                  className={`p-3.5 rounded-xl border flex items-start gap-3 ${
                    result.success
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                      : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
                  }`}
                >
                  {result.success ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <div className="text-xs space-y-1">
                    <p className="font-semibold">{result.message}</p>
                    {result.details && (
                      <p className="text-[11px] font-mono opacity-80">{result.details}</p>
                    )}
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isPushing}
                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                {isPushing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Đang đẩy mã nguồn lên GitHub...
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-5 h-5" />
                    Bắt Đầu Đẩy Mã Nguồn Lên GitHub
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Nếu bạn muốn đẩy mã nguồn thủ công qua Terminal trên máy tính, chỉ cần mở Terminal/PowerShell tại thư mục phần mềm và dán các lệnh sau:
              </p>

              <div className="relative">
                <pre className="p-3.5 bg-slate-950 text-slate-200 text-xs font-mono rounded-xl overflow-x-auto whitespace-pre-wrap">
                  {manualCommands}
                </pre>
                <button
                  onClick={copyCommands}
                  className="absolute top-2.5 right-2.5 px-2.5 py-1 text-[11px] font-semibold bg-slate-800 hover:bg-slate-700 text-white rounded-lg flex items-center gap-1 border border-slate-700 transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" />
                  {copied ? 'Đã chép!' : 'Sao chép'}
                </button>
              </div>
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
