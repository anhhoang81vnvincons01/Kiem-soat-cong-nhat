import React, { useState } from 'react';
import {
  ShieldAlert,
  Plus,
  RotateCcw,
  Check,
  AlertTriangle,
  XCircle,
  HelpCircle,
} from 'lucide-react';
import { AuditRuleConfig } from '../types/audit';

interface RuleManagerProps {
  rules: AuditRuleConfig[];
  onToggleRule: (ruleId: string) => void;
  onUpdateSeverity: (ruleId: string, severity: 'VI_PHAM' | 'CANH_BAO') => void;
  onAddRule: (newRule: AuditRuleConfig) => void;
  onResetRules: () => void;
}

export const RuleManager: React.FC<RuleManagerProps> = ({
  rules,
  onToggleRule,
  onUpdateSeverity,
  onAddRule,
  onResetRules,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newRuleName, setNewRuleName] = useState('');
  const [newRuleDesc, setNewRuleDesc] = useState('');
  const [newRuleCat, setNewRuleCat] = useState<'CHUNG_TU' | 'KHOI_LUONG' | 'TIMEMARK' | 'NHAN_DIEN' | 'NHAN_SU' | 'CUSTOM'>('CUSTOM');
  const [newRuleSev, setNewRuleSev] = useState<'VI_PHAM' | 'CANH_BAO'>('VI_PHAM');

  const handleCreateRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRuleName.trim()) return;

    const newRule: AuditRuleConfig = {
      id: `custom_rule_${Date.now()}`,
      code: `CUSTOM_${Date.now().toString().slice(-4)}`,
      name: newRuleName.trim(),
      description: newRuleDesc.trim() || 'Quy tắc kiểm soát tùy biến của người dùng.',
      category: newRuleCat,
      severity: newRuleSev,
      enabled: true,
    };

    onAddRule(newRule);
    setNewRuleName('');
    setNewRuleDesc('');
    setShowAddModal(false);
  };

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'CHUNG_TU': return 'Hồ sơ & Chứng từ';
      case 'KHOI_LUONG': return 'Khối lượng công';
      case 'TIMEMARK': return 'Ảnh & Dấu Timemark';
      case 'NHAN_DIEN': return 'BHLĐ & Nhận diện';
      case 'NHAN_SU': return 'Nhân sự & Chấm công';
      default: return 'Tùy chỉnh riêng';
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs mb-8">
      {/* Top Banner */}
      <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-900">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span>Ma Trận & Cấu Hình Bộ Quy Tắc Kiểm Soát QĐNBC</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Bật/tắt các điều kiện kiểm tra, điều chỉnh mức độ nghiêm trọng (Từ chối chi hoặc Yêu cầu giải trình), hoặc bổ sung quy tắc mới.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onResetRules}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Khôi phục mặc định</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 rounded-lg transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm quy tắc mới</span>
          </button>
        </div>
      </div>

      {/* Danh sách quy tắc */}
      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {rules.map((rule, idx) => (
          <div
            key={rule.id}
            className={`p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${
              !rule.enabled ? 'opacity-50 bg-slate-50/30 dark:bg-slate-900/30' : 'hover:bg-slate-50/60 dark:hover:bg-slate-800/30'
            }`}
          >
            <div className="flex items-start gap-3">
              <span className="font-mono text-xs text-slate-400 pt-0.5 w-6 tabular-nums">
                {(idx + 1).toString().padStart(2, '0')}.
              </span>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    {rule.name}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500 px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded">
                    {rule.code}
                  </span>
                  <span className="text-[10px] text-blue-700 dark:text-blue-300 px-1.5 py-0.5 bg-blue-50 dark:bg-blue-950/60 rounded">
                    {getCategoryLabel(rule.category)}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed max-w-3xl">
                  {rule.description}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
              {/* Dropdown severity */}
              <select
                value={rule.severity}
                onChange={(e) => onUpdateSeverity(rule.id, e.target.value as 'VI_PHAM' | 'CANH_BAO')}
                disabled={!rule.enabled}
                className="text-xs px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="VI_PHAM">🔴 Vi phạm (Từ chối thanh toán)</option>
                <option value="CANH_BAO">🟡 Cảnh báo (Cần giải trình)</option>
              </select>

              {/* Toggle Switch */}
              <button
                type="button"
                onClick={() => onToggleRule(rule.id)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  rule.enabled ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
                role="switch"
                aria-checked={rule.enabled}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    rule.enabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Thêm quy tắc mới */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-5 shadow-xl">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
              Thêm Quy Tắc Kiểm Soát Tùy Biến
            </h4>
            <form onSubmit={handleCreateRule} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tên quy tắc:
                </label>
                <input
                  type="text"
                  required
                  value={newRuleName}
                  onChange={(e) => setNewRuleName(e.target.value)}
                  placeholder="Ví dụ: Yêu cầu đủ 100% chữ ký công nhân"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Phân nhóm quy tắc:
                </label>
                <select
                  value={newRuleCat}
                  onChange={(e) => setNewRuleCat(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="CUSTOM">Quy tắc riêng</option>
                  <option value="CHUNG_TU">Hồ sơ & Chứng từ</option>
                  <option value="KHOI_LUONG">Khối lượng công</option>
                  <option value="TIMEMARK">Ảnh Timemark</option>
                  <option value="NHAN_DIEN">Bảo hộ lao động</option>
                  <option value="NHAN_SU">Nhân sự & Chấm công</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Mức độ xử lý:
                </label>
                <select
                  value={newRuleSev}
                  onChange={(e) => setNewRuleSev(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="VI_PHAM">🔴 Vi phạm (Từ chối thanh toán)</option>
                  <option value="CANH_BAO">🟡 Cảnh báo (Cần giải trình)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Mô tả chi tiết / Căn cứ quy định:
                </label>
                <textarea
                  rows={3}
                  value={newRuleDesc}
                  onChange={(e) => setNewRuleDesc(e.target.value)}
                  placeholder="Diễn giải căn cứ điều kiện để Chuyên viên kiểm soát chi phí áp dụng..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                >
                  Tạo quy tắc
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
