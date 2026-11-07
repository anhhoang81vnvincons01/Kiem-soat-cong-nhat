# Hệ Thống Kiểm Soát & Cảnh Báo Hồ Sơ Công Nhật Xây Dựng (QĐNBC)

Hệ thống ứng dụng web chuyên sâu dành cho Ban Chỉ huy Công trường và Chuyên viên Kiểm soát Chi phí (KSCP) nhằm tự động số hóa, bóc tách hồ sơ công nhật đối trừ từ file PDF (biên bản hiện trường viết tay, nhật ký công nhật, ảnh Timemark check-in/out điểm danh), tự động kiểm tra 9 lỗi vi phạm quy định QĐNBC, rà soát trùng lặp mã nhân viên và xuất báo cáo kiểm soát chi tiết ra file Excel (.xlsx).

## User Review & Critical Decisions

> [!IMPORTANT]
> Dựa trên xác nhận của bạn trong quá trình làm rõ yêu cầu:
> - **Tiêu chuẩn kiểm soát**: Xây dựng chuyên biệt theo quy chuẩn **Hồ sơ Công nhật QĐNBC** (tương thích toàn diện với luồng xử lý từ mã nguồn mẫu, đồng thời nâng cấp giao diện trực quan).
> - **Mô hình AI**: Tích hợp mô hình AI đa phương thức **Gemini 3.8 Flash** qua server-side Google GenAI SDK, đảm bảo khả năng đọc nhận diện chữ viết tay tiếng Việt và thị giác máy tính soi ảnh Timemark với độ chính xác cao nhất.
> - **4 Tính năng nâng cao**:
>   1. **Trình soi hồ sơ song song (Split-Screen Inspector)**: Xem từng trang PDF và ảnh Timemark bên cạnh bảng bóc tách dữ liệu và cảnh báo vi phạm.
>   2. **Bộ máy rà soát trùng lặp nhân sự (Cross-Batch Worker Deduplication)**: Quét toàn bộ mã nhân viên trên các tổ đội và ngày thi công để phát hiện khai khống/chấm công trùng.
>   3. **Bộ cấu hình quy tắc kiểm soát động (Customizable Audit Rules Engine)**: Cho phép bật/tắt, điều chỉnh ngưỡng và bổ sung điều kiện kiểm soát mới trực tiếp trên giao diện web.
>   4. **Bộ xuất báo cáo Excel nhiều sheet (.xlsx)**: Tạo file báo cáo chuẩn nghiệp vụ kiểm soát gồm bảng tổng hợp cảnh báo ngày, bảng chi tiết từng công nhân và bảng định mức đối trừ.

---

## 1. Overview & Core Concept

- **Mục tiêu cốt lõi**: Giải quyết triệt để bài toán tốn hàng giờ đọc thủ công hàng trăm trang hồ sơ công nhật viết tay lem luốc, soi từng con dấu Timemark nhỏ xíu trên ảnh và rà soát thủ công trùng mã nhân viên giữa các tổ đội xây dựng.
- **Đối tượng sử dụng**: Chuyên viên Kiểm soát chi phí (KSCP), Cán bộ Kỹ thuật Hiện trường (KTHT), Chỉ huy trưởng / Chỉ huy phó công trường, Ban Kiểm toán nội bộ.
- **Giá trị mang lại**: Giảm 90% thời gian rà soát hồ sơ, ngăn ngừa thất thoát chi phí nhân công do tính sai ca, làm liên tục quá giờ, chấm lặp nhân sự hoặc sử dụng ảnh Timemark sai quy cách.

---

## 2. User Experience & Visual Design

### 2.1 Luồng trải nghiệm người dùng (Key User Flows)

1. **Khởi tạo & Tải hồ sơ**:
   - Người dùng kéo thả 1 hoặc nhiều file PDF hồ sơ công nhật (hỗ trợ file scan, ảnh ghép trong PDF).
   - Có sẵn nút **"Tải hồ sơ mẫu QĐNBC"** giúp trải nghiệm tức thì toàn bộ quy trình với dữ liệu thực tế mẫu gồm cả các trường hợp chuẩn và vi phạm.
   - Nhập hoặc tùy chỉnh đơn giá công nhật (mặc định 450.000 VNĐ/công).
