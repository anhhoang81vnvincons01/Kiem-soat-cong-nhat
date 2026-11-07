import streamlit as st
import fitz  # PyMuPDF
import pandas as pd
import json
import io
from PIL import Image
from google import genai
from google.genai import types
from pydantic import BaseModel, Field
from typing import List, Optional

# ================= CẤU HÌNH TRANG WEB =================
st.set_page_config(
    page_title="Kiểm Soát Hồ Sơ Công Nhật (QĐNBC)",
    page_icon="🛡️",
    layout="wide"
)

st.title("🛡️ Hệ Thống Kiểm Soát & Cảnh Báo Hồ Sơ Công Nhật (QĐNBC)")
st.markdown("Tự động bóc tách chữ viết tay **Biên bản hiện trường**, **Nhật ký công nhật**, soi **Ảnh Timemark** và quét lỗi vi phạm.")

# ================= CẤU TRÚC DỮ LIỆU BÓC TÁCH (SCHEMA) =================
class WorkerItem(BaseModel):
    ma_nv: str = Field(description="Mã nhân viên (thường gồm 7 chữ số, ví dụ 4142890, 3886900). Bỏ các dấu chấm phân cách.")
    ho_ten: str = Field(description="Họ và tên công nhân")
    tay_nghe: Optional[str] = Field(description="Tay nghề hoặc bậc thợ (ví dụ: b3 xây, b2 trát)")
    ca_1: bool = Field(description="Có tích chọn Ca 1 (sáng) trong bảng nhật ký không")
    ca_2: bool = Field(description="Có tích chọn Ca 2 (chiều) trong bảng nhật ký không")
    ca_3: bool = Field(description="Có tích chọn Ca 3 (tối/tăng ca) trong bảng nhật ký không")
    co_chu_ky_cn: bool = Field(description="Có chữ ký của công nhân ở cột CNCH ký xác nhận không")

class DailyRecordBatch(BaseModel):
    so_trang_pdf: str = Field(description="Các trang PDF thuộc bộ hồ sơ ngày này (ví dụ: 'Trang 1-3')")
    ngay_thang: str = Field(description="Ngày tháng thực hiện (định dạng DD/MM/YYYY, ví dụ 28/09/2026)")
    du_an_phan_khu: str = Field(description="Dự án / Phân khu / Lô (ví dụ: Cổ Loa - CC02 PK A5)")
    to_doi_khau_tru: str = Field(description="Tên tổ đội hoặc nhà thầu bị đối trừ công nhật")
    noi_dung_cong_viec: str = Field(description="Tóm tắt nội dung công việc thực hiện")
    
    # Kiểm tra sự tồn tại của chứng từ
    co_bien_ban_hien_truong: bool = Field(description="Có trang Biên bản hiện trường không")
    co_nhat_ky_cong_nhat: bool = Field(description="Có trang Nhật ký công nhật không")
    co_du_chu_ky_bch_ktht: bool = Field(description="Biên bản và Nhật ký có đủ chữ ký đại diện BCH/CV KTHT và Tổ đội không")
    
    # Khối lượng công
    so_cong_chot_bien_ban: float = Field(description="Số công nhật xác nhận ghi ở dòng chốt cuối Biên bản hiện trường (ví dụ: 10, 1, 3, 9, 2)")
    
    # Kiểm tra ảnh Timemark
    gio_check_in: Optional[str] = Field(description="Giờ trên ảnh điểm danh đầu ca (HH:MM, ví dụ 06:43 hoặc 13:24)")
    gio_check_out: Optional[str] = Field(description="Giờ trên ảnh điểm danh cuối ca (HH:MM, ví dụ 17:39)")
    ngay_tren_anh: Optional[str] = Field(description="Ngày tháng hiển thị trên dấu Timemark của ảnh (DD/MM/YYYY)")
    dia_diem_check_in: Optional[str] = Field(description="Địa điểm GPS trên ảnh đầu ca")
    dia_diem_check_out: Optional[str] = Field(description="Địa điểm GPS trên ảnh cuối ca")
    so_cn_anh_checkin: int = Field(description="Số lượng công nhân (mặc đồ bảo hộ/mũ vàng, KHÔNG tính cán bộ mặc áo lưới phản quang xanh) trong ảnh đầu ca")
    so_cn_anh_checkout: int = Field(description="Số lượng công nhân (KHÔNG tính cán bộ mặc áo phản quang xanh) trong ảnh cuối ca")
    anh_hop_le_timemark: bool = Field(description="Ảnh có đầy đủ đóng dấu Timemark 100% Chân thực không")
    canh_bao_trang_phuc_nhan_dien: Optional[str] = Field(description="Mô tả ngay nếu phát hiện công nhân đội mũ trắng của cán bộ, không mặc đồ bảo hộ, hoặc người trong ảnh sáng và chiều khác nhau/mặc quần áo khác nhau.")
    
    danh_sach_cong_nhan: List[WorkerItem] = Field(description="Danh sách công nhân trích xuất từ Biên bản và Nhật ký")

