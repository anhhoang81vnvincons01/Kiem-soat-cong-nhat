import React from 'react';
import { FileText, AlertTriangle, XCircle, CheckCircle2, Users, Coins } from 'lucide-react';

interface MetricsOverviewProps {
  totalBatches: number;
  violateBatches: number;
  warningBatches: number;
  validBatches: number;
  totalWorkers: number;
  totalCost: number;
  donGia: number;
}

export const MetricsOverview: React.FC<MetricsOverviewProps> = ({
  totalBatches,
  violateBatches,
  warningBatches,
  validBatches,
  totalWorkers,
  totalCost,
  donGia,
}) => {
  const formatMoney = (val: number) => {
    return new Intl.NumberFormat('vi-VN').format(val) + ' đ';
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 mb-6">
      {/* Metric 1: Tổng hồ sơ */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
          <span className="text-xs font-medium">Tổng hồ sơ (Ngày)</span>
          <FileText className="w-4 h-4 text-blue-500" />
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white tabular-nums font-mono">
            {totalBatches}
          </span>
          <span className="text-xs text-slate-400">bộ chứng từ</span>
        </div>
      </div>

      {/* Metric 2: Vi phạm đỏ */}
      <div className="bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/60 rounded-xl p-3.5 flex flex-col justify-between">
        <div className="flex items-center justify-between text-rose-700 dark:text-rose-400">
          <span className="text-xs font-semibold">Vi phạm QĐNBC</span>
          <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-rose-700 dark:text-rose-300 tabular-nums font-mono">
            {violateBatches}
          </span>
          <span className="text-xs text-rose-600/80 dark:text-rose-400">từ chối chi</span>
        </div>
      </div>

      {/* Metric 3: Cảnh báo vàng */}
      <div className="bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/60 rounded-xl p-3.5 flex flex-col justify-between">
        <div className="flex items-center justify-between text-amber-700 dark:text-amber-400">
          <span className="text-xs font-semibold">Cảnh báo rà soát</span>
          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-amber-700 dark:text-amber-300 tabular-nums font-mono">
            {warningBatches}
          </span>
          <span className="text-xs text-amber-600/80 dark:text-amber-400">cần giải trình</span>
        </div>
      </div>

      {/* Metric 4: Hợp lệ */}
      <div className="bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/60 rounded-xl p-3.5 flex flex-col justify-between">
        <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400">
          <span className="text-xs font-semibold">Hợp lệ duyệt</span>
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-emerald-700 dark:text-emerald-300 tabular-nums font-mono">
            {validBatches}
          </span>
          <span className="text-xs text-emerald-600/80 dark:text-emerald-400">đạt chuẩn</span>
        </div>
      </div>

      {/* Metric 5: Tổng nhân sự */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
          <span className="text-xs font-medium">Tổng lượt công nhân</span>
          <Users className="w-4 h-4 text-indigo-500" />
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white tabular-nums font-mono">
            {totalWorkers}
          </span>
          <span className="text-xs text-slate-400">lượt chấm công</span>
        </div>
      </div>

      {/* Metric 6: Tổng tiền tạm tính */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
          <span className="text-xs font-medium">Giá trị đối trừ</span>
          <Coins className="w-4 h-4 text-emerald-500" />
        </div>
        <div className="mt-2 flex flex-col">
          <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white tabular-nums font-mono truncate">
            {formatMoney(totalCost)}
          </span>
          <span className="text-[11px] text-slate-400 tabular-nums">
            Đơn giá: {formatMoney(donGia)}/công
          </span>
        </div>
      </div>
    </div>
  );
};
