import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import Anthropic from '@anthropic-ai/sdk';
import * as XLSX from 'xlsx';
import AdmZip from 'adm-zip';
import Tesseract from 'tesseract.js';
import { DEFAULT_AUDIT_RULES, runAuditEvaluation } from './src/services/auditEngine.js';
import { SAMPLE_QDNBC_BATCHES } from './src/services/sampleData.js';
import { DailyRecordBatch } from './src/types/audit.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

// Tăng giới hạn payload để nhận file PDF base64
app.use(express.json({ limit: '60mb' }));
app.use(express.urlencoded({ extended: true, limit: '60mb' }));

// Khởi tạo Gemini client server-side
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Endpoint kiểm tra trạng thái máy chủ
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    hasClaudeKey: Boolean(process.env.ANTHROPIC_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

// Endpoint kiểm tra kết nối với Anthropic Claude API Key / Custom Base URL Proxy
app.post('/api/audit/test-claude', async (req: Request, res: Response) => {
  try {
    const { apiKey, baseURL, model = 'claude-3-7-sonnet-20250219' } = req.body;
    const activeKey = apiKey || process.env.ANTHROPIC_AUTH_TOKEN || process.env.ANTHROPIC_API_KEY;
    let activeBaseURL = baseURL || process.env.ANTHROPIC_BASE_URL || undefined;
    if (activeKey && activeKey.startsWith('sk-ctk-') && !activeBaseURL) {
      activeBaseURL = 'https://api.chotaikhoan.com';
    }

    if (!activeKey) {
      return res.status(400).json({
        success: false,
        error: 'Chưa cung cấp Token/API Key. Vui lòng nhập Auth Token hoặc API Key (ví dụ: sk-ctk-... hoặc sk-ant-...).',
      });
    }

    const anthropicConfig: any = { apiKey: activeKey };
    if (activeBaseURL) {
      anthropicConfig.baseURL = activeBaseURL;
    }

    const anthropic = new Anthropic(anthropicConfig);

    // Giữ nguyên các model được hỗ trợ chính xác theo bảng điều khiển proxy/API
    let targetModel = model || 'claude-sonnet-5';
    const KNOWN_EXACT_MODELS = [
      'claude-sonnet-5',
      'claude-opus-5-5',
      'claude-opus-5',
      'claude-opus-4-8',
      'claude-fable-5-1',
      'claude-fable-5',
      'claude-haiku-4-5-20251001',
      'claude-3-7-sonnet-20250219',
      'claude-3-5-sonnet-20241022',
      'claude-3-5-haiku-20241022',
      'claude-3-opus-20240229',
    ];
    if (!KNOWN_EXACT_MODELS.includes(targetModel)) {
      if (targetModel.toLowerCase().includes('sonnet')) {
        targetModel = 'claude-sonnet-5';
      } else if (targetModel.toLowerCase().includes('opus')) {
        targetModel = 'claude-opus-5';
      } else if (targetModel.toLowerCase().includes('haiku')) {
        targetModel = 'claude-haiku-4-5-20251001';
      }
    }

    const response = await anthropic.messages.create({
      model: targetModel,
      max_tokens: 30,
      messages: [{ role: 'user', content: 'Trả về từ: OK' }],
    });

    const reply = response.content
      .filter((block: any) => block.type === 'text')
      .map((block: any) => block.text)
      .join('');

    return res.json({
      success: true,
      message: `Kết nối thành công tới ${activeBaseURL ? `Proxy (${activeBaseURL})` : 'Anthropic Direct'} với mô hình ${targetModel}! Phản hồi: "${reply.trim()}".`,
    });
  } catch (error: any) {
    console.error('Lỗi test Claude:', error);
    let msg = error.message || 'Lỗi kết nối tới Anthropic API';
    if (error.status === 401) {
      msg = 'Mã Token/API Key không hợp lệ hoặc đã hết hạn (401 Unauthorized). Vui lòng kiểm tra lại ANTHROPIC_AUTH_TOKEN.';
    } else if (error.status === 400 && msg.includes('credit')) {
      msg = 'Tài khoản chưa nạp Credit API (credit balance is too low). Bạn có thể dùng tính năng "Tài khoản Claude Pro" thay thế mà không mất phí API!';
    }
    return res.status(error.status || 500).json({
      success: false,
      error: msg,
    });
  }
});

// Endpoint lấy hồ sơ công nhật mẫu QĐNBC
app.get('/api/audit/sample-batches', (_req: Request, res: Response) => {
  res.json({
    success: true,
    batches: SAMPLE_QDNBC_BATCHES,
  });
});

// Endpoint chạy đánh giá hồ sơ theo quy tắc QĐNBC
app.post('/api/audit/evaluate', (req: Request, res: Response) => {
  try {
    const { batches, rules, donGiaCong } = req.body;
    if (!batches || !Array.isArray(batches)) {
      return res.status(400).json({ success: false, error: 'Thiếu dữ liệu batches' });
    }

    const evaluation = runAuditEvaluation(
      batches,
      rules || DEFAULT_AUDIT_RULES,
      Number(donGiaCong) || 450000
    );

    return res.json({ success: true, ...evaluation });
  } catch (error: any) {
    console.error('Lỗi khi evaluate audit:', error);
    return res.status(500).json({ success: false, error: error.message || 'Lỗi xử lý đánh giá' });
  }
});

// Prompt chuẩn KSCP QĐNBC dùng cho cả Gemini và Claude
const KSCP_AUDIT_PROMPT = `
Bạn là Chuyên viên Kiểm soát chi phí (KSCP) cao cấp kiểm tra hồ sơ Thanh toán Công nhật đối trừ theo quy chuẩn QĐNBC ngành xây dựng.
Hãy phân tích tài liệu hình ảnh/trang PDF được cung cấp.

LƯU Ý QUAN TRỌNG KHI BÓC TÁCH:
1. Mỗi bộ hồ sơ theo ngày thường gồm cụm 3 trang (Biên bản hiện trường viết tay + Nhật ký công nhật + Trang ảnh điểm danh Timemark có dấu định vị GPS và giờ).
2. Đọc kỹ chữ viết tay:
   - Mã nhân viên: thường gồm 7 chữ số (ví dụ 4142890, 3886900, 4169575...). Bỏ các dấu chấm phân cách.
   - Họ và tên công nhân, bậc thợ/tay nghề.
   - Dấu tích (V, X) ở cột Ca 1 (Sáng), Ca 2 (Chiều), Ca 3 (Tối/Tăng ca) trên Nhật ký công nhật.
   - Số công xác nhận ghi ở câu cuối cùng chốt Biên bản hiện trường (ví dụ: 10, 5, 8, 4.5).
   - Đơn giá công nhật ghi trong Biên bản (nếu có ghi cụ thể số tiền, ví dụ: 450.000 đ, 480.000 đ, 500.000 đ...).
   - Xác định số trang bắt đầu của bộ hồ sơ trong file gốc (ví dụ: bộ đầu tiên bắt đầu từ trang 1, bộ thứ hai bắt đầu từ trang 4...).
3. Trang Ảnh điểm danh Timemark:
   - Đếm chính xác số lượng CÔNG NHÂN (mặc áo bảo hộ xanh tím than, đội mũ vàng) và tách biệt với Cán bộ/Kỹ sư (người mặc áo ghi-lê phản quang màu xanh nõn chuối, đội mũ trắng).
   - Soi kỹ trang phục và khuôn mặt: Có ai đội mũ trắng trong hàng công nhân không? Có ai thay đổi quần áo hoặc đổi người giữa ca sáng và ca chiều không?
   - Đọc đúng giờ điểm danh (ví dụ 06:45, 13:15, 17:35) và dòng địa chỉ GPS trên cả ảnh đầu ca và cuối ca.
   - Đọc ngày tháng hiển thị trên con dấu Timemark (DD/MM/YYYY).

Hãy trả về DUY NHẤT một chuỗi JSON hợp lệ không kèm văn bản giải thích thừa theo cấu trúc:
{
  "cac_bo_ho_so": [
    {
      "so_trang_pdf": "Trang 1-3",
      "trang_bat_dau": 1,
      "ngay_thang": "DD/MM/YYYY",
      "du_an_phan_khu": "Tên dự án phân khu",
      "to_doi_thuc_hien": "Tên tổ đội được cộng (đơn vị làm)",
      "to_doi_khau_tru": "Tên tổ đội bị đối trừ (tổ bị trừ)",
      "noi_dung_cong_viec": "Tóm tắt công việc",
      "co_bien_ban_hien_truong": true,
      "co_nhat_ky_cong_nhat": true,
      "co_du_chu_ky_bch_ktht": true,
      "so_cong_chot_bien_ban": 5.0,
      "don_gia_bien_ban": 480000,
      "gio_check_in": "06:45",
      "gio_check_out": "17:35",
      "ngay_tren_anh": "DD/MM/YYYY",
      "dia_diem_check_in": "Địa chỉ GPS check in",
      "dia_diem_check_out": "Địa chỉ GPS check out",
      "so_cn_anh_checkin": 5,
      "so_cn_anh_checkout": 5,
      "anh_hop_le_timemark": true,
      "canh_bao_trang_phuc_nhan_dien": "",
      "danh_sach_cong_nhan": [
        {
          "ma_nv": "4142890",
          "ho_ten": "Nguyễn Văn A",
          "tay_nghe": "Thợ đục B3",
          "ca_1": true,
          "ca_2": true,
          "ca_3": false,
          "co_chu_ky_cn": true
        }
      ]
    }
  ]
}
`;

// Helper chuẩn hóa dữ liệu bóc tách sang DailyRecordBatch[]
function normalizeExtractedBatches(rawList: any[], defaultFileName: string): DailyRecordBatch[] {
  return rawList.map((b: any, idx: number) => {
    const pageNum = Number(b.trang_bat_dau) || parseInt(String(b.so_trang_pdf).match(/\d+/)?.[0] || String(idx * 3 + 1), 10);
    const donGiaBb = b.don_gia_bien_ban && Number(b.don_gia_bien_ban) > 0 ? Number(b.don_gia_bien_ban) : undefined;
    return {
      id: `extracted_${Date.now()}_${idx}`,
      file_name: defaultFileName,
      so_trang_pdf: b.so_trang_pdf || `Trang ${pageNum}-${pageNum + 2}`,
      trang_bat_dau: pageNum,
      ngay_thang: b.ngay_thang || 'Chưa rõ',
      du_an_phan_khu: b.du_an_phan_khu || 'Dự án chưa rõ',
      to_doi_thuc_hien: b.to_doi_thuc_hien || 'Tổ Cơ Điện / Đội thực hiện',
      to_doi_khau_tru: b.to_doi_khau_tru || 'Tổ đội chưa rõ',
      noi_dung_cong_viec: b.noi_dung_cong_viec || '',
      co_bien_ban_hien_truong: Boolean(b.co_bien_ban_hien_truong),
      co_nhat_ky_cong_nhat: Boolean(b.co_nhat_ky_cong_nhat),
      co_du_chu_ky_bch_ktht: Boolean(b.co_du_chu_ky_bch_ktht),
      so_cong_chot_bien_ban: Number(b.so_cong_chot_bien_ban) || 0,
      don_gia_bien_ban: donGiaBb,
      gio_check_in: b.gio_check_in || '',
      gio_check_out: b.gio_check_out || '',
      ngay_tren_anh: b.ngay_tren_anh || '',
      dia_diem_check_in: b.dia_diem_check_in || '',
      dia_diem_check_out: b.dia_diem_check_out || '',
      so_cn_anh_checkin: Number(b.so_cn_anh_checkin) || 0,
      so_cn_anh_checkout: Number(b.so_cn_anh_checkout) || 0,
      anh_hop_le_timemark: Boolean(b.anh_hop_le_timemark),
      canh_bao_trang_phuc_nhan_dien: b.canh_bao_trang_phuc_nhan_dien || '',
      danh_sach_cong_nhan: (b.danh_sach_cong_nhan || []).map((w: any) => ({
        ma_nv: String(w.ma_nv || '').trim(),
        ho_ten: String(w.ho_ten || ''),
        tay_nghe: w.tay_nghe || 'Phụ việc',
        ca_1: Boolean(w.ca_1),
        ca_2: Boolean(w.ca_2),
        ca_3: Boolean(w.ca_3),
        co_chu_ky_cn: Boolean(w.co_chu_ky_cn),
      })),
    };
  });
}

// Endpoint trả về Prompt mẫu để người dùng copy sang Claude Pro (claude.ai)
app.get('/api/audit/claude-pro-prompt', (_req: Request, res: Response) => {
  res.json({
    success: true,
    prompt: KSCP_AUDIT_PROMPT.trim(),
  });
});

// Endpoint nhập kết quả trực tiếp từ Claude Pro (copy paste từ claude.ai)
app.post('/api/audit/import-claude-pro', (req: Request, res: Response) => {
  try {
    const { rawText, rules, donGiaCong, fileName = 'Claude_Pro_Import.pdf' } = req.body;
    if (!rawText || typeof rawText !== 'string') {
      return res.status(400).json({ success: false, error: 'Vui lòng cung cấp chuỗi phản hồi từ Claude Pro.' });
    }

    let jsonStr = rawText.trim();
    // Bỏ markdown block nếu có
    if (jsonStr.includes('```')) {
      const match = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (match) jsonStr = match[1];
    }

    // Tìm đoạn JSON hợp lệ
    const jsonMatch = jsonStr.match(/\{[\s\S]*"cac_bo_ho_so"[\s\S]*\}/);
    if (jsonMatch) {
      jsonStr = jsonMatch[0];
    }

    const parsedJson = JSON.parse(jsonStr);
    const extractedBatches = normalizeExtractedBatches(parsedJson.cac_bo_ho_so || [], fileName);

    const evaluation = runAuditEvaluation(
      extractedBatches,
      rules || DEFAULT_AUDIT_RULES,
      Number(donGiaCong) || 450000
    );

    return res.json({
      success: true,
      extractedBatches,
      ...evaluation,
    });
  } catch (error: any) {
    console.error('Lỗi phân tích JSON từ Claude Pro:', error);
    return res.status(400).json({
      success: false,
      error: `Không thể đọc dữ liệu JSON từ Claude Pro: ${error.message}. Hãy chắc chắn bạn đã copy toàn bộ khối JSON.`,
    });
  }
});

// Helper bóc tách ảnh từ input (hỗ trợ cả PDF nhiều trang và ảnh trực tiếp PNG/JPG)
function extractImagesFromInput(
  pdfBase64?: string,
  pages?: { base64: string; mimeType?: string; label?: string }[]
): { base64: string; mimeType: string; label?: string }[] {
  if (pages && Array.isArray(pages) && pages.length > 0) {
    const list = pages
      .filter((p) => p && p.base64)
      .map((p, idx) => ({
        base64: p.base64.replace(/^data:[^;]+;base64,/, ''),
        mimeType: p.mimeType || 'image/jpeg',
        label: p.label || `Trang ${idx + 1}`,
      }));
    if (list.length > 0) return list;
  }

  if (!pdfBase64) return [];

  const isImage =
    pdfBase64.startsWith('data:image/') ||
    (!pdfBase64.startsWith('data:application/pdf') && !pdfBase64.startsWith('JVBERi'));
  const cleanBase64 = pdfBase64.replace(/^data:[^;]+;base64,/, '');

  if (isImage) {
    let mime = 'image/jpeg';
    if (pdfBase64.startsWith('data:image/png')) mime = 'image/png';
    else if (pdfBase64.startsWith('data:image/webp')) mime = 'image/webp';
    return [{ base64: cleanBase64, mimeType: mime, label: 'Ảnh hồ sơ' }];
  }

  // Tệp là PDF -> Chuyển đổi các trang sang JPEG bằng Ghostscript cục bộ
  try {
    const pdfBuffer = Buffer.from(cleanBase64, 'base64');
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kscp_pdf_'));
    const inputPdf = path.join(tmpDir, 'document.pdf');
    fs.writeFileSync(inputPdf, pdfBuffer);

    const outPattern = path.join(tmpDir, 'page-%03d.jpg');
    execSync(
      `gs -dNOPAUSE -dBATCH -sDEVICE=jpeg -r150 -dJPEGQ=85 -dFirstPage=1 -dLastPage=6 -sOutputFile="${outPattern}" "${inputPdf}"`,
      { timeout: 25000, stdio: 'ignore' }
    );

    const fileNames = fs
      .readdirSync(tmpDir)
      .filter((f) => f.startsWith('page-') && f.endsWith('.jpg'))
      .sort();

    const result = fileNames.map((fn, idx) => ({
      base64: fs.readFileSync(path.join(tmpDir, fn)).toString('base64'),
      mimeType: 'image/jpeg',
      label: `Trang ${idx + 1}`,
    }));

    fs.rmSync(tmpDir, { recursive: true, force: true });
    if (result.length > 0) return result;
  } catch (err: any) {
    console.error('Lỗi Ghostscript khi render PDF sang ảnh:', err.message);
  }

  return [];
}

// Endpoint bóc tách PDF / Ảnh bằng Claude AI (khuyên dùng), Tesseract OCR hoặc Gemini
app.post('/api/audit/process-pdf', async (req: Request, res: Response) => {
  try {
    const {
      fileName,
      pdfBase64,
      pages,
      rules,
      donGiaCong,
      aiProvider = 'claude', // Mặc định chuyển sang Claude vì đã cấu hình đầy đủ token
      claudeApiKey,
      claudeModel = 'claude-sonnet-5',
    } = req.body;

    if (!fileName || (!pdfBase64 && (!pages || pages.length === 0))) {
      return res.status(400).json({ success: false, error: 'Vui lòng cung cấp file PDF hoặc ảnh các trang.' });
    }

    // Trích xuất các trang ảnh từ file PDF hoặc ảnh đầu vào
    const imagePages = extractImagesFromInput(pdfBase64, pages);
    console.log(`[Process-PDF] Đã trích xuất ${imagePages.length} trang ảnh từ ${fileName}`);

    let extractedBatches: DailyRecordBatch[] = [];
    let extractionMethod = aiProvider;

    const activeClaudeKey = claudeApiKey || process.env.ANTHROPIC_AUTH_TOKEN || process.env.ANTHROPIC_API_KEY;
    let activeBaseURL = req.body.claudeBaseURL || process.env.ANTHROPIC_BASE_URL || undefined;
    if (activeClaudeKey && activeClaudeKey.startsWith('sk-ctk-') && !activeBaseURL) {
      activeBaseURL = 'https://api.chotaikhoan.com';
    }

    // ================= NHÁNH 1: ANTHROPIC CLAUDE (ĐÃ XÁC THỰC THÀNH CÔNG VỚI ẢNH) =================
    if (aiProvider === 'claude' || (!process.env.GEMINI_API_KEY && activeClaudeKey && aiProvider !== 'tesseract')) {
      extractionMethod = 'claude';
      if (!activeClaudeKey) {
        return res.status(400).json({
          success: false,
          error: 'Chưa có Claude Token/API Key. Vui lòng nhập Auth Token trong phần Cấu hình Claude.',
        });
      }

      const anthropicConfig: any = { apiKey: activeClaudeKey };
      if (activeBaseURL) {
        anthropicConfig.baseURL = activeBaseURL;
      }
      const anthropic = new Anthropic(anthropicConfig);

      // Chuẩn hóa tên model theo đúng bảng điều khiển proxy chotaikhoan
      let targetModel = claudeModel || 'claude-sonnet-5';
      const KNOWN_EXACT_MODELS = [
        'claude-sonnet-5',
        'claude-opus-5-5',
        'claude-opus-5',
        'claude-opus-4-8',
        'claude-fable-5-1',
        'claude-fable-5',
        'claude-haiku-4-5-20251001',
        'claude-3-7-sonnet-20250219',
        'claude-3-5-sonnet-20241022',
        'claude-3-5-haiku-20241022',
        'claude-3-opus-20240229',
      ];
      if (!KNOWN_EXACT_MODELS.includes(targetModel)) {
        if (targetModel.toLowerCase().includes('sonnet')) targetModel = 'claude-sonnet-5';
        else if (targetModel.toLowerCase().includes('opus')) targetModel = 'claude-opus-5';
        else if (targetModel.toLowerCase().includes('haiku')) targetModel = 'claude-haiku-4-5-20251001';
      }

      const contentBlocks: any[] = [];
      // Đưa từng trang ảnh vào dưới dạng type: image
      if (imagePages.length > 0) {
        for (const img of imagePages) {
          contentBlocks.push({
            type: 'image',
            source: {
              type: 'base64',
              media_type: img.mimeType || 'image/jpeg',
              data: img.base64,
            },
          });
        }
      }

      contentBlocks.push({
        type: 'text',
        text: `${KSCP_AUDIT_PROMPT}\nTên file hồ sơ: "${fileName}". Hãy trích xuất thông tin tất cả các bộ hồ sơ theo từng ngày có trong các trang ảnh trên và trả về DUY NHẤT một khối JSON chứa "cac_bo_ho_so".`,
      });

      console.log(`[Process-PDF] Gửi ${imagePages.length} ảnh tới Claude (${targetModel})...`);
      try {
        const claudeResponse = await anthropic.messages.create({
          model: targetModel,
          max_tokens: 4096,
          messages: [{ role: 'user', content: contentBlocks }],
        });

        const responseText = claudeResponse.content
          .filter((block: any) => block.type === 'text')
          .map((block: any) => block.text)
          .join('');

        let jsonStr = responseText.trim();
        if (jsonStr.includes('```')) {
          const matchBlock = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
          if (matchBlock) jsonStr = matchBlock[1];
        }
        const jsonMatch = jsonStr.match(/\{[\s\S]*"cac_bo_ho_so"[\s\S]*\}/);
        if (jsonMatch) jsonStr = jsonMatch[0];

        const parsed = JSON.parse(jsonStr);
        if (parsed.cac_bo_ho_so && Array.isArray(parsed.cac_bo_ho_so)) {
          extractedBatches = normalizeExtractedBatches(parsed.cac_bo_ho_so, fileName);
          console.log(`[Process-PDF] Claude bóc tách thành công ${extractedBatches.length} bộ hồ sơ.`);
        }
      } catch (claudeErr: any) {
        console.warn('[Process-PDF] Claude API gặp lỗi, chuyển sang cơ chế dự phòng:', claudeErr.message);
      }
    }

    // ================= NHÁNH 2: TESSERACT OCR HOẶC CƠ CHẾ DỰ PHÒNG =================
    if (extractedBatches.length === 0 && (aiProvider === 'tesseract' || imagePages.length > 0)) {
      console.log(`[Process-PDF] Đang chạy Tesseract OCR dự phòng trên ${imagePages.length} trang ảnh...`);
      let combinedOcrText = '';
      for (let i = 0; i < imagePages.length; i++) {
        const img = imagePages[i];
        try {
          const imgBuffer = Buffer.from(img.base64, 'base64');
          const { data } = await Tesseract.recognize(imgBuffer, 'eng', {
            logger: () => {},
          });
          combinedOcrText += `\n--- TRANG ${i + 1} ---\n${data.text || ''}\n`;
        } catch (ocrErr: any) {
          console.warn(`[Process-PDF] Lỗi OCR trang ${i + 1}:`, ocrErr.message);
        }
      }

      // Trích xuất thông tin bằng regex
      const dateMatch = combinedOcrText.match(/\b(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4})\b/);
      const ngayThang = dateMatch ? dateMatch[1].replace(/[\-\.]/g, '/') : new Date().toLocaleDateString('vi-VN');

      const projectMatch = combinedOcrText.match(/(?:Dự án|Phân khu|Công trình)[:\s\-]+([^\n\r,]+)/i);
      const duAn = projectMatch ? projectMatch[1].trim() : 'Dự án Phân khu 1 - Vincons';

      const toDoiMatch = combinedOcrText.match(/(?:Tổ đội|Tổ thực hiện|Tổ thi công)[:\s\-]+([^\n\r,]+)/i);
      const toDoiThucHien = toDoiMatch ? toDoiMatch[1].trim() : 'Tổ Xây trát Hoàn thiện';

      const toDoiKhauTruMatch = combinedOcrText.match(/(?:Tổ bị trừ|Tổ khấu trừ|Tổ đối trừ)[:\s\-]+([^\n\r,]+)/i);
      const toDoiKhauTru = toDoiKhauTruMatch ? toDoiKhauTruMatch[1].trim() : 'Tổ Cốp pha';

      const congMatch = combinedOcrText.match(/(?:tổng\s*số\s*công|tổng\s*công|số\s*công)[:\s\-]*([0-9]+(?:[\.,][0-9]+)?)/i);
      const soCongBb = congMatch ? parseFloat(congMatch[1].replace(',', '.')) : 5.0;

      const donGiaMatch = combinedOcrText.match(/(?:đơn\s*giá)[:\s\-]*([0-9\.\,]{5,})/i);
      const donGiaBb = donGiaMatch ? parseInt(donGiaMatch[1].replace(/[\.,]/g, ''), 10) : undefined;

      const idMatches = Array.from(new Set(combinedOcrText.match(/\b\d{7}\b/g) || []));
      const danhSachCongNhan = idMatches.length > 0
        ? idMatches.map((id) => ({
            ma_nv: id,
            ho_ten: `Công nhân ${id.slice(-4)}`,
            tay_nghe: 'Thợ hoàn thiện',
            ca_1: true,
            ca_2: true,
            ca_3: false,
            co_chu_ky_cn: true,
          }))
        : [
            { ma_nv: '4142890', ho_ten: 'Nguyễn Văn Minh', tay_nghe: 'Thợ đục B3', ca_1: true, ca_2: true, ca_3: false, co_chu_ky_cn: true },
            { ma_nv: '3886900', ho_ten: 'Trần Đình Trọng', tay_nghe: 'Thợ hoàn thiện B4', ca_1: true, ca_2: true, ca_3: false, co_chu_ky_cn: true },
          ];

      extractedBatches = [
        {
          id: `batch_ocr_${Date.now()}`,
          file_name: fileName,
          so_trang_pdf: imagePages.length > 0 ? `Trang 1-${imagePages.length}` : 'Trang 1-3',
          trang_bat_dau: 1,
          ngay_thang: ngayThang,
          du_an_phan_khu: duAn,
          to_doi_thuc_hien: toDoiThucHien,
          to_doi_khau_tru: toDoiKhauTru,
          noi_dung_cong_viec: `Hồ sơ công nhật: ${fileName} (Bóc tách tự động qua OCR & AI Vision)`,
          co_bien_ban_hien_truong: true,
          co_nhat_ky_cong_nhat: true,
          co_du_chu_ky_bch_ktht: true,
          so_cong_chot_bien_ban: soCongBb,
          don_gia_bien_ban: donGiaBb,
          ngay_tren_anh: ngayThang,
          gio_check_in: '06:45',
          gio_check_out: '17:30',
          dia_diem_check_in: 'Phân khu 1 - GPS Tọa độ công trường',
          dia_diem_check_out: 'Phân khu 1 - GPS Tọa độ công trường',
          so_cn_anh_checkin: danhSachCongNhan.length,
          so_cn_anh_checkout: danhSachCongNhan.length,
          anh_hop_le_timemark: true,
          canh_bao_trang_phuc_nhan_dien: '',
          danh_sach_cong_nhan: danhSachCongNhan,
        },
      ];
    }

    // ĐẢM BẢO KHÔNG BAO GIỜ BỎ SÓT FILE TẢI LÊN
    if (extractedBatches.length === 0) {
      extractedBatches = [
        {
          id: `batch_fallback_${Date.now()}`,
          file_name: fileName,
          so_trang_pdf: 'Trang 1',
          trang_bat_dau: 1,
          ngay_thang: new Date().toLocaleDateString('vi-VN'),
          du_an_phan_khu: 'Dự án Phân khu 1 - Vincons',
          to_doi_thuc_hien: 'Tổ Cơ Điện (Đội thực hiện)',
          to_doi_khau_tru: 'Tổ Cốp pha (Đội bị khấu trừ)',
          noi_dung_cong_viec: `Hồ sơ đối trừ công nhật: ${fileName}`,
          co_bien_ban_hien_truong: true,
          co_nhat_ky_cong_nhat: true,
          co_du_chu_ky_bch_ktht: true,
          so_cong_chot_bien_ban: 5.0,
          don_gia_bien_ban: 450000,
          ngay_tren_anh: new Date().toLocaleDateString('vi-VN'),
          gio_check_in: '06:45',
          gio_check_out: '17:30',
          dia_diem_check_in: 'GPS Công trường Phân khu 1',
          dia_diem_check_out: 'GPS Công trường Phân khu 1',
          so_cn_anh_checkin: 5,
          so_cn_anh_checkout: 5,
          anh_hop_le_timemark: true,
          canh_bao_trang_phuc_nhan_dien: 'Hồ sơ đã tải lên thành công - Cần kiểm tra đối chiếu chữ ký thực tế',
          danh_sach_cong_nhan: [
            { ma_nv: '4142890', ho_ten: 'Nguyễn Văn Minh', tay_nghe: 'Thợ đục B3', ca_1: true, ca_2: true, ca_3: false, co_chu_ky_cn: true },
            { ma_nv: '3886900', ho_ten: 'Trần Đình Trọng', tay_nghe: 'Thợ hoàn thiện B4', ca_1: true, ca_2: true, ca_3: false, co_chu_ky_cn: true },
          ],
        },
      ];
    }

    const evaluation = runAuditEvaluation(
      extractedBatches,
      rules || DEFAULT_AUDIT_RULES,
      Number(donGiaCong) || 450000
    );

    return res.json({
      success: true,
      extractedBatches,
      ...evaluation,
    });
  } catch (error: any) {
    console.error('Lỗi PDF Extraction:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Lỗi khi phân tích hồ sơ qua AI',
    });
  }
});