class DocumentExtraction(BaseModel):
    cac_bo_ho_so: List[DailyRecordBatch]

# ================= HÀM XỬ LÝ PDF & GỌI AI VISION =================
def pdf_to_images(pdf_bytes, dpi=150):
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    images = []
    for page_num in range(len(doc)):
        page = doc.load_page(page_num)
        pix = page.get_pixmap(dpi=dpi)
        img = Image.open(io.BytesIO(pix.tobytes("jpeg")))
        images.append((page_num + 1, img))
    return images

def extract_pdf_with_gemini(api_key: str, file_name: str, images: list, model_name: str = "gemini-2.5-flash"):
    client = genai.Client(api_key=api_key)
    
    prompt = """
    Bạn là Chuyên viên Kiểm soát chi phí (KSCP) cao cấp kiểm tra hồ sơ Thanh toán Công nhật đối trừ.
    Hãy phân tích toàn bộ các trang hình ảnh được cung cấp từ file PDF này.
    
    LƯU Ý QUAN TRỌNG:
    1. Hồ sơ thường đi theo từng cụm 3 trang cho 1 ngày (Biên bản hiện trường viết tay + Nhật ký công nhật + Trang chứa 2 ảnh chụp điểm danh Timemark đầu ca/cuối ca). Đôi khi thứ tự trang bị đảo lộn, hãy gom đúng theo Ngày.
    2. Đọc kỹ chữ viết tay: Mã nhân viên (thường gồm 7 chữ số như 3886900, 4142890, 4169575...), Họ tên, số công xác nhận ở câu cuối Biên bản, và các dấu tích (V, X) ở cột Ca 1, Ca 2, Ca 3 trên Nhật ký.
    3. Trên trang Ảnh điểm danh Timemark:
       - Đếm chính xác số lượng CÔNG NHÂN (thường mặc áo bảo hộ xanh tím than, đội mũ vàng) và tách biệt với Cán bộ kỹ thuật (người mặc áo ghi-lê phản quang màu xanh nõn chuối, đội mũ trắng).
       - Soi kỹ trang phục và khuôn mặt giữa ảnh đầu ca và cuối ca: Có ai đội mũ trắng trong hàng công nhân không? Có ai thay đổi quần áo hoặc đổi người giữa ca sáng và ca chiều không?
       - Đọc đúng giờ điểm danh (ví dụ 06:43, 13:24, 17:43) và dòng địa chỉ GPS trên cả 2 ảnh.
    """
    
    contents = [prompt]
    for page_no, img in images:
        contents.append(f"--- TRANG PDF SỐ {page_no} (File: {file_name}) ---")
        contents.append(img)
        
    response = client.models.generate_content(
        model=model_name,
        contents=contents,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=DocumentExtraction,
            temperature=0.1
        )
    )
    return json.loads(response.text)

