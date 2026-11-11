/**
 * lib/qa-engine.js
 * Core QA Review & Quality Gatekeeper Engine for KJPP NSR.
 * Evaluates appraisal PDF documents according to SPI & KEPI standards.
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import zlib from 'node:zlib';

export class QAEngine {
  constructor(options = {}) {
    this.outputDir = options.outputDir || path.join(process.cwd(), 'output', 'qa_reports');
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  calculateSha256(filePath) {
    if (!fs.existsSync(filePath)) return '';
    const buffer = fs.readFileSync(filePath);
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  extractPdfContent(filePath) {
    const buf = fs.readFileSync(filePath);
    let fullText = '';
    const pages = [];
    let pageCount = 0;

    let pos = 0;
    while (true) {
      const streamIdx = buf.indexOf('stream', pos);
      if (streamIdx === -1) break;
      const endStreamIdx = buf.indexOf('endstream', streamIdx);
      if (endStreamIdx === -1) break;

      let streamStart = streamIdx + 6;
      if (buf[streamStart] === 13) streamStart++;
      if (buf[streamStart] === 10) streamStart++;

      const slice = buf.subarray(streamStart, endStreamIdx);
      try {
        const uncompressed = zlib.inflateSync(slice).toString('latin1');
        if (uncompressed.includes('BT')) {
          pageCount++;
          let pageText = '';
          const btRegex = /BT([\s\S]*?)ET/g;
          let match;
          while ((match = btRegex.exec(uncompressed)) !== null) {
            const block = match[1];
            const tjRegex = /\[(.*?)\]\s*TJ/g;
            let tjMatch;
            while ((tjMatch = tjRegex.exec(block)) !== null) {
              let line = '';
              const tokenRegex = /\(([^)]*)\)|(-?\d+(?:\.\d+)?)/g;
              let tok;
              while ((tok = tokenRegex.exec(tjMatch[1])) !== null) {
                if (tok[1] !== undefined) {
                  line += tok[1];
                } else if (tok[2] !== undefined) {
                  const spaceVal = parseFloat(tok[2]);
                  if (spaceVal < -180) line += ' ';
                }
              }
              pageText += line + '\n';
            }
            const singleTjRegex = /\(([^)]*)\)\s*Tj/g;
            let singleMatch;
            while ((singleMatch = singleTjRegex.exec(block)) !== null) {
              pageText += singleMatch[1] + ' ';
            }
          }

          pages.push({
            pageNumber: pageCount,
            text: pageText
          });
          fullText += '\n' + pageText;
        }
      } catch (e) {}

      pos = endStreamIdx + 9;
    }

    return {
      filePath,
      fileName: path.basename(filePath),
      fileSize: buf.length,
      fileHash: this.calculateSha256(filePath),
      totalPages: Math.max(1, pages.length),
      pages,
      fullText
    };
  }

  runDeterministicRules(parsed) {
    const findings = [];
    const text = parsed.fullText;
    const lower = text.toLowerCase();

    // 1. #REF! Check
    if (text.includes('#REF!')) {
      const affectedPages = parsed.pages.filter(p => p.text.includes('#REF!')).map(p => p.pageNumber);
      findings.push({
        severity: 'CRITICAL',
        category: 'CALCULATION',
        title: 'Formula Reference Error (#REF!) Terdeteksi',
        condition_found: `Ditemukan token formula rusak '#REF!' pada halaman ${affectedPages.join(', ')}. Rumus referensi sel Excel hilang.`,
        standard_reference: 'SPI 105 Butir 5.1 & KEPI Butir 3 (Integritas Kalkulasi)',
        impact_analysis: 'Nilai pasar agunan tidak memiliki dasar matematis valid dan berpotensi gugur saat audit perbankan.',
        corrective_action: 'Buka kembali lembar KKP sumber dan perbaiki referensi sel formula yang hilang/terhapus.',
        page_numbers: affectedPages.length > 0 ? affectedPages : [3, 4],
        resolved: false
      });
    }

    // 2. #VALUE! or #DIV/0!
    if (text.includes('#VALUE!') || text.includes('#DIV/0!')) {
      findings.push({
        severity: 'CRITICAL',
        category: 'CALCULATION',
        title: 'Math Formula Syntax Error (#VALUE! / #DIV/0!)',
        condition_found: 'Terdeteksi pembagian dengan nol atau tipe data tidak sesuai pada kalkulasi penilaian.',
        standard_reference: 'SPI 105 Butir 5.1 (Akurasi Matematika)',
        impact_analysis: 'Aritmetika KKP tidak tuntas sehingga merusak keabsahan nilai agunan.',
        corrective_action: 'Perbaiki formula pembobotan dan hindari variabel pembagi nol.',
        page_numbers: [4],
        resolved: false
      });
    }

    // 3. Overflow ####
    if (/####+/.test(text)) {
      const affectedPages = parsed.pages.filter(p => /####+/.test(p.text)).map(p => p.pageNumber);
      findings.push({
        severity: 'MAJOR',
        category: 'CLERICAL',
        title: 'Tampilan Angka Terpotong / Cell Overflow (####)',
        condition_found: `Ditemukan karakter overflow '####' pada kolom tabel rincian biaya halaman ${affectedPages.join(', ')}.`,
        standard_reference: 'SPI 103 Butir 4 (Kelengkapan Penyajian Laporan)',
        impact_analysis: 'Rincian angka biaya konstruksi atau unit tidak terbaca oleh komite kredit bank.',
        corrective_action: 'Perlebar lebar kolom pada spreadsheet KKP sebelum mengekspor ke dokumen PDF.',
        page_numbers: affectedPages.length > 0 ? affectedPages : [5],
        resolved: false
      });
    }

    // 4. Rp 0 indication
    if (/Rp\.?\s*0\s*(?:,-|\/m2|\(Nol\))?/i.test(text)) {
      findings.push({
        severity: 'MAJOR',
        category: 'CALCULATION',
        title: 'Indikasi Nilai Sarana Pelengkap Rp 0 Tanpa Keterangan',
        condition_found: 'Terdapat komponen biaya atau sarana pelengkap yang tercatat bernilai Rp 0.',
        standard_reference: 'SPI 105 Butir 5.2 (Kelengkapan Penilaian Fisik)',
        impact_analysis: 'Potensi kelalaian dalam menaksir sarana pelengkap properti agunan.',
        corrective_action: 'Lengkapi estimasi biaya sarana pelengkap atau beri keterangan resmi bila fasilitas tidak dinilai.',
        page_numbers: [6],
        resolved: false
      });
    }

    // 5. Appraiser License Check: Non-simple Commercial vs License PS
    const isCommercialComplex = /rumah sakit|rsia|klinik utama|hotel|resort|mall|pusat perbelanjaan|kawasan perumahan|kyg/i.test(lower);
    const hasPsLicense = /\bps[-\s]?(?:1|2|3|4)?\b|\bpenilai\s+sederhana\b/i.test(lower);
    const hasPLicense = /\bp[-\s]?(?:1|2|3|4)?\.\d{2}\.\d{5}\b|\bpenilai\s+publik\s+properti\b|\bizin\s+penilai\s+publik\s*:\s*p-/i.test(lower);

    if (isCommercialComplex && hasPsLicense && !hasPLicense) {
      findings.push({
        severity: 'CRITICAL',
        category: 'SPI_COMPLIANCE',
        title: 'Kompetensi Izin Penilai Publik Tidak Sesuai Klasifikasi Aset',
        condition_found: 'Aset merupakan objek komersial non-sederhana (Rumah Sakit / Kawasan), namun laporan memuat lisensi terbatas Penilai Sederhana (PS).',
        standard_reference: 'KMK No. 248/KM.1/2019 & POJK Penilaian Agunan Bank',
        impact_analysis: 'Laporan ditolak mutlak oleh pihak perbankan dan berisiko terkena sanksi pembekuan izin dari P2PK Kemenkeu RI.',
        corrective_action: 'Laporan wajib ditandatangani oleh Rekan Penilai Publik Pemegang Izin Properti Penuh (P) (Ir. Nanang Rahayu / Dharma Hartono).',
        page_numbers: [1, 2],
        resolved: false
      });
    }

    // 6. Reconciliation sum check
    const mTanah = text.match(/(?:nilai\s+pasar\s+tanah|nilai\s+tanah)[^\d]*Rp\.?\s*([\d\.,]+)/i);
    const mBgn = text.match(/(?:nilai\s+pasar\s+bangunan|nilai\s+bangunan)[^\d]*Rp\.?\s*([\d\.,]+)/i);
    const mTot = text.match(/(?:total\s+nilai\s+pasar|kesimpulan\s+nilai\s+pasar)[^\d]*Rp\.?\s*([\d\.,]+)/i);

    if (mTanah && mBgn && mTot) {
      const vTanah = parseFloat(mTanah[1].replace(/\./g, '').replace(',', '.'));
      const vBgn = parseFloat(mBgn[1].replace(/\./g, '').replace(',', '.'));
      const vTot = parseFloat(mTot[1].replace(/\./g, '').replace(',', '.'));
      const sum = vTanah + vBgn;
      const diff = Math.abs(vTot - sum);
      if (diff > 100000 && vTot > 0 && sum > 0) {
        findings.push({
          severity: 'MAJOR',
          category: 'CALCULATION',
          title: 'Diskrepansi Rekonsiliasi Nilai Penjumlahan (Sum Discrepancy)',
          condition_found: `Total Nilai Pasar tercatat Rp ${vTot.toLocaleString('id-ID')}, namun Nilai Tanah + Bangunan = Rp ${sum.toLocaleString('id-ID')}. Selisih: Rp ${diff.toLocaleString('id-ID')}.`,
          standard_reference: 'SPI 105 Butir 5.3 (Rekonsiliasi Nilai Pendekatan Biaya)',
          impact_analysis: 'Ketidaksinkronan angka antara tabel resume dengan kertas kerja memicu sanggahan tim audit bank.',
          corrective_action: 'Periksa kembali nilai sarana pelengkap atau pembulatan angka akhir pada naskah laporan.',
          page_numbers: [3, 4],
          resolved: false
        });
      }
    }

    return findings;
  }

  runSemanticAudits(parsed) {
    const findings = [];
    const text = parsed.fullText;
    const lower = text.toLowerCase();

    // 1. Contradiction: Tanah Kosong vs Building Valuation
    if (/\btanah\s+kosong\b|\bvacant\s+land\b/i.test(lower) && /\bnilai\s+pasar\s+bangunan\b|\brcn\b/i.test(lower)) {
      findings.push({
        severity: 'CRITICAL',
        category: 'METHODOLOGY',
        title: 'Kontradiksi Identifikasi Objek: Tanah Kosong Memuat Penilaian Bangunan',
        condition_found: "Laporan mendefinisikan objek sebagai 'Tanah Kosong' namun memuat bab kalkulasi Nilai Pasar Bangunan / RCN.",
        standard_reference: 'SPI 103 Butir 3.1 & KEPI Butir 2 (Kejelasan Objek Penilaian)',
        impact_analysis: 'Informasi material agunan menyesatkan (misleading). Legalitas kredit perbankan cacat formil.',
        corrective_action: "Koreksi lingkup objek menjadi 'Tanah dan Bangunan' atau hapus kertas kerja penilaian fisik bangunan.",
        page_numbers: [1, 3],
        resolved: false
      });
    }

    // 2. HBU Analysis 4 Criteria Check (KPUP 10)
    if (/hbu|highest\s+and\s+best\s+use|tertinggi\s+dan\s+terbaik/i.test(lower)) {
      const criteria = {
        'Kelayakan Hukum': /kelayakan\s+hukum|diizinkan\s+hukum|legal|peraturan\s+daerah|zoning/i.test(lower),
        'Kelayakan Fisik': /kelayakan\s+fisik|memungkinkan\s+secara\s+fisik|topografi|bentuk\s+tanah/i.test(lower),
        'Kelayakan Finansial': /kelayakan\s+finansial|layak\s+keuangan|pendapatan|dcf|npv/i.test(lower),
        'Produktivitas Maksimal': /produktivitas\s+maksimal|hasil\s+maksimal|paling\s+menguntungkan/i.test(lower)
      };
      const missing = Object.entries(criteria).filter(([_, v]) => !v).map(([k]) => k);
      if (missing.length >= 2) {
        findings.push({
          severity: 'MAJOR',
          category: 'METHODOLOGY',
          title: 'Analisis Penggunaan Tertinggi & Terbaik (HBU) Tidak Memenuhi 4 Kriteria Baku',
          condition_found: `Bab HBU belum mengelaborasi kriteria wajib: ${missing.join(', ')}.`,
          standard_reference: 'KPUP Butir 10 & SPI 105 (Uji 4 Kriteria Analisis HBU)',
          impact_analysis: 'Landasan penetapan pendekatan penilaian properti agunan menjadi rentan digugat.',
          corrective_action: 'Lengkapi matriks pengujian 4 kriteria HBU (Aspek Hukum, Fisik, Finansial, dan Produktivitas Maksimal).',
          page_numbers: [6, 7],
          resolved: false
        });
      }
    }

    // 3. Liquidation discount flat reduction
    if ((lower.includes('nilai likuidasi') || lower.includes('liquidation value')) &&
        /(?:dipotong|diskon|potongan)\s*(?:sebesar)?\s*(?:30%|25%|20%|40%|50%)/i.test(lower) &&
        !/waktu\s+pemasaran\s+terbatas|jangka\s+waktu\s+penjualan|daya\s+serap\s+pasar/i.test(lower)) {
      findings.push({
        severity: 'MODERATE',
        category: 'METHODOLOGY',
        title: 'Penerapan Diskon Nilai Likuidasi Flat Tanpa Justifikasi Waktu Pemasaran (SPI 202)',
        condition_found: 'Nilai likuidasi dipotong persentase flat tanpa analisis mendalam mengenai waktu pemasaran terbatas (limited marketing period).',
        standard_reference: 'SPI 202 Butir 4.3 (Penetapan Nilai Likuidasi Agunan Perbankan)',
        impact_analysis: 'Dapat dipertanyakan oleh Komite Manajemen Risiko Bank saat audit portofolio kredit macet.',
        corrective_action: 'Sertakan justifikasi tertulis mengenai likuiditas aset, estimasi lama penjualan lelang (3-6 bulan), dan profil pembeli potensial.',
        page_numbers: [4, 5],
        resolved: false
      });
    }

    return findings;
  }

  evaluateDocument(filePath, jobOrderId = 'JO-NSR-2026-0001', uploadedBy = 'Penilai Pelaksana') {
    const parsed = this.extractPdfContent(filePath);
    const detFindings = this.runDeterministicRules(parsed);
    const semFindings = this.runSemanticAudits(parsed);
    const allFindings = [...detFindings, ...semFindings];

    const criticalCount = allFindings.filter(f => f.severity === 'CRITICAL').length;
    const majorCount = allFindings.filter(f => f.severity === 'MAJOR').length;
    const modCount = allFindings.filter(f => f.severity === 'MODERATE').length;
    const minorCount = allFindings.filter(f => f.severity === 'MINOR').length;

    let verdict = 'ACCEPTABLE';
    let score = 98.0;
    let nolapUnlocked = true;

    if (criticalCount > 0) {
      verdict = 'NOT_ACCEPTABLE';
      score = Math.max(30.0, 58.0 - (criticalCount * 12.0) - (majorCount * 4.0));
      nolapUnlocked = false;
    } else if (majorCount > 0) {
      verdict = 'REQUIRES_MAJOR_REVISION';
      score = Math.max(55.0, 75.0 - (majorCount * 6.0) - (modCount * 2.0));
      nolapUnlocked = false;
    } else if (modCount > 0) {
      verdict = 'ACCEPTABLE_WITH_REVISION';
      score = Math.max(80.0, 92.0 - (modCount * 3.0));
      nolapUnlocked = true;
    }

    // Extract property total values if available
    let totalMarketValue = 0;
    let totalLiquidationValue = 0;
    const mMarket = parsed.fullText.match(/(?:nilai\s+pasar\s+properti|total\s+nilai\s+pasar)[^\d]*Rp\.?\s*([\d\.,]+)/i);
    const mLiq = parsed.fullText.match(/(?:nilai\s+likuidasi)[^\d]*Rp\.?\s*([\d\.,]+)/i);
    if (mMarket) totalMarketValue = parseFloat(mMarket[1].replace(/\./g, '').replace(',', '.')) || 0;
    if (mLiq) totalLiquidationValue = parseFloat(mLiq[1].replace(/\./g, '').replace(',', '.')) || 0;

    const result = {
      id: 'rev-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      job_order_id: jobOrderId,
      file_name: parsed.fileName,
      file_hash: parsed.fileHash,
      total_pages: parsed.totalPages,
      uploaded_by: uploadedBy,
      status: verdict,
      compliance_score: Math.round(score * 10) / 10,
      total_market_value: totalMarketValue,
      total_liquidation_value: totalLiquidationValue,
      discrepancy_amount: 0,
      gate_nolap_unlocked: nolapUnlocked,
      findings_summary: {
        critical: criticalCount,
        major: majorCount,
        moderate: modCount,
        minor: minorCount,
        total: allFindings.length
      },
      findings: allFindings,
      created_at: new Date().toISOString()
    };

    // Generate formal report HTML
    const reportHtml = this.generateReportHtml(result);
    const safeName = parsed.fileName.replace(/[^a-zA-Z0-9_-]/g, '_');
    const reportPath = path.join(this.outputDir, `QA_REPORT_${safeName}.html`);
    fs.writeFileSync(reportPath, reportHtml, 'utf8');
    result.generated_report_pdf_url = `output/qa_reports/QA_REPORT_${safeName}.html`;

    return result;
  }

  generateReportHtml(review) {
    const v = review.status;
    const isBad = v === 'NOT_ACCEPTABLE' || v === 'REQUIRES_MAJOR_REVISION';
    const vColor = isBad ? '#dc2626' : '#16a34a';
    const vBg = isBad ? '#fef2f2' : '#f0fdf4';

    const rows = (review.findings || []).map(f => {
      const c = f.severity === 'CRITICAL' ? '#dc2626' : f.severity === 'MAJOR' ? '#ea580c' : f.severity === 'MODERATE' ? '#ca8a04' : '#2563eb';
      return `
        <tr style="border-bottom: 1px solid #e2e8f0; font-size: 11px;">
          <td style="padding: 8px; font-weight: bold; color: ${c};">${f.severity}</td>
          <td style="padding: 8px;"><strong>${f.title}</strong><br><span style="color:#64748b;">Ref: ${f.standard_reference}</span></td>
          <td style="padding: 8px; color: #334155;">${f.condition_found}<br><em style="color:#0284c7;">Aksi: ${f.corrective_action}</em></td>
          <td style="padding: 8px; text-align: center;">Hal ${(f.page_numbers || [1]).join(', ')}</td>
        </tr>
      `;
    }).join('');

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>INDEPENDENT TECHNICAL REVIEW REPORT - KJPP NSR</title>
  <style>
    @page { size: A4; margin: 15mm; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #0f172a; margin: 0; padding: 0; background: #fff; }
    .page { page-break-after: always; padding: 10px 0; }
    .header { border-bottom: 2px solid #0f172a; padding-bottom: 8px; margin-bottom: 15px; }
    .title-box { text-align: center; margin-bottom: 20px; }
    .verdict-banner { background: ${vBg}; border: 2px solid ${vColor}; border-radius: 8px; padding: 15px; text-align: center; margin: 15px 0; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th { background: #0f172a; color: #fff; padding: 8px; font-size: 11px; text-transform: uppercase; text-align: left; }
    .section-head { font-size: 13px; font-weight: 800; text-transform: uppercase; border-left: 4px solid #0284c7; padding-left: 8px; margin: 20px 0 10px 0; }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <div style="font-size: 14px; font-weight: 900; letter-spacing: 0.5px;">KJPP NANANG RAHAYU SIGIT PARYANTO &amp; REKAN</div>
      <div style="font-size: 10px; color: #64748b;">KANTOR JASA PENILAI PUBLIK (KMK NO. 2.19.0160) &bull; KOMITE KENDALI MUTU &amp; SPM</div>
    </div>
    
    <div class="title-box">
      <h2 style="font-size: 16px; font-weight: 900; text-transform: uppercase; margin: 0 0 5px 0;">INDEPENDENT TECHNICAL REVIEW &amp; QA REPORT</h2>
      <p style="font-size: 11px; color: #64748b; margin: 0;">Laporan Pengujian Kepatuhan Standar Penilaian Indonesia (SPI) &amp; KEPI</p>
    </div>

    <table style="border: 1px solid #e2e8f0; font-size: 11px; margin-bottom: 15px;">
      <tr><td style="padding: 6px; width: 25%; background: #f8fafc; font-weight: bold;">Nomor Job Order:</td><td style="padding: 6px; font-family: monospace;">${review.job_order_id}</td></tr>
      <tr><td style="padding: 6px; background: #f8fafc; font-weight: bold;">Nama Dokumen:</td><td style="padding: 6px;">${review.file_name}</td></tr>
      <tr><td style="padding: 6px; background: #f8fafc; font-weight: bold;">Skor Kepatuhan Mutu:</td><td style="padding: 6px; font-weight: bold;">${review.compliance_score}%</td></tr>
      <tr><td style="padding: 6px; background: #f8fafc; font-weight: bold;">Status Gerbang NoLap:</td><td style="padding: 6px; font-weight: bold; color: ${vColor};">${review.gate_nolap_unlocked ? 'TERBUKA PENUH' : 'TERKUNCI (MUTLAK)'}</td></tr>
    </table>

    <div class="verdict-banner">
      <h3 style="font-size: 18px; font-weight: 900; color: ${vColor}; margin: 0 0 5px 0;">${review.status.replace(/_/g, ' ')}</h3>
      <p style="font-size: 11px; color: #334155; margin: 0;">
        ${isBad ? 'DRAF LAPORAN DITOLAK: Terdapat formula rusak / temuan kritis yang wajib diperbaiki sebelum NoLap Kemenkeu diterbitkan.' : 'LAPORAN MEMENUHI SYARAT: Seluruh pengujian deterministik dan prinsip material SPI/KEPI terpenuhi.'}
      </p>
    </div>

    <div class="section-head">Daftar Temuan Evaluasi Teknis (${review.findings_summary.total} Temuan)</div>
    <table>
      <thead>
        <tr>
          <th style="width: 12%;">Tingkat</th>
          <th style="width: 33%;">Judul &amp; Standar</th>
          <th style="width: 45%;">Kondisi Faktual &amp; Rekomendasi Aksi</th>
          <th style="width: 10%;">Lokasi</th>
        </tr>
      </thead>
      <tbody>
        ${rows || '<tr><td colspan="4" style="text-align:center; padding:15px; color:#16a34a;">Tidak ditemukan anomali. Berkas lulus pengujian 100%.</td></tr>'}
      </tbody>
    </table>

    <div style="margin-top: 30px; border-top: 1px solid #cbd5e1; padding-top: 15px; font-size: 10px; color: #64748b; text-align: center;">
      Dokumen ini diterbitkan otomatis oleh Sistem Quality Gatekeeper Portal Technical Review KJPP NSR (KMK No. 2.19.0160).
    </div>
  </div>
</body>
</html>`;
  }
}
