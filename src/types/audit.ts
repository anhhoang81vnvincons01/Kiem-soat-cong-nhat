export interface WorkerItem {
  ma_nv: string;
  ho_ten: string;
  tay_nghe?: string;
  ca_1: boolean;
  ca_2: boolean;
  ca_3: boolean;
  co_chu_ky_cn: boolean;
}

export interface DailyRecordBatch {
  id: string;
  file_name: string;
  so_trang_pdf: string;
  trang_bat_dau: number; // Số trang bắt đầu của bộ hồ sơ trong file gốc (để mở đúng trang)
  pdf_blob_url?: string; // Đường dẫn URL xem file PDF gốc
  ngay_thang: string; // DD/MM/YYYY
  du_an_phan_khu: string;
  to_doi_thuc_hien: string; // Tổ được cộng (đơn vị thực hiện công việc)
  to_doi_khau_tru: string;  // Tổ bị trừ (tổ đội vi phạm hoặc bị khấu trừ chi phí)
  noi_dung_cong_viec: string;
  
  // Chứng từ & Đơn giá
  co_bien_ban_hien_truong: boolean;
  co_nhat_ky_cong_nhat: boolean;
  co_du_chu_ky_bch_ktht: boolean;
  so_cong_chot_bien_ban: number;
  don_gia_bien_ban?: number; // Đơn giá ghi trong Biên bản hiện trường nếu có (ưu tiên áp dụng)
  
  // Timemark
  gio_check_in?: string;
  gio_check_out?: string;
  ngay_tren_anh?: string;
  dia_diem_check_in?: string;
  dia_diem_check_out?: string;
  so_cn_anh_checkin: number;
  so_cn_anh_checkout: number;
  anh_hop_le_timemark: boolean;
  canh_bao_trang_phuc_nhan_dien?: string;
  
  // Danh sách công nhân
  danh_sach_cong_nhan: WorkerItem[];
  
  // Hình ảnh trang để xem soi song song
  thumbnail_bien_ban?: string;
  thumbnail_nhat_ky?: string;
  thumbnail_timemark?: string;
}

export type AuditStatus = 'HOP_LE' | 'CANH_BAO' | 'VI_PHAM';

export interface AuditBatchSummary {
  batch_id: string;
  file_name: string;
  so_trang_pdf: string;
  trang_bat_dau: number;
  pdf_blob_url?: string;
  ngay_thang: string;
  du_an_phan_khu: string;
  to_doi_thuc_hien: string; // Tổ được cộng
  to_doi_khau_tru: string;  // Tổ bị trừ
  noi_dung_cong_viec: string;
  so_cn: number;
  so_cong_bien_ban: number;
  so_cong_nhat_ky: number;
  don_gia_ap_dung: number; // Đơn giá thực tế áp dụng
  nguon_don_gia: 'BIEN_BAN' | 'MAC_DINH'; // Nguồn đơn giá (từ Biên bản hay mặc định)
  gio_in_out: string;
  quan_so_anh: string;
  gia_tri_tam_tinh: number;
  trang_thai: AuditStatus;
  errors: string[];
  warnings: string[];
  raw_batch: DailyRecordBatch;
}

export interface WorkerAuditRow {
  key: string;
  file_name: string;
  so_trang_pdf: string;
  trang_bat_dau: number;
  pdf_blob_url?: string;
  ngay_thang: string;
  to_doi_thuc_hien: string; // Tổ được cộng
  to_doi_khau_tru: string;  // Tổ bị trừ
  du_an: string;
  ma_nv: string;
  ho_ten: string;
  tay_nghe: string;
  ca_1: boolean;
  ca_2: boolean;
  ca_3: boolean;
  so_cong: number;
  co_chu_ky_cn: boolean;
  is_duplicate: boolean;
  is_3_ca: boolean;
  duplicate_details?: string;
}

export interface AuditRuleConfig {
  id: string;
  code: string;
  name: string;
  description: string;
  category: 'CHUNG_TU' | 'KHOI_LUONG' | 'TIMEMARK' | 'NHAN_DIEN' | 'NHAN_SU' | 'CUSTOM';
  severity: 'VI_PHAM' | 'CANH_BAO';
  enabled: boolean;
  params?: Record<string, any>;
}