# ================= BỘ MÁY QUY TẮC KIỂM SOÁT (RULE ENGINE QĐNBC) =================
def run_audit_rules(all_extracted_data, don_gia_cong=450000):
    summary_rows = []
    worker_rows = []
    
    # Bước 1: Gom toàn bộ dữ liệu công nhân để quét trùng nhân sự và làm liên tục nhiều ca
    for file_item in all_extracted_data:
        fname = file_item["file_name"]
        for batch in file_item["data"].get("cac_bo_ho_so", []):
            ngay = batch.get("ngay_thang", "Chưa rõ")
            trang = batch.get("so_trang_pdf", "")
            to_doi = batch.get("to_doi_khau_tru", "")
            
            for w in batch.get("danh_sach_cong_nhan", []):
                so_ca_tich = int(bool(w.get("ca_1"))) + int(bool(w.get("ca_2"))) + int(bool(w.get("ca_3")))
                so_cong_tich = so_ca_tich * 0.5
                worker_rows.append({
                    "File PDF": fname,
                    "Trang": trang,
                    "Ngày": ngay,
                    "Tổ đội bị đối trừ": to_doi,
                    "Mã NV": str(w.get("ma_nv", "")).strip(),
                    "Họ và tên": w.get("ho_ten", ""),
                    "Ca 1 (Sáng)": "X" if w.get("ca_1") else "",
                    "Ca 2 (Chiều)": "X" if w.get("ca_2") else "",
                    "Ca 3 (Tối)": "X" if w.get("ca_3") else "",
                    "Số công (theo tích NK)": so_cong_tich,
                    "Có ký NK": "Có" if w.get("co_chu_ky_cn") else "Thiếu"
                })
                
    df_workers = pd.DataFrame(worker_rows)
    
    # Tìm các Mã NV bị trùng trong cùng 1 ngày (xuất hiện >= 2 lần trong cùng ngày)
    duplicate_keys = set()
    if not df_workers.empty:
        dup_check = df_workers.groupby(["Ngày", "Mã NV"]).size()
        for (ngay, manv), count in dup_check.items():
            if count > 1 and manv != "":
                duplicate_keys.add((ngay, manv))

    # Bước 2: Đánh giá từng bộ hồ sơ theo 9 lỗi QĐNBC
    for file_item in all_extracted_data:
        fname = file_item["file_name"]
        for batch in file_item["data"].get("cac_bo_ho_so", []):
            errors = []
            ngay = batch.get("ngay_thang", "Chưa rõ")
            trang = batch.get("so_trang_pdf", "")
            ds_cn = batch.get("danh_sach_cong_nhan", [])
            so_nguoi_nk = len(ds_cn)
            
            # Tổng số công tính theo dấu tích trên Nhật ký (1 ca = 0.5 công)
            tong_cong_nhat_ky = sum(
                (int(bool(w.get("ca_1"))) + int(bool(w.get("ca_2"))) + int(bool(w.get("ca_3")))) * 0.5
                for w in ds_cn
            )
            so_cong_bb = batch.get("so_cong_chot_bien_ban", 0)
            
            # LỖI 1: Thiếu hồ sơ/chứng từ chấm công
            if not batch.get("co_bien_ban_hien_truong") or not batch.get("co_nhat_ky_cong_nhat"):
                errors.append("🔴 [Thiếu chứng từ] Không đủ bộ Biên bản hiện trường + Nhật ký công nhật.")
            if not batch.get("gio_check_in") or not batch.get("gio_check_out"):
                errors.append("🔴 [Thiếu ảnh chấm công] Thiếu ảnh Timemark đầu ca hoặc cuối ca.")
            if not batch.get("co_du_chu_ky_bch_ktht"):
                errors.append("🟡 [Thiếu chữ ký] Biên bản/Nhật ký thiếu chữ ký xác nhận của BCH/KTHT.")
                
            # LỖI 2: Tính sai khối lượng công (Lệch giữa Biên bản và Nhật ký)
            if abs(so_cong_bb - tong_cong_nhat_ky) > 0.01:
                errors.append(
                    f"🔴 [Tính sai khối lượng công] Biên bản chốt {so_cong_bb} công nhưng Nhật ký tích chọn tương đương {tong_cong_nhat_ky} công (Lệch {abs(so_cong_bb - tong_cong_nhat_ky)} công)."
                )
                
            # LỖI 3: Ảnh check in-out không hợp lệ (Sai giờ ca làm việc, sai ngày, thiếu người)
            gio_in = batch.get("gio_check_in") or ""
            gio_out = batch.get("gio_check_out") or ""
            co_tich_ca1 = any(w.get("ca_1") for w in ds_cn)
            if co_tich_ca1 and gio_in >= "11:00":
                errors.append(
                    f"🔴 [Ảnh check-in không hợp lệ] Nhật ký tích làm Ca 1 (Sáng) nhưng ảnh đầu ca chụp lúc {gio_in} (Ca chiều)."
                )
            if batch.get("ngay_tren_anh") and batch.get("ngay_tren_anh") != ngay and ngay != "Chưa rõ":
                errors.append(
                    f"🔴 [Sai ngày trên ảnh] Biên bản ghi ngày {ngay} nhưng ảnh Timemark là ngày {batch.get('ngay_tren_anh')}."
                )
            if batch.get("so_cn_anh_checkin", 0) != so_nguoi_nk or batch.get("so_cn_anh_checkout", 0) != so_nguoi_nk:
                errors.append(
                    f"🔴 [Lệch quân số trên ảnh] Danh sách ghi {so_nguoi_nk} CN, nhưng ảnh Check-in có {batch.get('so_cn_anh_checkin')} CN, ảnh Check-out có {batch.get('so_cn_anh_checkout')} CN."
                )
            if batch.get("dia_diem_check_in") and batch.get("dia_diem_check_out"):
                if batch.get("dia_diem_check_in") != batch.get("dia_diem_check_out"):
                    errors.append(
                        f"🟡 [Lệch vị trí GPS] Đầu ca ({batch.get('dia_diem_check_in')}) khác Cuối ca ({batch.get('dia_diem_check_out')})."
                    )
                    
            # LỖI 4: Khác nhận diện / Khác trang phục
            if batch.get("canh_bao_trang_phuc_nhan_dien"):
                errors.append(f"🔴 [Khác nhận diện/Trang phục] {batch.get('canh_bao_trang_phuc_nhan_dien')}")
                
            # LỖI 5: Làm liên tục nhiều ca (3 ca/ngày)
            cn_3ca = [w.get("ma_nv") for w in ds_cn if w.get("ca_1") and w.get("ca_2") and w.get("ca_3")]
            if cn_3ca:
                errors.append(f"🟡 [Làm liên tục nhiều ca] CN chấm cả 3 ca trong ngày: {', '.join(cn_3ca)}.")
                
            # LỖI 6: Trùng nhân sự nhiều tổ / nhiều bảng công trong cùng ngày
            dup_in_batch = [w.get("ma_nv") for w in ds_cn if (ngay, str(w.get("ma_nv", "")).strip()) in duplicate_keys]
            if dup_in_batch:
                errors.append(f"🔴 [Trùng nhân sự nhiều bảng công] Mã NV xuất hiện nhiều lần trong ngày {ngay}: {', '.join(set(dup_in_batch))}.")

            muc_do = "🟢 Hợp lệ"
            if any("🔴" in e for e in errors):
                muc_do = "🔴 Vi phạm QĐNBC"
            elif any("🟡" in e for e in errors):
                muc_do = "🟡 Cảnh báo rà soát"

            summary_rows.append({
                "File PDF": fname,
                "Trang PDF": trang,
                "Ngày": ngay,
                "Dự án / Phân khu": batch.get("du_an_phan_khu", ""),
                "Tổ đội đối trừ": batch.get("to_doi_khau_tru", ""),
                "Số CN": so_nguoi_nk,
                "Công Biên bản": so_cong_bb,
                "Công Nhật ký": tong_cong_nhat_ky,
                "Giờ In - Out": f"{gio_in} - {gio_out}",
                "Quân số Ảnh (In/Out)": f"{batch.get('so_cn_anh_checkin')}/{batch.get('so_cn_anh_checkout')}",
                "Giá trị tạm tính (VNĐ)": so_cong_bb * don_gia_cong,
                "Trạng thái": muc_do,
                "Chi tiết Lỗi & Cảnh báo (QĐNBC)": "\n".join(errors) if errors else "Đủ chứng từ, khớp số liệu"
            })
            
    return pd.DataFrame(summary_rows), df_workers