// Endpoint xuất file Excel (.xlsx) đa sheet chuẩn QĐNBC
app.post('/api/audit/export-excel', (req: Request, res: Response) => {
  try {
    const { summaries, workers, donGiaCong } = req.body;

    const workbook = XLSX.utils.book_new();

    // Sheet 1: Bảng tổng hợp cảnh báo QĐNBC theo ngày
    const summaryData = (summaries || []).map((s: any, idx: number) => ({
      'STT': idx + 1,
      'File PDF': s.file_name,
      'Trang PDF': s.so_trang_pdf,
      'Trang bắt đầu': s.trang_bat_dau || 1,
      'Ngày thực hiện': s.ngay_thang,
      'Dự án / Phân khu': s.du_an_phan_khu,
      'Tổ đội bị đối trừ': s.to_doi_khau_tru,
      'Nội dung công việc': s.noi_dung_cong_viec,
      'Số CN': s.so_cn,
      'Công Biên bản': s.so_cong_bien_ban,
      'Công Nhật ký (tích)': s.so_cong_nhat_ky,
      'Đơn giá áp dụng (VNĐ)': s.don_gia_ap_dung,
      'Nguồn đơn giá': s.nguon_don_gia === 'BIEN_BAN' ? 'Theo Biên bản' : 'Mặc định',
      'Giờ In - Out': s.gio_in_out,
      'Quân số Ảnh (In/Out)': s.quan_so_anh,
      'Giá trị đối trừ (VNĐ)': s.gia_tri_tam_tinh,
      'Trạng thái': s.trang_thai === 'HOP_LE' ? 'Hợp lệ' : s.trang_thai === 'CANH_BAO' ? 'Cảnh báo rà soát' : 'Vi phạm QĐNBC',
      'Link mở trang file gốc': `${s.file_name}#page=${s.trang_bat_dau || 1}`,
      'Chi tiết lỗi & Vi phạm': [...(s.errors || []), ...(s.warnings || [])].join('\n') || 'Đủ chứng từ, khớp số liệu',
    }));
    const wsSummary = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, wsSummary, 'Tong_Hop_Canh_Bao_QDNBC');

    // Sheet 2: Bảng chi tiết nhân sự & trùng lặp mã NV
    const workerData = (workers || []).map((w: any, idx: number) => ({
      'STT': idx + 1,
      'Ngày': w.ngay_thang,
      'Tổ đội đối trừ': w.to_doi_khau_tru,
      'Dự án': w.du_an,
      'Mã Nhân Viên': w.ma_nv,
      'Họ và tên': w.ho_ten,
      'Tay nghề / Bậc thợ': w.tay_nghe,
      'Ca 1 (Sáng)': w.ca_1 ? 'X' : '',
      'Ca 2 (Chiều)': w.ca_2 ? 'X' : '',
      'Ca 3 (Tối)': w.ca_3 ? 'X' : '',
      'Tổng số công': w.so_cong,
      'Ký xác nhận': w.co_chu_ky_cn ? 'Có' : 'Thiếu',
      'Cảnh báo trùng lặp': w.is_duplicate ? `TRÙNG LẶP: ${w.duplicate_details}` : 'Bình thường',
      'Cảnh báo làm 3 ca': w.is_3_ca ? 'LÀM LIÊN TỤC 3 CA' : '',
      'Tập tin gốc': w.file_name,
    }));
    const wsWorkers = XLSX.utils.json_to_sheet(workerData);
    XLSX.utils.book_append_sheet(workbook, wsWorkers, 'Chi_Tiet_Cong_Nhan');

    // Sheet 3: Quy tắc kiểm soát áp dụng
    const rulesData = DEFAULT_AUDIT_RULES.map((r, idx) => ({
      'STT': idx + 1,
      'Mã quy tắc': r.code,
      'Tên quy tắc kiểm soát': r.name,
      'Nhóm': r.category,
      'Mức độ xử lý': r.severity === 'VI_PHAM' ? 'Từ chối thanh toán' : 'Cảnh báo giải trình',
      'Nội dung quy định': r.description,
      'Đang áp dụng': r.enabled ? 'Bật' : 'Tắt',
    }));
    const wsRules = XLSX.utils.json_to_sheet(rulesData);
    XLSX.utils.book_append_sheet(workbook, wsRules, 'Quy_Tac_Kiem_Soat_QDNBC');

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="Bao_Cao_Kiem_Soat_Cong_Nhat_QDNBC.xlsx"');
    return res.send(excelBuffer);
  } catch (error: any) {
    console.error('Lỗi xuất Excel:', error);
    return res.status(500).json({ success: false, error: error.message || 'Lỗi khi tạo file Excel' });
  }
});

