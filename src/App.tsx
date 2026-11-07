/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import ExcelJS from 'exceljs';
import { Header } from './components/Header';
import { MetricsOverview } from './components/MetricsOverview';
import { UploadSection } from './components/UploadSection';
import { AuditTable } from './components/AuditTable';
import { SplitScreenInspector } from './components/SplitScreenInspector';
import { WorkerDeduplication } from './components/WorkerDeduplication';
import { RuleManager } from './components/RuleManager';
import { GuideModal } from './components/GuideModal';
import { GoogleDrivePickerModal } from './components/GoogleDrivePickerModal';
import { SavedHistoryModal, SavedHistoryItem } from './components/SavedHistoryModal';
import { InstallPackageModal } from './components/InstallPackageModal';
import { GithubPushModal } from './components/GithubPushModal';
import {
  AuditBatchSummary,
  AuditRuleConfig,
  DailyRecordBatch,
  WorkerAuditRow,
} from './types/audit';
import { DEFAULT_AUDIT_RULES, runAuditEvaluation } from './services/auditEngine';
import { SAMPLE_QDNBC_BATCHES } from './services/sampleData';
import {
  signInWithGoogle,
  logoutGoogle,
  subscribeToAuth,
  uploadExcelReportToGoogleDrive,
  GoogleDriveUser,
  getAccessToken,
} from './services/googleDriveAuth';

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return (
        localStorage.getItem('theme') === 'dark' ||
        (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)
      );
    }
    return false;
  });

  const [activeTab, setActiveTab] = useState<'audit' | 'workers' | 'rules' | 'guide'>('audit');
  const [donGia, setDonGia] = useState<number>(450000);
  const [rules, setRules] = useState<AuditRuleConfig[]>(DEFAULT_AUDIT_RULES);

  // Dữ liệu bộ hồ sơ
  const [batches, setBatches] = useState<DailyRecordBatch[]>([]);
  const [summaries, setSummaries] = useState<AuditBatchSummary[]>([]);
  const [workers, setWorkers] = useState<WorkerAuditRow[]>([]);

  // Thống kê
  const [totalBatches, setTotalBatches] = useState(0);
  const [violateBatches, setViolateBatches] = useState(0);
  const [warningBatches, setWarningBatches] = useState(0);
  const [validBatches, setValidBatches] = useState(0);
  const [totalCost, setTotalCost] = useState(0);

  // Google Drive Integration State
  const [googleUser, setGoogleUser] = useState<GoogleDriveUser | null>(null);
  const [showDrivePicker, setShowDrivePicker] = useState(false);
  const [showConfirmUploadDrive, setShowConfirmUploadDrive] = useState(false);
  const [isUploadingToDrive, setIsUploadingToDrive] = useState(false);
  const [driveUploadResult, setDriveUploadResult] = useState<{ id: string; name: string; webViewLink?: string } | null>(null);

  // Kho lưu trữ hồ sơ cũ & Làm mới
  const [savedHistory, setSavedHistory] = useState<SavedHistoryItem[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('qdnbc_saved_history');
        if (stored) return JSON.parse(stored);
      } catch (e) {
        console.error('Lỗi đọc kho hồ sơ:', e);
      }
    }
    return [];
  });
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [showGithubModal, setShowGithubModal] = useState(false);

  // Inspector & Scan states
  const [selectedBatch, setSelectedBatch] = useState<AuditBatchSummary | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processStatus, setProcessStatus] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);

  // Lắng nghe trạng thái Firebase/Google Auth
  useEffect(() => {
    const unsubscribe = subscribeToAuth((user) => {
      setGoogleUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Đồng bộ chế độ Dark mode với html element
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  // Yêu cầu người dùng: Xóa đi 05 công tác mẫu đang hiện, bắt đầu với giao diện sạch sẽ 100%
  // Người dùng có thể tự bấm nạp mẫu hoặc tải lên hồ sơ thực tế bất cứ lúc nào.

  // Chạy lại đánh giá bất cứ khi nào batches, rules hoặc đơn giá thay đổi
  useEffect(() => {
    if (batches.length > 0) {
      reEvaluate(batches, rules, donGia);
    } else {
      setSummaries([]);
      setWorkers([]);
      setTotalBatches(0);
      setViolateBatches(0);
      setWarningBatches(0);
      setValidBatches(0);
      setTotalCost(0);
    }
  }, [batches, rules, donGia]);

  const reEvaluate = (
    currentBatches: DailyRecordBatch[],
    currentRules: AuditRuleConfig[],
    currentDonGia: number
  ) => {
    const result = runAuditEvaluation(currentBatches, currentRules, currentDonGia);
    setSummaries(result.summaries);
    setWorkers(result.workers);
    setTotalBatches(result.totalBatches);
    setViolateBatches(result.violateBatches);
    setWarningBatches(result.warningBatches);
    setValidBatches(result.validBatches);
    setTotalCost(result.totalCost);

    // Cập nhật selectedBatch nếu đang mở
    if (selectedBatch) {
      const updated = result.summaries.find((s) => s.batch_id === selectedBatch.batch_id);
      if (updated) setSelectedBatch(updated);
    }
  };

  const loadSampleData = () => {
    setBatches(SAMPLE_QDNBC_BATCHES);
    reEvaluate(SAMPLE_QDNBC_BATCHES, rules, donGia);
  };

  // Xử lý tải và bóc tách PDF thực tế qua Gemini, Claude API hoặc Tesseract OCR
  const handleProcessFiles = async (
    files: File[],
    config: {
      aiProvider: 'gemini' | 'claude' | 'tesseract';
      claudeApiKey?: string;
      claudeBaseURL?: string;
      claudeModel?: string;
    }
  ) => {
    setIsProcessing(true);
    setProgressPercent(10);
    const aiLabel =
      config.aiProvider === 'gemini'
        ? 'Gemini 3.8 Flash'
        : config.aiProvider === 'claude'
        ? `Claude (${config.claudeModel || 'Sonnet'})`
        : 'Tesseract OCR (Google Offline)';
    setProcessStatus(`Đang chuẩn bị đọc ${files.length} file PDF bằng ${aiLabel}...`);

    const newExtractedBatches: DailyRecordBatch[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const stepBase = (i / files.length) * 80 + 10;
      setProgressPercent(stepBase);
      setProcessStatus(`Đang đọc file: ${file.name} (${i + 1}/${files.length})...`);

      try {
        const blobUrl = URL.createObjectURL(file);
        const base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        setProgressPercent(stepBase + 20);
        setProcessStatus(`${aiLabel} đang soi chữ viết tay & Timemark: ${file.name}...`);

        const response = await fetch('/api/audit/process-pdf', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: file.name,
            pdfBase64: base64Data,
            rules,
            donGiaCong: donGia,
            aiProvider: config.aiProvider,
            claudeApiKey: config.claudeApiKey,
            claudeBaseURL: config.claudeBaseURL,
            claudeModel: config.claudeModel,
          }),
        });

        const data = await response.json();
        if (data.success && data.extractedBatches) {
          const batchesWithUrl = data.extractedBatches.map((b: DailyRecordBatch) => ({
            ...b,
            pdf_blob_url: blobUrl,
          }));
          newExtractedBatches.push(...batchesWithUrl);
        } else {
          alert(`Lỗi khi xử lý file ${file.name}: ${data.error || 'Không thể bóc tách'}`);
        }
      } catch (err: any) {
        console.error(`Lỗi khi gửi file ${file.name}:`, err);
        alert(`Lỗi kết nối khi gửi file ${file.name}: ${err.message}`);
      }
    }

    setProgressPercent(95);
    setProcessStatus('Đang tổng hợp và chạy bộ quy tắc kiểm soát QĐNBC...');

    if (newExtractedBatches.length > 0) {
      setBatches((prev) => [...prev, ...newExtractedBatches]);
    }

    setTimeout(() => {
      setProgressPercent(100);
      setIsProcessing(false);
      setProcessStatus('');
    }, 500);
  };

  // Mở trực tiếp đúng trang của file gốc
  const handleOpenOriginalPage = (batch: AuditBatchSummary) => {
    if (batch.pdf_blob_url) {
      window.open(`${batch.pdf_blob_url}#page=${batch.trang_bat_dau || 1}`, '_blank');
    } else {
      // Đối với mẫu giả lập hoặc khi chưa có blob url, mở SplitScreenInspector
      setSelectedBatch(batch);
    }
  };

  // Nhập dữ liệu bóc tách trực tiếp từ Claude Pro (claude.ai)
  const handleImportClaudePro = async (rawText: string) => {
    try {
      setIsProcessing(true);
      setProcessStatus('Đang nạp và kiểm tra dữ liệu từ Claude Pro...');
      const response = await fetch('/api/audit/import-claude-pro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawText,
          rules,
          donGiaCong: donGia,
          fileName: 'Claude_Pro_Import.pdf',
        }),
      });

      const data = await response.json();
      if (data.success && data.extractedBatches) {
        setBatches((prev) => [...prev, ...data.extractedBatches]);
        alert(`Đã nạp thành công ${data.extractedBatches.length} bộ hồ sơ từ Claude Pro!`);
      } else {
        alert(data.error || 'Lỗi khi nhập dữ liệu từ Claude Pro.');
      }
    } catch (err: any) {
      alert('Lỗi nhập Claude Pro: ' + err.message);
    } finally {
      setIsProcessing(false);
      setProcessStatus('');
    }
  };

  // Làm mới toàn bộ bảng dữ liệu (để nạp hồ sơ mới từ đầu)
  const handleResetData = () => {
    if (batches.length > 0) {
      const confirmReset = window.confirm(
        'Bạn có chắc chắn muốn làm mới toàn bộ bảng để nạp hồ sơ mới từ đầu không?\n(Mẹo: Bạn có thể nhấn "Lưu hồ sơ này" trước khi làm mới để không bị mất dữ liệu cũ)'
      );
      if (!confirmReset) return;
    }
    setBatches([]);
    setSelectedBatch(null);
  };

  // Lưu hồ sơ hiện tại vào kho lưu trữ (History)
  const handleSaveToHistory = () => {
    if (batches.length === 0) {
      alert('Chưa có dữ liệu hồ sơ để lưu.');
      return;
    }
    const defaultName = `Đợt kiểm soát ${new Date().toLocaleDateString('vi-VN')} (${batches.length} đợt / ${batches[0]?.du_an_phan_khu || 'QĐNBC'})`;
    const name = window.prompt('Nhập tên gợi nhớ cho bộ hồ sơ này:', defaultName);
    if (!name) return;

    const newItem: SavedHistoryItem = {
      id: `history_${Date.now()}`,
      name,
      savedAt: new Date().toISOString(),
      batchCount: batches.length,
      totalWorkers: workers.length,
      totalCost,
      batches: [...batches],
    };

    const updated = [newItem, ...savedHistory];
    setSavedHistory(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('qdnbc_saved_history', JSON.stringify(updated));
    }
    alert(`Đã lưu "${name}" vào Kho hồ sơ thành công!`);
  };

  // Mở lại một hồ sơ cũ từ kho lưu trữ
  const handleLoadHistory = (item: SavedHistoryItem) => {
    setBatches(item.batches);
    setSelectedBatch(null);
  };

  // Xóa một mục trong kho lưu trữ
  const handleDeleteHistory = (id: string) => {
    const updated = savedHistory.filter((h) => h.id !== id);
    setSavedHistory(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('qdnbc_saved_history', JSON.stringify(updated));
    }
  };

  // Xóa toàn bộ kho lưu trữ
  const handleClearAllHistory = () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa toàn bộ kho lưu trữ hồ sơ cũ không?')) {
      setSavedHistory([]);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('qdnbc_saved_history');
      }
    }
  };

  // Đăng nhập Google Drive
  const handleGoogleSignIn = async () => {
    try {
      const res = await signInWithGoogle();
      setGoogleUser(res.user);
    } catch (err: any) {
      alert('Không thể kết nối Google: ' + (err.message || 'Lỗi đăng nhập'));
    }
  };

  const handleGoogleSignOut = async () => {
    try {
      await logoutGoogle();
      setGoogleUser(null);
    } catch (err: any) {
      console.error('Lỗi đăng xuất:', err);
    }
  };

  // Nạp các tệp PDF vừa chọn từ Google Drive
  const handleDriveFilesSelected = (files: File[]) => {
    if (files.length > 0) {
      handleProcessFiles(files, { aiProvider: 'gemini' });
    }
  };

  // Tạo Blob Excel chuyên nghiệp, đẹp mắt, đầy đủ định dạng có điều kiện (Conditional Formatting)
  // Tự động tô màu đỏ các ô vi phạm, màu vàng các ô cảnh báo, màu xanh các ô duyệt hợp lệ
  const generateExcelBlob = async (): Promise<{ blob: Blob; fileName: string }> => {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'KSCP Vincons';
    workbook.created = new Date();

    const thinBorder: Partial<ExcelJS.Borders> = {
      top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      right: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    };

    // ==========================================
    // SHEET 1: Tong_Hop_Canh_Bao_QDNBC
    // ==========================================
    const wsSummary = workbook.addWorksheet('Tong_Hop_Canh_Bao_QDNBC', {
      views: [{ showGridLines: true }],
    });

    // Dòng tiêu đề chính
    wsSummary.mergeCells('A1:T1');
    const titleCell1 = wsSummary.getCell('A1');
    titleCell1.value = 'BÁO CÁO KIỂM SOÁT HỒ SƠ CÔNG NHẬT ĐỐI TRỪ (QUY CHUẨN QĐNBC)';
    titleCell1.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } };
    titleCell1.alignment = { horizontal: 'center', vertical: 'middle' };
    wsSummary.getRow(1).height = 32;

    // Dòng thông tin người lập & tiêu chuẩn
    wsSummary.mergeCells('A2:T2');
    const titleCell2 = wsSummary.getCell('A2');
    titleCell2.value = `Ngày lập báo cáo: ${new Date().toLocaleDateString('vi-VN')} | Đơn vị kiểm soát: KSCP / Ban QLDA Vincons | Tiêu chuẩn: 9 Lỗi đối trừ QĐNBC`;
    titleCell2.font = { name: 'Arial', size: 10, italic: true, color: { argb: 'FF334155' } };
    titleCell2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
    titleCell2.alignment = { horizontal: 'center', vertical: 'middle' };
    wsSummary.getRow(2).height = 22;

    // Dòng thống kê số liệu
    wsSummary.mergeCells('A3:T3');
    const titleCell3 = wsSummary.getCell('A3');
    titleCell3.value = `Tổng số đợt: ${summaries.length} | Hợp lệ: ${validBatches} | Cảnh báo: ${warningBatches} | Vi phạm: ${violateBatches} | Tổng giá trị tạm tính: ${new Intl.NumberFormat('vi-VN').format(totalCost)} VNĐ`;
    titleCell3.font = { name: 'Arial', size: 10.5, bold: true, color: { argb: 'FF0F172A' } };
    titleCell3.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
    titleCell3.alignment = { horizontal: 'center', vertical: 'middle' };
    wsSummary.getRow(3).height = 22;

    // Dòng trống cách điệu
    wsSummary.getRow(4).height = 10;

    // Tiêu đề các cột dữ liệu
    const summaryHeaders = [
      'STT',
      'Tập tin PDF gốc',
      'Phạm vi trang',
      'Trang bắt đầu',
      'Đường link mở trang file gốc',
      'Ngày thực hiện',
      'Dự án / Phân khu',
      'Tổ được cộng (+)',
      'Tổ bị trừ (-)',
      'Nội dung công việc',
      'Số CN (Bảng)',
      'Công Biên bản',
      'Công Nhật ký (tích)',
      'Đơn giá áp dụng (VNĐ)',
      'Nguồn gốc đơn giá',
      'Giờ In - Out',
      'Quân số Ảnh (In/Out)',
      'Giá trị tạm tính (VNĐ)',
      'Kết luận kiểm duyệt',
      'Chi tiết lỗi & Cảnh báo đối soát (9 Lỗi chuẩn QĐNBC)',
    ];

    const headerRow5 = wsSummary.addRow(summaryHeaders);
    headerRow5.height = 28;
    headerRow5.eachCell((cell) => {
      cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      cell.border = thinBorder;
    });

    // Điền dữ liệu và áp dụng Conditional Formatting (Định dạng có điều kiện màu sắc)
    summaries.forEach((s, idx) => {
      const isViolate = s.trang_thai === 'VI_PHAM';
      const isWarning = s.trang_thai === 'CANH_BAO';
      const isValid = s.trang_thai === 'HOP_LE';

      const statusText = isValid
        ? 'Duyệt thanh toán'
        : isWarning
        ? 'Cảnh báo cần giải trình'
        : 'Từ chối (Vi phạm QĐNBC)';

      const detailText =
        [...s.errors, ...s.warnings].join(' | ') ||
        'Hồ sơ đầy đủ, số liệu khớp đúng chuẩn 100%';

      const linkTarget = s.pdf_blob_url
        ? `${s.pdf_blob_url}#page=${s.trang_bat_dau || 1}`
        : `${s.file_name}#page=${s.trang_bat_dau || 1}`;

      const row = wsSummary.addRow([
        idx + 1,
        s.file_name,
        s.so_trang_pdf,
        s.trang_bat_dau || 1,
        linkTarget,
        s.ngay_thang,
        s.du_an_phan_khu,
        s.to_doi_thuc_hien,
        s.to_doi_khau_tru,
        s.noi_dung_cong_viec,
        s.so_cn,
        s.so_cong_bien_ban,
        s.so_cong_nhat_ky,
        s.don_gia_ap_dung,
        s.nguon_don_gia === 'BIEN_BAN' ? 'Ưu tiên Biên bản' : 'Mặc định hệ thống',
        s.gio_in_out,
        s.quan_so_anh,
        s.gia_tri_tam_tinh,
        statusText,
        detailText,
      ]);

      row.height = 24;

      // Nền hàng theo mức độ: vi phạm tô hồng nhẹ, cảnh báo tô vàng nhẹ, hợp lệ nền trắng/xám
      const defaultRowFill: ExcelJS.FillPattern = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: {
          argb: isViolate ? 'FFFFF5F5' : isWarning ? 'FFFFFDF0' : idx % 2 === 0 ? 'FFFFFFFF' : 'FFF8FAFC',
        },
      };

      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        cell.font = { name: 'Arial', size: 9.5, color: { argb: 'FF1E293B' } };
        cell.border = thinBorder;
        cell.fill = defaultRowFill;
        cell.alignment = { vertical: 'middle' };

        // Căn giữa cho các trường mã, số lượng, ngày
        if ([1, 3, 4, 6, 11, 12, 13, 14, 16, 17, 18].includes(colNumber)) {
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        }
        // Định dạng tiền tệ VND
        if (colNumber === 14 || colNumber === 18) {
          cell.numFmt = '#,##0';
          cell.alignment = { horizontal: 'right', vertical: 'middle' };
        }
      });

      // Cột 5: Hyperlink click mở trực tiếp trang file PDF gốc
      const linkCell = row.getCell(5);
      linkCell.value = {
        text: `Mở trang ${s.trang_bat_dau || 1} (${s.file_name})`,
        hyperlink: linkTarget,
        tooltip: 'Nhấp để mở đúng trang PDF gốc kiểm tra',
      };
      linkCell.font = { name: 'Arial', size: 9.5, color: { argb: 'FF2563EB' }, underline: true };

      // Cột 8: Tổ được cộng (+) -> Chữ xanh lục đậm
      const toCongCell = row.getCell(8);
      toCongCell.font = { name: 'Arial', size: 9.5, bold: true, color: { argb: 'FF047857' } };

      // Cột 9: Tổ bị trừ (-) -> Chữ đỏ đậm
      const toTruCell = row.getCell(9);
      toTruCell.font = { name: 'Arial', size: 9.5, bold: true, color: { argb: 'FFB91C1C' } };

      // Cảnh báo lệch công Biên bản vs Công Nhật ký (Cột 12 & 13)
      if (s.so_cong_bien_ban !== s.so_cong_nhat_ky) {
        const cellBB = row.getCell(12);
        const cellNK = row.getCell(13);
        const diffFill: ExcelJS.FillPattern = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFD2D2' },
        };
        cellBB.fill = diffFill;
        cellBB.font = { name: 'Arial', size: 9.5, bold: true, color: { argb: 'FF991B1B' } };
        cellNK.fill = diffFill;
        cellNK.font = { name: 'Arial', size: 9.5, bold: true, color: { argb: 'FF991B1B' } };
      }

      // ĐỊNH DẠNG CÓ ĐIỀU KIỆN (CONDITIONAL FORMATTING):
      // Cột 19: Kết luận kiểm duyệt (ĐỎ VI PHẠM, VÀNG CẢNH BÁO, XANH HỢP LỆ)
      const statusCell = row.getCell(19);
      if (isViolate) {
        statusCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFD2D2' }, // Tự động tô nền ĐỎ
        };
        statusCell.font = {
          name: 'Arial',
          size: 9.5,
          bold: true,
          color: { argb: 'FF991B1B' }, // Chữ đỏ đậm
        };
      } else if (isWarning) {
        statusCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFF3CD' }, // Tự động tô nền VÀNG
        };
        statusCell.font = {
          name: 'Arial',
          size: 9.5,
          bold: true,
          color: { argb: 'FF92400E' }, // Chữ vàng hổ phách đậm
        };
      } else {
        statusCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFD1E7DD' }, // Tự động tô nền XANH LÁ
        };
        statusCell.font = {
          name: 'Arial',
          size: 9.5,
          bold: true,
          color: { argb: 'FF0F5132' }, // Chữ xanh lá đậm
        };
      }
      statusCell.alignment = { horizontal: 'center', vertical: 'middle' };

      // Cột 20: Chi tiết lỗi & Vi phạm
      const detailCell = row.getCell(20);
      if (isViolate) {
        detailCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFEBEB' }, // Nền đỏ dịu
        };
        detailCell.font = {
          name: 'Arial',
          size: 9.5,
          bold: true,
          color: { argb: 'FFB91C1C' },
        };
      } else if (isWarning) {
        detailCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFFBEB' }, // Nền vàng dịu
        };
        detailCell.font = {
          name: 'Arial',
          size: 9.5,
          bold: true,
          color: { argb: 'FFB45309' },
        };
      } else {
        detailCell.font = {
          name: 'Arial',
          size: 9.5,
          color: { argb: 'FF059669' },
        };
      }
    });

    // Thiết lập độ rộng cột tối ưu cho Sheet 1
    wsSummary.columns = [
      { width: 6 },  // 1: STT
      { width: 26 }, // 2: File gốc
      { width: 14 }, // 3: Phạm vi trang
      { width: 14 }, // 4: Trang bắt đầu
      { width: 34 }, // 5: Link trang gốc
      { width: 14 }, // 6: Ngày
      { width: 22 }, // 7: Dự án
      { width: 24 }, // 8: Tổ được cộng
      { width: 24 }, // 9: Tổ bị trừ
      { width: 32 }, // 10: Nội dung CV
      { width: 12 }, // 11: Số CN
      { width: 14 }, // 12: Công BB
      { width: 18 }, // 13: Công NK
      { width: 20 }, // 14: Đơn giá
      { width: 18 }, // 15: Nguồn đơn giá
      { width: 16 }, // 16: Giờ in-out
      { width: 18 }, // 17: Quân số ảnh
      { width: 22 }, // 18: Giá trị tạm tính
      { width: 26 }, // 19: Kết luận kiểm duyệt
      { width: 65 }, // 20: Chi tiết lỗi
    ];

    // Cài đặt quy tắc định dạng có điều kiện (Native Conditional Formatting Rules) cho Excel
    if (summaries.length > 0) {
      wsSummary.addConditionalFormatting({
        ref: `S6:S${5 + summaries.length}`,
        rules: [
          {
            type: 'cellIs',
            operator: 'equal',
            formulae: ['"Từ chối (Vi phạm QĐNBC)"'],
            style: {
              fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFFFD2D2' } },
              font: { color: { argb: 'FF991B1B' }, bold: true },
            },
            priority: 1,
          },
          {
            type: 'cellIs',
            operator: 'equal',
            formulae: ['"Cảnh báo cần giải trình"'],
            style: {
              fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFFFF3CD' } },
              font: { color: { argb: 'FF92400E' }, bold: true },
            },
            priority: 2,
          },
          {
            type: 'cellIs',
            operator: 'equal',
            formulae: ['"Duyệt thanh toán"'],
            style: {
              fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFD1E7DD' } },
              font: { color: { argb: 'FF0F5132' }, bold: true },
            },
            priority: 3,
          },
        ],
      });
    }

    // ==========================================
    // SHEET 2: Chi_Tiet_Cong_Nhan
    // ==========================================
    const wsWorkers = workbook.addWorksheet('Chi_Tiet_Cong_Nhan', {
      views: [{ showGridLines: true }],
    });

    // Dòng tiêu đề Sheet 2
    wsWorkers.mergeCells('A1:P1');
    const workerTitle1 = wsWorkers.getCell('A1');
    workerTitle1.value = 'DANH SÁCH CHI TIẾT NHÂN SỰ & ĐỐI SOÁT TRÙNG LẶP CÔNG NHÂN THEO NGÀY';
    workerTitle1.font = { name: 'Arial', size: 13, bold: true, color: { argb: 'FFFFFFFF' } };
    workerTitle1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F766E' } };
    workerTitle1.alignment = { horizontal: 'center', vertical: 'middle' };
    wsWorkers.getRow(1).height = 30;

    // Dòng phụ chú
    wsWorkers.mergeCells('A2:P2');
    const workerTitle2 = wsWorkers.getCell('A2');
    workerTitle2.value = `Tổng số lượt chấm công: ${workers.length} lượt công nhân | Tự động phát hiện trùng lặp & làm quá 3 ca liên tục theo quy chuẩn QĐNBC`;
    workerTitle2.font = { name: 'Arial', size: 10, italic: true, color: { argb: 'FF334155' } };
    workerTitle2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0FDFA' } };
    workerTitle2.alignment = { horizontal: 'center', vertical: 'middle' };
    wsWorkers.getRow(2).height = 20;

    wsWorkers.getRow(3).height = 10;

    const workerHeaders = [
      'STT',
      'Ngày thực hiện',
      'Dự án / Phân khu',
      'Tổ được cộng (+)',
      'Tổ bị trừ (-)',
      'Mã Nhân Viên (7 số)',
      'Họ và tên công nhân',
      'Bậc thợ / Tay nghề',
      'Ca 1 (Sáng)',
      'Ca 2 (Chiều)',
      'Ca 3 (Tối / Tăng ca)',
      'Tổng số công',
      'Ký xác nhận (CN)',
      'Trạng thái trùng lặp nhân sự',
      'Cảnh báo làm 3 ca liên tục',
      'Tên file hồ sơ gốc',
    ];

    const headerRow4 = wsWorkers.addRow(workerHeaders);
    headerRow4.height = 28;
    headerRow4.eachCell((cell) => {
      cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF134E4A' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      cell.border = thinBorder;
    });

    workers.forEach((w, idx) => {
      const isDup = !!w.is_duplicate;
      const is3Ca = !!w.is_3_ca;
      const missingSign = !w.co_chu_ky_cn;

      const row = wsWorkers.addRow([
        idx + 1,
        w.ngay_thang,
        w.du_an,
        w.to_doi_thuc_hien,
        w.to_doi_khau_tru,
        w.ma_nv,
        w.ho_ten,
        w.tay_nghe,
        w.ca_1 ? 'X' : '-',
        w.ca_2 ? 'X' : '-',
        w.ca_3 ? 'X' : '-',
        w.so_cong,
        w.co_chu_ky_cn ? 'Đã ký' : 'Thiếu ký',
        isDup ? `TRÙNG LẶP: ${w.duplicate_details}` : 'Bình thường',
        is3Ca ? 'LÀM LIÊN TỤC 3 CA' : '',
        w.file_name,
      ]);

      row.height = 22;

      const defaultFill: ExcelJS.FillPattern = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: {
          argb: isDup ? 'FFFFF5F5' : is3Ca ? 'FFFFFDF0' : idx % 2 === 0 ? 'FFFFFFFF' : 'FFF8FAFC',
        },
      };

      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        cell.font = { name: 'Arial', size: 9.5, color: { argb: 'FF1E293B' } };
        cell.border = thinBorder;
        cell.fill = defaultFill;
        cell.alignment = { vertical: 'middle' };

        if ([1, 2, 6, 8, 9, 10, 11, 12, 13].includes(colNumber)) {
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        }
      });

      // Cột 4 & 5: Tổ được cộng (+) & Tổ bị trừ (-)
      row.getCell(4).font = { name: 'Arial', size: 9.5, bold: true, color: { argb: 'FF047857' } };
      row.getCell(5).font = { name: 'Arial', size: 9.5, bold: true, color: { argb: 'FFB91C1C' } };

      // CONDITIONAL FORMATTING cho công nhân trùng lặp (Cột 7 & 14 tô ĐỎ)
      if (isDup) {
        const dupCell = row.getCell(14);
        dupCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFD2D2' }, // Tô ĐỎ vi phạm trùng lặp
        };
        dupCell.font = {
          name: 'Arial',
          size: 9.5,
          bold: true,
          color: { argb: 'FF991B1B' },
        };

        const nameCell = row.getCell(7);
        nameCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFEBEB' },
        };
        nameCell.font = {
          name: 'Arial',
          size: 9.5,
          bold: true,
          color: { argb: 'FF991B1B' },
        };
      }

      // CONDITIONAL FORMATTING cho công nhân làm 3 ca (Cột 15 tô VÀNG CẢNH BÁO)
      if (is3Ca) {
        const caCell = row.getCell(15);
        caCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFF3CD' }, // Tô VÀNG cảnh báo 3 ca
        };
        caCell.font = {
          name: 'Arial',
          size: 9.5,
          bold: true,
          color: { argb: 'FF92400E' },
        };
      }

      // Cột 13: Thiếu chữ ký công nhân
      if (missingSign) {
        const signCell = row.getCell(13);
        signCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFE2E2' },
        };
        signCell.font = {
          name: 'Arial',
          size: 9.5,
          bold: true,
          color: { argb: 'FFB91C1C' },
        };
      }
    });

    wsWorkers.columns = [
      { width: 6 },  // STT
      { width: 14 }, // Ngày
      { width: 22 }, // Dự án
      { width: 24 }, // Tổ được cộng
      { width: 24 }, // Tổ bị trừ
      { width: 20 }, // Mã NV
      { width: 24 }, // Họ tên
      { width: 18 }, // Tay nghề
      { width: 12 }, // Ca 1
      { width: 12 }, // Ca 2
      { width: 14 }, // Ca 3
      { width: 14 }, // Tổng công
      { width: 14 }, // Chữ ký
      { width: 45 }, // Trạng thái trùng lặp
      { width: 25 }, // Cảnh báo 3 ca
      { width: 28 }, // File
    ];

    if (workers.length > 0) {
      wsWorkers.addConditionalFormatting({
        ref: `N5:N${4 + workers.length}`,
        rules: [
          {
            type: 'containsText',
            operator: 'containsText',
            text: 'TRÙNG LẶP',
            style: {
              fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFFFD2D2' } },
              font: { color: { argb: 'FF991B1B' }, bold: true },
            },
            priority: 1,
          },
        ],
      });
      wsWorkers.addConditionalFormatting({
        ref: `O5:O${4 + workers.length}`,
        rules: [
          {
            type: 'containsText',
            operator: 'containsText',
            text: 'LÀM LIÊN TỤC 3 CA',
            style: {
              fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFFFF3CD' } },
              font: { color: { argb: 'FF92400E' }, bold: true },
            },
            priority: 1,
          },
        ],
      });
    }

    // ==========================================
    // SHEET 3: Ma_Tran_Quy_Tac_QDNBC
    // ==========================================
    const wsRules = workbook.addWorksheet('Ma_Tran_Quy_Tac_QDNBC', {
      views: [{ showGridLines: true }],
    });

    wsRules.mergeCells('A1:G1');
    const ruleTitle1 = wsRules.getCell('A1');
    ruleTitle1.value = 'MA TRẬN QUY TẮC KIỂM SOÁT HỒ SƠ CÔNG NHẬT (QĐNBC TIÊU CHUẨN)';
    ruleTitle1.font = { name: 'Arial', size: 13, bold: true, color: { argb: 'FFFFFFFF' } };
    ruleTitle1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF334155' } };
    ruleTitle1.alignment = { horizontal: 'center', vertical: 'middle' };
    wsRules.getRow(1).height = 30;

    wsRules.mergeCells('A2:G2');
    const ruleTitle2 = wsRules.getCell('A2');
    ruleTitle2.value = `Số lượng quy tắc: ${rules.length} quy tắc | Tự động phân loại Vi phạm (Từ chối) và Cảnh báo (Giải trình)`;
    ruleTitle2.font = { name: 'Arial', size: 10, italic: true, color: { argb: 'FF334155' } };
    ruleTitle2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
    ruleTitle2.alignment = { horizontal: 'center', vertical: 'middle' };
    wsRules.getRow(2).height = 20;

    wsRules.getRow(3).height = 10;

    const ruleHeaders = [
      'STT',
      'Mã quy tắc',
      'Tên quy tắc kiểm soát',
      'Nhóm kiểm tra',
      'Mức độ xử lý vi phạm',
      'Mô tả quy định chi tiết',
      'Trạng thái kích hoạt',
    ];

    const headerRowRule = wsRules.addRow(ruleHeaders);
    headerRowRule.height = 26;
    headerRowRule.eachCell((cell) => {
      cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF475569' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = thinBorder;
    });

    rules.forEach((r, idx) => {
      const isViolate = r.severity === 'VI_PHAM';
      const row = wsRules.addRow([
        idx + 1,
        r.code,
        r.name,
        r.category,
        isViolate ? 'Từ chối thanh toán (Vi phạm)' : 'Cảnh báo cần giải trình',
        r.description,
        r.enabled ? 'Đang áp dụng' : 'Tạm tắt',
      ]);
      row.height = 22;

      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        cell.font = { name: 'Arial', size: 9.5, color: { argb: 'FF1E293B' } };
        cell.border = thinBorder;
        cell.alignment = { vertical: 'middle' };
        if ([1, 2, 4, 7].includes(colNumber)) {
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        }
      });

      const severityCell = row.getCell(5);
      severityCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: isViolate ? 'FFFFD2D2' : 'FFFFF3CD' }, // Tô ĐỎ vi phạm, VÀNG cảnh báo
      };
      severityCell.font = {
        name: 'Arial',
        size: 9.5,
        bold: true,
        color: { argb: isViolate ? 'FF991B1B' : 'FF92400E' },
      };
      severityCell.alignment = { horizontal: 'center', vertical: 'middle' };
    });

    wsRules.columns = [
      { width: 6 },  // STT
      { width: 14 }, // Mã
      { width: 32 }, // Tên quy tắc
      { width: 16 }, // Nhóm
      { width: 28 }, // Mức độ
      { width: 65 }, // Mô tả
      { width: 18 }, // Trạng thái
    ];

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const fileName = `Bao_Cao_Kiem_Soat_Cong_Nhat_QDNBC_${new Date().toISOString().slice(0, 10)}.xlsx`;
    return { blob, fileName };
  };

  // Xuất file Excel (.xlsx) đa sheet về máy tính
  const handleExportExcel = async () => {
    try {
      const { blob, fileName } = await generateExcelBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Lỗi khi xuất file Excel:', err);
    }
  };

  // Bắt đầu quy trình xuất báo cáo lên Google Drive (Yêu cầu xác nhận từ người dùng)
  const handleStartExportToGoogleDrive = async () => {
    if (!getAccessToken()) {
      try {
        await handleGoogleSignIn();
      } catch {
        return;
      }
    }
    setShowConfirmUploadDrive(true);
  };

  // Xác nhận lưu vào Google Drive sau khi người dùng đồng ý
  const handleConfirmUploadToDrive = async () => {
    setIsUploadingToDrive(true);
    setDriveUploadResult(null);
    try {
      const { blob, fileName } = await generateExcelBlob();
      const result = await uploadExcelReportToGoogleDrive(blob, fileName);
      setDriveUploadResult(result);
    } catch (err: any) {
      alert('Không thể lưu lên Google Drive: ' + err.message);
    } finally {
      setIsUploadingToDrive(false);
    }
  };

  // Rule Handlers
  const handleToggleRule = (ruleId: string) => {
    setRules((prev) =>
      prev.map((r) => (r.id === ruleId ? { ...r, enabled: !r.enabled } : r))
    );
  };

  const handleUpdateSeverity = (ruleId: string, severity: 'VI_PHAM' | 'CANH_BAO') => {
    setRules((prev) =>
      prev.map((r) => (r.id === ruleId ? { ...r, severity } : r))
    );
  };

  const handleAddRule = (newRule: AuditRuleConfig) => {
    setRules((prev) => [...prev, newRule]);
  };

  const handleResetRules = () => {
    setRules(DEFAULT_AUDIT_RULES);
  };

  // Điều hướng giữa các batch trong Inspector
  const currentBatchIndex = selectedBatch
    ? summaries.findIndex((s) => s.batch_id === selectedBatch.batch_id)
    : -1;
  const hasPrev = currentBatchIndex > 0;
  const hasNext = currentBatchIndex >= 0 && currentBatchIndex < summaries.length - 1;

  const handlePrevBatch = () => {
    if (hasPrev) {
      setSelectedBatch(summaries[currentBatchIndex - 1]);
    }
  };

  const handleNextBatch = () => {
    if (hasNext) {
      setSelectedBatch(summaries[currentBatchIndex + 1]);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onExportExcel={handleExportExcel}
        onExportToGoogleDrive={handleStartExportToGoogleDrive}
        onGoogleSignIn={handleGoogleSignIn}
        onGoogleSignOut={handleGoogleSignOut}
        isGoogleLoggedIn={Boolean(googleUser && getAccessToken())}
        googleUserEmail={googleUser?.email}
        onNewScan={() => {
          setActiveTab('audit');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onResetData={handleResetData}
        onSaveToHistory={handleSaveToHistory}
        onOpenHistoryModal={() => setShowHistoryModal(true)}
        onOpenInstallModal={() => setShowInstallModal(true)}
        onOpenGithubModal={() => setShowGithubModal(true)}
        savedHistoryCount={savedHistory.length}
        isDarkMode={isDarkMode}
        toggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        hasData={summaries.length > 0}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* KPI Metrics */}
        <MetricsOverview
          totalBatches={totalBatches}
          violateBatches={violateBatches}
          warningBatches={warningBatches}
          validBatches={validBatches}
          totalWorkers={workers.length}
          totalCost={totalCost}
          donGia={donGia}
        />

        {/* Tab 1: Hồ sơ kiểm tra & Tải PDF */}
        {activeTab === 'audit' && (
          <>
            <UploadSection
              onProcessFiles={handleProcessFiles}
              onImportClaudePro={handleImportClaudePro}
              onLoadSample={loadSampleData}
              onOpenGoogleDrivePicker={() => setShowDrivePicker(true)}
              isGoogleLoggedIn={Boolean(googleUser && getAccessToken())}
              googleUserEmail={googleUser?.email}
              isProcessing={isProcessing}
              processStatus={processStatus}
              progressPercent={progressPercent}
              donGia={donGia}
              setDonGia={setDonGia}
            />

            <AuditTable
              summaries={summaries}
              onSelectBatch={(batch) => setSelectedBatch(batch)}
              onOpenOriginalPage={handleOpenOriginalPage}
              selectedBatchId={selectedBatch?.batch_id}
              donGiaMacDinh={donGia}
            />
          </>
        )}

        {/* Tab 2: Rà soát trùng lặp nhân sự & Làm 3 ca */}
        {activeTab === 'workers' && (
          <WorkerDeduplication workers={workers} />
        )}

        {/* Tab 3: Cấu hình ma trận quy tắc QĐNBC */}
        {activeTab === 'rules' && (
          <RuleManager
            rules={rules}
            onToggleRule={handleToggleRule}
            onUpdateSeverity={handleUpdateSeverity}
            onAddRule={handleAddRule}
            onResetRules={handleResetRules}
          />
        )}

        {/* Tab 4: Cẩm nang hướng dẫn chuẩn 9 lỗi */}
        {activeTab === 'guide' && <GuideModal />}
      </main>

      {/* Modal Chọn file PDF từ Google Drive */}
      <GoogleDrivePickerModal
        isOpen={showDrivePicker}
        onClose={() => setShowDrivePicker(false)}
        onSelectFiles={handleDriveFilesSelected}
        onRequestLogin={handleGoogleSignIn}
        isLoggedIn={Boolean(googleUser && getAccessToken())}
        userEmail={googleUser?.email}
      />

      {/* Modal Quản Lý Kho Hồ Sơ Cũ Đã Lưu */}
      <SavedHistoryModal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        historyList={savedHistory}
        onLoadHistory={handleLoadHistory}
        onDeleteHistory={handleDeleteHistory}
        onClearAll={handleClearAllHistory}
      />

      {/* Modal Xác nhận Lưu Báo Cáo vào Google Drive (Yêu cầu skill để đảm bảo an toàn thao tác ghi) */}
      {showConfirmUploadDrive && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
              Xác nhận lưu báo cáo lên Google Drive
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
              Hệ thống sẽ tạo một tệp Excel <span className="font-semibold text-slate-800 dark:text-slate-200">Bao_Cao_Kiem_Soat_Cong_Nhat_QDNBC.xlsx</span> chứa đầy đủ 3 trang tính (Tổng hợp cảnh báo, Chi tiết công nhân, và Ma trận quy tắc) trên Google Drive của tài khoản <strong className="text-blue-600 dark:text-blue-400">{googleUser?.email}</strong>.
            </p>

            {driveUploadResult ? (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl mb-4 text-xs text-emerald-800 dark:text-emerald-300">
                <p className="font-semibold mb-1">✓ Đã lưu thành công lên Google Drive!</p>
                <p className="truncate text-slate-600 dark:text-slate-400">{driveUploadResult.name}</p>
                {driveUploadResult.webViewLink && (
                  <a
                    href={driveUploadResult.webViewLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-block mt-2 text-blue-600 dark:text-blue-400 underline font-semibold"
                  >
                    Mở tệp trên Google Drive →
                  </a>
                )}
              </div>
            ) : null}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setShowConfirmUploadDrive(false);
                  setDriveUploadResult(null);
                }}
                disabled={isUploadingToDrive}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                {driveUploadResult ? 'Đóng' : 'Hủy bỏ'}
              </button>
              {!driveUploadResult && (
                <button
                  type="button"
                  onClick={handleConfirmUploadToDrive}
                  disabled={isUploadingToDrive}
                  className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
                >
                  {isUploadingToDrive ? 'Đang lưu vào Drive...' : 'Xác nhận lưu vào Drive'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Trình Soi Song Song Split-Screen Modal */}
      {selectedBatch && (
        <SplitScreenInspector
          batch={selectedBatch}
          onClose={() => setSelectedBatch(null)}
          onPrevBatch={handlePrevBatch}
          onNextBatch={handleNextBatch}
          onOpenOriginalPage={handleOpenOriginalPage}
          hasPrev={hasPrev}
          hasNext={hasNext}
          donGiaMacDinh={donGia}
        />
      )}

      {/* Modal Xuất Bộ Cài Đặt (PWA / Windows .bat / Electron) */}
      <InstallPackageModal
        isOpen={showInstallModal}
        onClose={() => setShowInstallModal(false)}
      />

      {/* Modal Đẩy Mã Nguồn Lên GitHub */}
      <GithubPushModal
        isOpen={showGithubModal}
        onClose={() => setShowGithubModal(false)}
      />

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-4 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
          <p>© 2026 Hệ Thống Kiểm Soát Hồ Sơ Công Nhật (QĐNBC) · Chuẩn Kiểm Soát Chi Phí Xây Dựng</p>
          <div className="flex items-center gap-4">
            <span>Phiên bản v2.5 Enterprise</span>
            <span>·</span>
            <span>Tích hợp Gemini 3.8 Flash Vision</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
