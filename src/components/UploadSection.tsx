import React, { useState, useRef } from 'react';
import {
  Upload,
  Sparkles,
  FileText,
  RefreshCw,
  Cpu,
  Key,
  Copy,
  Check,
  ExternalLink,
  MessageSquareCode,
  HardDrive,
  Settings2,
} from 'lucide-react';
import { ClaudeConfigModal } from './ClaudeConfigModal';

interface UploadSectionProps {
  onProcessFiles: (
    files: File[],
    config: {
      aiProvider: 'gemini' | 'claude' | 'tesseract';
      claudeApiKey?: string;
      claudeBaseURL?: string;
      claudeModel?: string;
    }
  ) => void;
  onImportClaudePro: (rawText: string) => void;
  onLoadSample: () => void;
  onOpenGoogleDrivePicker: () => void;
  isGoogleLoggedIn: boolean;
  googleUserEmail?: string | null;
  isProcessing: boolean;
  processStatus: string;
  progressPercent: number;
  donGia: number;
  setDonGia: (val: number) => void;
}

export const UploadSection: React.FC<UploadSectionProps> = ({
  onProcessFiles,
  onImportClaudePro,
  onLoadSample,
  onOpenGoogleDrivePicker,
  isGoogleLoggedIn,
  googleUserEmail,
  isProcessing,
  processStatus,
  progressPercent,
  donGia,
  setDonGia,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cấu hình mô hình AI & OCR - Mặc định Claude vì đã cài sẵn token và proxy
  const [aiProvider, setAiProvider] = useState<'gemini' | 'claude' | 'tesseract'>(() => {
    return (typeof window !== 'undefined' ? (localStorage.getItem('ai_provider') as any) : null) || 'claude';
  });
  const [claudeApiKey, setClaudeApiKey] = useState(() => {
    return typeof window !== 'undefined' ? localStorage.getItem('claude_api_key') || '' : '';
  });
  const [claudeBaseURL, setClaudeBaseURL] = useState(() => {
    return typeof window !== 'undefined' ? localStorage.getItem('claude_base_url') || '' : '';
  });
  const [claudeModel, setClaudeModel] = useState(() => {
    return typeof window !== 'undefined' ? localStorage.getItem('claude_model') || 'claude-sonnet-5' : 'claude-sonnet-5';
  });
  const [showClaudeConfigModal, setShowClaudeConfigModal] = useState(false);
  const [showClaudeProModal, setShowClaudeProModal] = useState(false);
  const [claudeProText, setClaudeProText] = useState('');
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  const filterSupportedFiles = (fileList: FileList | File[]) => {
    return Array.from(fileList).filter((f) => {
      const name = f.name.toLowerCase();
      return (
        f.type === 'application/pdf' ||
        f.type.startsWith('image/') ||
        name.endsWith('.pdf') ||
        name.endsWith('.png') ||
        name.endsWith('.jpg') ||
        name.endsWith('.jpeg') ||
        name.endsWith('.webp')
      );
    });
  };

  const handleSelectAiProvider = (provider: 'gemini' | 'claude' | 'tesseract') => {
    setAiProvider(provider);
    if (typeof window !== 'undefined') {
      localStorage.setItem('ai_provider', provider);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const validFiles = filterSupportedFiles(e.dataTransfer.files);
      if (validFiles.length > 0) {
        onProcessFiles(validFiles, { aiProvider, claudeApiKey, claudeBaseURL, claudeModel });
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const validFiles = filterSupportedFiles(e.target.files);
      if (validFiles.length > 0) {
        onProcessFiles(validFiles, { aiProvider, claudeApiKey, claudeBaseURL, claudeModel });
      }
      e.target.value = '';
    }
  };

  const copyClaudePrompt = async () => {
    try {
      const res = await fetch('/api/audit/claude-pro-prompt');
      const data = await res.json();
      if (data.prompt) {
        await navigator.clipboard.writeText(data.prompt);
        setCopiedPrompt(true);
        setTimeout(() => setCopiedPrompt(false), 2500);
      }
    } catch (e) {
      console.error('Lỗi sao chép prompt:', e);
    }
  };

  const handleSubmitClaudePro = (e: React.FormEvent) => {
    e.preventDefault();
    if (!claudeProText.trim()) return;
    onImportClaudePro(claudeProText);
    setClaudeProText('');
    setShowClaudeProModal(false);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 mb-6 shadow-xs">
      {/* Top Header & Settings */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>Tải Lên Hồ Sơ Công Nhật Đối Trừ (PDF / Ảnh)</span>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-sm bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
              QĐNBC Chuẩn
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Bóc tách chữ viết tay Biên bản hiện trường & Nhật ký công nhật, nhận diện khuôn mặt và thẻ Timemark qua Claude AI hoặc OCR.
          </p>
        </div>

        {/* Thanh chọn AI Engine & Đơn giá */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Chọn AI Provider */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
            <button
              type="button"
              onClick={() => handleSelectAiProvider('claude')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                aiProvider === 'claude'
                  ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>Anthropic Claude</span>
            </button>
            <button
              type="button"
              onClick={() => handleSelectAiProvider('tesseract')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                aiProvider === 'tesseract'
                  ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>Tesseract OCR (Google)</span>
            </button>
            <button
              type="button"
              onClick={() => handleSelectAiProvider('gemini')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                aiProvider === 'gemini'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>Google Gemini</span>
            </button>
          </div>

          {/* Nút Claude Pro Importer */}
          <button
            type="button"
            onClick={() => setShowClaudeProModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors whitespace-nowrap"
          >
            <MessageSquareCode className="w-3.5 h-3.5 text-amber-600" />
            <span>Tài khoản Claude Pro</span>
          </button>

          {/* Nút Chọn từ Google Drive */}
          <button
            type="button"
            onClick={onOpenGoogleDrivePicker}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap ${
              isGoogleLoggedIn
                ? 'text-blue-800 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/50 border-blue-300 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/50'
                : 'text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
            title={isGoogleLoggedIn ? `Google Drive: ${googleUserEmail}` : 'Kết nối Google Drive để chọn hồ sơ PDF'}
          >
            <HardDrive className="w-3.5 h-3.5 text-blue-500" />
            <span>{isGoogleLoggedIn ? 'Chọn từ Google Drive' : 'Kết nối Google Drive'}</span>
          </button>

          {/* Cấu hình đơn giá */}
          <div className="flex items-center gap-2 shrink-0 bg-slate-50 dark:bg-slate-800/60 p-1 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
            <label htmlFor="unit-price-input" className="text-xs font-medium text-slate-600 dark:text-slate-300 whitespace-nowrap">
              Đơn giá:
            </label>
            <input
              id="unit-price-input"
              type="number"
              value={donGia}
              onChange={(e) => setDonGia(Math.max(0, Number(e.target.value) || 0))}
              step={10000}
              className="w-24 text-xs font-semibold tabular-nums font-mono px-2 py-0.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-white focus:outline-none"
            />
            <span className="text-[11px] text-slate-400">đ/công</span>
          </div>
        </div>
      </div>

      {/* Cấu hình thêm nếu chọn Claude API */}
      {aiProvider === 'claude' && (
        <div className="mt-3 p-3 bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300">
            <Key className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="font-semibold">Cấu hình Claude API:</span>
            {claudeApiKey ? (
              <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full font-medium">
                ✓ Đã có Key
              </span>
            ) : (
              <span className="text-[10px] bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded-full font-medium">
                Cần cấu hình API Key hoặc Pro
              </span>
            )}
          </div>
          <div className="flex flex-1 max-w-lg items-center gap-2">
            <input
              type="password"
              value={claudeApiKey}
              onChange={(e) => setClaudeApiKey(e.target.value)}
              placeholder="Nhập Anthropic API Key (sk-ant-...)"
              className="flex-1 px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 rounded-lg text-xs font-mono text-slate-900 dark:text-white focus:outline-none"
            />
            <select
              value={claudeModel}
              onChange={(e) => setClaudeModel(e.target.value)}
              className="px-2 py-1.5 bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 rounded-lg text-xs text-slate-900 dark:text-white font-medium"
            >
              <option value="claude-sonnet-5">claude-sonnet-5 (Khuyên dùng)</option>
              <option value="claude-opus-5-5">claude-opus-5-5 (Mạnh nhất)</option>
              <option value="claude-opus-5">claude-opus-5 (Cân bằng)</option>
              <option value="claude-opus-4-8">claude-opus-4-8</option>
              <option value="claude-fable-5-1">claude-fable-5-1</option>
              <option value="claude-fable-5">claude-fable-5</option>
              <option value="claude-haiku-4-5-20251001">claude-haiku-4-5-20251001 (Rẻ nhất)</option>
            </select>
            <button
              type="button"
              onClick={() => setShowClaudeConfigModal(true)}
              className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium text-xs whitespace-nowrap transition"
            >
              Hướng dẫn & Test
            </button>
          </div>
        </div>
      )}

      {/* Banner thông tin khi chọn Tesseract OCR */}
      {aiProvider === 'tesseract' && (
        <div className="mt-3 p-3 bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 rounded-xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span>
              <strong>Tesseract OCR (Mã nguồn mở Google):</strong> Nhận diện chữ & bảng biểu chạy 100% Offline/Cục bộ trên máy, hoàn toàn miễn phí, không gửi ảnh tài liệu công trình ra ngoài. Phù hợp bóc tách bảng biểu in và số liệu rõ nét.
            </span>
          </div>
          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 whitespace-nowrap self-start sm:self-auto">
            Không cần API Key
          </span>
        </div>
      )}

      {/* Vùng kéo thả file */}
      <div className="mt-4">
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
            dragActive
              ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20'
              : 'border-slate-300 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-600 hover:bg-slate-50/50 dark:hover:bg-slate-800/30'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf, .png, .jpg, .jpeg, .webp, image/*"
            multiple
            onChange={handleChange}
            className="hidden"
          />

          <div className="flex flex-col items-center justify-center gap-2">
            <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                Kéo thả file PDF hoặc Ảnh hồ sơ vào đây hoặc <span className="text-blue-600 dark:text-blue-400 underline">chọn từ máy tính</span>
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                Đang xử lý qua mô hình: <strong className="text-amber-600 dark:text-amber-400">{aiProvider === 'claude' ? `Claude (${claudeModel})` : aiProvider === 'gemini' ? 'Gemini 3.8 Flash Vision' : 'Tesseract OCR (Google Offline)'}</strong>
              </p>
            </div>
          </div>
        </div>

        {/* Tiến trình quét */}
        {isProcessing && (
          <div className="mt-4 p-4 rounded-xl bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60">
            <div className="flex items-center justify-between text-xs font-semibold text-blue-900 dark:text-blue-200 mb-1.5">
              <span className="flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600 dark:text-blue-400" />
                {processStatus || 'Đang phân tích hồ sơ qua AI Vision...'}
              </span>
              <span className="tabular-nums font-mono">{Math.round(progressPercent)}%</span>
            </div>
            <div className="w-full bg-blue-200/60 dark:bg-blue-900/50 rounded-full h-2 overflow-hidden">
              <div
                className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Nút nạp hồ sơ mẫu nhanh & Chạy thử tệp thực tế */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Thử nghiệm nhanh dữ liệu thực tế:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={async () => {
                try {
                  const resp = await fetch('/assets/aistudio/1_7.BBK_Ho_ng_Trung_Anh_3877531_31.03.XD_K__2_425149d1.pdf');
                  const blob = await resp.blob();
                  const sampleFile = new File([blob], '1_7.BBK_Hoang_Trung_Anh_3877531_15trang.pdf', { type: 'application/pdf' });
                  onProcessFiles([sampleFile], { aiProvider, claudeApiKey, claudeBaseURL, claudeModel });
                } catch (e) {
                  console.error('Lỗi tải tệp mẫu:', e);
                }
              }}
              disabled={isProcessing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors shadow-xs"
            >
              <FileText className="w-3.5 h-3.5 text-emerald-600" />
              <span>Chạy quét trực tiếp file 15 trang thực tế (Hoàng Trung Anh)</span>
            </button>

            <button
              type="button"
              onClick={onLoadSample}
              disabled={isProcessing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Nạp 5 bộ mẫu giả lập</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modal Hướng dẫn & Nhập từ tài khoản Claude Pro (claude.ai) */}
      {showClaudeProModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl p-6 shadow-2xl text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold">
                  Pro
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Sử Dụng Tài Khoản Claude Pro (claude.ai)
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Dành cho bạn có tài khoản Claude Pro trên web mà không cần đăng ký Claude API riêng
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowClaudeProModal(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-4">
              {/* Bước 1 */}
              <div className="p-3 bg-amber-50/60 dark:bg-slate-800 rounded-xl border border-amber-200 dark:border-slate-700">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-amber-900 dark:text-amber-300">
                    Bước 1: Sao chép Prompt KSCP chuẩn
                  </span>
                  <button
                    type="button"
                    onClick={copyClaudePrompt}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-[11px] font-semibold"
                  >
                    {copiedPrompt ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedPrompt ? 'Đã sao chép!' : 'Sao chép Prompt'}</span>
                  </button>
                </div>
                <p className="text-slate-600 dark:text-slate-400 text-[11px]">
                  Mở trang web <a href="https://claude.ai" target="_blank" rel="noreferrer" className="text-blue-600 dark:text-blue-400 underline font-semibold">claude.ai</a>, đính kèm file PDF hồ sơ công nhật của bạn và dán Prompt này vào khung chat.
                </p>
              </div>

              {/* Bước 2 */}
              <form onSubmit={handleSubmitClaudePro} className="space-y-3">
                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Bước 2: Dán kết quả JSON nhận được từ Claude Pro vào đây:
                  </label>
                  <textarea
                    rows={6}
                    required
                    value={claudeProText}
                    onChange={(e) => setClaudeProText(e.target.value)}
                    placeholder='Dán toàn bộ câu trả lời JSON của Claude Pro (bắt đầu bằng { "cac_bo_ho_so": [ ... ] })...'
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono text-[11px] focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowClaudeProModal(false)}
                    className="px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Đóng
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>Nạp Dữ Liệu & Chạy Kiểm Soát QĐNBC</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal Cấu Hình & Kiểm Tra Anthropic Claude */}
      <ClaudeConfigModal
        isOpen={showClaudeConfigModal}
        onClose={() => setShowClaudeConfigModal(false)}
        apiKey={claudeApiKey}
        baseURL={claudeBaseURL}
        onSaveApiKey={(key, base) => {
          setClaudeApiKey(key);
          setClaudeBaseURL(base || '');
          if (typeof window !== 'undefined') {
            localStorage.setItem('claude_api_key', key);
            localStorage.setItem('claude_base_url', base || '');
          }
        }}
        model={claudeModel}
        onSelectModel={(m) => {
          setClaudeModel(m);
          if (typeof window !== 'undefined') {
            localStorage.setItem('claude_model', m);
          }
        }}
        onTestConnection={async (key, base, m) => {
          const res = await fetch('/api/audit/test-claude', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ apiKey: key, baseURL: base, model: m }),
          });
          const data = await res.json();
          if (!res.ok || !data.success) {
            throw new Error(data.error || 'Kiểm tra kết nối thất bại.');
          }
          return { success: true, message: data.message };
        }}
      />
    </div>
  );
};
