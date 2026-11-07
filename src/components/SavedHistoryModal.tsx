import React from 'react';
import { 
  History, 
  X, 
  Trash2, 
  FolderOpen, 
  Calendar, 
  FileText, 
  Building2, 
  Users, 
  AlertTriangle,
  Clock,
  HardDrive
} from 'lucide-react';
import { DailyRecordBatch } from '../types/audit';

export interface SavedHistoryItem {
  id: string;
  name: string;
  savedAt: string;
  batchCount: number;
  totalWorkers: number;
  totalCost: number;
  batches: DailyRecordBatch[];
}

interface SavedHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  historyList: SavedHistoryItem[];
  onLoadHistory: (item: SavedHistoryItem) => void;
  onDeleteHistory: (id: string) => void;
  onClearAll: () => void;
}

export const SavedHistoryModal: React.FC<SavedHistoryModalProps> = ({
  isOpen,
  onClose,
  historyList,
  onLoadHistory,
  onDeleteHistory,
  onClearAll,
}) => {
  if (!isOpen) return null;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/60">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  Kho Lưu Trữ Hồ Sơ Cũ
                </h3>
                <span className="text-xs bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-semibold px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800">
                  {historyList.length} hồ sơ
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Lưu trữ các đợt kiểm soát trước đó để bạn có thể mở lại đối chiếu bất cứ lúc nào
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

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 text-xs">
          {historyList.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <HardDrive className="w-10 h-10 mx-auto opacity-30" />
              <p className="text-sm font-medium">Chưa có hồ sơ cũ nào được lưu</p>
              <p className="text-xs max-w-xs mx-auto text-slate-500">
                Khi kiểm tra một bộ hồ sơ, hãy nhấn nút <strong>"Lưu hồ sơ này"</strong> trên thanh điều hướng để lưu vào kho này.
              </p>
            </div>
          ) : (
            historyList.map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:border-indigo-400 dark:hover:border-indigo-600 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
              >
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-white text-sm">
                      {item.name}
                    </span>
                    <span className="text-[10px] text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(item.savedAt).toLocaleString('vi-VN')}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-slate-500 dark:text-slate-400 text-[11px]">
                    <span className="flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5 text-blue-500" />
                      {item.batchCount} đợt / ngày
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-amber-500" />
                      {item.totalWorkers} công nhân
                    </span>
                    <span>•</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400 font-mono">
                      {formatCurrency(item.totalCost)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={() => {
                      onLoadHistory(item);
                      onClose();
                    }}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold flex items-center gap-1.5 shadow-xs transition"
                  >
                    <FolderOpen className="w-3.5 h-3.5" />
                    <span>Mở hồ sơ này</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteHistory(item.id)}
                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition"
                    title="Xóa hồ sơ khỏi kho"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {historyList.length > 0 && (
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 flex items-center justify-between text-xs">
            <span className="text-slate-500">
              Dữ liệu được lưu an toàn trong trình duyệt của bạn
            </span>
            <button
              type="button"
              onClick={onClearAll}
              className="text-red-600 hover:text-red-700 dark:text-red-400 font-medium hover:underline"
            >
              Xóa toàn bộ kho lưu trữ
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
