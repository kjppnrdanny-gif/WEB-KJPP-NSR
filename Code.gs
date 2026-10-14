/**
 * =========================================================================================
 * BACKEND GOOGLE APPS SCRIPT (GAS) - SISTEM LINGKUP PENUGASAN (SPK) & JOB ORDER (JO)
 * KJPP NANANG RAHAYU SIGIT PARYANTO DAN REKAN (KJPP NSR)
 * =========================================================================================
 * Modul Terpadu:
 * 1. LockService Atomic Sequential Numbering (Anti Bentrok / Anti Laporan Ganda)
 * 2. CacheService Performance Optimization (Sub-Second Dashboard Loading)
 * 3. Role-Based Access Control (RBAC): Pusat (Full Akses Approval) vs Cabang (Antrean)
 * 4. Google Drive Document Automation (Ekspor Google Docs & PDF 9 Dokumen Resmi)
 * 
 * Lead Architect & Developer : Danny Taufik Hidayat, S.H. (kjppnr.danny@gmail.com)
 * Copyright (c) 2026 KJPP NSR. All rights reserved.
 * =========================================================================================
 */

// -----------------------------------------------------------------------------------------
// 1. KONFIGURASI GLOBAL & ENVIRONMENT SISTEM
// -----------------------------------------------------------------------------------------
const CONFIG = {
  // Nama Sheet di Google Spreadsheet Penyimpanan
  SHEET_DATABASE: 'Database_Penugasan',
  SHEET_COUNTER: 'Config_Counter',
  SHEET_LOG: 'Log_Aktivitas',
  
  // Cache TTL (Detik)
  CACHE_TTL_SECONDS: 120, // 2 Menit
  
  // Master Token Otorisasi Resmi KJPP NSR (Case-Insensitive)
  TOKENS: {
    PUSAT: ['NSR-PST-2026', 'NSR2026', 'NSR8899'],
    CABANG: {
      'NSR-BDG-2026': 'Kantor Cabang Bandung',
      'NSR-PDG-2026': 'Kantor Cabang Padang',
      'NSR-MKS-2026': 'Kantor Cabang Makassar',
      'NSR-PLB-2026': 'Kantor Cabang Palembang',
      'NSR-PLM-2026': 'Kantor Cabang Palembang'
    }
  },

  // Folder Root Google Drive KJPP NSR (Opsional: ID Folder Drive Terpusat)
  DRIVE_ROOT_FOLDER_NAME: 'KJPP NSR - Arsip Digital Penugasan & JO'
};

