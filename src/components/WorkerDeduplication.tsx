import React, { useState } from 'react';
import { Search, AlertOctagon, UserX, Clock, Filter, CheckCircle2 } from 'lucide-react';
import { WorkerAuditRow } from '../types/audit';

interface WorkerDeduplicationProps {
  workers: WorkerAuditRow[];
}

export const WorkerDeduplication: React.FC<WorkerDeduplicationProps> = ({ workers }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState<'ALL' | 'DUPLICATE' | '3_CA' | 'NO_SIGN'>('ALL');

  const duplicateWorkers = workers.filter((w) => w.is_duplicate);
  const overtimeWorkers = workers.filter((w) => w.is_3_ca);
  const noSignWorkers = workers.filter((w) => !w.co_chu_ky_cn);

  const filteredWorkers = workers.filter((w) => {
    if (filterMode === 'DUPLICATE' && !w.is_duplicate) return false;
    if (filterMode === '3_CA' && !w.is_3_ca) return false;
    if (filterMode === 'NO_SIGN' && w.co_chu_ky_cn) return false;

    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      w.ma_nv.toLowerCase().includes(term) ||
      w.ho_ten.toLowerCase().includes(term) ||
      w.to_doi_khau_tru.toLowerCase().includes(term) ||
      w.du_an.toLowerCase().includes(term) ||
      w.ngay_thang.toLowerCase().includes(term) ||
      w.tay_nghe.toLowerCase().includes(term)
    );
  });

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs mb-8">
      {/* Header & thống kê */}
      <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Bảng Đối Soát Trùng Lặp Nhân Sự & Giờ Làm Việc</span>
              <span className="text-xs px-2 py-0.5 rounded-sm bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-bold font-mono">
                {duplicateWorkers.length} lượt trùng
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Phát hiện các Mã nhân viên xuất hiện ở nhiều tổ đội/bảng công trong cùng 1 ngày, hoặc công nhân làm quá 2 ca liên tục.
            </p>
          </div>

          {/* KPI Mini */}
          <div className="flex items-center gap-3">
            <div className="p-2.5 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-center">
              <div className="text-[11px] text-slate-400">Trùng mã NV / Ngày</div>
              <div className="text-lg font-bold text-rose-600 dark:text-rose-400 font-mono tabular-nums">
                {duplicateWorkers.length}
              </div>
            </div>
            <div className="p-2.5 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-center">
              <div className="text-[11px] text-slate-400">Làm cả 3 ca/ngày</div>
              <div className="text-lg font-bold text-amber-600 dark:text-amber-400 font-mono tabular-nums">
                {overtimeWorkers.length}
              </div>
            </div>
            <div className="p-2.5 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-center">
              <div className="text-[11px] text-slate-400">Thiếu chữ ký</div>
              <div className="text-lg font-bold text-slate-700 dark:text-slate-300 font-mono tabular-nums">
                {noSignWorkers.length}
              </div>
            </div>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo Mã NV 7 số, Họ tên, Tổ đội..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-1.5 p-1 bg-slate-200/60 dark:bg-slate-800 rounded-lg shrink-0 overflow-x-auto">
            <button
              onClick={() => setFilterMode('ALL')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                filterMode === 'ALL'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Tất cả ({workers.length})
            </button>
            <button
              onClick={() => setFilterMode('DUPLICATE')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                filterMode === 'DUPLICATE'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-rose-700 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/60'
              }`}
            >
              Trùng mã NV ({duplicateWorkers.length})
            </button>
            <button
              onClick={() => setFilterMode('3_CA')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                filterMode === '3_CA'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-950/60'
              }`}
            >
              Làm 3 ca ({overtimeWorkers.length})
            </button>
            <button
              onClick={() => setFilterMode('NO_SIGN')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                filterMode === 'NO_SIGN'
                  ? 'bg-slate-700 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              Thiếu chữ ký ({noSignWorkers.length})
            </button>
          </div>
        </div>
      </div>

      {/* Bảng nhân sự */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
              <th className="py-2.5 px-3">Mã NV</th>
              <th className="py-2.5 px-3">Họ và tên</th>
              <th className="py-2.5 px-3">Tay nghề</th>
              <th className="py-2.5 px-3">Ngày</th>
              <th className="py-2.5 px-3">Tổ đội bị đối trừ</th>
              <th className="py-2.5 px-3 text-center">Ca 1</th>
              <th className="py-2.5 px-3 text-center">Ca 2</th>
              <th className="py-2.5 px-3 text-center">Ca 3</th>
              <th className="py-2.5 px-3 text-right">Tổng công</th>
              <th className="py-2.5 px-3 text-center">Ký</th>
              <th className="py-2.5 px-3 min-w-[200px]">Cảnh báo vi phạm</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredWorkers.length === 0 ? (
              <tr>
                <td colSpan={11} className="py-8 text-center text-slate-400 dark:text-slate-500">
                  Không tìm thấy nhân sự nào theo tiêu chí đã chọn.
                </td>
              </tr>
            ) : (
              filteredWorkers.map((w, idx) => (
                <tr
                  key={w.key || idx}
                  className={`transition-colors ${
                    w.is_duplicate
                      ? 'bg-rose-50/60 dark:bg-rose-950/20 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                      : w.is_3_ca
                      ? 'bg-amber-50/60 dark:bg-amber-950/20 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                      : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <td className="py-2.5 px-3 font-mono font-bold text-blue-600 dark:text-blue-400">
                    {w.ma_nv}
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">
                    {w.ho_ten}
                  </td>
                  <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400">
                    {w.tay_nghe}
                  </td>
                  <td className="py-2.5 px-3 font-mono tabular-nums text-slate-700 dark:text-slate-300">
                    {w.ngay_thang}
                  </td>
                  <td className="py-2.5 px-3 font-medium text-slate-700 dark:text-slate-300 max-w-[180px] truncate" title={w.to_doi_khau_tru}>
                    {w.to_doi_khau_tru}
                  </td>
                  <td className="py-2.5 px-3 text-center font-bold text-slate-700 dark:text-slate-300">
                    {w.ca_1 ? '✓' : '-'}
                  </td>
                  <td className="py-2.5 px-3 text-center font-bold text-slate-700 dark:text-slate-300">
                    {w.ca_2 ? '✓' : '-'}
                  </td>
                  <td className="py-2.5 px-3 text-center font-bold text-slate-700 dark:text-slate-300">
                    {w.ca_3 ? '✓' : '-'}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold tabular-nums text-slate-900 dark:text-white">
                    {w.so_cong.toFixed(1)}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    {w.co_chu_ky_cn ? (
                      <span className="text-emerald-600 font-bold">✓</span>
                    ) : (
                      <span className="text-rose-600 font-bold" title="Thiếu chữ ký">✕</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3">
                    {w.is_duplicate ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 dark:text-rose-300 bg-rose-100 dark:bg-rose-950/60 px-2 py-0.5 rounded">
                        <AlertOctagon className="w-3 h-3 text-rose-600 shrink-0" />
                        {w.duplicate_details || 'Trùng lặp cùng ngày'}
                      </span>
                    ) : w.is_3_ca ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60 px-2 py-0.5 rounded">
                        <Clock className="w-3 h-3 text-amber-600 shrink-0" />
                        Làm liên tục 3 ca (1.5 công)
                      </span>
                    ) : !w.co_chu_ky_cn ? (
                      <span className="text-[11px] text-slate-500 italic">
                        Chưa ký cột xác nhận
                      </span>
                    ) : (
                      <span className="text-[11px] text-emerald-600 dark:text-emerald-400">
                        Hợp lệ
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
