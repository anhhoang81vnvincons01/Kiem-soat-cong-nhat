import {
  AuditBatchSummary,
  AuditRuleConfig,
  DailyRecordBatch,
  WorkerAuditRow,
} from '../types/audit';

export const DEFAULT_AUDIT_RULES: AuditRuleConfig[] = [
  {
    id: 'rule_1',
    code: 'LOI_01_CHUNG_TU',
    name: 'Đủ bộ chứng từ & chữ ký',
    description: 'Kiểm tra phải có đủ Biên bản hiện trường viết tay, Nhật ký công nhật và đủ chữ ký xác nhận của BCH/KTHT.',
    category: 'CHUNG_TU',
    severity: 'VI_PHAM',
    enabled: true,
  },
  {
    id: 'rule_2',
    code: 'LOI_02_ANH_TIMEMARK',
    name: 'Đủ ảnh Timemark đầu ca & cuối ca',
    description: 'Bắt buộc phải có cả ảnh Timemark điểm danh đầu ca (Check-in) và cuối ca (Check-out).',
    category: 'TIMEMARK',
    severity: 'VI_PHAM',
    enabled: true,
  },
  {
    id: 'rule_3',
    code: 'LOI_03_LECH_KHOI_LUONG',
    name: 'Lệch khối lượng công (Biên bản vs Nhật ký)',
    description: 'So sánh số công chốt ở câu cuối Biên bản với tổng số công tích chọn trên Nhật ký (mỗi ca = 0.5 công). Cho phép sai số tối đa 0.01 công.',
    category: 'KHOI_LUONG',
    severity: 'VI_PHAM',
    enabled: true,
    params: { max_tolerance: 0.01 },
  },
  {
    id: 'rule_4',
    code: 'LOI_04_GIO_CHECKIN_CA1',
    name: 'Giờ check-in ca sáng (Ca 1)',
    description: 'Nếu nhật ký tích làm Ca 1 (Sáng), ảnh đầu ca không được chụp sau 11:00.',
    category: 'TIMEMARK',
    severity: 'VI_PHAM',
    enabled: true,
    params: { cutoff_morning_hour: '11:00' },
  },
  {
    id: 'rule_5',
    code: 'LOI_05_SAI_NGAY_ANH',
    name: 'Khớp ngày giữa ảnh Timemark và Biên bản',
    description: 'Ngày hiển thị trên con dấu Timemark phải khớp chính xác với ngày lập Biên bản hiện trường.',
    category: 'TIMEMARK',
    severity: 'VI_PHAM',
    enabled: true,
  },
  {
    id: 'rule_6',
    code: 'LOI_06_QUAN_SO_ANH',
    name: 'Khớp quân số ảnh Timemark vs Nhật ký',
    description: 'Số lượng công nhân trong ảnh Timemark (mũ vàng/áo bảo hộ) phải đúng bằng số công nhân ghi trong danh sách chấm công.',
    category: 'TIMEMARK',
    severity: 'VI_PHAM',
    enabled: true,
  },
  {
    id: 'rule_7',
    code: 'LOI_07_TRANG_PHUC_BHLD',
    name: 'Cảnh báo nhận diện & Trang phục BHLĐ',
    description: 'Phát hiện công nhân đội mũ trắng của cán bộ, không có BHLĐ hoặc có sự tráo đổi người giữa ca sáng và chiều.',
    category: 'NHAN_DIEN',
    severity: 'VI_PHAM',
    enabled: true,
  },
  {
    id: 'rule_8',
    code: 'LOI_08_TRUNG_MA_NV',
    name: 'Rà soát trùng lặp Mã NV trong cùng 1 ngày',
    description: 'Mã nhân viên (7 chữ số) không được xuất hiện ở từ 2 tổ đội hoặc 2 bảng chấm công khác nhau trong cùng ngày.',
    category: 'NHAN_SU',
    severity: 'VI_PHAM',
    enabled: true,
  },
  {
    id: 'rule_9',
    code: 'LOI_09_LAM_3_CA',
    name: 'Cảnh báo làm liên tục 3 ca trong ngày',
    description: 'Cảnh báo nếu 1 công nhân được tích cả 3 ca (Sáng, Chiều, Tối/Tăng ca) tương đương 1.5 công/ngày.',
    category: 'NHAN_SU',
    severity: 'CANH_BAO',
    enabled: true,
    params: { max_shifts: 2 },
  },
  {
    id: 'rule_10',
    code: 'LOI_10_LECH_GPS',
    name: 'Cảnh báo lệch vị trí GPS đầu ca & cuối ca',
    description: 'Địa chỉ hoặc tọa độ GPS ghi trên dấu Timemark đầu ca khác biệt với cuối ca.',
    category: 'TIMEMARK',
    severity: 'CANH_BAO',
    enabled: true,
  },
];