2. **Tiến trình xử lý đa phương thức (Multimodal Processing)**:
   - Thanh tiến trình phân tích theo thời gian thực (Render trang -> Gemini Vision OCR -> Chuẩn hóa dữ liệu theo cấu trúc Schema -> Chạy bộ quy tắc kiểm soát 9 lỗi).
3. **Bảng điều khiển Tổng quan (Audit Dashboard)**:
   - Các chỉ số KPI trọng yếu: Tổng số bộ hồ sơ ngày, Số bộ Vi phạm đỏ (từ chối thanh toán), Số bộ Cảnh báo vàng (cần giải trình), Tổng số lượt công nhân, Tổng giá trị tiền đối trừ tạm tính.
   - Bộ lọc đa chiều: Lọc theo Trạng thái (Hợp lệ / Cảnh báo / Vi phạm), Lọc theo Ngày, Tổ đội đối trừ, Phân khu dự án.
4. **Trình soi hồ sơ song song (Split-Screen Document Inspector)**:
   - Chọn bất kỳ dòng hồ sơ nào để mở khung soi: Nửa bên trái hiển thị ảnh chụp trang PDF / Timemark phóng to; Nửa bên phải hiển thị bảng bóc tách dữ liệu có đánh dấu trường bị vi phạm bằng màu trực quan và lý do cụ thể.
5. **Rà soát Trùng mã Nhân viên (Worker Deduplication Explorer)**:
   - Bảng phân tích riêng biệt nhóm theo Ngày và Mã công nhân: Đánh dấu đỏ các mã nhân viên xuất hiện ở từ 2 tổ đội hoặc 2 bảng chấm công khác nhau trong cùng 1 ngày, hoặc công nhân làm quá 2 ca/ngày (chấm 3 ca liên tục).
6. **Quản lý Quy tắc & Xuất Báo cáo**:
   - Tab cấu hình 9 quy tắc kiểm soát QĐNBC: Điều chỉnh ngưỡng chênh lệch công, giờ check-in giới hạn ca sáng, bật/tắt yêu cầu chữ ký.
   - Nút **"Xuất Báo cáo Excel (.xlsx)"** tạo file chuẩn định dạng kế toán ngay lập tức.

### 2.2 Định hướng thẩm mỹ & Ngôn ngữ thiết kế (Design Identity)

- **Phong cách**: Enterprise SaaS / Kỹ thuật xây dựng hiện đại, tinh tế, đậm chất kỷ luật và rõ ràng của ngành kiểm soát chi phí.
- **Bảng màu (Tailwind Tokens)**:
  - Nền chủ đạo: Sạch sẽ, tương phản cao (`bg-slate-50` / `dark:bg-slate-950`).
  - Khung cấu trúc: Tấm nền thẻ màu xám xanh nhẹ (`bg-white` / `dark:bg-slate-900`, viền `border-slate-200` / `dark:border-slate-800`).
  - Màu trạng thái nghiệp vụ:
    - Đỏ vi phạm nghiêm trọng: `text-rose-700 bg-rose-50 border-rose-200`
    - Vàng cảnh báo rà soát: `text-amber-700 bg-amber-50 border-amber-200`
    - Xanh lục hợp lệ: `text-emerald-700 bg-emerald-50 border-emerald-200`
    - Điểm nhấn chính (Primary Action): Xanh công trình chuyên nghiệp (`bg-blue-600 hover:bg-blue-700 text-white`).
- **Typography & Font**: Font `Plus Jakarta Sans` cho tiêu đề và cấu trúc giao diện, kết hợp font đơn cách `JetBrains Mono` / `tabular-nums` cho toàn bộ số liệu công, giờ điểm danh Timemark, mã nhân viên 7 số và số tiền VNĐ.
- **Tuân thủ quy chuẩn frontend**: Không dùng badge pill nhét bừa bãi, không có animation giả lập vô nghĩa, các số liệu trong bảng luôn căn phải và thẳng hàng theo hàng thập phân.

---

## 3. Key Product Decisions & Trade-Offs

