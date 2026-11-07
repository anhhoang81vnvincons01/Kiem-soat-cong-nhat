import { DailyRecordBatch } from '../types/audit';

export const SAMPLE_QDNBC_BATCHES: DailyRecordBatch[] = [
  {
    id: 'batch_coloa_01',
    file_name: 'HS_CongNhat_CoLoa_CC02_A5_2809.pdf',
    so_trang_pdf: 'Trang 1 - 3',
    trang_bat_dau: 1,
    ngay_thang: '28/09/2026',
    du_an_phan_khu: 'Vinhomes Cổ Loa - Phân khu A5 (CC02)',
    to_doi_thuc_hien: 'Tổ Cơ Điện & Xử Lý Sự Cố Vincons', // Tổ được cộng
    to_doi_khau_tru: 'Tổ Xây Trát Anh Tuấn (Công ty XD Đông Bắc)', // Tổ bị trừ
    noi_dung_cong_viec: 'Đục phá tẩy rửa dầm sàn trục D-E tầng 14 do bê tông rỗ tổ ong, vệ sinh thép chờ và thu dọn phế thải.',
    co_bien_ban_hien_truong: true,
    co_nhat_ky_cong_nhat: true,
    co_du_chu_ky_bch_ktht: true,
    so_cong_chot_bien_ban: 5.0,
    don_gia_bien_ban: 480000, // Đơn giá ghi rõ trong Biên bản: 480.000 đ/công
    gio_check_in: '06:45',
    gio_check_out: '17:35',
    ngay_tren_anh: '28/09/2026',
    dia_diem_check_in: 'Tầng 14 Tháp A, CC02 Vin Cổ Loa, Đông Anh, HN',
    dia_diem_check_out: 'Tầng 14 Tháp A, CC02 Vin Cổ Loa, Đông Anh, HN',
    so_cn_anh_checkin: 5,
    so_cn_anh_checkout: 5,
    anh_hop_le_timemark: true,
    danh_sach_cong_nhan: [
      { ma_nv: '4142890', ho_ten: 'Nguyễn Văn Hùng', tay_nghe: 'Thợ đục B3', ca_1: true, ca_2: true, ca_3: false, co_chu_ky_cn: true },
      { ma_nv: '3886900', ho_ten: 'Trần Đình Trọng', tay_nghe: 'Thợ đục B3', ca_1: true, ca_2: true, ca_3: false, co_chu_ky_cn: true },
      { ma_nv: '4169575', ho_ten: 'Lê Văn Tuấn', tay_nghe: 'Thợ sắt B2', ca_1: true, ca_2: true, ca_3: false, co_chu_ky_cn: true },
      { ma_nv: '4201882', ho_ten: 'Hoàng Minh Hải', tay_nghe: 'Phụ vận chuyển', ca_1: true, ca_2: true, ca_3: false, co_chu_ky_cn: true },
      { ma_nv: '3994120', ho_ten: 'Phạm Quốc Bảo', tay_nghe: 'Phụ vệ sinh', ca_1: true, ca_2: true, ca_3: false, co_chu_ky_cn: true },
    ],
  },
  {
    id: 'batch_coloa_02',
    file_name: 'HS_CongNhat_CoLoa_CC02_A5_2809.pdf', // Cùng file với batch 01, nhưng trang 4 - 6
    so_trang_pdf: 'Trang 4 - 6',
    trang_bat_dau: 4,
    ngay_thang: '28/09/2026',
    du_an_phan_khu: 'Vinhomes Cổ Loa - Phân khu A5 (CC02)',
    to_doi_thuc_hien: 'Tổ Vệ Sinh & An Toàn Công Trường', // Tổ được cộng
    to_doi_khau_tru: 'Tổ Cốp Pha Thăng Long (Đối trừ dọn dẹp cẩu)', // Tổ bị trừ
    noi_dung_cong_viec: 'Bốc xếp và vệ sinh cốp pha nhôm để sai vị trí cản trở lối thoát hiểm PCCC tầng hầm B1.',
    co_bien_ban_hien_truong: true,
    co_nhat_ky_cong_nhat: true,
    co_du_chu_ky_bch_ktht: true,
    so_cong_chot_bien_ban: 8.0,
    don_gia_bien_ban: 450000, // Đơn giá ghi trong Biên bản: 450.000 đ/công
    gio_check_in: '13:15', // Lỗi: Nhật ký tích ca 1 (sáng) nhưng ảnh chụp lúc 13:15
    gio_check_out: '17:40',
    ngay_tren_anh: '28/09/2026',
    dia_diem_check_in: 'Hầm B1 Zone 2 CC02 Vin Cổ Loa',
    dia_diem_check_out: 'Hầm B1 Zone 2 CC02 Vin Cổ Loa',
    so_cn_anh_checkin: 6, // Lỗi: Lệch quân số ảnh (6 người) vs danh sách (8 người)
    so_cn_anh_checkout: 6,
    anh_hop_le_timemark: true,
    canh_bao_trang_phuc_nhan_dien: 'Có 01 người trong ảnh check-in đội mũ trắng bảo hộ của kỹ sư/cán bộ giám sát, không đúng trang phục công nhân.',
    danh_sach_cong_nhan: [
      { ma_nv: '4142890', ho_ten: 'Nguyễn Văn Hùng', tay_nghe: 'Bốc xếp cốp pha', ca_1: true, ca_2: true, ca_3: false, co_chu_ky_cn: true }, // TRÙNG MÃ VỚI BATCH 01
      { ma_nv: '4223101', ho_ten: 'Đỗ Mạnh Cường', tay_nghe: 'Thợ giàn giáo B3', ca_1: true, ca_2: true, ca_3: false, co_chu_ky_cn: true },
      { ma_nv: '4223102', ho_ten: 'Vũ Đức Thắng', tay_nghe: 'Phụ vận chuyển', ca_1: true, ca_2: true, ca_3: false, co_chu_ky_cn: true },
      { ma_nv: '4223103', ho_ten: 'Lương Thế Vinh', tay_nghe: 'Phụ bốc vác', ca_1: true, ca_2: true, ca_3: false, co_chu_ky_cn: true },
      { ma_nv: '4223104', ho_ten: 'Bùi Văn Hạnh', tay_nghe: 'Thợ cốp pha', ca_1: true, ca_2: true, ca_3: false, co_chu_ky_cn: true },
      { ma_nv: '4223105', ho_ten: 'Ngô Thanh Sơn', tay_nghe: 'Thợ cốp pha', ca_1: true, ca_2: true, ca_3: false, co_chu_ky_cn: true },
      { ma_nv: '4223106', ho_ten: 'Dương Văn Quý', tay_nghe: 'Phụ vệ sinh', ca_1: true, ca_2: true, ca_3: false, co_chu_ky_cn: false },
      { ma_nv: '4223107', ho_ten: 'Mai Văn Tám', tay_nghe: 'Phụ vệ sinh', ca_1: true, ca_2: true, ca_3: false, co_chu_ky_cn: true },
    ],
  },
  {
    id: 'batch_ocean_03',
    file_name: 'HS_CongNhat_OceanPark2_SanVuon_2909.pdf',
    so_trang_pdf: 'Trang 1 - 3',
    trang_bat_dau: 1,
    ngay_thang: '29/09/2026',
    du_an_phan_khu: 'Vinhomes Ocean Park 2 - San Hô 08',
    to_doi_thuc_hien: 'Tổ Cơ Giới Hạ Tầng 02', // Tổ được cộng
    to_doi_khau_tru: 'Tổ Hoàn Thiện Cảnh Quan Xanh', // Tổ bị trừ
    noi_dung_cong_viec: 'San gạt mặt bằng đất màu, đào mương cáp ngầm chiếu sáng cảnh quan khu shophouse.',
    co_bien_ban_hien_truong: true,
    co_nhat_ky_cong_nhat: true,
    co_du_chu_ky_bch_ktht: false, // Cảnh báo: Thiếu chữ ký BCH/KTHT
    so_cong_chot_bien_ban: 10.0, // Lỗi: Biên bản chốt 10 công nhưng Nhật ký tính 8 công (Lệch 2 công)
    don_gia_bien_ban: undefined, // Không ghi đơn giá trong Biên bản -> Lấy đơn giá mặc định
    gio_check_in: '07:05',
    gio_check_out: '17:15',
    ngay_tren_anh: '29/09/2026',
    dia_diem_check_in: 'Khu San Hô SH08, Ocean Park 2, Văn Giang, Hưng Yên',
    dia_diem_check_out: 'Khu San Hô SH08, Ocean Park 2, Văn Giang, Hưng Yên',
    so_cn_anh_checkin: 8,
    so_cn_anh_checkout: 8,
    anh_hop_le_timemark: true,
    danh_sach_cong_nhan: [
      { ma_nv: '5012399', ho_ten: 'Đặng Quốc Khánh', tay_nghe: 'Lái máy đào nhỏ', ca_1: true, ca_2: true, ca_3: false, co_chu_ky_cn: true },
      { ma_nv: '5012400', ho_ten: 'Hà Văn Nam', tay_nghe: 'Thợ hồ B2', ca_1: true, ca_2: true, ca_3: false, co_chu_ky_cn: true },
      { ma_nv: '5012401', ho_ten: 'Phan Đình Giáp', tay_nghe: 'Thợ điện hạ thế', ca_1: true, ca_2: true, ca_3: false, co_chu_ky_cn: true },
      { ma_nv: '5012402', ho_ten: 'Nguyễn Thành Trung', tay_nghe: 'Phụ đào rãnh', ca_1: true, ca_2: true, ca_3: false, co_chu_ky_cn: true },
      { ma_nv: '5012403', ho_ten: 'Trần Văn Kiên', tay_nghe: 'Phụ đào rãnh', ca_1: true, ca_2: true, ca_3: false, co_chu_ky_cn: true },
      { ma_nv: '5012404', ho_ten: 'Lê Văn Luyện', tay_nghe: 'Phụ vận chuyển', ca_1: true, ca_2: true, ca_3: false, co_chu_ky_cn: true },
      { ma_nv: '5012405', ho_ten: 'Vũ Hữu Bằng', tay_nghe: 'Phụ san gạt', ca_1: true, ca_2: true, ca_3: false, co_chu_ky_cn: true },
      { ma_nv: '5012406', ho_ten: 'Tạ Minh Tân', tay_nghe: 'Phụ san gạt', ca_1: true, ca_2: true, ca_3: false, co_chu_ky_cn: true },
    ],
  },
  {
    id: 'batch_grand_04',
    file_name: 'HS_TangCa_Dem_BeTong_3009.pdf',
    so_trang_pdf: 'Trang 1 - 2',
    trang_bat_dau: 1,
    ngay_thang: '30/09/2026',
    du_an_phan_khu: 'Vinhomes Grand Park - The Beverly T18',
    to_doi_thuc_hien: 'Tổ Tăng Ca Đột Xuất Đội 1', // Tổ được cộng
    to_doi_khau_tru: 'Tổ Bê Tông Vĩnh Hưng', // Tổ bị trừ
    noi_dung_cong_viec: 'Bảo dưỡng ẩm bê tông sàn mái, đầm dùi tăng ca đêm và căng lưới bao che an toàn.',
    co_bien_ban_hien_truong: true,
    co_nhat_ky_cong_nhat: true,
    co_du_chu_ky_bch_ktht: true,
    so_cong_chot_bien_ban: 4.5,
    don_gia_bien_ban: 520000, // Đơn giá ca đêm ghi trong Biên bản: 520.000 đ/công
    gio_check_in: '07:10',
    gio_check_out: '22:45',
    ngay_tren_anh: '29/09/2026', // Lỗi: Ngày trên ảnh (29/09) lệch với Biên bản (30/09)
    dia_diem_check_in: 'Sàn mái T18, Beverly, Grand Park, TP. Thủ Đức',
    dia_diem_check_out: 'Cổng 2 Công trường Grand Park, TP. Thủ Đức', // Cảnh báo: Lệch vị trí GPS
    so_cn_anh_checkin: 3,
    so_cn_anh_checkout: 3,
    anh_hop_le_timemark: true,
    danh_sach_cong_nhan: [
      { ma_nv: '6104881', ho_ten: 'Trịnh Công Định', tay_nghe: 'Thợ bảo dưỡng BT', ca_1: true, ca_2: true, ca_3: true, co_chu_ky_cn: true }, // CẢNH BÁO: Làm cả 3 ca
      { ma_nv: '6104882', ho_ten: 'Lâm Văn Phước', tay_nghe: 'Thợ bảo dưỡng BT', ca_1: true, ca_2: true, ca_3: true, co_chu_ky_cn: true }, // CẢNH BÁO: Làm cả 3 ca
      { ma_nv: '6104883', ho_ten: 'Dương Văn Hoàng', tay_nghe: 'Phụ lưới an toàn', ca_1: true, ca_2: true, ca_3: true, co_chu_ky_cn: true }, // CẢNH BÁO: Làm cả 3 ca
    ],
  },
  {
    id: 'batch_golden_05',
    file_name: 'HS_CongNhat_ChongTham_HopLe_0110.pdf',
    so_trang_pdf: 'Trang 1 - 3',
    trang_bat_dau: 1,
    ngay_thang: '01/10/2026',
    du_an_phan_khu: 'Vinhomes Smart City - Phân khu Imperia S4',
    to_doi_thuc_hien: 'Tổ Kỹ Thuật Chống Thấm Vincons', // Tổ được cộng
    to_doi_khau_tru: 'Tổ Chống Thấm Việt Nhật', // Tổ bị trừ
    noi_dung_cong_viec: 'Khò màng dán chống thấm cổ ống xuyên sàn khu vệ sinh căn hộ trục 02-05.',
    co_bien_ban_hien_truong: true,
    co_nhat_ky_cong_nhat: true,
    co_du_chu_ky_bch_ktht: true,
    so_cong_chot_bien_ban: 4.0,
    don_gia_bien_ban: 450000, // Đơn giá ghi trong Biên bản: 450.000 đ/công
    gio_check_in: '07:20',
    gio_check_out: '17:10',
    ngay_tren_anh: '01/10/2026',
    dia_diem_check_in: 'Trục 02-05 Tầng 8 S4 Smart City, Nam Từ Liêm, HN',
    dia_diem_check_out: 'Trục 02-05 Tầng 8 S4 Smart City, Nam Từ Liêm, HN',
    so_cn_anh_checkin: 4,
    so_cn_anh_checkout: 4,
    anh_hop_le_timemark: true,
    danh_sach_cong_nhan: [
      { ma_nv: '7119021', ho_ten: 'Phan Văn Hiệp', tay_nghe: 'Thợ màng khò B3', ca_1: true, ca_2: true, ca_3: false, co_chu_ky_cn: true },
      { ma_nv: '7119022', ho_ten: 'Đinh Tiến Đạt', tay_nghe: 'Thợ màng khò B3', ca_1: true, ca_2: true, ca_3: false, co_chu_ky_cn: true },
      { ma_nv: '7119023', ho_ten: 'Vũ Quang Huy', tay_nghe: 'Phụ quét sơn lót', ca_1: true, ca_2: true, ca_3: false, co_chu_ky_cn: true },
      { ma_nv: '7119024', ho_ten: 'Bùi Quốc Tuấn', tay_nghe: 'Phụ vệ sinh bụi', ca_1: true, ca_2: true, ca_3: false, co_chu_ky_cn: true },
    ],
  },
];