// -----------------------------------------------------------------------------------------
// 2. ENTRY POINT HTTP POST: doPost(e) DENGAN LockService
// -----------------------------------------------------------------------------------------
function doPost(e) {
  const lock = LockService.getScriptLock();
  
  try {
    // 1. Tunggu script lock hingga maksimal 30 detik untuk menjamin penomoran urut atomik
    const acquired = lock.tryLock(30000);
    if (!acquired) {
      return respondJSON({
        success: false,
        error: 'Server sedang sibuk memproses transaksi penomoran lain. Silakan coba kembali beberapa saat lagi.'
      }, 503);
    }

    // 2. Parse payload request
    let payload = {};
    if (e.postData && e.postData.contents) {
      try {
        payload = JSON.parse(e.postData.contents);
      } catch (err) {
        payload = e.parameter || {};
      }
    } else {
      payload = e.parameter || {};
    }

    const action = payload.action || 'CREATE_SUBMISSION';
    const clientToken = (payload.token || '').trim().toUpperCase();

    // 3. Verifikasi Token & RBAC
    const authResult = verifikasiAksesToken(clientToken);
    if (!authResult.valid) {
      return respondJSON({
        success: false,
        error: 'Otorisasi Ditolak: Token tidak terdaftar atau tidak memiliki hak akses.'
      }, 401);
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet() || inisialisasiSpreadsheetBaru();
    let result = {};

    // 4. Routing Action
    switch (action) {
      case 'CREATE_SUBMISSION':
        result = prosesPengajuanBaru(ss, payload.data, authResult);
        break;

      case 'APPROVE_SUBMISSION':
        if (authResult.mode !== 'PUSAT') {
          return respondJSON({
            success: false,
            error: 'Otorisasi Ditolak: Hanya Akun Kantor Pusat yang berhak menerbitkan nomor resmi dan melakukan approval.'
          }, 403);
        }
        result = prosesApprovalPusat(ss, payload.projectId, authResult);
        break;

      case 'UPDATE_SUBMISSION':
        result = prosesUpdateData(ss, payload.projectId, payload.data, authResult);
        break;

      case 'GENERATE_DOCUMENTS':
        result = prosesGenerateDokumenDrive(payload.projectId, payload.docTypes);
        break;

      default:
        result = { success: false, error: 'Aksi (' + action + ') tidak dikenali oleh sistem.' };
    }

    // Invalidate Cache Dashboard setelah perubahan data
    try {
      const cache = CacheService.getScriptCache();
      cache.remove('DASHBOARD_PENUGASAN_ALL');
    } catch (cErr) {
      console.warn('Gagal membersihkan cache:', cErr);
    }

    return respondJSON(result);

  } catch (error) {
    console.error('Fatal Error di doPost:', error);
    return respondJSON({
      success: false,
      error: 'Terjadi kesalahan sistem internal: ' + error.toString()
    }, 500);

  } finally {
    // Selalu lepaskan lock
    lock.releaseLock();
  }
}

// -----------------------------------------------------------------------------------------
// 3. ENTRY POINT HTTP GET: doGet(e) DENGAN CacheService
// -----------------------------------------------------------------------------------------
function doGet(e) {
  try {
    const params = e.parameter || {};
    const clientToken = (params.token || '').trim().toUpperCase();
    const forceRefresh = params.refresh === 'true';

    // 1. Verifikasi Akses
    const authResult = verifikasiAksesToken(clientToken);
    if (!authResult.valid) {
      return respondJSON({
        success: false,
        error: 'Otorisasi Ditolak: Token tidak valid.'
      }, 401);
    }

    const cache = CacheService.getScriptCache();
    const cacheKey = 'DASHBOARD_PENUGASAN_ALL';
    let dataList = null;

    // 2. Baca dari CacheService bila tidak forceRefresh
    if (!forceRefresh) {
      const cached = cache.get(cacheKey);
      if (cached) {
        try {
          dataList = JSON.parse(cached);
        } catch (e) {
          dataList = null;
        }
      }
    }

    // 3. Jika cache miss, baca langsung dari Spreadsheet
    if (!dataList) {
      const ss = SpreadsheetApp.getActiveSpreadsheet() || inisialisasiSpreadsheetBaru();
      const sheet = ss.getSheetByName(CONFIG.SHEET_DATABASE);
      dataList = [];

      if (sheet && sheet.getLastRow() > 1) {
        const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();
        const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          const item = {};
          for (let j = 0; j < headers.length; j++) {
            item[headers[j]] = row[j];
          }
          // Parse JSON nested jika ada
          if (item.objek_list && typeof item.objek_list === 'string') {
            try { item.objek_list = JSON.parse(item.objek_list); } catch (err) {}
          }
          dataList.push(item);
        }
      }

      // Simpan ke CacheService
      try {
        cache.put(cacheKey, JSON.stringify(dataList), CONFIG.CACHE_TTL_SECONDS);
      } catch (cErr) {
        console.warn('Gagal menyimpan cache:', cErr);
      }
    }

    // 4. Filter data berdasarkan Role & Cabang jika penyeru adalah Cabang
    let filteredList = dataList;
    if (authResult.mode === 'CABANG') {
      filteredList = dataList.filter(item => item.kantor_wilayah === authResult.wilayah);
    }

    // Filter tambahan dari parameter URL
    if (params.status && params.status !== 'ALL') {
      filteredList = filteredList.filter(item => item.status === params.status);
    }

    return respondJSON({
      success: true,
      role: authResult.mode,
      wilayah: authResult.wilayah,
      totalCount: filteredList.length,
      data: filteredList
    });

  } catch (error) {
    console.error('Fatal Error di doGet:', error);
    return respondJSON({
      success: false,
      error: 'Gagal memuat data penugasan: ' + error.toString()
    }, 500);
  }
}