- **Xử lý PDF qua Canvas / Image Buffer kết hợp Gemini Vision**:
  - *Phương án chọn*: Chuyển đổi các trang PDF thành định dạng hình ảnh chuẩn và gửi vào Gemini 3.8 Flash qua endpoint server-side với `responseSchema` nghiêm ngặt.
  - *Lý do*: Hồ sơ công nhật thực tế trên công trường luôn là chữ viết tay trên biểu mẫu in sẵn và ảnh chụp màn hình Timemark lồng trong PDF. Parser văn bản thuần túy (như pdf-parse) sẽ hoàn toàn bất lực trước chữ viết tay và ảnh chụp. Gemini Vision giải quyết hoàn hảo cả OCR chữ viết tay, tích ô và nhận diện quân số/mũ bảo hộ trên ảnh.
- **Kiến trúc Server-Side Gemini API Proxy**:
  - *Phương án chọn*: Khởi tạo `@google/genai` với `apiKey: process.env.GEMINI_API_KEY` trong Express backend (`server.ts`). Client gọi qua `/api/audit/*`.
  - *Lý do*: Bảo mật tuyệt đối API key, không để lộ ra ngoài trình duyệt, hỗ trợ streaming cập nhật tiến trình và xử lý tập tin dung lượng lớn an toàn.
- **Bộ máy kiểm soát hai lớp (Two-Layer Validation Engine)**:
  - *Lớp 1 (AI bóc tách cấu trúc)*: Gemini trích xuất dữ liệu thô chuẩn hóa (Mã NV, Tích ca 1/2/3, Chữ ký, Số công biên bản, Giờ ảnh, Quân số ảnh, Cảnh báo mũ nón).
  - *Lớp 2 (Thuật toán kiểm soát xác thực cục bộ - Rule Engine)*: Chạy trên mã nguồn TypeScript/JavaScript với logic toán học chính xác 100%, không phụ thuộc vào việc AI tự tính nhẩm, đảm bảo tính toán tài chính minh bạch và nhất quán.

---

## 4. Technical Architecture & Data Strategy

### 4.1 Sơ đồ kiến trúc hệ thống

```
┌────────────────────────────────────────────────────────────────────────┐
│                          CLIENT (React 19 + Vite)                      │
│                                                                        │
│  ┌───────────────────┐  ┌───────────────────┐  ┌───────────────────┐   │
│  │   PDF Upload &    │  │  Audit Dashboard  │  │   Split-Screen    │   │
│  │   Demo Loader     │  │  (Metrics & Table)│  │   Inspector View  │   │
│  └─────────┬─────────┘  └─────────▲─────────┘  └─────────▲─────────┘   │
│            │                      │                      │             │
│            │            ┌─────────┴─────────┐  ┌─────────┴─────────┐   │
│            │            │ Worker Deduplicat.│  │ Custom Rule Editor│   │
│            │            │ & Overtime Audit  │  │ & Excel Export    │   │
│            │            └───────────────────┘  └───────────────────┘   │
└────────────┼───────────────────────────────────────────────────────────┘
             │ HTTP POST (Multipart / Base64 PDF)
             ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        SERVER (Express + tsx)                          │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  /api/audit/process-pdf                                          │  │
│  │  - PDF Page Rasterizer & Timemark Crop Extraction                │  │
│  │  - Gemini 3.8 Flash Multimodal OCR via @google/genai SDK        │  │
│  │  - Structured JSON Schema (DocumentExtraction)                   │  │
│  └──────────────────────────────────┬───────────────────────────────┘  │
│                                     │                                  │
│                                     ▼                                  │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  Rule Engine QĐNBC (Deterministic Verification)                  │  │
│  │  1. Thiếu chứng từ (Biên bản / Nhật ký / Timemark / Chữ ký)      │  │
│  │  2. Lệch số công (Biên bản vs Nhật ký tích ca)                  │  │
│  │  3. Ảnh check-in/out sai giờ (Ca sáng chụp sau 11h, sai ngày)    │  │
│  │  4. Lệch quân số ảnh Timemark vs Nhật ký công nhân               │  │
│  │  5. Vi phạm trang phục / Nhận diện (mũ trắng, đổi đồ)            │  │
│  │  6. Trùng nhân sự nhiều tổ đội trong cùng 1 ngày                │  │
│  │  7. Làm quá số ca quy định (3 ca liên tục)                       │  │
│  │  8. Lệch tọa độ GPS giữa đầu ca và cuối ca                       │  │
│  │  9. Quy tắc động người dùng tùy biến                             │  │
│  └──────────────────────────────────┬───────────────────────────────┘  │
│                                     │                                  │
│                                     ▼                                  │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  /api/audit/export-excel: XLSX generation & download             │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Cấu trúc dữ liệu chính (Data Models)

```typescript
export interface WorkerItem {
  ma_nv: string;           // Mã nhân viên (7 chữ số, ví dụ: 4142890)
  ho_ten: string;          // Họ tên công nhân
  tay_nghe?: string;       // Bậc thợ / ngành nghề
  ca_1: boolean;           // Sáng (0.5 công)
  ca_2: boolean;           // Chiều (0.5 công)
  ca_3: boolean;           // Tối/Tăng ca (0.5 công)
  co_chu_ky_cn: boolean;   // Có chữ ký công nhân
}