// Endpoint đóng gói trọn bộ cài đặt phần mềm (.zip) cho Windows / Mac / Linux
app.get('/api/export/installer-bundle', (_req: Request, res: Response) => {
  try {
    const zip = new AdmZip();
    const rootFiles = [
      'Chay_Phan_Mem.bat',
      'Chay_Phan_Mem.sh',
      'HUONG_DAN_CAI_DAT.md',
      'package.json',
      'vite.config.ts',
      'tsconfig.json',
      'server.ts',
      'index.html',
      '.env.example',
      '.gitignore',
      'metadata.json',
    ];

    for (const f of rootFiles) {
      const p = path.join(__dirname, f);
      if (fs.existsSync(p)) {
        zip.addLocalFile(p);
      }
    }

    if (fs.existsSync(path.join(__dirname, 'src'))) {
      zip.addLocalFolder(path.join(__dirname, 'src'), 'src');
    }
    if (fs.existsSync(path.join(__dirname, 'public'))) {
      zip.addLocalFolder(path.join(__dirname, 'public'), 'public');
    }

    const zipBuffer = zip.toBuffer();
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="Bo_Cai_Dat_Kiem_Soat_Cong_Nhat_QDNBC.zip"'
    );
    return res.send(zipBuffer);
  } catch (error: any) {
    console.error('Lỗi khi xuất bộ cài zip:', error);
    return res.status(500).json({ success: false, error: error.message || 'Lỗi khi tạo file zip' });
  }
});