// -----------------------------------------------------------------------------------------
// 4. LOGIKA INTI PENOMORAN OTOMATIS & APPROVAL (LockService Protected)
// -----------------------------------------------------------------------------------------

/**
 * Menyimpan pengajuan baru baik dari Cabang (WAITING_APPROVAL) maupun Pusat (APPROVED Langsung)
 */
function prosesPengajuanBaru(ss, data, auth) {
  if (!data) throw new Error('Data pengajuan tidak boleh kosong.');

  const sheetDb = ss.getSheetByName(CONFIG.SHEET_DATABASE) || buatSheetDatabase(ss);
  const now = new Date();
  const dSurat = new Date(data.tanggal_surat || now);
  const romawi = getBulanRomawi(dSurat);
  const thn = dSurat.getFullYear();

  const isPusat = (auth.mode === 'PUSAT');
  let noAdm = 'Menunggu Otorisasi Pusat';
  let noLp = 'Menunggu Otorisasi Pusat';
  let status = 'WAITING_APPROVAL';

  // Jika input langsung oleh Admin Pusat, terbitkan nomor seketika
  if (isPusat) {
    const nextSeq = ambilDanKunciNomorUrut(ss, thn);
    const seqPadded = nextSeq.toString().padStart(3, '0');
    noAdm = `${seqPadded}/JO/NSR/${romawi}/${thn}`;
    noLp = `${seqPadded}/NSR/PN-APP/${romawi}/${thn}`;
    status = 'APPROVED';
  }

  const projectId = 'PRJ-' + now.getTime();
  const objekJson = (typeof data.objek_list === 'object') ? JSON.stringify(data.objek_list) : (data.objek_list || '[]');

  const recordRow = [
    projectId,
    status,
    noAdm,
    noLp,
    data.kantor_wilayah || auth.wilayah,
    data.tanggal_surat || now.toISOString().split('T')[0],
    data.rujukan_surat_nomor || '',
    data.rujukan_surat_tanggal || '',
    data.pemberi_tugas_nama || '',
    data.pemberi_tugas_pic || '',
    data.pemberi_tugas_jabatan || '',
    data.pemberi_tugas_kontak || '',
    data.pemberi_tugas_email || '',
    data.pemberi_tugas_alamat || '',
    data.pemberi_tugas_npwp || '',
    data.pengguna_laporan_a || '',
    data.pengguna_laporan_b || '',
    (data.debitur_nama || '').toUpperCase(),
    data.debitur_cp || '',
    data.tujuan_penilaian || '',
    data.dasar_nilai || '',
    data.pendekatan_penilaian || '',
    data.mata_uang || 'Rupiah (IDR)',
    data.tanggal_penilaian || data.tanggal_surat || now.toISOString().split('T')[0],
    data.sumber_proyek || '',
    data.marketing_nama || '',
    data.rekan_nama || '',
    data.reviewer_nama || '',
    data.penilai_nama || '',
    data.asisten_nama || '',
    data.survey_hari || '',
    data.survey_tanggal || '',
    data.sla_inspeksi || 1,
    data.sla_analisa || 2,
    data.sla_final || 2,
    data.sla_total || 5,
    Number(data.biaya_dpp || 0),
    Number(data.biaya_ppn || 0),
    Number(data.biaya_total || 0),
    data.terbilang || angkaTerbilang(data.biaya_total || 0),
    data.cara_pembayaran || '',
    data.rekening_resmi || '',
    objekJson,
    auth.token,
    now.toISOString(),
    isPusat ? now.toISOString() : ''
  ];

  sheetDb.appendRow(recordRow);

  // Catat Log
  catatLogAktivitas(ss, projectId, isPusat ? 'DIRECT_APPROVAL_PUSAT' : 'SUBMIT_CABANG', auth.token, `Debitur: ${data.debitur_nama}`);

  return {
    success: true,
    projectId: projectId,
    status: status,
    nomor_adm: noAdm,
    nomor_lp: noLp,
    message: isPusat ? 'Pengajuan berhasil disimpan dan nomor resmi telah diterbitkan.' : 'Pengajuan berhasil dikirim ke antrean Kantor Pusat.'
  };
}

/**
 * Melakukan approval dari Admin Pusat untuk pengajuan Cabang
 */