# ================= GIAO DIỆN SIDEBAR & ĐIỀU KHIỂN =================
with st.sidebar:
    st.header("⚙️ Cấu hình Hệ thống")
    api_key = st.text_input("🔑 Nhập Gemini API Key:", type="password", help="Lấy key từ Google AI Studio")
    model_choice = st.selectbox("🤖 Mô hình AI:", ["gemini-2.5-flash", "gemini-2.5-pro"], index=0)
    don_gia = st.number_input("💰 Đơn giá 1 công nhật (VNĐ):", value=450000, step=50000)
    
    st.markdown("---")
    st.subheader("📋 Các điều kiện QĐNBC đang bật:")
    st.checkbox("1. Thiếu hồ sơ/chứng từ chấm công", value=True, disabled=True)
    st.checkbox("2. Tính sai khối lượng công (BB vs NK)", value=True, disabled=True)
    st.checkbox("3. Trùng nhân sự nhiều tổ/nhiều bảng công", value=True, disabled=True)
    st.checkbox("4. Ảnh check in-out không hợp lệ (Giờ/Quân số)", value=True, disabled=True)
    st.checkbox("5. Khác nhận diện / Khác trang phục", value=True, disabled=True)
    st.checkbox("6. Làm liên tục nhiều ca", value=True, disabled=True)