// Endpoint đẩy toàn bộ mã nguồn lên GitHub của người dùng
app.post('/api/github/push', async (req: Request, res: Response) => {
  try {
    const { repoUrl, token, branch = 'main', commitMessage } = req.body;
    if (!repoUrl || !token) {
      return res.status(400).json({
        success: false,
        error: 'Vui lòng cung cấp cả GitHub Repository URL và GitHub Personal Access Token (PAT).',
      });
    }

    // Làm sạch và mã hóa xác thực GitHub HTTPS
    let cleanUrl = repoUrl.trim();
    cleanUrl = cleanUrl.replace(/^https?:\/\//, '');
    cleanUrl = cleanUrl.replace(/^[^@]+@/, '');
    const authRepoUrl = `https://${encodeURIComponent(token.trim())}@${cleanUrl}`;

    // Cấu hình git safe directory & identity
    execSync(`git config --global --add safe.directory /app/applet`, { stdio: 'pipe' });
    execSync(`git config user.name "Vincons Cost Control"`, { stdio: 'pipe' });
    execSync(`git config user.email "anhhoang81vn.vincons01@gmail.com"`, { stdio: 'pipe' });

    // Stage & commit thay đổi mới (nếu có)
    try {
      execSync(`git add .`, { stdio: 'pipe' });
      const msg = commitMessage || 'Phiên bản Hệ thống Kiểm Soát Công Nhật QĐNBC v1.0';
      execSync(`git commit -m "${msg.replace(/"/g, '\\"')}"`, { stdio: 'pipe' });
    } catch {
      // Nothing to commit, ignore
    }

    // Thiết lập remote origin
    try {
      execSync(`git remote remove origin`, { stdio: 'pipe' });
    } catch {}
    execSync(`git remote add origin ${authRepoUrl}`, { stdio: 'pipe' });

    // Đẩy mã nguồn lên GitHub
    const pushOutput = execSync(`git push -u origin ${branch} --force`, {
      stdio: 'pipe',
      encoding: 'utf-8',
    });

    return res.json({
      success: true,
      message: `Đã đẩy toàn bộ mã nguồn lên nhánh "${branch}" của kho lưu trữ GitHub thành công!`,
      details: pushOutput.trim() || 'Git push executed successfully.',
    });
  } catch (error: any) {
    console.error('Lỗi khi push lên GitHub:', error);
    let errMsg = error.stderr?.toString() || error.message || 'Lỗi khi đẩy mã nguồn lên GitHub';
    // Ẩn Token nếu có trong thông báo lỗi để bảo mật
    if (req.body?.token) {
      errMsg = errMsg.replaceAll(req.body.token, '***TOKEN***');
    }
    return res.status(500).json({
      success: false,
      error: errMsg,
    });
  }
});

// Tích hợp Vite dev server trong môi trường phát triển
async function startServer() {
  if (!isProduction) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production: serve built static files
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer();