function prosesApprovalPusat(ss, projectId, auth) {
  if (!projectId) throw new Error('Project ID wajib disertakan.');

  const sheetDb = ss.getSheetByName(CONFIG.SHEET_DATABASE);
  if (!sheetDb) throw new Error('Sheet database tidak ditemukan.');

  const data = sheetDb.getDataRange().getValues();
  let rowIndex = -1;
  let targetRow = null;

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === projectId) {
      rowIndex = i + 1; // 1-indexed
      targetRow = data[i];
      break;
    }
  }

  if (rowIndex === -1) throw new Error('Data penugasan dengan ID ' + projectId + ' tidak ditemukan.');

  if (targetRow[1] === 'APPROVED') {
    return {
      success: true,
      message: 'Proyek ini sudah berstatus APPROVED sebelumnya.',
      nomor_adm: targetRow[2],
      nomor_lp: targetRow[3]
    };
  }

  const dSurat = new Date(targetRow[5] || new Date());
  const romawi = getBulanRomawi(dSurat);
  const thn = dSurat.getFullYear();

  // Ambil nomor urut secara terkunci aman
  const nextSeq = ambilDanKunciNomorUrut(ss, thn);
  const seqPadded = nextSeq.toString().padStart(3, '0');
  const noAdm = `${seqPadded}/JO/NSR/${romawi}/${thn}`;
  const noLp = `${seqPadded}/NSR/PN-APP/${romawi}/${thn}`;
  const nowIso = new Date().toISOString();

  // Update kolom status (col 2), noAdm (col 3), noLp (col 4), approved_at (col 45)
  sheetDb.getRange(rowIndex, 2).setValue('APPROVED');
  sheetDb.getRange(rowIndex, 3).setValue(noAdm);
  sheetDb.getRange(rowIndex, 4).setValue(noLp);
  sheetDb.getRange(rowIndex, 45).setValue(nowIso);

  catatLogAktivitas(ss, projectId, 'APPROVAL_RESMI_PUSAT', auth.token, `Nomor diterbitkan: ${noLp} & ${noAdm}`);

  return {
    success: true,
    projectId: projectId,
    status: 'APPROVED',
    nomor_adm: noAdm,
    nomor_lp: noLp,
    approved_at: nowIso,
    message: 'Approval berhasil! Nomor resmi telah dikunci dan diterbitkan.'
  };
}

/**
 * Mengambil dan menginkremen nomor urut tahunan secara atomik
 */
function ambilDanKunciNomorUrut(ss, tahun) {
  let sheetCounter = ss.getSheetByName(CONFIG.SHEET_COUNTER);
  if (!sheetCounter) {
    sheetCounter = ss.insertSheet(CONFIG.SHEET_COUNTER);
    sheetCounter.appendRow(['Tahun', 'Counter_JO_SPK', 'Last_Updated']);
  }

  const data = sheetCounter.getDataRange().getValues();
  let rowIdx = -1;
  let currentCounter = 0;

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] == tahun) {
      rowIdx = i + 1;
      currentCounter = parseInt(data[i][1], 10) || 0;
      break;
    }
  }

  const nextCounter = currentCounter + 1;
  const nowIso = new Date().toISOString();

  if (rowIdx === -1) {
    sheetCounter.appendRow([tahun, nextCounter, nowIso]);
  } else {
    sheetCounter.getRange(rowIdx, 2).setValue(nextCounter);
    sheetCounter.getRange(rowIdx, 3).setValue(nowIso);
  }

  return nextCounter;
}

