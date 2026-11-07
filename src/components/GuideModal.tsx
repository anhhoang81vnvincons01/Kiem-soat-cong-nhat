import React from 'react';
import { BookOpen, ShieldAlert, CheckCircle, AlertTriangle, XCircle, FileSpreadsheet } from 'lucide-react';

export const GuideModal: React.FC = () => {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs mb-8">
      <div className="flex items-center gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
          <BookOpen className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Cẩm Nang Quy Chuẩn Kiểm Soát Hồ Sơ Công Nhật (QĐNBC)
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Quy định nghiệp vụ dành cho Chuyên viên Kiểm soát chi phí (KSCP) & Kỹ thuật hiện trường (KTHT)
          </p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
        {/* Nhóm 1: Hồ sơ & Khối lượng */}
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
            <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-2 text-sm">
              <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 flex items-center justify-center text-xs">1</span>
              Quy chuẩn Bộ Chứng Từ Bắt Buộc
            </h4>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Mỗi đợt công nhật đối trừ theo ngày bắt buộc phải có đủ cụm 3 chứng từ:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1 text-slate-700 dark:text-slate-300">
              <li><strong>Biên bản hiện trường:</strong> Ghi rõ nội dung việc làm phát sinh, phân khu, tên tổ đội chịu đối trừ, số công chốt ở câu cuối cùng và đủ chữ ký BCH, KTHT, Tổ trưởng.</li>
              <li><strong>Nhật ký công nhật:</strong> Danh sách công nhân có Mã NV (7 số), họ tên, tích ô Ca 1, Ca 2, Ca 3 và chữ ký từng người.</li>
              <li><strong>Ảnh Timemark:</strong> Đủ 2 ảnh (Check-in đầu ca và Check-out cuối ca) chụp bằng camera có đóng dấu thời gian và tọa độ GPS 100% Chân thực.</li>
            </ul>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
            <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-2 text-sm">
              <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 flex items-center justify-center text-xs">2</span>
              Nguyên Tắc Tính Công & Đối Chiếu Khối Lượng
            </h4>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Mỗi ca làm việc (Ca 1 Sáng, Ca 2 Chiều, Ca 3 Tối) tương đương <strong>0.5 công nhật</strong>.
            </p>
            <p className="mt-2 text-rose-600 dark:text-rose-400 font-semibold">
              ⚠️ Nếu số công chốt ở câu cuối Biên bản lệch với tổng số công tích chọn trên Nhật ký (sai số vượt 0.01 công), hồ sơ sẽ lập tức bị xếp loại VI PHẠM TÍNH SAI KHỐI LƯỢNG.
            </p>
          </div>
        </div>

        {/* Nhóm 2: Timemark & Chấm lặp */}
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
            <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-2 text-sm">
              <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 flex items-center justify-center text-xs">3</span>
              Kiểm Soát Ảnh Timemark & Nhận Diện BHLĐ
            </h4>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-700 dark:text-slate-300">
              <li><strong>Khớp thời gian:</strong> Nếu nhật ký tích Ca 1 (Sáng), ảnh đầu ca không được chụp sau 11:00. Ngày trên ảnh phải trùng khớp 100% với ngày lập Biên bản.</li>
              <li><strong>Quân số trên ảnh:</strong> Số người đứng trong ảnh (mặc đồ bảo hộ, mũ vàng) phải đúng bằng số lượng công nhân ký danh sách.</li>
              <li><strong>Trang phục BHLĐ:</strong> Tuyệt đối cấm công nhân đội mũ trắng (mũ của cán bộ chỉ huy/giám sát). Phát hiện tráo đổi người sáng chiều hoặc không có đồ bảo hộ sẽ bị gắn cờ từ chối.</li>
            </ul>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
            <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-2 text-sm">
              <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 flex items-center justify-center text-xs">4</span>
              Chống Khai Khống & Trùng Nhân Sự Nhiều Tổ
            </h4>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Hệ thống tự động liên kết toàn bộ các file PDF đã tải lên trong đợt kiểm tra để quét chéo Mã nhân viên:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1 text-slate-700 dark:text-slate-300">
              <li>Một Mã NV xuất hiện ở từ 2 tổ đội hoặc 2 phân khu khác nhau trong cùng 1 ngày sẽ bị phát hiện và cảnh báo đỏ ngay lập tức.</li>
              <li>Cảnh báo công nhân làm cả 3 ca liên tục trong ngày (vượt quá giới hạn an toàn lao động).</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