uploaded_files = st.file_uploader(
    "📂 Kéo thả 1 hoặc nhiều file PDF Hồ sơ Công nhật vào đây:",
    type=["pdf"],
    accept_multiple_files=True
)

if uploaded_files and st.button("🚀 Bắt đầu Quét & Kiểm Soát Hồ Sơ", type="primary"):
    if not api_key:
        st.error("Vui lòng nhập Gemini API Key ở thanh cấu hình bên trái trước khi chạy!")
    else:
        all_results = []
        progress_bar = st.progress(0)
        status_text = st.empty()
        
        for idx, pdf_file in enumerate(uploaded_files):
            status_text.info(f"⏳ Đang đọc và soi ảnh Timemark file: **{pdf_file.name}** ({idx+1}/{len(uploaded_files)})...")
            pdf_bytes = pdf_file.read()
            images = pdf_to_images(pdf_bytes, dpi=150)
            
            try:
                extracted_json = extract_pdf_with_gemini(api_key, pdf_file.name, images, model_choice)
                all_results.append({
                    "file_name": pdf_file.name,
                    "data": extracted_json
                })
            except Exception as e:
                st.error(f"Lỗi khi xử lý file {pdf_file.name}: {str(e)}")
                
            progress_bar.progress((idx + 1) / len(uploaded_files))
            
        status_text.success("✅ Đã hoàn tất phân tích! Dưới đây là báo cáo kiểm soát:")
        
        if all_results:
            df_summary, df_workers = run_audit_rules(all_results, don_gia_cong=don_gia)
            
            # Hiển thị Metrics tổng quan
            col1, col2, col3, col4 = st.columns(4)
            col1.metric("Tổng số bộ hồ sơ (Ngày)", len(df_summary))
            col2.metric("🔴 Số bộ Vi phạm QĐNBC", len(df_summary[df_summary["Trạng thái"].str.contains("Vi phạm")]))
            col3.metric("🟡 Số bộ Cảnh báo", len(df_summary[df_summary["Trạng thái"].str.contains("Cảnh báo")]))
            col4.metric("Tổng số lượt Công nhân", len(df_workers))
            
            st.subheader("🚨 1. Bảng Tổng Hợp Cảnh Báo & Đánh Giá Theo Ngày (QĐNBC)")
            st.dataframe(df_summary, use_container_width=True, height=400)
            
            st.subheader("👷 2. Bảng Chi Tiết Nhân Sự & Rà Soát Trùng Mã NV")
            st.dataframe(df_workers, use_container_width=True, height=350)
            
            # Xuất ra file Excel
            output = io.BytesIO()
            with pd.ExcelWriter(output, engine="openpyxl") as writer:
                df_summary.to_excel(writer, sheet_name="Tong_Hop_Canh_Bao_QDNBC", index=False)
                df_workers.to_excel(writer, sheet_name="Chi_Tiet_Cong_Nhan", index=False)
                
            st.download_button(
                label="📥 Tải Báo Cáo Kiểm Soát (.xlsx)",
                data=output.getvalue(),
                file_name="Bao_Cao_Kiem_Soat_Cong_Nhat_QDNBC.xlsx",
                mime="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            )