// -----------------------------------------------------------------------------------------
// 5. OTOMASI EKSPOR DOKUMEN GOOGLE DRIVE (DOCS & PDF)
// -----------------------------------------------------------------------------------------
function prosesGenerateDokumenDrive(projectId, docTypes) {
  const ss = SpreadsheetApp.getActiveSpreadsheet() || inisialisasiSpreadsheetBaru();
  const sheetDb = ss.getSheetByName(CONFIG.SHEET_DATABASE);
  const data = sheetDb.getDataRange().getValues();
  const headers = data[0];

  let p = null;
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === projectId) {
      p = {};
      for (let j = 0; j < headers.length; j++) {
        p[headers[j]] = data[i][j];
      }
      break;
    }
  }

  if (!p) throw new Error('Data proyek tidak ditemukan.');
  if (p.status !== 'APPROVED') {
    throw new Error('Dokumen hanya dapat diekspor resmi ke Google Drive setelah status APPROVED oleh Kantor Pusat.');
  }

  // 1. Dapatkan atau buat Folder di Google Drive
  const rootFolder = getOrCreateFolder(CONFIG.DRIVE_ROOT_FOLDER_NAME);
  const yearFolder = getOrCreateFolder(new Date().getFullYear().toString(), rootFolder);
  const branchFolder = getOrCreateFolder(p.kantor_wilayah, yearFolder);
  const projectFolder = getOrCreateFolder(`${p.debitur_nama} (${p.id})`, branchFolder);

  // 2. Buat Google Doc Berkas SPK & Representasi
  const docName = `Lingkup_Penugasan_SPK_${p.debitur_nama.replace(/\s+/g, '_')}`;
  const newDoc = DocumentApp.create(docName);
  const body = newDoc.getBody();

  // Susun isi dokumen di Google Docs
  body.appendParagraph("KANTOR JASA PENILAI PUBLIK").setHeading(DocumentApp.ParagraphHeading.HEADING1);
  body.appendParagraph("NANANG RAHAYU SIGIT PARYANTO DAN REKAN").setHeading(DocumentApp.ParagraphHeading.HEADING2);
  body.appendParagraph("Izin Usaha Kemenkeu RI No. 2.19.0160 | KMK RI No. 248/KM.1/2019");
  body.appendHorizontalRule();

  body.appendParagraph(`LINGKUP PENUGASAN (SPK) PENILAIAN PROPERTI\nNomor: ${p.nomor_lp}`).setHeading(DocumentApp.ParagraphHeading.TITLE);
  body.appendParagraph(`Tanggal: ${p.tanggal_surat}`);
  body.appendParagraph(`Pemberi Tugas: ${p.pemberi_tugas_nama}`);
  body.appendParagraph(`Nama Debitur: ${p.debitur_nama}`);
  body.appendParagraph(`Maksud & Tujuan: ${p.tujuan_penilaian}`);
  body.appendParagraph(`Dasar Nilai: ${p.dasar_nilai}`);
  body.appendParagraph(`Total Biaya Kontrak: ${formatRupiah(p.biaya_total)} (${p.terbilang})`);
  body.appendParagraph(`Rekan Penanggung Jawab: ${p.rekan_nama}`);

  newDoc.saveAndClose();

  // 3. Pindahkan berkas Google Doc ke folder proyek
  const docFile = DriveApp.getFileById(newDoc.getId());
  projectFolder.addFile(docFile);
  DriveApp.getRootFolder().removeFile(docFile);

  // 4. Konversi ke PDF
  const pdfBlob = docFile.getAs(MimeType.PDF);
  const pdfFile = projectFolder.createFile(pdfBlob).setName(`${docName}.pdf`);

  return {
    success: true,
    folderUrl: projectFolder.getUrl(),
    docUrl: docFile.getUrl(),
    pdfUrl: pdfFile.getUrl(),
    message: 'Dokumen Google Docs dan PDF berhasil disimpan di folder Google Drive KJPP NSR.'
  };
}

function getOrCreateFolder(folderName, parentFolder) {
  const parent = parentFolder || DriveApp;
  const folders = parent.getFoldersByName(folderName);
  if (folders.hasNext()) {
    return folders.next();
  }
  return parent.createFolder(folderName);
}

// -----------------------------------------------------------------------------------------
// 6. HELPER & STRUKTUR TABEL INITIALIZER
// -----------------------------------------------------------------------------------------
function verifikasiAksesToken(token) {
  if (!token) return { valid: false };

  if (CONFIG.TOKENS.PUSAT.includes(token)) {
    return { valid: true, mode: 'PUSAT', wilayah: 'Kantor Pusat Jakarta', token: token };
  }

  if (CONFIG.TOKENS.CABANG[token]) {
    return { valid: true, mode: 'CABANG', wilayah: CONFIG.TOKENS.CABANG[token], token: token };
  }

  return { valid: false };
}

