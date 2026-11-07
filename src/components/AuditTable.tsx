import React, { useState } from 'react';
import {
  Search,
  Filter,
  Eye,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  ChevronDown,
  ArrowUpDown,
  ExternalLink,
  FileText,
} from 'lucide-react';
import { AuditBatchSummary, AuditStatus } from '../types/audit';

interface AuditTableProps {
  summaries: AuditBatchSummary[];
  onSelectBatch: (batch: AuditBatchSummary) => void;
  onOpenOriginalPage: (batch: AuditBatchSummary) => void;
  selectedBatchId?: string;
  donGiaMacDinh: number;
}

export const AuditTable: React.FC<AuditTableProps> = ({
  summaries,
  onSelectBatch,
  onOpenOriginalPage,
  selectedBatchId,
  donGiaMacDinh,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | AuditStatus>('ALL');
  
  // Yêu cầu 3: Mặc định sắp xếp theo File trong folder -> Trang trong file
  const [sortBy, setSortBy] = useState<'file_page' | 'date' | 'status' | 'cost' | 'diff'>('file_page');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const formatMoney = (val: number) => {
    return new Intl.NumberFormat('vi-VN').format(val) + ' đ';
  };

  const filteredSummaries = summaries
    .filter((s) => {
      if (statusFilter !== 'ALL' && s.trang_thai !== statusFilter) {
        return false;
      }
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      return (
        s.file_name.toLowerCase().includes(term) ||
        s.du_an_phan_khu.toLowerCase().includes(term) ||
        s.to_doi_khau_tru.toLowerCase().includes(term) ||
        s.ngay_thang.toLowerCase().includes(term) ||
        s.noi_dung_cong_viec.toLowerCase().includes(term) ||
        s.raw_batch.danh_sach_cong_nhan.some(
          (w) => w.ma_nv.toLowerCase().includes(term) || w.ho_ten.toLowerCase().includes(term)
        )
      );
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'file_page') {
        const fileCmp = a.file_name.localeCompare(b.file_name, 'vi', { numeric: true });
        if (fileCmp !== 0) return sortOrder === 'asc' ? fileCmp : -fileCmp;
        const pageDiff = (a.trang_bat_dau || 1) - (b.trang_bat_dau || 1);
        return sortOrder === 'asc' ? pageDiff : -pageDiff;
      } else if (sortBy === 'status') {
        const priority: Record<AuditStatus, number> = { VI_PHAM: 3, CANH_BAO: 2, HOP_LE: 1 };
        comparison = priority[b.trang_thai] - priority[a.trang_thai];
      } else if (sortBy === 'cost') {
        comparison = b.gia_tri_tam_tinh - a.gia_tri_tam_tinh;
      } else if (sortBy === 'diff') {
        const diffA = Math.abs(a.so_cong_bien_ban - a.so_cong_nhat_ky);
        const diffB = Math.abs(b.so_cong_bien_ban - b.so_cong_nhat_ky);
        comparison = diffB - diffA;
      } else if (sortBy === 'date') {
        comparison = a.ngay_thang.localeCompare(b.ngay_thang);
      }
      return sortOrder === 'desc' ? comparison : -comparison;
    });

  const toggleSort = (type: 'file_page' | 'date' | 'status' | 'cost' | 'diff') => {
    if (sortBy === type) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(type);
      setSortOrder(type === 'file_page' ? 'asc' : 'desc');
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs mb-8">
      {/* Thanh tìm kiếm và bộ lọc */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo Dự án, Tổ đội, Mã NV (7 số), Họ tên..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Nút lọc sắp xếp và trạng thái */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Nút sắp xếp File -> Trang */}
          <button
            type="button"
            onClick={() => toggleSort('file_page')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              sortBy === 'file_page'
                ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-800'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:text-slate-900'
            }`}
            title="Thứ tự: File trong thư mục -> Số trang trong file"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span>Xếp theo File → Trang {sortBy === 'file_page' && (sortOrder === 'asc' ? '↑' : '↓')}</span>
          </button>

          {/* Bộ lọc trạng thái segmented button */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg shrink-0 overflow-x-auto">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                statusFilter === 'ALL'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Tất cả ({summaries.length})
            </button>
            <button
              onClick={() => setStatusFilter('VI_PHAM')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                statusFilter === 'VI_PHAM'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40'
              }`}
            >
              Vi phạm ({summaries.filter((s) => s.trang_thai === 'VI_PHAM').length})
            </button>
            <button
              onClick={() => setStatusFilter('CANH_BAO')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                statusFilter === 'CANH_BAO'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40'
              }`}
            >
              Cảnh báo ({summaries.filter((s) => s.trang_thai === 'CANH_BAO').length})
            </button>
            <button
              onClick={() => setStatusFilter('HOP_LE')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                statusFilter === 'HOP_LE'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
              }`}
            >
              Hợp lệ ({summaries.filter((s) => s.trang_thai === 'HOP_LE').length})
            </button>
          </div>
        </div>
      </div>

      {/* Bảng dữ liệu chính */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
              <th className="py-2.5 px-3 whitespace-nowrap">STT</th>

              {/* Yêu cầu 2: Cột mở trang file gốc */}
              <th className="py-2.5 px-3 min-w-[190px] whitespace-nowrap">
                <button
                  onClick={() => toggleSort('file_page')}
                  className="inline-flex items-center gap-1 hover:text-slate-900 dark:hover:text-white"
                >
                  File gốc & Trang (Link mở)
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>

              <th className="py-2.5 px-3 whitespace-nowrap">
                <button
                  onClick={() => toggleSort('date')}
                  className="inline-flex items-center gap-1 hover:text-slate-900 dark:hover:text-white"
                >
                  Ngày thực hiện
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              
              <th className="py-2.5 px-3 min-w-[150px]">Dự án / Phân khu</th>
              
              {/* Yêu cầu người dùng: Có cột tổ được cộng, tổ bị trừ riêng biệt */}
              <th className="py-2.5 px-3 min-w-[160px] text-emerald-700 dark:text-emerald-400 font-bold">
                Tổ được cộng (+)
              </th>
              
              <th className="py-2.5 px-3 min-w-[160px] text-rose-700 dark:text-rose-400 font-bold">
                Tổ bị trừ (-)
              </th>
              
              <th className="py-2.5 px-3 text-right whitespace-nowrap">
                <button
                  onClick={() => toggleSort('diff')}
                  className="inline-flex items-center gap-1 hover:text-slate-900 dark:hover:text-white justify-end w-full"
                >
                  Công BB / NK
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              
              {/* Yêu cầu 1: Cột đơn giá ưu tiên lấy theo biên bản */}
              <th className="py-2.5 px-3 text-right whitespace-nowrap">
                Đơn giá áp dụng
              </th>

              <th className="py-2.5 px-3 text-center whitespace-nowrap">Giờ In - Out</th>
              <th className="py-2.5 px-3 text-center whitespace-nowrap">Quân số ảnh</th>
              
              <th className="py-2.5 px-3 text-right whitespace-nowrap">
                <button
                  onClick={() => toggleSort('cost')}
                  className="inline-flex items-center gap-1 hover:text-slate-900 dark:hover:text-white justify-end w-full"
                >
                  Giá trị đối trừ
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              
              <th className="py-2.5 px-3 whitespace-nowrap">
                <button
                  onClick={() => toggleSort('status')}
                  className="inline-flex items-center gap-1 hover:text-slate-900 dark:hover:text-white"
                >
                  Trạng thái
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              
              <th className="py-2.5 px-3 min-w-[220px]">Chi tiết Lỗi & Cảnh báo</th>
              <th className="py-2.5 px-3 text-center whitespace-nowrap">Soi chi tiết</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredSummaries.length === 0 ? (
              <tr>
                <td colSpan={12} className="py-12 text-center">
                  <div className="flex flex-col items-center justify-center gap-2 max-w-md mx-auto text-slate-500 dark:text-slate-400">
                    <FileText className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-1" />
                    <p className="font-semibold text-sm text-slate-700 dark:text-slate-300">
                      {summaries.length === 0
                        ? 'Chưa có hồ sơ kiểm soát nào được nạp'
                        : 'Không tìm thấy hồ sơ nào khớp với bộ lọc'}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      {summaries.length === 0
                        ? 'Vui lòng kéo thả hoặc chọn tệp PDF hồ sơ công nhật ở thanh công cụ phía trên để hệ thống tự động đối soát.'
                        : 'Hãy thử đổi từ khóa tìm kiếm hoặc chọn lại trạng thái kiểm tra.'}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredSummaries.map((s, idx) => {
                const isSelected = s.batch_id === selectedBatchId;
                const hasDiff = Math.abs(s.so_cong_bien_ban - s.so_cong_nhat_ky) > 0.01;

                return (
                  <tr
                    key={s.batch_id}
                    onClick={() => onSelectBatch(s)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-blue-50/80 dark:bg-blue-950/40'
                        : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    {/* STT */}
                    <td className="py-3 px-3 font-mono text-slate-400 tabular-nums">
                      {idx + 1}
                    </td>

                    {/* Yêu cầu 2: Cột đường link mở đúng trang file gốc */}
                    <td className="py-3 px-3">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenOriginalPage(s);
                        }}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors group text-left"
                        title={`Bấm để mở file gốc tại Trang ${s.trang_bat_dau}`}
                      >
                        <FileText className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                        <div className="flex flex-col truncate max-w-[150px]">
                          <span className="font-mono text-[11px] truncate">{s.file_name}</span>
                          <span className="text-[10px] text-blue-500 font-bold group-hover:underline flex items-center gap-1">
                            Mở Trang {s.trang_bat_dau} ({s.so_trang_pdf})
                            <ExternalLink className="w-2.5 h-2.5" />
                          </span>
                        </div>
                      </button>
                    </td>

                    {/* Ngày thực hiện */}
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-900 dark:text-white tabular-nums font-mono whitespace-nowrap">
                        {s.ngay_thang}
                      </div>
                    </td>

                    {/* Dự án */}
                    <td className="py-3 px-3">
                      <div className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[160px]" title={s.du_an_phan_khu}>
                        {s.du_an_phan_khu}
                      </div>
                    </td>

                    {/* Tổ được cộng (+) */}
                    <td className="py-3 px-3">
                      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 truncate max-w-[170px]" title={s.to_doi_thuc_hien}>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                        <span className="truncate">{s.to_doi_thuc_hien}</span>
                      </div>
                    </td>

                    {/* Tổ bị trừ (-) */}
                    <td className="py-3 px-3">
                      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-semibold bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 truncate max-w-[170px]" title={s.to_doi_khau_tru}>
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0"></span>
                        <span className="truncate">{s.to_doi_khau_tru}</span>
                      </div>
                    </td>

                    {/* Công BB / NK */}
                    <td className="py-3 px-3 text-right tabular-nums font-mono">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {s.so_cong_bien_ban.toFixed(1)} công
                      </div>
                      <div
                        className={`text-[11px] font-medium ${
                          hasDiff
                            ? 'text-rose-600 dark:text-rose-400 font-bold'
                            : 'text-slate-400'
                        }`}
                      >
                        NK: {s.so_cong_nhat_ky.toFixed(1)} {hasDiff && `(Lệch ${Math.abs(s.so_cong_bien_ban - s.so_cong_nhat_ky).toFixed(1)})`}
                      </div>
                    </td>

                    {/* Yêu cầu 1: Đơn giá áp dụng (ưu tiên theo Biên bản) */}
                    <td className="py-3 px-3 text-right tabular-nums font-mono whitespace-nowrap">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {formatMoney(s.don_gia_ap_dung)}
                      </div>
                      <div className="text-[10px]">
                        {s.nguon_don_gia === 'BIEN_BAN' ? (
                          <span className="font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-1 py-0.5 rounded">
                            Theo Biên bản
                          </span>
                        ) : (
                          <span className="text-slate-400">Mặc định</span>
                        )}
                      </div>
                    </td>

                    {/* Giờ Check-in - Out */}
                    <td className="py-3 px-3 text-center font-mono tabular-nums">
                      <span className="text-slate-700 dark:text-slate-300 font-medium whitespace-nowrap">
                        {s.gio_in_out}
                      </span>
                    </td>

                    {/* Quân số ảnh */}
                    <td className="py-3 px-3 text-center font-mono tabular-nums whitespace-nowrap">
                      <span
                        className={`font-semibold ${
                          s.raw_batch.so_cn_anh_checkin !== s.so_cn || s.raw_batch.so_cn_anh_checkout !== s.so_cn
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {s.quan_so_anh} / {s.so_cn} CN
                      </span>
                    </td>

                    {/* Giá trị đối trừ */}
                    <td className="py-3 px-3 text-right font-mono tabular-nums font-bold text-slate-900 dark:text-white whitespace-nowrap">
                      {formatMoney(s.gia_tri_tam_tinh)}
                    </td>

                    {/* Trạng thái */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      {s.trang_thai === 'VI_PHAM' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/50">
                          <XCircle className="w-3 h-3 text-rose-600" />
                          Vi phạm QĐNBC
                        </span>
                      )}
                      {s.trang_thai === 'CANH_BAO' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900/50">
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          Cảnh báo rà soát
                        </span>
                      )}
                      {s.trang_thai === 'HOP_LE' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/50">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Hợp lệ duyệt
                        </span>
                      )}
                    </td>

                    {/* Chi tiết Lỗi vi phạm */}
                    <td className="py-3 px-3">
                      {s.errors.length > 0 ? (
                        <div className="space-y-1">
                          {s.errors.slice(0, 2).map((err, eIdx) => (
                            <p key={eIdx} className="text-[11px] text-rose-600 dark:text-rose-400 font-medium leading-tight line-clamp-1">
                              • {err}
                            </p>
                          ))}
                          {s.errors.length > 2 && (
                            <span className="text-[10px] text-rose-500 font-bold">
                              +{s.errors.length - 2} vi phạm khác...
                            </span>
                          )}
                        </div>
                      ) : s.warnings.length > 0 ? (
                        <div className="space-y-1">
                          {s.warnings.map((warn, wIdx) => (
                            <p key={wIdx} className="text-[11px] text-amber-600 dark:text-amber-400 font-medium leading-tight line-clamp-1">
                              • {warn}
                            </p>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[11px] text-emerald-600 dark:text-emerald-400">
                          Đủ chứng từ, số liệu khớp đúng
                        </span>
                      )}
                    </td>

                    {/* Nút xem chi tiết */}
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectBatch(s);
                        }}
                        className="inline-flex items-center justify-center p-1.5 rounded-lg text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Mở trình soi song song chi tiết chứng từ"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
