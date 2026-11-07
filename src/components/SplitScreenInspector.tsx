import React, { useState } from 'react';
import {
  X,
  FileText,
  Camera,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  MapPin,
  Clock,
  Users,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Coins,
} from 'lucide-react';
import { AuditBatchSummary } from '../types/audit';

interface SplitScreenInspectorProps {
  batch: AuditBatchSummary;
  onClose: () => void;
  onPrevBatch?: () => void;
  onNextBatch?: () => void;
  onOpenOriginalPage?: (batch: AuditBatchSummary) => void;
  hasPrev?: boolean;
  hasNext?: boolean;
  donGiaMacDinh: number;
}

export const SplitScreenInspector: React.FC<SplitScreenInspectorProps> = ({
  batch,
  onClose,
  onPrevBatch,
  onNextBatch,
  onOpenOriginalPage,
  hasPrev,
  hasNext,
  donGiaMacDinh,
}) => {
  const [activeDocTab, setActiveDocTab] = useState<'bien_ban' | 'nhat_ky' | 'timemark'>('bien_ban');

  const b = batch.raw_batch;
  const formatMoney = (val: number) => new Intl.NumberFormat('vi-VN').format(val) + ' đ';

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-7xl h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Top Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 bg-slate-50 dark:bg-slate-900 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
              QĐ
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Trình Soi Song Song Chứng Từ & Đánh Giá Vi Phạm
                </h3>
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                    batch.trang_thai === 'VI_PHAM'
                      ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                      : batch.trang_thai === 'CANH_BAO'
                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                      : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                  }`}
                >
                  {batch.trang_thai === 'VI_PHAM'
                    ? 'Vi phạm QĐNBC'
                    : batch.trang_thai === 'CANH_BAO'
                    ? 'Cảnh báo rà soát'
                    : 'Hợp lệ duyệt'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {b.du_an_phan_khu} · {b.to_doi_khau_tru} · Ngày: <span className="font-mono font-semibold">{b.ngay_thang}</span> ({b.so_trang_pdf})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Nút mở đúng trang file gốc */}
            <button
              type="button"
              onClick={() => onOpenOriginalPage?.(batch)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors whitespace-nowrap"
              title={`Mở file gốc tại Trang ${b.trang_bat_dau}`}
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Mở file gốc (Trang {b.trang_bat_dau})</span>
            </button>

            {/* Nav buttons */}
            <div className="flex items-center gap-1 border border-slate-200 dark:border-slate-700 rounded-lg p-0.5 bg-white dark:bg-slate-800">
              <button
                onClick={onPrevBatch}
                disabled={!hasPrev}
                className="p-1 rounded text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none"
                title="Hồ sơ trước"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={onNextBatch}
                disabled={!hasNext}
                className="p-1 rounded text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none"
                title="Hồ sơ kế tiếp"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Split Screen Body */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          {/* CỘT TRÁI (6/12): XEM TÀI LIỆU SCAN & ẢNH TIMEMARK */}
          <div className="lg:col-span-6 border-r border-slate-200 dark:border-slate-800 flex flex-col bg-slate-100 dark:bg-slate-950 overflow-hidden">
            {/* Tabs chọn trang */}
            <div className="flex items-center gap-1 p-2 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shrink-0">
              <button
                onClick={() => setActiveDocTab('bien_ban')}
                className={`flex-1 py-1.5 px-2 text-xs font-semibold rounded-md transition-colors flex items-center justify-center gap-1.5 ${
                  activeDocTab === 'bien_ban'
                    ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>1. Biên bản hiện trường</span>
              </button>
              <button
                onClick={() => setActiveDocTab('nhat_ky')}
                className={`flex-1 py-1.5 px-2 text-xs font-semibold rounded-md transition-colors flex items-center justify-center gap-1.5 ${
                  activeDocTab === 'nhat_ky'
                    ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>2. Nhật ký công nhật</span>
              </button>
              <button
                onClick={() => setActiveDocTab('timemark')}
                className={`flex-1 py-1.5 px-2 text-xs font-semibold rounded-md transition-colors flex items-center justify-center gap-1.5 ${
                  activeDocTab === 'timemark'
                    ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                <span>3. Ảnh Timemark điểm danh</span>
              </button>
            </div>

            {/* Khung hiển thị mô phỏng thực tế của trang scan */}
            <div className="flex-1 p-4 overflow-y-auto flex items-center justify-center">
              {activeDocTab === 'bien_ban' && (
                <div className="w-full max-w-lg bg-amber-50/40 dark:bg-slate-900 border border-amber-200 dark:border-slate-700 rounded-xl p-6 shadow-md text-slate-800 dark:text-slate-200 text-xs font-serif leading-relaxed">
                  <div className="text-center font-bold uppercase tracking-wider text-sm border-b pb-2 mb-4 text-slate-900 dark:text-white font-sans">
                    CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
                    <div className="text-[10px] font-normal tracking-normal text-slate-500">Độc lập - Tự do - Hạnh phúc</div>
                    <div className="text-xs font-bold mt-2 text-blue-700 dark:text-blue-400">BIÊN BẢN XÁC NHẬN CÔNG NHẬT HIỆN TRƯỜNG</div>
                  </div>

                  <div className="space-y-2 font-sans text-xs">
                    <p>• <strong>Dự án / Phân khu:</strong> {b.du_an_phan_khu}</p>
                    <p>• <strong>Thời gian thực hiện:</strong> Ngày {b.ngay_thang} (Trang {b.trang_bat_dau})</p>
                    <p>• <strong>Tổ được cộng (+):</strong> <span className="font-semibold text-emerald-700 dark:text-emerald-400">{b.to_doi_thuc_hien || 'Tổ Cơ Điện / Đội thực hiện'}</span></p>
                    <p>• <strong>Tổ bị trừ (-):</strong> <span className="font-semibold text-rose-700 dark:text-rose-400">{b.to_doi_khau_tru}</span></p>
                    <p>• <strong>Nội dung công việc:</strong> {b.noi_dung_cong_viec}</p>
                    
                    <p className="mt-2 text-blue-800 dark:text-blue-300">
                      • <strong>Đơn giá xác nhận trong Biên bản:</strong>{' '}
                      {b.don_gia_bien_ban ? (
                        <span className="font-bold font-mono bg-blue-100 dark:bg-blue-900/60 px-2 py-0.5 rounded text-blue-900 dark:text-blue-200">
                          {formatMoney(b.don_gia_bien_ban)}/công (Ghi rõ trong Biên bản)
                        </span>
                      ) : (
                        <span className="italic text-slate-500">
                          Không ghi đơn giá cụ thể (Áp dụng theo định mức mặc định)
                        </span>
                      )}
                    </p>

                    <div className="mt-4 p-3 bg-amber-100/60 dark:bg-slate-800 rounded border border-amber-300 dark:border-slate-600 font-mono">
                      <span className="font-sans font-bold text-slate-900 dark:text-white">DÒNG CHỐT KHỐI LƯỢNG (VIẾT TAY):</span>
                      <p className="mt-1 text-sm font-bold text-blue-800 dark:text-blue-300">
                        "Xác nhận khối lượng thực hiện đối trừ là: {b.so_cong_chot_bien_ban} công (viết bằng chữ: {b.so_cong_chot_bien_ban} công nhật)."
                      </p>
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700 grid grid-cols-3 gap-2 text-center text-[11px]">
                      <div>
                        <p className="font-bold">ĐẠI DIỆN TỔ ĐỘI</p>
                        <div className="h-10 flex items-center justify-center italic text-blue-600 dark:text-blue-400 font-serif">
                          (Đã ký)
                        </div>
                        <p className="text-slate-500">Tổ trưởng</p>
                      </div>
                      <div>
                        <p className="font-bold">KỸ THUẬT HT</p>
                        <div className="h-10 flex items-center justify-center italic text-blue-600 dark:text-blue-400 font-serif">
                          {b.co_du_chu_ky_bch_ktht ? '(Đã ký)' : <span className="text-rose-500 font-bold not-italic">THIẾU CHỮ KÝ</span>}
                        </div>
                        <p className="text-slate-500">CV KTHT</p>
                      </div>
                      <div>
                        <p className="font-bold">BAN CHỈ HUY</p>
                        <div className="h-10 flex items-center justify-center italic text-blue-600 dark:text-blue-400 font-serif">
                          {b.co_du_chu_ky_bch_ktht ? '(Đã duyệt)' : <span className="text-rose-500 font-bold not-italic">THIẾU CHỮ KÝ</span>}
                        </div>
                        <p className="text-slate-500">Chỉ huy phó</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeDocTab === 'nhat_ky' && (
                <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-md text-xs font-sans">
                  <div className="text-center font-bold text-xs border-b pb-2 mb-3 text-slate-900 dark:text-white">
                    BẢNG CHẤM CÔNG NHẬT KÝ THEO CA (Biểu mẫu QĐNBC)
                    <div className="text-[11px] font-normal text-slate-500">
                      Ngày: {b.ngay_thang} · {b.to_doi_khau_tru}
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-[11px]">
                      <thead>
                        <tr className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-b">
                          <th className="p-1.5">Mã NV</th>
                          <th className="p-1.5">Họ tên</th>
                          <th className="p-1 text-center">Ca 1</th>
                          <th className="p-1 text-center">Ca 2</th>
                          <th className="p-1 text-center">Ca 3</th>
                          <th className="p-1.5 text-right">Tổng</th>
                          <th className="p-1 text-center">Ký</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {b.danh_sach_cong_nhan.map((w, idx) => {
                          const shifts = (w.ca_1 ? 1 : 0) + (w.ca_2 ? 1 : 0) + (w.ca_3 ? 1 : 0);
                          return (
                            <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                              <td className="p-1.5 font-mono font-bold text-blue-600 dark:text-blue-400">{w.ma_nv}</td>
                              <td className="p-1.5 font-medium">{w.ho_ten}</td>
                              <td className="p-1 text-center font-bold text-slate-700 dark:text-slate-300">{w.ca_1 ? '✓' : ''}</td>
                              <td className="p-1 text-center font-bold text-slate-700 dark:text-slate-300">{w.ca_2 ? '✓' : ''}</td>
                              <td className="p-1 text-center font-bold text-slate-700 dark:text-slate-300">{w.ca_3 ? '✓' : ''}</td>
                              <td className="p-1.5 text-right font-mono font-bold">{(shifts * 0.5).toFixed(1)}</td>
                              <td className="p-1 text-center text-slate-500">{w.co_chu_ky_cn ? '✓' : <span className="text-rose-500 font-bold">✕</span>}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        <tr className="bg-slate-50 dark:bg-slate-800 font-bold border-t">
                          <td colSpan={5} className="p-2 text-right">Tổng công theo Nhật ký:</td>
                          <td className="p-2 text-right font-mono text-blue-700 dark:text-blue-400">
                            {batch.so_cong_nhat_ky.toFixed(1)} công
                          </td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}

              {activeDocTab === 'timemark' && (
                <div className="w-full max-w-lg space-y-4">
                  {/* Ảnh Check-in */}
                  <div className="bg-slate-900 rounded-xl p-3 text-white border border-slate-700 relative overflow-hidden shadow-lg">
                    <div className="flex items-center justify-between text-xs pb-1.5 border-b border-slate-800 text-slate-400">
                      <span className="font-bold text-blue-400 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> Ảnh 1: Check-in Đầu Ca
                      </span>
                      <span className="font-mono text-emerald-400">
                        Quân số nhận diện: {b.so_cn_anh_checkin} CN
                      </span>
                    </div>

                    <div className="mt-2 h-44 bg-slate-800 rounded-lg relative flex flex-col justify-end p-3 border border-slate-700/80">
                      <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-85">
                        {Array.from({ length: Math.min(b.so_cn_anh_checkin, 8) }).map((_, i) => (
                          <div key={i} className="flex flex-col items-center">
                            <div className={`w-5 h-5 rounded-full border-2 ${i === 0 && b.canh_bao_trang_phuc_nhan_dien ? 'bg-white border-rose-500' : 'bg-amber-400 border-amber-600'}`} />
                            <div className="w-6 h-12 bg-blue-900 rounded-t-sm mt-0.5 border border-slate-600" />
                          </div>
                        ))}
                      </div>

                      <div className="relative z-10 bg-black/75 backdrop-blur-xs p-2 rounded text-[11px] font-mono leading-tight border-l-2 border-emerald-500">
                        <div className="flex items-center justify-between text-amber-300 font-bold">
                          <span>TIMEMARK CAMERA · 100% CHÂN THỰC</span>
                          <span>{b.gio_check_in || '--:--'}</span>
                        </div>
                        <div className="text-white">Ngày: {b.ngay_tren_anh || b.ngay_thang}</div>
                        <div className="text-slate-300 text-[10px] truncate">
                          Đ/c: {b.dia_diem_check_in || 'GPS Công trường'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Ảnh Check-out */}
                  <div className="bg-slate-900 rounded-xl p-3 text-white border border-slate-700 relative overflow-hidden shadow-lg">
                    <div className="flex items-center justify-between text-xs pb-1.5 border-b border-slate-800 text-slate-400">
                      <span className="font-bold text-amber-400 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> Ảnh 2: Check-out Cuối Ca
                      </span>
                      <span className="font-mono text-emerald-400">
                        Quân số nhận diện: {b.so_cn_anh_checkout} CN
                      </span>
                    </div>

                    <div className="mt-2 h-44 bg-slate-800 rounded-lg relative flex flex-col justify-end p-3 border border-slate-700/80">
                      <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-85">
                        {Array.from({ length: Math.min(b.so_cn_anh_checkout, 8) }).map((_, i) => (
                          <div key={i} className="flex flex-col items-center">
                            <div className="w-5 h-5 rounded-full bg-amber-400 border-2 border-amber-600" />
                            <div className="w-6 h-12 bg-blue-900 rounded-t-sm mt-0.5 border border-slate-600" />
                          </div>
                        ))}
                      </div>

                      <div className="relative z-10 bg-black/75 backdrop-blur-xs p-2 rounded text-[11px] font-mono leading-tight border-l-2 border-amber-500">
                        <div className="flex items-center justify-between text-amber-300 font-bold">
                          <span>TIMEMARK CAMERA · 100% CHÂN THỰC</span>
                          <span>{b.gio_check_out || '--:--'}</span>
                        </div>
                        <div className="text-white">Ngày: {b.ngay_tren_anh || b.ngay_thang}</div>
                        <div className="text-slate-300 text-[10px] truncate">
                          Đ/c: {b.dia_diem_check_out || 'GPS Công trường'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* CỘT PHẢI (6/12): KẾT QUẢ ĐỐI SOÁT & DANH SÁCH LỖI */}
          <div className="lg:col-span-6 flex flex-col bg-white dark:bg-slate-900 overflow-y-auto p-5">
            {/* Banner trạng thái & lỗi */}
            {batch.errors.length > 0 ? (
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 mb-4">
                <div className="flex items-center gap-2 text-rose-800 dark:text-rose-300 font-bold text-xs">
                  <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>PHÁT HIỆN {batch.errors.length} LỖI VI PHẠM QUY CHUẨN QĐNBC:</span>
                </div>
                <ul className="mt-2 space-y-1.5 pl-6 list-disc text-xs text-rose-700 dark:text-rose-300 font-medium">
                  {batch.errors.map((err, eIdx) => (
                    <li key={eIdx}>{err}</li>
                  ))}
                </ul>
              </div>
            ) : batch.warnings.length > 0 ? (
              <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 mb-4">
                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-xs">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>CÓ {batch.warnings.length} CẢNH BÁO CẦN RÀ SOÁT / GIẢI TRÌNH:</span>
                </div>
                <ul className="mt-2 space-y-1 pl-6 list-disc text-xs text-amber-700 dark:text-amber-300 font-medium">
                  {batch.warnings.map((warn, wIdx) => (
                    <li key={wIdx}>{warn}</li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 mb-4">
                <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>HỒ SƠ HỢP LỆ THEO QUY ĐỊNH QĐNBC:</span>
                </div>
                <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-300 pl-6">
                  Đủ chứng từ Biên bản + Nhật ký, đủ chữ ký xác nhận, số công khớp đúng, ảnh Timemark hợp lệ quân số và giờ điểm danh.
                </p>
              </div>
            )}

            {/* Các thẻ đối chiếu thông số cốt lõi */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              {/* Thẻ số công */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800">
                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
                  Đối chiếu Khối lượng công:
                </div>
                <div className="mt-1 flex items-baseline justify-between">
                  <span className="text-xs">Biên bản chốt:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {b.so_cong_chot_bien_ban} công
                  </span>
                </div>
                <div className="flex items-baseline justify-between mt-0.5">
                  <span className="text-xs">Nhật ký tích chọn:</span>
                  <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                    {batch.so_cong_nhat_ky} công
                  </span>
                </div>
                <div className="mt-1 pt-1 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-[11px]">
                  <span>Chênh lệch:</span>
                  <span
                    className={`font-mono font-bold ${
                      Math.abs(b.so_cong_chot_bien_ban - batch.so_cong_nhat_ky) > 0.01
                        ? 'text-rose-600 dark:text-rose-400'
                        : 'text-emerald-600 dark:text-emerald-400'
                    }`}
                  >
                    {Math.abs(b.so_cong_chot_bien_ban - batch.so_cong_nhat_ky).toFixed(1)} công
                  </span>
                </div>
              </div>

              {/* Thẻ quân số & Timemark */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800">
                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
                  Quân số & Giờ Timemark:
                </div>
                <div className="mt-1 flex items-baseline justify-between">
                  <span className="text-xs">Danh sách ký:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {b.danh_sach_cong_nhan.length} người
                  </span>
                </div>
                <div className="flex items-baseline justify-between mt-0.5">
                  <span className="text-xs">Ảnh Check-in/out:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {b.so_cn_anh_checkin} / {b.so_cn_anh_checkout} người
                  </span>
                </div>
                <div className="mt-1 pt-1 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-[11px]">
                  <span>Thời gian ca:</span>
                  <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                    {b.gio_check_in || '--:--'} → {b.gio_check_out || '--:--'}
                  </span>
                </div>
              </div>
            </div>

            {/* Thẻ chi tiết đơn giá & giá trị đối trừ */}
            <div className="p-3.5 mb-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Coins className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">
                    Giá trị đối trừ: {formatMoney(batch.gia_tri_tam_tinh)}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                    <span>Đơn giá: <strong className="text-slate-800 dark:text-slate-200">{formatMoney(batch.don_gia_ap_dung)}/công</strong></span>
                    <span>·</span>
                    <span className={`font-semibold ${batch.nguon_don_gia === 'BIEN_BAN' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500'}`}>
                      {batch.nguon_don_gia === 'BIEN_BAN' ? 'Ưu tiên lấy theo Biên bản' : 'Theo định mức chung'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bảng danh sách công nhân trích xuất */}
            <div className="flex-1 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden flex flex-col">
              <div className="bg-slate-100 dark:bg-slate-800 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span>Danh Sách Công Nhân Trích Xuất ({b.danh_sach_cong_nhan.length} người)</span>
                <span className="text-[11px] font-normal text-slate-500">
                  Tổng công: <strong className="text-slate-900 dark:text-white font-mono">{batch.so_cong_nhat_ky.toFixed(1)} công</strong>
                </span>
              </div>
              <div className="overflow-y-auto max-h-56 divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 text-[11px] text-slate-500 font-semibold">
                    <tr>
                      <th className="p-2">Mã NV</th>
                      <th className="p-2">Họ và tên</th>
                      <th className="p-2">Bậc thợ</th>
                      <th className="p-2 text-center">Ca Sáng</th>
                      <th className="p-2 text-center">Ca Chiều</th>
                      <th className="p-2 text-center">Tăng ca</th>
                      <th className="p-2 text-right">Công</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {b.danh_sach_cong_nhan.map((w, wIdx) => {
                      const count = (w.ca_1 ? 1 : 0) + (w.ca_2 ? 1 : 0) + (w.ca_3 ? 1 : 0);
                      return (
                        <tr key={wIdx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="p-2 font-mono font-bold text-blue-600 dark:text-blue-400">{w.ma_nv}</td>
                          <td className="p-2 font-medium text-slate-800 dark:text-slate-200">{w.ho_ten}</td>
                          <td className="p-2 text-slate-500">{w.tay_nghe || 'Phụ'}</td>
                          <td className="p-2 text-center">{w.ca_1 ? '✓' : '-'}</td>
                          <td className="p-2 text-center">{w.ca_2 ? '✓' : '-'}</td>
                          <td className="p-2 text-center">{w.ca_3 ? '✓' : '-'}</td>
                          <td className="p-2 text-right font-mono font-bold text-slate-900 dark:text-white">
                            {(count * 0.5).toFixed(1)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