function inisialisasiSpreadsheetBaru() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (ss) {
    buatSheetDatabase(ss);
    return ss;
  }
  throw new Error('Spreadsheet aktif tidak ditemukan. Pastikan script ini terikat (container-bound) atau memiliki akses Spreadsheet.');
}

function buatSheetDatabase(ss) {
  let sheet = ss.getSheetByName(CONFIG.SHEET_DATABASE);
  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.SHEET_DATABASE);
    const headers = [
      'id', 'status', 'nomor_adm', 'nomor_lp', 'kantor_wilayah', 'tanggal_surat',
      'rujukan_surat_nomor', 'rujukan_surat_tanggal', 'pemberi_tugas_nama', 'pemberi_tugas_pic',
      'pemberi_tugas_jabatan', 'pemberi_tugas_kontak', 'pemberi_tugas_email', 'pemberi_tugas_alamat',
      'pemberi_tugas_npwp', 'pengguna_laporan_a', 'pengguna_laporan_b', 'debitur_nama',
      'debitur_cp', 'tujuan_penilaian', 'dasar_nilai', 'pendekatan_penilaian', 'mata_uang',
      'tanggal_penilaian', 'sumber_proyek', 'marketing_nama', 'rekan_nama', 'reviewer_nama',
      'penilai_nama', 'asisten_nama', 'survey_hari', 'survey_tanggal', 'sla_inspeksi',
      'sla_analisa', 'sla_final', 'sla_total', 'biaya_dpp', 'biaya_ppn', 'biaya_total',
      'terbilang', 'cara_pembayaran', 'rekening_resmi', 'objek_list', 'submitted_by_token',
      'created_at', 'approved_at'
    ];
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#1e293b').setFontColor('#ffffff');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function catatLogAktivitas(ss, idProyek, tipeAksi, token, keterangan) {
  let sheet = ss.getSheetByName(CONFIG.SHEET_LOG);
  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.SHEET_LOG);
    sheet.appendRow(['Timestamp', 'Project_ID', 'Tipe_Aksi', 'Token_Aktor', 'Keterangan']);
    sheet.getRange(1, 1, 1, 5).setFontWeight('bold').setBackground('#0f172a').setFontColor('#ffffff');
  }
  sheet.appendRow([new Date().toISOString(), idProyek, tipeAksi, token, keterangan]);
}

function respondJSON(data, statusCode) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function getBulanRomawi(dateObj) {
  const romawi = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];
  return romawi[dateObj.getMonth()];
}

function formatRupiah(num) {
  if (!num || isNaN(num)) return "Rp 0,-";
  return "Rp " + Number(num).toLocaleString('id-ID') + ",-";
}

function angkaTerbilang(nilai) {
  nilai = Math.floor(Math.abs(Number(nilai)));
  if (isNaN(nilai) || nilai === 0) return "Nol Rupiah";

  const huruf = ["", "Satu", "Dua", "Tiga", "Empat", "Lima", "Enam", "Tujuh", "Delapan", "Sembilan", "Sepuluh", "Sebelas"];
  function bagi(n) {
    let temp = "";
    if (n < 12) temp = " " + huruf[n];
    else if (n < 20) temp = bagi(n - 10) + " Belas";
    else if (n < 100) temp = bagi(Math.floor(n / 10)) + " Puluh" + bagi(n % 10);
    else if (n < 200) temp = " Seratus" + bagi(n - 100);
    else if (n < 1000) temp = bagi(Math.floor(n / 100)) + " Ratus" + bagi(n % 100);
    else if (n < 2000) temp = " Seribu" + bagi(n - 1000);
    else if (n < 1000000) temp = bagi(Math.floor(n / 1000)) + " Ribu" + bagi(n % 1000);
    else if (n < 1000000000) temp = bagi(Math.floor(n / 1000000)) + " Juta" + bagi(n % 1000000);
    else if (n < 1000000000000) temp = bagi(Math.floor(n / 1000000000)) + " Milyar" + bagi(n % 1000000000);
    else temp = bagi(Math.floor(n / 1000000000000)) + " Triliun" + bagi(n % 1000000000000);
    return temp;
  }
  return (bagi(nilai).trim() + " Rupiah").replace(/\s+/g, ' ');
}