export interface DailyRecordBatch {
  id: string;
  file_name: string;
  so_trang_pdf: string;
  ngay_thang: string;      // DD/MM/YYYY
  du_an_phan_khu: string;  // Ví dụ: Vinhomes Cổ Loa - CC02
  to_doi_khau_tru: string; // Tên tổ đội bị đối trừ
  noi_dung_cong_viec: string;
  co_bien_ban_hien_truong: boolean;
  co_nhat_ky_cong_nhat: boolean;
  co_du_chu_ky_bch_ktht: boolean;
  so_cong_chot_bien_ban: number;
  gio_check_in?: string;
  gio_check_out?: string;
  ngay_tren_anh?: string;
  dia_diem_check_in?: string;
  dia_diem_check_out?: string;
  so_cn_anh_checkin: number;
  so_cn_anh_checkout: number;
  anh_hop_le_timemark: boolean;
  canh_bao_trang_phuc_nhan_dien?: string;
  danh_sach_cong_nhan: WorkerItem[];
  page_thumbnails?: string[]; // Ảnh render trang PDF để xem trực tiếp
}

export interface AuditResultRow {
  batch_id: string;
  file_name: string;
  trang_pdf: string;
  ngay: string;
  du_an: string;
  to_doi: string;
  so_cn: number;
  cong_bien_ban: number;
  cong_nhat_ky: number;
  gio_in_out: string;
  quan_so_anh: string;
  gia_tri_tam_tinh: number;
  trang_thai: 'HOP_LE' | 'CANH_BAO' | 'VI_PHAM';
  loi_chi_tiet: string[];
}
```

### 4.3 Kế hoạch thực hiện theo thứ tự (Execution Roadmap)

1. **Bước 1 - Cấu hình Backend & Full-Stack Engine**:
   - Thiết lập `server.ts` chạy Express kết hợp Vite dev server.
   - Viết module xử lý `@google/genai` với prompt chuyên gia KSCP xây dựng và Structured JSON Output.
   - Viết bộ máy kiểm soát QĐNBC Rule Engine và các endpoint API xử lý file PDF + dữ liệu mẫu.
2. **Bước 2 - Bộ sinh và tải Báo cáo Excel**:
   - Tích hợp xuất file `.xlsx` đa sheet (Tổng hợp cảnh báo, Bảng chi tiết chấm công, Danh sách trùng lặp).
3. **Bước 3 - Giao diện Web Hiện đại**:
   - Xây dựng thanh công cụ và bộ nạp hồ sơ mẫu (Sample Dataset) cùng khu vực kéo thả PDF.
   - Thẻ thống kê KPI tài chính & vi phạm.
   - Bảng tổng hợp kiểm soát với bộ lọc tìm kiếm và phân loại màu sắc vi phạm.
   - Khung soi chi tiết song song (PDF/Timemark Split-Screen Inspector).
   - Tab phân tích đối soát nhân sự trùng lặp và làm ca đêm/làm nhiều ca.
   - Bảng quản lý quy tắc kiểm soát cho phép người dùng bật/tắt hoặc thêm quy tắc mới.
4. **Bước 4 - Kiểm thử & Hoàn thiện**:
   - Biên dịch `compile_applet` và kiểm tra lỗi `lint_applet`.
   - Xác nhận luồng chạy trơn tru với cả dữ liệu mẫu và file tải lên thực tế.
