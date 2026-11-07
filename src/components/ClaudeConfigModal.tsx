import React, { useState, useEffect } from 'react';
import { 
  Key, 
  CheckCircle2, 
  X, 
  AlertCircle, 
  ExternalLink, 
  HelpCircle, 
  Zap, 
  Globe, 
  UserCheck, 
  Check, 
  Copy,
  Cpu,
  Server
} from 'lucide-react';

interface ClaudeConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey: string;
  onSaveApiKey: (key: string, baseURL?: string) => void;
  baseURL?: string;
  model: string;
  onSelectModel: (m: string) => void;
  onTestConnection: (key: string, baseURL: string, model: string) => Promise<{ success: boolean; message: string }>;
}

export const ClaudeConfigModal: React.FC<ClaudeConfigModalProps> = ({
  isOpen,
  onClose,
  apiKey,
  baseURL = '',
  onSaveApiKey,
  model,
  onSelectModel,
  onTestConnection,
}) => {
  const [inputKey, setInputKey] = useState(apiKey);
  const [inputBaseURL, setInputBaseURL] = useState(baseURL || '');
  const [selectedModel, setSelectedModel] = useState(model);
  const [activeTab, setActiveTab] = useState<'api_key' | 'claude_pro_guide'>('api_key');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  useEffect(() => {
    setInputKey(apiKey);
  }, [apiKey]);

  useEffect(() => {
    setInputBaseURL(baseURL || '');
  }, [baseURL]);

  useEffect(() => {
    setSelectedModel(model);
  }, [model]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveApiKey(inputKey.trim(), inputBaseURL.trim());
    onSelectModel(selectedModel);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  const handleTest = async () => {
    if (!inputKey.trim()) {
      setTestResult({
        success: false,
        message: 'Vui lòng nhập Token / API Key trước khi kiểm tra.',
      });
      return;
    }
    setTesting(true);
    setTestResult(null);
    try {
      const res = await onTestConnection(inputKey.trim(), inputBaseURL.trim(), selectedModel);
      setTestResult(res);
    } catch (e: any) {
      setTestResult({
        success: false,
        message: e.message || 'Lỗi không xác định khi kết nối với Anthropic Claude.',
      });
    } finally {
      setTesting(false);
    }
  };

  const copyClaudePrompt = async () => {
    try {
      const res = await fetch('/api/audit/claude-pro-prompt');
      const data = await res.json();
      if (data.prompt) {
        await navigator.clipboard.writeText(data.prompt);
        setCopiedPrompt(true);
        setTimeout(() => setCopiedPrompt(false), 2000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Helper fill sample provider (chotaikhoan hoặc official Anthropic)
  const applyQuickPreset = (type: 'chotaikhoan' | 'anthropic_official') => {
    if (type === 'chotaikhoan') {
      setInputBaseURL('https://api.chotaikhoan.com');
      if (!inputKey.startsWith('sk-ctk-')) {
        // preserve if user already has key
      }
    } else {
      setInputBaseURL('');
    }
    setTestResult(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 font-bold text-lg">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  Cấu Hình Kết Nối Anthropic Claude
                </h3>
                <span className="text-[10px] bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 font-bold px-2 py-0.5 rounded-full border border-amber-300 dark:border-amber-700">
                  Sonnet 3.5 / 3.7 • Opus • Haiku
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Hỗ trợ đầy đủ ANTHROPIC_BASE_URL (Proxy/chotaikhoan.com) & ANTHROPIC_AUTH_TOKEN
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-5 bg-slate-50 dark:bg-slate-950/40 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('api_key')}
            className={`py-3 px-4 font-semibold border-b-2 flex items-center gap-2 transition ${
              activeTab === 'api_key'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>Cách 1: Base URL & Auth Token (Proxy / API)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('claude_pro_guide')}
            className={`py-3 px-4 font-semibold border-b-2 flex items-center gap-2 transition ${
              activeTab === 'claude_pro_guide'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Cách 2: Tài khoản Claude Pro (web claude.ai)</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {activeTab === 'api_key' ? (
            <div className="space-y-4">
              {/* Preset buttons */}
              <div className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  Cổng kết nối nhanh:
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => applyQuickPreset('chotaikhoan')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition ${
                      inputBaseURL.includes('chotaikhoan')
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600'
                    }`}
                  >
                    api.chotaikhoan.com
                  </button>
                  <button
                    type="button"
                    onClick={() => applyQuickPreset('anthropic_official')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition ${
                      !inputBaseURL
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600'
                    }`}
                  >
                    Anthropic Chính hãng
                  </button>
                </div>
              </div>

              {/* Form Input 1: ANTHROPIC_BASE_URL */}
              <div>
                <label className="block font-semibold text-slate-800 dark:text-slate-200 mb-1">
                  1. ANTHROPIC_BASE_URL (Đường dẫn máy chủ Proxy/API):
                </label>
                <div className="relative">
                  <Server className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={inputBaseURL}
                    onChange={(e) => {
                      setInputBaseURL(e.target.value);
                      setTestResult(null);
                    }}
                    placeholder="https://api.chotaikhoan.com (hoặc để trống nếu dùng Anthropic trực tiếp)"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs font-mono text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Nếu bạn mua tài khoản từ bên thứ 3 (như hướng dẫn của chotaikhoan), nhập: <code className="bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 px-1 py-0.5 rounded font-mono">https://api.chotaikhoan.com</code>
                </p>
              </div>

              {/* Form Input 2: ANTHROPIC_AUTH_TOKEN */}
              <div>
                <label className="block font-semibold text-slate-800 dark:text-slate-200 mb-1">
                  2. ANTHROPIC_AUTH_TOKEN / API KEY:
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    value={inputKey}
                    onChange={(e) => {
                      setInputKey(e.target.value);
                      setTestResult(null);
                    }}
                    placeholder="sk-ctk-fc15a46... hoặc sk-ant-..."
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs font-mono text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Mã token xác thực bạn nhận được (bắt đầu bằng <code className="font-mono text-slate-600 dark:text-slate-300">sk-ctk-...</code> hoặc <code className="font-mono text-slate-600 dark:text-slate-300">sk-ant-...</code>).
                </p>
              </div>

              {/* Form Input 3: Model Selection */}
              <div>
                <label className="block font-semibold text-slate-800 dark:text-slate-200 mb-1">
                  3. Phiên bản mô hình Claude (Chính xác theo bảng điều khiển của bạn):
                </label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 font-medium"
                >
                  <optgroup label="Dòng Sonnet & Opus cao cấp (Khuyên dùng cho soi công nhật)">
                    <option value="claude-sonnet-5">
                      claude-sonnet-5 (Nhanh, thông minh, tối ưu nhận diện chữ viết tay & ảnh Timemark)
                    </option>
                    <option value="claude-opus-5-5">
                      claude-opus-5-5 (Mạnh nhất hiện có: suy luận sâu, phân tích ảnh độ khó cao)
                    </option>
                    <option value="claude-opus-5">
                      claude-opus-5 (Bản Opus cân bằng: rất mạnh ở suy luận, giá mềm hơn 5-5)
                    </option>
                    <option value="claude-opus-4-8">
                      claude-opus-4-8 (Opus thế hệ trước: suy luận và phân tích ảnh tốt)
                    </option>
                  </optgroup>
                  <optgroup label="Dòng Fable & Haiku (Ngôn ngữ & Tốc độ)">
                    <option value="claude-fable-5-1">
                      claude-fable-5-1 (Dòng Fable nâng cấp: viết lách, kể chuyện, suy luận mượt)
                    </option>
                    <option value="claude-fable-5">
                      claude-fable-5 (Dòng Fable: mạnh về ngôn ngữ và phân tích ảnh)
                    </option>
                    <option value="claude-haiku-4-5-20251001">
                      claude-haiku-4-5-20251001 (Nhanh & rẻ nhất nhà Claude: hợp việc nhẹ, tốc độ cao)
                    </option>
                  </optgroup>
                  <optgroup label="Mô hình chuẩn Anthropic API gốc">
                    <option value="claude-3-7-sonnet-20250219">
                      claude-3-7-sonnet-20250219 (Bản chuẩn Anthropic Direct)
                    </option>
                    <option value="claude-3-5-sonnet-20241022">
                      claude-3-5-sonnet-20241022 (Bản chuẩn Anthropic Direct)
                    </option>
                  </optgroup>
                </select>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Đã đồng bộ đầy đủ 7 mô hình được hỗ trợ trong tài khoản của bạn: <strong className="text-amber-600 dark:text-amber-400">claude-sonnet-5</strong>, <strong>claude-opus-5-5</strong>, <strong>claude-opus-5</strong>, <strong>claude-opus-4-8</strong>, <strong>claude-fable-5-1</strong>, <strong>claude-fable-5</strong>, <strong>claude-haiku-4-5-20251001</strong>.
                </p>
              </div>

              {/* Status & Test result */}
              {testResult && (
                <div
                  className={`p-3 rounded-xl border flex items-start gap-2.5 text-xs ${
                    testResult.success
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                      : 'bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-800 text-red-800 dark:text-red-300'
                  }`}
                >
                  {testResult.success ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
                  )}
                  <div className="flex-1 font-medium">{testResult.message}</div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold">
                  <UserCheck className="w-4 h-4 text-amber-500" />
                  <span>Cách sử dụng tài khoản Claude Pro (web claude.ai) mà không tốn phí API:</span>
                </div>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  Nếu bạn đã đăng ký gói <strong>Claude Pro</strong> trên trang web <a href="https://claude.ai" target="_blank" rel="noreferrer" className="text-blue-600 dark:text-blue-400 underline font-semibold">claude.ai</a>, bạn không cần phải mua Token hay thiết lập Base URL.
                </p>

                <div className="space-y-2 border-t border-slate-200 dark:border-slate-700 pt-3">
                  <p className="font-semibold text-slate-800 dark:text-slate-200">Quy trình 3 bước:</p>
                  <ol className="list-decimal pl-5 space-y-2 text-slate-600 dark:text-slate-400">
                    <li>
                      <strong>Sao chép Prompt chuẩn KSCP:</strong>
                      <div className="mt-1 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={copyClaudePrompt}
                          className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold flex items-center gap-1.5 transition shadow-xs"
                        >
                          {copiedPrompt ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedPrompt ? 'Đã sao chép Prompt!' : 'Sao chép Prompt KSCP QĐNBC'}</span>
                        </button>
                      </div>
                    </li>
                    <li>
                      <strong>Đính kèm PDF vào Claude Pro:</strong> Vào <a href="https://claude.ai" target="_blank" rel="noreferrer" className="text-blue-600 underline font-medium">claude.ai</a>, tạo đoạn chat mới, đính kèm file PDF biên bản công nhật và dán Prompt vừa copy.
                    </li>
                    <li>
                      <strong>Dán kết quả về app:</strong> Nhấn nút <strong>"Tài khoản Claude Pro"</strong> màu vàng trên giao diện chính của ứng dụng và dán kết quả JSON vào.
                    </li>
                  </ol>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 flex items-center justify-between">
          <div className="text-[11px] text-slate-500">
            {savedSuccess ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Đã lưu cấu hình thành công!
              </span>
            ) : (
              'Hệ thống tự động lưu vào trình duyệt của bạn'
            )}
          </div>

          <div className="flex items-center gap-2">
            {activeTab === 'api_key' && (
              <button
                type="button"
                onClick={handleTest}
                disabled={testing}
                className="px-3.5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold transition flex items-center gap-1.5"
              >
                <Zap className={`w-3.5 h-3.5 text-amber-500 ${testing ? 'animate-spin' : ''}`} />
                <span>{testing ? 'Đang kiểm tra...' : 'Kiểm tra kết nối'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-xs transition"
            >
              Lưu & Áp dụng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