export function runAuditEvaluation(
  batches: DailyRecordBatch[],
  rules: AuditRuleConfig[] = DEFAULT_AUDIT_RULES,
  donGiaMacDinh: number = 450000
): {
  summaries: AuditBatchSummary[];
  workers: WorkerAuditRow[];
  totalBatches: number;
  violateBatches: number;
  warningBatches: number;
  validBatches: number;
  totalCost: number;
} {
  // Yêu cầu 3: Sắp xếp theo thứ tự: Tên file -> Trang trong file
  const sortedBatches = [...batches].sort((a, b) => {
    const fileCmp = a.file_name.localeCompare(b.file_name, 'vi', { numeric: true });
    if (fileCmp !== 0) return fileCmp;
    const pageA = a.trang_bat_dau || parseInt(a.so_trang_pdf.match(/\d+/)?.[0] || '1', 10);
    const pageB = b.trang_bat_dau || parseInt(b.so_trang_pdf.match(/\d+/)?.[0] || '1', 10);
    return pageA - pageB;
  });

  const ruleMap = new Map<string, AuditRuleConfig>();
  rules.forEach((r) => ruleMap.set(r.code, r));

  const isRuleActive = (code: string) => {
    const r = ruleMap.get(code);
    return r ? r.enabled : true;
  };

  // Bước 1: Trích xuất toàn bộ công nhân và kiểm tra trùng lặp
  const allWorkers: WorkerAuditRow[] = [];
  const workerDailyOccurrences = new Map<string, Array<{ batchId: string; toDoi: string; rowIdx: number }>>();

  sortedBatches.forEach((b) => {
    const ngay = b.ngay_thang || 'Chưa rõ';
    const trangBatDau = b.trang_bat_dau || parseInt(b.so_trang_pdf.match(/\d+/)?.[0] || '1', 10);

    b.danh_sach_cong_nhan.forEach((w, idx) => {
      const maNvClean = (w.ma_nv || '').trim();
      const shiftsCount = (w.ca_1 ? 1 : 0) + (w.ca_2 ? 1 : 0) + (w.ca_3 ? 1 : 0);
      const soCong = shiftsCount * 0.5;
      const is3Ca = shiftsCount >= 3;

      const workerRow: WorkerAuditRow = {
        key: `${b.id}_${maNvClean}_${idx}`,
        file_name: b.file_name,
        so_trang_pdf: b.so_trang_pdf,
        trang_bat_dau: trangBatDau,
        pdf_blob_url: b.pdf_blob_url,
        ngay_thang: ngay,
        to_doi_thuc_hien: b.to_doi_thuc_hien || 'Tổ Cơ Điện / Đội thực hiện',
        to_doi_khau_tru: b.to_doi_khau_tru,
        du_an: b.du_an_phan_khu,
        ma_nv: maNvClean,
        ho_ten: w.ho_ten,
        tay_nghe: w.tay_nghe || 'Phụ việc',
        ca_1: w.ca_1,
        ca_2: w.ca_2,
        ca_3: w.ca_3,
        so_cong: soCong,
        co_chu_ky_cn: w.co_chu_ky_cn,
        is_duplicate: false,
        is_3_ca: is3Ca,
      };

      allWorkers.push(workerRow);

      if (maNvClean && maNvClean.length >= 4) {
        const key = `${ngay}___${maNvClean}`;
        if (!workerDailyOccurrences.has(key)) {
          workerDailyOccurrences.set(key, []);
        }
        workerDailyOccurrences.get(key)!.push({
          batchId: b.id,
          toDoi: b.to_doi_khau_tru,
          rowIdx: allWorkers.length - 1,
        });
      }
    });
  });

  // Đánh dấu công nhân bị trùng
  const duplicateKeys = new Set<string>();
  workerDailyOccurrences.forEach((occurrences, key) => {
    if (occurrences.length > 1) {
      duplicateKeys.add(key);
      const toDoiList = occurrences.map((o) => o.toDoi).join(', ');
      occurrences.forEach((occ) => {
        allWorkers[occ.rowIdx].is_duplicate = true;
        allWorkers[occ.rowIdx].duplicate_details = `Xuất hiện ${occurrences.length} lần trong ngày ở: ${toDoiList}`;
      });
    }
  });

  // Bước 2: Kiểm tra từng bộ hồ sơ theo các quy tắc QĐNBC
  const summaries: AuditBatchSummary[] = [];

  sortedBatches.forEach((b) => {
    const errors: string[] = [];
    const warnings: string[] = [];

    const ngay = b.ngay_thang || 'Chưa rõ';
    const dsCn = b.danh_sach_cong_nhan || [];
    const soNguoiNk = dsCn.length;
    const soCongNk = dsCn.reduce(
      (sum, w) => sum + ((w.ca_1 ? 1 : 0) + (w.ca_2 ? 1 : 0) + (w.ca_3 ? 1 : 0)) * 0.5,
      0
    );
    const soCongBb = b.so_cong_chot_bien_ban || 0;
    const trangBatDau = b.trang_bat_dau || parseInt(b.so_trang_pdf.match(/\d+/)?.[0] || '1', 10);

    // Yêu cầu 1: Đơn giá công nhật: ưu tiên lấy theo được ghi trong biên bản (nếu biên bản phù hợp)
    const hasValidDonGiaBb = Boolean(b.don_gia_bien_ban && Number(b.don_gia_bien_ban) > 0);
    const donGiaApDung = hasValidDonGiaBb ? Number(b.don_gia_bien_ban) : donGiaMacDinh;
    const nguonDonGia: 'BIEN_BAN' | 'MAC_DINH' = hasValidDonGiaBb ? 'BIEN_BAN' : 'MAC_DINH';

    if (hasValidDonGiaBb && (b.don_gia_bien_ban! < 150000 || b.don_gia_bien_ban! > 1500000)) {
      warnings.push(
        `Đơn giá ghi trong Biên bản (${b.don_gia_bien_ban?.toLocaleString('vi-VN')} đ) bất thường so với mức kiểm soát chi phí phổ thông.`
      );
    }

    // Rule 1: Thiếu chứng từ & Chữ ký
    if (isRuleActive('LOI_01_CHUNG_TU')) {
      if (!b.co_bien_ban_hien_truong || !b.co_nhat_ky_cong_nhat) {
        errors.push('Thiếu chứng từ: Không đủ bộ Biên bản hiện trường + Nhật ký công nhật.');
      }
      if (!b.co_du_chu_ky_bch_ktht) {
        warnings.push('Thiếu chữ ký: Biên bản hoặc Nhật ký thiếu chữ ký xác nhận của BCH/KTHT.');
      }
    }

    // Rule 2: Thiếu ảnh Timemark
    if (isRuleActive('LOI_02_ANH_TIMEMARK')) {
      if (!b.gio_check_in || !b.gio_check_out) {
        errors.push('Thiếu ảnh điểm danh: Không đủ cả 2 ảnh Timemark đầu ca (Check-in) và cuối ca (Check-out).');
      }
    }

    // Rule 3: Lệch khối lượng công
    if (isRuleActive('LOI_03_LECH_KHOI_LUONG')) {
      const tol = ruleMap.get('LOI_03_LECH_KHOI_LUONG')?.params?.max_tolerance ?? 0.01;
      const diff = Math.abs(soCongBb - soCongNk);
      if (diff > tol) {
        errors.push(
          `Lệch số công: Biên bản chốt ${soCongBb} công, Nhật ký tính ${soCongNk} công (Lệch ${diff.toFixed(1)} công).`
        );
      }
    }

    // Rule 4: Giờ check-in ca 1
    if (isRuleActive('LOI_04_GIO_CHECKIN_CA1')) {
      const hasCa1 = dsCn.some((w) => w.ca_1);
      const cutoff = ruleMap.get('LOI_04_GIO_CHECKIN_CA1')?.params?.cutoff_morning_hour || '11:00';
      if (hasCa1 && b.gio_check_in && b.gio_check_in >= cutoff) {
        errors.push(
          `Ảnh check-in không hợp lệ: Nhật ký tích làm Ca 1 (Sáng) nhưng ảnh đầu ca chụp lúc ${b.gio_check_in} (sau ${cutoff}).`
        );
      }
    }

    // Rule 5: Khớp ngày giữa ảnh Timemark và Biên bản
    if (isRuleActive('LOI_05_SAI_NGAY_ANH')) {
      if (b.ngay_tren_anh && b.ngay_tren_anh !== ngay && ngay !== 'Chưa rõ') {
        errors.push(
          `Sai ngày trên ảnh: Biên bản ghi ngày ${ngay} nhưng dấu Timemark là ngày ${b.ngay_tren_anh}.`
        );
      }
    }

    // Rule 6: Khớp quân số ảnh
    if (isRuleActive('LOI_06_QUAN_SO_ANH')) {
      const inCount = b.so_cn_anh_checkin || 0;
      const outCount = b.so_cn_anh_checkout || 0;
      if (inCount !== soNguoiNk || outCount !== soNguoiNk) {
        errors.push(
          `Lệch quân số ảnh: Danh sách có ${soNguoiNk} CN, nhưng ảnh Check-in có ${inCount} CN, ảnh Check-out có ${outCount} CN.`
        );
      }
    }

    // Rule 7: Nhận diện & Trang phục
    if (isRuleActive('LOI_07_TRANG_PHUC_BHLD')) {
      if (b.canh_bao_trang_phuc_nhan_dien && b.canh_bao_trang_phuc_nhan_dien.trim().length > 0) {
        errors.push(`Vi phạm BHLĐ/Nhận diện: ${b.canh_bao_trang_phuc_nhan_dien}`);
      }
    }

    // Rule 8: Trùng mã nhân viên trong batch
    if (isRuleActive('LOI_08_TRUNG_MA_NV')) {
      const dupInBatch = dsCn
        .map((w) => (w.ma_nv || '').trim())
        .filter((ma) => ma && duplicateKeys.has(`${ngay}___${ma}`));
      if (dupInBatch.length > 0) {
        const uniqueDups = Array.from(new Set(dupInBatch));
        errors.push(
          `Trùng nhân sự trong ngày: Mã NV xuất hiện ở nhiều bảng công trong ngày ${ngay}: ${uniqueDups.join(', ')}.`
        );
      }
    }

    // Rule 9: Làm liên tục 3 ca
    if (isRuleActive('LOI_09_LAM_3_CA')) {
      const workers3Ca = dsCn
        .filter((w) => w.ca_1 && w.ca_2 && w.ca_3)
        .map((w) => `${w.ho_ten} (${w.ma_nv})`);
      if (workers3Ca.length > 0) {
        warnings.push(`Làm việc quá tải (3 ca/ngày): ${workers3Ca.join('; ')}.`);
      }
    }

    // Rule 10: Lệch vị trí GPS
    if (isRuleActive('LOI_10_LECH_GPS')) {
      if (b.dia_diem_check_in && b.dia_diem_check_out && b.dia_diem_check_in !== b.dia_diem_check_out) {
        warnings.push(
          `Lệch vị trí GPS: Đầu ca (${b.dia_diem_check_in}) khác Cuối ca (${b.dia_diem_check_out}).`
        );
      }
    }

    // Xác định trạng thái tổng thể
    let trang_thai: 'HOP_LE' | 'CANH_BAO' | 'VI_PHAM' = 'HOP_LE';
    if (errors.length > 0) {
      trang_thai = 'VI_PHAM';
    } else if (warnings.length > 0) {
      trang_thai = 'CANH_BAO';
    }

    const giaTriTamTinh = soCongBb * donGiaApDung;

    summaries.push({
      batch_id: b.id,
      file_name: b.file_name,
      so_trang_pdf: b.so_trang_pdf,
      trang_bat_dau: trangBatDau,
      pdf_blob_url: b.pdf_blob_url,
      ngay_thang: ngay,
      du_an_phan_khu: b.du_an_phan_khu,
      to_doi_thuc_hien: b.to_doi_thuc_hien || 'Tổ Cơ Điện / Đội thực hiện',
      to_doi_khau_tru: b.to_doi_khau_tru,
      noi_dung_cong_viec: b.noi_dung_cong_viec,
      so_cn: soNguoiNk,
      so_cong_bien_ban: soCongBb,
      so_cong_nhat_ky: soCongNk,
      don_gia_ap_dung: donGiaApDung,
      nguon_don_gia: nguonDonGia,
      gio_in_out: `${b.gio_check_in || '--:--'} - ${b.gio_check_out || '--:--'}`,
      quan_so_anh: `${b.so_cn_anh_checkin ?? 0}/${b.so_cn_anh_checkout ?? 0}`,
      gia_tri_tam_tinh: giaTriTamTinh,
      trang_thai,
      errors,
      warnings,
      raw_batch: {
        ...b,
        trang_bat_dau: trangBatDau,
      },
    });
  });

  const totalBatches = summaries.length;
  const violateBatches = summaries.filter((s) => s.trang_thai === 'VI_PHAM').length;
  const warningBatches = summaries.filter((s) => s.trang_thai === 'CANH_BAO').length;
  const validBatches = summaries.filter((s) => s.trang_thai === 'HOP_LE').length;
  const totalCost = summaries.reduce((sum, s) => sum + s.gia_tri_tam_tinh, 0);

  return {
    summaries,
    workers: allWorkers,
    totalBatches,
    violateBatches,
    warningBatches,
    validBatches,
    totalCost,
  };
}
