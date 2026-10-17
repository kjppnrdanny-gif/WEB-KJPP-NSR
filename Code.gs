/**
 * =========================================================================================
 * BACKEND GOOGLE APPS SCRIPT (GAS) - SISTEM LINGKUP PENUGASAN (SPK) & JOB ORDER (JO)
 * KJPP NANANG RAHAYU SIGIT PARYANTO DAN REKAN (KJPP NSR)
 * SPREADSHEET DATABASE: DB_PENUGASAN_JO_NSR
 * =========================================================================================
 * Modul Terpadu:
 * 1. LockService Atomic Sequential Numbering (Anti Bentrok / Anti Laporan Ganda)
 * 2. CacheService Performance Optimization (Sub-Second Dashboard Loading)
 * 3. Role-Based Access Control (RBAC): Pusat (Full Akses Approval) vs Cabang (Antrean)
 * 4. Google Drive Document Automation (Ekspor Google Docs & PDF 9 Dokumen Resmi)
 * 5. 100% Sinkronisasi 4 Sheet: Data_Penugasan, Config_Counter, Master_Personil, Log_Aktivitas
 * 
 * Lead Architect & Developer : Danny Taufik Hidayat, S.H. (kjppnr.danny@gmail.com)
 * Copyright (c) 2026 KJPP NSR. All rights reserved.
 * =========================================================================================
 */

// -----------------------------------------------------------------------------------------
// 1. KONFIGURASI GLOBAL & ENVIRONMENT SISTEM
// -----------------------------------------------------------------------------------------
const GAS_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbwAq8vKXq8rbKgAtxUlSHkxWqqM7329UZyVtXTmEK0bcX7p9dyaidm7KCXG2iALwZ9d/exec';

const CONFIG = {
  // Web App Endpoint URL Resmi Google Apps Script
  WEB_APP_URL: GAS_WEB_APP_URL,

  // ID Master Spreadsheet DB_PENUGASAN_JO_NSR Resmi KJPP NSR
  SPREADSHEET_ID: '1VJW4nrzc1884kxepxZ2p8zNUcHrCWEqodQQcjeXXg_g',

  // ID Master Database Administrasi KJPP NSR
  MASTER_ADMIN_SPREADSHEET_ID: '1Aob9oFvOObV7Nz0bt3DDsTrWCoFKd233FFYkdBCSFTg',

  // Nama Sheet di Google Spreadsheet DB_PENUGASAN_JO_NSR
  SHEET_DATA: 'Data_Penugasan',
  SHEET_COUNTER: 'Config_Counter',
  SHEET_PERSONIL: 'Master_Personil',
  SHEET_LOG: 'Log_Aktivitas',
  SHEET_SURAT_UMUM: 'Buku_Surat_Umum',
  FOLDER_SURAT_UMUM: 'ARSIP_SURAT_UMUM_NSR',
  
  // Cache TTL (Detik)
  CACHE_TTL_SECONDS: 120, // 2 Menit
  
  // Master Token Otorisasi Resmi KJPP NSR (Case-Insensitive - 5 Kelompok User RBAC)
  TOKENS: {
    // 1. ADMIN_PUSAT (Otorisasi Penuh Kantor Pusat & Master Admin)
    ADMIN_PUSAT: ['NSR-PST-2026', 'NSR2026', 'NSR8899'],
    
    // 2. ADMIN_CABANG (Otorisasi Admin Kantor Cabang)
    ADMIN_CABANG: {
      'NSR-BDG-2026': 'Kantor Cabang Bandung',
      'NSR-PDG-2026': 'Kantor Cabang Padang',
      'NSR-MKS-2026': 'Kantor Cabang Makassar',
      'NSR-PLB-2026': 'Kantor Cabang Palembang',
      'NSR-PLM-2026': 'Kantor Cabang Palembang'
    },

    // 3. MARKETING (Divisi Business Development & Marketing)
    MARKETING: {
      'NSR-MKT-2026': 'Semua Wilayah',
      'MKT-PST-2026': 'Kantor Pusat Jakarta',
      'MKT-BDG-2026': 'Kantor Cabang Bandung',
      'MKT-PDG-2026': 'Kantor Cabang Padang',
      'MKT-MKS-2026': 'Kantor Cabang Makassar',
      'MKT-PLB-2026': 'Kantor Cabang Palembang',
      'MKT-PLM-2026': 'Kantor Cabang Palembang'
    },

    // 4. REVIEWER (Tim Quality Control / Reviewer KKP)
    REVIEWER: {
      'NSR-REV-2026': 'Semua Wilayah',
      'REV-PST-2026': 'Kantor Pusat Jakarta',
      'REV-BDG-2026': 'Kantor Cabang Bandung',
      'REV-PDG-2026': 'Kantor Cabang Padang',
      'REV-MKS-2026': 'Kantor Cabang Makassar',
      'REV-PLB-2026': 'Kantor Cabang Palembang',
      'REV-PLM-2026': 'Kantor Cabang Palembang'
    },

    // 5. PENILAI (Penilai Lapangan / Asisten Penilai / Surveyor)
    PENILAI: {
      'NSR-PNL-2026': 'Semua Wilayah',
      'PNL-PST-2026': 'Kantor Pusat Jakarta',
      'PNL-BDG-2026': 'Kantor Cabang Bandung',
      'PNL-PDG-2026': 'Kantor Cabang Padang',
      'PNL-MKS-2026': 'Kantor Cabang Makassar',
      'PNL-PLB-2026': 'Kantor Cabang Palembang',
      'PNL-PLM-2026': 'Kantor Cabang Palembang'
    }
  },

  // Folder Root Google Drive KJPP NSR
  DRIVE_ROOT_FOLDER_NAME: 'KJPP NSR - Arsip Digital Penugasan & JO'
};

// 53 KOLOM RESMI SHEET Data_Penugasan
const HEADERS_DATA_PENUGASAN = [
  'ID_Penugasan',
  'Timestamp_Input',
  'Status_Approval',
  'Kantor_Wilayah',
  'Mode_Pengaju',
  'No_Adm_JO',
  'No_Lingkup_Penugasan',
  'Jenis_Laporan',
  'Tgl_Dibuat',
  'No_Surat_Klien',
  'Tgl_Surat_Klien',
  'Masa_Berlaku_LP',
  'Rekan_Penilai_Publik',
  'No_Izin_Publik_Rekan',
  'Reviewer',
  'Penilai',
  'Asisten_Surveyor',
  'Surveyor_Pendamping_HP',
  'Nama_Pemberi_Tugas',
  'Bidang_Usaha_Klien',
  'NPWP_Klien',
  'PIC_Klien',
  'Jabatan_PIC',
  'Telp_PIC',
  'Email_PIC',
  'Alamat_Pemberi_Tugas',
  'Pengguna_Laporan_A',
  'Pengguna_Laporan_B',
  'Nama_Debitur_Utama',
  'Nama_Pemilik_Sertipikat',
  'Hubungan_Pemilik_Sertipikat',
  'Rincian_Objek_JSON',
  'Tujuan_Penilaian',
  'Dasar_Nilai',
  'Pendekatan_Penilaian',
  'Mata_Uang',
  'Tgl_Penilaian',
  'Tgl_Survey',
  'Survey_Hari',
  'SLA_Inspeksi',
  'SLA_Analisa',
  'SLA_Final',
  'SLA_Total',
  'Marketing_Sumber_Proyek',
  'Biaya_Net_DPP',
  'PPN_11_Persen',
  'Total_Biaya_All_In',
  'Terbilang_Biaya',
  'Cara_Pembayaran',
  'Rekening_Resmi',
  'Tgl_Approval_Pusat',
  'Disetujui_Oleh',
  'Folder_Drive_URL'
];

// 13 KOLOM RESMI SHEET Buku_Surat_Umum
const HEADERS_SURAT_UMUM = [
  'Timestamp',
  'No_Urut',
  'No_Surat',
  'Tanggal_Surat',
  'Tujuan_Penerima',
  'Perihal',
  'Klasifikasi_Perihal',
  'Penandatangan',
  'Link_Arsip_Final',
  'Link_File_Mentah',
  'File_ID_Final',
  'File_ID_Mentah',
  'Status_Arsip'
];

// =========================================================================================
// MASTER PERSONIL RESMI SHEET Master_Personil (5 Rekan Berizin & 10 Tenaga Ahli)
// =========================================================================================
const MASTER_REKAN_DEFAULT = [
  {
    nama: "Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert)",
    jabatan: "Pemimpin Rekan",
    klasifikasi: "Penilai Properti",
    mappi: "95-S-00594",
    rmk: "RMK-2017.00201",
    izin: "P-1.09.00218",
    bpn: "PP1.0006.25",
    ojk: "KEP-859/KS.13/2026"
  },
  {
    nama: "Deni Siswandi, S.T., MAPPI (Cert.)",
    jabatan: "Rekan",
    klasifikasi: "Penilai Properti",
    mappi: "06-S-02013",
    rmk: "RMK-2017.01564",
    izin: "P-1.20.00581",
    bpn: "PPI.0041.24",
    ojk: "KEP-1261/KS.13/2026"
  },
  {
    nama: "Hernita, S.Si., MAPPI (Cert.)",
    jabatan: "Rekan",
    klasifikasi: "Penilai Properti",
    mappi: "09-S-02262",
    rmk: "RMK-2017.00437",
    izin: "PS1.15.00046",
    bpn: "-",
    ojk: "KEP-1012/KS.13/2026"
  },
  {
    nama: "Muhammad Amin Sade, SM., MAPPI (Cert.)",
    jabatan: "Rekan",
    klasifikasi: "Penilai Properti",
    mappi: "09-S-02425",
    rmk: "RMK-2017.00527",
    izin: "PS1.16.00126",
    bpn: "-",
    ojk: "KEP-1278/KS.13/2026"
  },
  {
    nama: "Dharma Priyanto Sih Budi Susilo, ST., MAPPI (Cert.)",
    jabatan: "Rekan",
    klasifikasi: "Penilai Properti",
    mappi: "16-S-06984",
    rmk: "RMK-2017.01801",
    izin: "PS1.19.00249",
    bpn: "PP2.0031.23",
    ojk: "KEP-523/KS.13/2026"
  }
];

const MASTER_TENAGA_AHLI_DEFAULT = [
  { nama: "Tedi Setiadi, S.T.", mappi: "10-T-02490", rmk: "RMK-2017.01563", peran: "Reviewer / Penilai", hp: "0815-5566-7788" },
  { nama: "Danny Taufik Hidayat, S.H.", mappi: "10-P-02594", rmk: "RMK-2021.04012", peran: "Reviewer / Penilai", hp: "0812-9876-5432" },
  { nama: "Angga Malid Cahyadi", mappi: "12-P-03478", rmk: "RMK-2020.03466", peran: "Reviewer / Penilai", hp: "0813-1122-3344" },
  { nama: "Ardi Nurmayadi, S.T.", mappi: "17-P-07605", rmk: "RMK-2020.03523", peran: "Reviewer / Penilai", hp: "0818-9900-1122" },
  { nama: "Andri Kusmandana, S.Ak.", mappi: "12-P-03607", rmk: "RMK-2017.01889", peran: "Reviewer / Penilai", hp: "0817-2233-4455" },
  { nama: "Wawan Kurniawan", mappi: "11-P-03096", rmk: "RMK-2020.03293", peran: "Reviewer / Penilai", hp: "0814-6677-8899" },
  { nama: "Yasir Rizal, A.Md.", mappi: "17-P-08043", rmk: "-", peran: "Asisten Penilai", hp: "0853-8899-0011" },
  { nama: "Fadri Nurdin", mappi: "14-A-05096", rmk: "-", peran: "Asisten Penilai", hp: "0852-7788-9900" },
  { nama: "M. Syahrul Rully", mappi: "14-A-05100", rmk: "-", peran: "Asisten Penilai", hp: "0857-9900-1122" },
  { nama: "Uci Sanusi", mappi: "14-A-05076", rmk: "-", peran: "Asisten Penilai", hp: "0859-1122-3344" }
];

/**
 * Dual-Key Payload Mapping Helper
 * Mengambil nilai dari key utama atau key sekunder (camelCase / snake_case / PascalCase) dengan fallback default
 */
function pick(k1, k2, def) {
  if (k1 !== undefined && k1 !== null && k1 !== '') return k1;
  if (k2 !== undefined && k2 !== null && k2 !== '') return k2;
  return def !== undefined ? def : '';
}

/**
 * Membaca Master Personil resmi dari sheet Master_Personil
 */
function bacaMasterPersonil(ss) {
  let sheet = ss.getSheetByName(CONFIG.SHEET_PERSONIL);
  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.SHEET_PERSONIL);
    sheet.appendRow(['Kategori', 'Nama', 'Jabatan', 'Klasifikasi', 'MAPPI', 'Izin_Publik', 'RMK', 'BPN', 'OJK', 'Peran', 'HP']);
    sheet.getRange(1, 1, 1, 11).setFontWeight('bold').setBackground('#1e293b').setFontColor('#ffffff');
    sheet.setFrozenRows(1);
    
    MASTER_REKAN_DEFAULT.forEach(r => {
      sheet.appendRow(['REKAN', r.nama, r.jabatan, r.klasifikasi, r.mappi, r.izin, r.rmk, r.bpn, r.ojk, 'Penandatangan Laporan', '-']);
    });
    MASTER_TENAGA_AHLI_DEFAULT.forEach(p => {
      sheet.appendRow(['TENAGA_AHLI', p.nama, '-', '-', p.mappi, '-', p.rmk, '-', '-', p.peran, p.hp]);
    });
    return {
      rekan: MASTER_REKAN_DEFAULT,
      personil: MASTER_TENAGA_AHLI_DEFAULT
    };
  }

  const numRows = sheet.getLastRow();
  if (numRows < 2) {
    return {
      rekan: MASTER_REKAN_DEFAULT,
      personil: MASTER_TENAGA_AHLI_DEFAULT
    };
  }

  const values = sheet.getRange(2, 1, numRows - 1, Math.max(11, sheet.getLastColumn())).getValues();
  const rekanList = [];
  const personilList = [];

  for (let i = 0; i < values.length; i++) {
    const row = values[i];
    const kat = String(row[0] || '').trim().toUpperCase();
    const nama = String(row[1] || '').trim();
    if (!nama) continue;

    if (kat === 'REKAN') {
      rekanList.push({
        nama: nama,
        jabatan: String(row[2] || 'Rekan'),
        klasifikasi: String(row[3] || 'Penilai Properti'),
        mappi: String(row[4] || '-'),
        izin: String(row[5] || '-'),
        rmk: String(row[6] || '-'),
        bpn: String(row[7] || '-'),
        ojk: String(row[8] || '-')
      });
    } else {
      personilList.push({
        nama: nama,
        mappi: String(row[4] || '-'),
        rmk: String(row[6] || '-'),
        peran: String(row[9] || 'Reviewer / Penilai'),
        hp: String(row[10] || '-')
      });
    }
  }

  return {
    rekan: rekanList.length > 0 ? rekanList : MASTER_REKAN_DEFAULT,
    personil: personilList.length > 0 ? personilList : MASTER_TENAGA_AHLI_DEFAULT
  };
}

// -----------------------------------------------------------------------------------------
// 2. ENTRY POINT HTTP GET: doGet(e) DENGAN CacheService & 44-KOLOM MAPPING
// -----------------------------------------------------------------------------------------
function doGet(e) {
  try {
    const params = (e && e.parameter) || {};

    // Routing khusus modul Buku Agenda Surat Umum (SU) via GET
    if (params.action === 'GET_SURAT_UMUM_LIST') {
      const ss = getMasterSpreadsheet();
      const targetYear = parseInt(params.target_year || params.targetYear, 10) || new Date().getFullYear() || 2026;
      const resSU = bacaDaftarSuratUmum(ss, targetYear);
      return respondJSON(resSU);
    }

    const forceRefresh = params.refresh === 'true';

    const cache = CacheService.getScriptCache();
    const cacheKey = 'DB_PENUGASAN_JO_NSR_CACHE';
    let cachedPayload = null;

    if (!forceRefresh) {
      const cached = cache.get(cacheKey);
      if (cached) {
        try {
          cachedPayload = JSON.parse(cached);
        } catch (cErr) {
          cachedPayload = null;
        }
      }
    }

    if (cachedPayload) {
      return respondJSON(cachedPayload);
    }

    const ss = getMasterSpreadsheet();
    
    // Jika forceRefresh aktif, sinkronkan counter ke data riil Data_Penugasan
    if (forceRefresh) {
      try {
        rekalkulasiCounterMax(ss, 2026);
      } catch (rErr) {
        console.warn('Gagal rekalkulasiCounterMax di doGet:', rErr);
      }
    }

    // 1. Baca Counter dari Config_Counter
    const counterData = bacaConfigCounter(ss);

    // 2. Baca Submissions dari Data_Penugasan
    const sheetData = ss.getSheetByName(CONFIG.SHEET_DATA) || ss.getSheetByName('Database_Penugasan') || buatSheetDatabase(ss);
    const submissions = [];

    if (sheetData && sheetData.getLastRow() > 1) {
      const numRows = sheetData.getLastRow() - 1;
      const numCols = sheetData.getLastColumn();
      const rows = sheetData.getRange(2, 1, numRows, numCols).getValues();
      const headers = sheetData.getRange(1, 1, 1, numCols).getValues()[0];

      for (let i = 0; i < rows.length; i++) {
        const item = {};
        for (let j = 0; j < headers.length; j++) {
          const colName = String(headers[j]).trim();
          item[colName] = rows[i][j];
        }
        submissions.push(item);
      }
    }

    const responsePayload = {
      status: 'success',
      success: true,
      counter: counterData,
      submissions: submissions,
      masterPersonil: bacaMasterPersonil(ss),
      totalCount: submissions.length,
      timestamp: new Date().toISOString()
    };

    // Simpan ke CacheService
    try {
      cache.put(cacheKey, JSON.stringify(responsePayload), CONFIG.CACHE_TTL_SECONDS);
    } catch (cErr) {
      console.warn('Gagal menyimpan cache:', cErr);
    }

    return respondJSON(responsePayload);

  } catch (error) {
    console.error('Fatal Error di doGet:', error);
    return respondJSON({
      status: 'error',
      success: false,
      error: 'Gagal memuat data penugasan: ' + error.toString()
    }, 500);
  }
}

// -----------------------------------------------------------------------------------------
// 3. ENTRY POINT HTTP POST: doPost(e) DENGAN LockService & RBAC
// -----------------------------------------------------------------------------------------
function doPost(e) {
  const lock = LockService.getScriptLock();
  
  try {
    // 1. Concurrency guard LockService hingga 30 detik sebelum transaksi data dieksekusi
    try {
      lock.waitLock(30000);
    } catch (lockErr) {
      return respondJSON({
        status: 'error',
        success: false,
        code: 'SERVER_BUSY',
        error: 'Server sedang sibuk memproses transaksi penomoran lain. Silakan coba kembali beberapa saat lagi.'
      }, 503);
    }

    // 2. Parse payload request
    let payload = {};
    if (e && e.postData && e.postData.contents) {
      try {
        payload = JSON.parse(e.postData.contents);
      } catch (err) {
        payload = (e && e.parameter) || {};
      }
    } else {
      payload = (e && e.parameter) || {};
    }

    const action = payload.action || 'CREATE_SUBMISSION';
    const clientToken = (payload.token || '').trim().toUpperCase();

    // 3. Verifikasi Token & RBAC
    const authResult = verifikasiAksesToken(clientToken);
    if (!authResult.valid) {
      return respondJSON({
        status: 'error',
        success: false,
        error: 'Otorisasi Ditolak: Token tidak terdaftar atau tidak memiliki hak akses.'
      }, 401);
    }

    const ss = getMasterSpreadsheet();
    let result = {};

    // 4. Routing Action
    switch (action) {
      case 'CREATE_SUBMISSION':
      case 'CREATE':
        if (authResult.role === 'PENILAI' || authResult.role === 'REVIEWER') {
          return respondJSON({
            status: 'error',
            success: false,
            error: 'Otorisasi Ditolak: Akun Penilai dan Reviewer tidak memiliki hak akses pengajuan Job Order baru di server Pusat.'
          }, 403);
        }
        result = prosesPengajuanBaru(ss, payload.data, authResult);
        break;

      case 'APPROVE_SUBMISSION':
      case 'APPROVE':
        if (authResult.role !== 'ADMIN_PUSAT') {
          return respondJSON({
            status: 'error',
            success: false,
            error: 'Otorisasi Ditolak: Hanya Akun Admin Pusat yang berhak menerbitkan nomor resmi dan melakukan approval di server Pusat.'
          }, 403);
        }
        result = prosesApprovalPusat(ss, payload.projectId || (payload.data && payload.data.ID_Penugasan), payload.data, authResult);
        break;

      case 'UPDATE_SUBMISSION':
      case 'UPDATE':
        result = prosesUpdateData(ss, payload.projectId, payload.data, authResult);
        break;

      case 'GENERATE_DOCUMENTS':
        result = prosesGenerateDokumenDrive(payload.projectId, payload.docTypes);
        break;

      case 'GET_DATA':
      case 'SYNC':
        result = {
          status: 'success',
          success: true,
          counter: bacaConfigCounter(ss),
          submissions: bacaSemuaSubmissions(ss),
          masterPersonil: bacaMasterPersonil(ss)
        };
        break;

      case 'GET_MASTER':
      case 'MASTER_PERSONIL':
        result = {
          status: 'success',
          success: true,
          masterPersonil: bacaMasterPersonil(ss)
        };
        break;

      case 'GET_SURAT_UMUM_LIST':
        if (authResult.role !== 'ADMIN_PUSAT') {
          return respondJSON({
            status: 'error',
            success: false,
            code: 'FORBIDDEN',
            error: 'Otorisasi Ditolak: Modul Buku Agenda Surat Umum hanya dapat diakses oleh Admin Kantor Pusat Jakarta.'
          }, 403);
        }
        result = bacaDaftarSuratUmum(ss, parseInt(payload.target_year || payload.targetYear, 10) || new Date().getFullYear() || 2026);
        break;

      case 'CREATE_SURAT_UMUM':
        if (authResult.role !== 'ADMIN_PUSAT') {
          return respondJSON({
            status: 'error',
            success: false,
            code: 'FORBIDDEN',
            error: 'Otorisasi Ditolak: Hanya Admin Kantor Pusat Jakarta yang berhak meregistrasi nomor Surat Umum di server Pusat.'
          }, 403);
        }
        result = prosesBuatSuratUmum(ss, payload.data || payload, authResult);
        break;

      case 'UPLOAD_ARSIP_SURAT_UMUM':
        if (authResult.role !== 'ADMIN_PUSAT') {
          return respondJSON({
            status: 'error',
            success: false,
            code: 'FORBIDDEN',
            error: 'Otorisasi Ditolak: Hanya Admin Kantor Pusat Jakarta yang berhak mengunggah berkas arsip Surat Umum.'
          }, 403);
        }
        result = prosesUploadArsipSuratUmum(ss, payload);
        break;

      default:
        result = { status: 'error', success: false, error: 'Aksi (' + action + ') tidak dikenali oleh sistem.' };
    }

    // Invalidate Cache setelah mutasi data
    try {
      const cache = CacheService.getScriptCache();
      cache.remove('DB_PENUGASAN_JO_NSR_CACHE');
    } catch (cErr) {
      console.warn('Gagal membersihkan cache:', cErr);
    }

    return respondJSON(result);

  } catch (error) {
    console.error('Fatal Error di doPost:', error);
    return respondJSON({
      status: 'error',
      success: false,
      error: 'Terjadi kesalahan sistem internal: ' + error.toString()
    }, 500);

  } finally {
    try {
      SpreadsheetApp.flush();
    } catch (fErr) {
      console.warn('Gagal SpreadsheetApp.flush():', fErr);
    }
    try {
      lock.releaseLock();
    } catch (lErr) {
      console.warn('Gagal lock.releaseLock():', lErr);
    }
  }
}

// -----------------------------------------------------------------------------------------
// 4. LOGIKA INTI PENOMORAN OTOMATIS & APPROVAL (LockService Protected)
// -----------------------------------------------------------------------------------------

/**
 * Ekstraksi angka urut bersih dari string nomor surat atau ID
 */
function extractSeq(val) {
  if (!val) return 0;
  const s = String(val).trim();
  if (s.indexOf('MENUNGGU') !== -1 || s.indexOf('REQ') !== -1 || s.indexOf('BEBAS') !== -1 || s.indexOf('AUTO') !== -1) return 0;
  if (s.indexOf('/') !== -1) {
    const seg = s.split('/')[0].replace(/\D/g, '');
    const n = parseInt(seg, 10);
    return (!isNaN(n) && n < 100000) ? n : 0;
  }
  if (s.indexOf('-') !== -1) {
    const parts = s.split('-');
    const lastSeg = parts[parts.length - 1].replace(/\D/g, '');
    const n = parseInt(lastSeg, 10);
    return (!isNaN(n) && n < 100000) ? n : 0;
  }
  const n = parseInt(s.replace(/\D/g, ''), 10);
  return (!isNaN(n) && n < 100000) ? n : 0;
}

/**
 * Memeriksa duplikasi nomor urut 4 digit atau string nomor lengkap di sheet Data_Penugasan
 */
function cekDuplikasiBackend(sheetData, noLp, noAdm, currentProjectId, targetYear) {
  if (!sheetData || sheetData.getLastRow() < 2) return null;

  const strLp = String(noLp || '').trim().toUpperCase();
  const strAdm = String(noAdm || '').trim().toUpperCase();

  if (strLp.indexOf('MENUNGGU') !== -1 && strAdm.indexOf('MENUNGGU') !== -1) return null;

  const seqLp = extractSeq(strLp);
  const seqAdm = extractSeq(strAdm);

  const numRows = sheetData.getLastRow() - 1;
  const numCols = sheetData.getLastColumn();
  const headers = sheetData.getRange(1, 1, 1, numCols).getValues()[0].map(h => String(h).trim());

  const idxId = headers.indexOf('ID_Penugasan') !== -1 ? headers.indexOf('ID_Penugasan') : 0;
  const idxStatus = headers.indexOf('Status_Approval') !== -1 ? headers.indexOf('Status_Approval') : 2;
  const idxMode = headers.indexOf('Mode_Pengaju') !== -1 ? headers.indexOf('Mode_Pengaju') : 4;
  const idxAdm = headers.indexOf('No_Adm_JO') !== -1 ? headers.indexOf('No_Adm_JO') : 5;
  const idxLp = headers.indexOf('No_Lingkup_Penugasan') !== -1 ? headers.indexOf('No_Lingkup_Penugasan') : 6;
  const idxDebitur = headers.indexOf('Nama_Debitur_Utama') !== -1 ? headers.indexOf('Nama_Debitur_Utama') : 28;
  const idxTgl = headers.indexOf('Tgl_Dibuat') !== -1 ? headers.indexOf('Tgl_Dibuat') : 8;
  const idxTs = headers.indexOf('Timestamp_Input') !== -1 ? headers.indexOf('Timestamp_Input') : 1;

  const data = sheetData.getRange(2, 1, numRows, numCols).getValues();

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const rowId = String(row[idxId] || '').trim();
    if (currentProjectId && rowId === String(currentProjectId).trim()) {
      continue;
    }

    const rowStatus = String(row[idxStatus] || '').trim().toUpperCase();
    const rowMode = String(row[idxMode] || '').trim().toUpperCase();
    if (rowStatus !== 'APPROVED' && rowMode !== 'PUSAT') {
      continue;
    }

    const rowAdm = String(row[idxAdm] || '').trim().toUpperCase();
    const rowLp = String(row[idxLp] || '').trim().toUpperCase();
    const rowDebitur = String(row[idxDebitur] || 'Debitur Terdaftar').trim();
    const rowTgl = new Date(row[idxTgl] || row[idxTs] || new Date());
    const rowYear = rowTgl.getFullYear() || 2026;

    if (targetYear && rowYear !== targetYear) {
      continue;
    }

    // 1. Cek Exact String Match
    if (strLp && rowLp && strLp === rowLp) {
      return {
        field: 'Nomor Lingkup Penugasan',
        debitur: rowDebitur,
        existingNumber: rowLp
      };
    }
    if (strAdm && rowAdm && strAdm === rowAdm) {
      return {
        field: 'Nomor Adm JO',
        debitur: rowDebitur,
        existingNumber: rowAdm
      };
    }

    // 2. Cek Buku Nomor Gabungan (4 digit urut sama di alur Pusat / nomor resmi untuk APP & RTL)
    const rowSeqLp = extractSeq(rowLp);
    const rowSeqAdm = extractSeq(rowAdm);

    if (seqLp > 0 && rowSeqLp > 0 && seqLp === rowSeqLp) {
      return {
        field: 'Nomor Lingkup Penugasan [Nomor Urut ' + String(seqLp).padStart(4, '0') + ']',
        debitur: rowDebitur,
        existingNumber: rowLp
      };
    }
    if (seqAdm > 0 && rowSeqAdm > 0 && seqAdm === rowSeqAdm) {
      return {
        field: 'Nomor Adm JO [Nomor Urut ' + String(seqAdm).padStart(4, '0') + ']',
        debitur: rowDebitur,
        existingNumber: rowAdm
      };
    }
  }

  return null;
}

/**
 * Menghitung ulang (re-kalkulasi) nilai sequence maksimum aktual dari seluruh
 * penugasan aktif di sheet Data_Penugasan untuk tahun berjalan (targetYear)
 * dan memperbarui parameter di Config_Counter.
 * Mencegah bug lompatan permanen counter akibat typo atau penghapusan data.
 */
function rekalkulasiCounterMax(ss, targetYear) {
  const yr = targetYear || new Date().getFullYear() || 2026;
  const sheetData = ss.getSheetByName(CONFIG.SHEET_DATA) || ss.getSheetByName('Database_Penugasan');
  const sheetCounter = ss.getSheetByName(CONFIG.SHEET_COUNTER);
  if (!sheetData || !sheetCounter) return 415;

  let trueMax = 415; // Baseline awal resmi KJPP NSR

  if (sheetData.getLastRow() >= 2) {
    const numRows = sheetData.getLastRow() - 1;
    const numCols = sheetData.getLastColumn();
    const headers = sheetData.getRange(1, 1, 1, numCols).getValues()[0].map(h => String(h).trim());

    const idxId = headers.indexOf('ID_Penugasan') !== -1 ? headers.indexOf('ID_Penugasan') : 0;
    const idxStatus = headers.indexOf('Status_Approval') !== -1 ? headers.indexOf('Status_Approval') : 2;
    const idxMode = headers.indexOf('Mode_Pengaju') !== -1 ? headers.indexOf('Mode_Pengaju') : 4;
    const idxAdm = headers.indexOf('No_Adm_JO') !== -1 ? headers.indexOf('No_Adm_JO') : 5;
    const idxLp = headers.indexOf('No_Lingkup_Penugasan') !== -1 ? headers.indexOf('No_Lingkup_Penugasan') : 6;
    const idxTgl = headers.indexOf('Tgl_Dibuat') !== -1 ? headers.indexOf('Tgl_Dibuat') : 8;
    const idxTs = headers.indexOf('Timestamp_Input') !== -1 ? headers.indexOf('Timestamp_Input') : 1;

    const data = sheetData.getRange(2, 1, numRows, numCols).getValues();

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowStatus = String(row[idxStatus] || '').trim().toUpperCase();
      const rowMode = String(row[idxMode] || '').trim().toUpperCase();
      
      // Hanya hitung baris yang APPROVED atau penugasan langsung PUSAT
      if (rowStatus !== 'APPROVED' && rowMode !== 'PUSAT') continue;

      const rowTgl = new Date(row[idxTgl] || row[idxTs] || new Date());
      const rowYear = rowTgl.getFullYear() || yr;
      if (rowYear !== yr) continue;

      const seqAdm = extractSeq(row[idxAdm]);
      const seqLp = extractSeq(row[idxLp]);
      const seqId = extractSeq(row[idxId]);

      if (seqAdm > trueMax && seqAdm < 50000) trueMax = seqAdm;
      if (seqLp > trueMax && seqLp < 50000) trueMax = seqLp;
      if (seqId > trueMax && seqId < 50000) trueMax = seqId;
    }
  }

  // Update Config_Counter dengan trueMax yang aktual
  const counterData = sheetCounter.getDataRange().getValues();
  let rowAdm = -1;
  let rowLp = -1;

  for (let i = 0; i < counterData.length; i++) {
    const k = String(counterData[i][0]).trim();
    if (k === 'LAST_NO_ADM_JO') rowAdm = i + 1;
    else if (k === 'LAST_NO_LP_SPK') rowLp = i + 1;
  }

  if (rowAdm !== -1) {
    sheetCounter.getRange(rowAdm, 2).setValue(trueMax);
  } else {
    sheetCounter.appendRow(['LAST_NO_ADM_JO', trueMax]);
  }

  if (rowLp !== -1) {
    sheetCounter.getRange(rowLp, 2).setValue(trueMax);
  } else {
    sheetCounter.appendRow(['LAST_NO_LP_SPK', trueMax]);
  }

  return trueMax;
}

/**
 * Memperbarui LAST_NO_LP_SPK dan LAST_NO_ADM_JO dengan nilai maksimum jika angka baru lebih besar
 */
function updateCounterMax(ss, newNumberInt) {
  if (!newNumberInt || isNaN(newNumberInt) || newNumberInt <= 0 || newNumberInt >= 50000) return;
  let sheetCounter = ss.getSheetByName(CONFIG.SHEET_COUNTER);
  if (!sheetCounter) return;

  const data = sheetCounter.getDataRange().getValues();
  let rowAdm = -1;
  let rowLp = -1;
  let currentCounter = 415;

  for (let i = 0; i < data.length; i++) {
    const k = String(data[i][0]).trim();
    if (k === 'LAST_NO_ADM_JO') {
      rowAdm = i + 1;
      currentCounter = Math.max(currentCounter, parseInt(data[i][1], 10) || 415);
    } else if (k === 'LAST_NO_LP_SPK') {
      rowLp = i + 1;
      currentCounter = Math.max(currentCounter, parseInt(data[i][1], 10) || 415);
    }
  }

  // Guard: Cegah lompatan tidak wajar (> 100) tanpa verifikasi
  if (newNumberInt > currentCounter + 100) {
    console.warn('Lompatan counter abnormal dicegah:', newNumberInt, 'vs', currentCounter);
    return;
  }

  const finalCounter = Math.max(currentCounter, newNumberInt);

  if (rowAdm !== -1) {
    sheetCounter.getRange(rowAdm, 2).setValue(finalCounter);
  }
  if (rowLp !== -1) {
    sheetCounter.getRange(rowLp, 2).setValue(finalCounter);
  }
}

/**
 * Menyimpan pengajuan baru baik dari Cabang (WAITING_APPROVAL) maupun Pusat (APPROVED Langsung)
 */
function prosesPengajuanBaru(ss, data, auth) {
  if (!data) throw new Error('Data pengajuan tidak boleh kosong.');

  const sheetData = ss.getSheetByName(CONFIG.SHEET_DATA) || ss.getSheetByName('Database_Penugasan') || buatSheetDatabase(ss);
  const now = new Date();
  const dSurat = new Date(data.Tgl_Dibuat || data.tanggal_surat || now);
  const romawi = getBulanRomawi(dSurat);
  const thn = dSurat.getFullYear();

  const isPusat = (auth.mode === 'PUSAT');
  const jenisLap = (pick(data.Jenis_Laporan, data.jenis_laporan, 'APP')).toUpperCase();
  const kodeLap = (jenisLap === 'RTL') ? 'PN-RTL' : 'PN-APP';

  let noAdm = pick(data.No_Adm_JO, data.nomor_adm, 'Menunggu Input & Otorisasi Admin Pusat');
  let noLp = pick(data.No_Lingkup_Penugasan, data.nomor_lp, 'Menunggu Input & Otorisasi Admin Pusat');
  let status = isPusat ? 'APPROVED' : 'WAITING_APPROVAL';

  // Jika input langsung oleh Admin Pusat dan nomor belum dibuat, terbitkan nomor seketika
  if (isPusat && (!noAdm || String(noAdm).indexOf('Menunggu') !== -1)) {
    const shCounter = ss.getSheetByName(CONFIG.SHEET_COUNTER);
    const counterObj = incrementAndGetCounter(shCounter, romawi, thn, jenisLap);
    noAdm = counterObj.nextNoAdm;
    noLp = counterObj.nextLp;
    status = 'APPROVED';
  }

  // PROTEKSI HARD-BLOCK: Cek Duplikasi Nomor
  if (isPusat || (noLp && String(noLp).indexOf('Menunggu') === -1)) {
    const duplikat = cekDuplikasiBackend(sheetData, noLp, noAdm, null, thn);
    if (duplikat) {
      return {
        status: 'error',
        success: false,
        code: 'DUPLICATE_NUMBER',
        message: 'Nomor registrasi tersebut sudah terdaftar di sistem. Gunakan nomor urut lain.'
      };
    }
  }

  // Auto-Advance Counter Menggunakan Math.max (Resilient Cut-off):
  // Ekstrak nomor urut integer dari input manual
  const manualNumberInt = parseInt(String(noLp || noAdm || "").split('/')[0].replace(/\D/g, ""), 10);
  if (manualNumberInt && !isNaN(manualNumberInt) && manualNumberInt > 0) {
    updateCounterMax(ss, manualNumberInt);
  }

  const nextSeqStr = (typeof noAdm === 'number') ? noAdm.toString().padStart(4, '0') : now.getTime().toString().slice(-4);
  const projectId = pick(data.ID_Penugasan, data.id, `NSR-${thn}-${nextSeqStr}`);

  // Rincian Objek JSON
  let objekJson = '[]';
  if (data.Rincian_Objek_JSON) {
    objekJson = (typeof data.Rincian_Objek_JSON === 'object') ? JSON.stringify(data.Rincian_Objek_JSON) : data.Rincian_Objek_JSON;
  } else if (data.objek_list) {
    objekJson = (typeof data.objek_list === 'object') ? JSON.stringify(data.objek_list) : data.objek_list;
  }

  // Rincian Hari Kerja "2|3|2|7"
  let rincianHari = data.Rincian_Hari_Kerja;
  if (!rincianHari) {
    const i = pick(data.SLA_Inspeksi, data.sla_inspeksi, 1);
    const a = pick(data.SLA_Analisa, data.sla_analisa, 2);
    const f = pick(data.SLA_Final, data.sla_final, 2);
    const t = pick(data.SLA_Total, data.sla_total, (i + a + f));
    rincianHari = `${i}|${a}|${f}|${t}`;
  }

  // Mapping 53 kolom persis sesuai HEADERS_DATA_PENUGASAN via pick() helper
  const rowMap = {
    'ID_Penugasan': projectId,
    'Timestamp_Input': now.toISOString(),
    'Status_Approval': status,
    'Kantor_Wilayah': pick(data.Kantor_Wilayah, data.kantor_wilayah, auth.wilayah),
    'Mode_Pengaju': auth.mode,
    'No_Adm_JO': noAdm,
    'No_Lingkup_Penugasan': noLp,
    'Jenis_Laporan': jenisLap || (kodeLap === 'PN-RTL' ? 'RTL' : 'APP'),
    'Tgl_Dibuat': pick(data.Tgl_Dibuat, data.tanggal_surat, now.toISOString().split('T')[0]),
    'No_Surat_Klien': pick(data.No_Surat_Klien, data.rujukan_surat_nomor, '-'),
    'Tgl_Surat_Klien': pick(data.Tgl_Surat_Klien, data.rujukan_surat_tanggal, now.toISOString().split('T')[0]),
    'Masa_Berlaku_LP': pick(data.Masa_Berlaku_LP, data.masa_berlaku_lp, hitungMasaBerlaku(pick(data.Tgl_Dibuat, data.tanggal_surat, now))),
    'Rekan_Penilai_Publik': pick(data.Rekan_Penilai_Publik, data.rekan_nama, 'Deni Siswandi, S.T., MAPPI (Cert.)'),
    'No_Izin_Publik_Rekan': pick(data.No_Izin_Publik_Rekan, data.rekan_izin, 'P-1.20.00581'),
    'Reviewer': pick(data.Reviewer, data.reviewer_nama, 'Danny Taufik Hidayat, S.H.'),
    'Penilai': pick(data.Penilai, data.penilai_nama, 'Tedi Setiadi, S.T.'),
    'Asisten_Surveyor': pick(data.Asisten_Surveyor, data.asisten_nama, 'Fadri Nurdin'),
    'Surveyor_Pendamping_HP': pick(data.Surveyor_Pendamping_HP, `${data.asisten_nama || 'Fadri Nurdin'} / ${data.debitur_cp || '-'}`, '-'),
    'Nama_Pemberi_Tugas': pick(data.Nama_Pemberi_Tugas, data.pemberi_tugas_nama, ''),
    'Bidang_Usaha_Klien': pick(data.Bidang_Usaha_Klien, data.bidang_usaha_klien, 'Perbankan'),
    'NPWP_Klien': pick(data.NPWP_Klien, data.pemberi_tugas_npwp, ''),
    'PIC_Klien': pick(data.PIC_Klien, data.pemberi_tugas_pic, ''),
    'Jabatan_PIC': pick(data.Jabatan_PIC, data.pemberi_tugas_jabatan, ''),
    'Telp_PIC': pick(data.Telp_PIC, data.pemberi_tugas_kontak, ''),
    'Email_PIC': pick(data.Email_PIC, data.pemberi_tugas_email, ''),
    'Alamat_Pemberi_Tugas': pick(data.Alamat_Pemberi_Tugas, data.pemberi_tugas_alamat, ''),
    'Pengguna_Laporan_A': pick(data.Pengguna_Laporan_A, data.pengguna_laporan_a, pick(data.Nama_Pemberi_Tugas, data.pemberi_tugas_nama, '')),
    'Pengguna_Laporan_B': pick(data.Pengguna_Laporan_B, data.pengguna_laporan_b, '-'),
    'Nama_Debitur_Utama': String(pick(data.Nama_Debitur_Utama, data.debitur_nama, '')).toUpperCase(),
    'Nama_Pemilik_Sertipikat': pick(data.Nama_Pemilik_Sertipikat, data.pemilik_sertipikat, pick(data.Nama_Debitur_Utama, data.debitur_nama, '')),
    'Hubungan_Pemilik_Sertipikat': pick(data.Hubungan_Pemilik_Sertipikat, data.hubungan_pemilik, 'Milik Sendiri'),
    'Rincian_Objek_JSON': objekJson,
    'Tujuan_Penilaian': pick(data.Tujuan_Penilaian, data.tujuan_penilaian, 'Penjaminan Utang / Agunan Kredit'),
    'Dasar_Nilai': pick(data.Dasar_Nilai, data.dasar_nilai, 'Nilai Pasar (SPI 101) & Indikasi Nilai Likuidasi (SPI 202)'),
    'Pendekatan_Penilaian': pick(data.Pendekatan_Penilaian, data.pendekatan_penilaian, 'Pendekatan Pasar dan Pendekatan Biaya'),
    'Mata_Uang': pick(data.Mata_Uang, data.mata_uang, 'Rupiah (IDR)'),
    'Tgl_Penilaian': pick(data.Tgl_Penilaian, data.tanggal_penilaian, pick(data.Tgl_Dibuat, data.tanggal_surat, now.toISOString().split('T')[0])),
    'Tgl_Survey': pick(data.Tgl_Survey, data.survey_tanggal, now.toISOString().split('T')[0]),
    'Survey_Hari': pick(data.Survey_Hari, data.survey_hari, 'Kamis'),
    'SLA_Inspeksi': Number(pick(data.SLA_Inspeksi, data.sla_inspeksi, 1)),
    'SLA_Analisa': Number(pick(data.SLA_Analisa, data.sla_analisa, 2)),
    'SLA_Final': Number(pick(data.SLA_Final, data.sla_final, 2)),
    'SLA_Total': Number(pick(data.SLA_Total, data.sla_total, 5)),
    'Marketing_Sumber_Proyek': pick(data.Marketing_Sumber_Proyek, data.marketing_nama, 'Divisi Marketing'),
    'Biaya_Net_DPP': Number(pick(data.Biaya_Net_DPP, data.biaya_dpp, 0)),
    'PPN_11_Persen': Number(pick(data.PPN_11_Persen, data.biaya_ppn, 0)),
    'Total_Biaya_All_In': Number(pick(data.Total_Biaya_All_In, data.biaya_total, 0)),
    'Terbilang_Biaya': pick(data.Terbilang_Biaya, data.terbilang, angkaTerbilang(pick(data.Total_Biaya_All_In, data.biaya_total, 0))),
    'Cara_Pembayaran': pick(data.Cara_Pembayaran, data.cara_pembayaran, 'Pembayaran dilakukan 100% setelah Lingkup Penugasan (SPK) ditandatangani para pihak.'),
    'Rekening_Resmi': pick(data.Rekening_Resmi, data.rekening_resmi, 'Bank Mandiri Cab. Jakarta Ampera Raya No. Rek. 127-00-1014166-9 an KJPP NANANG RAHAYU SIGIT PARYANTO DAN REKAN'),
    'Tgl_Approval_Pusat': isPusat ? now.toISOString() : '-',
    'Disetujui_Oleh': isPusat ? `Admin Pusat (${auth.token})` : '-',
    'Folder_Drive_URL': pick(data.Folder_Drive_URL, data.folder_drive_url, '-')
  };

  const rowValues = HEADERS_DATA_PENUGASAN.map(h => rowMap[h] !== undefined ? rowMap[h] : '');
  sheetData.appendRow(rowValues);

  // Perbarui counter jika ada nomor urut baru yang lebih tinggi
  const usedSeq = extractSeq(noAdm) || extractSeq(noLp);
  if (usedSeq > 0) {
    updateCounterMax(ss, usedSeq);
  }

  // Catat Log Aktivitas
  catatLogAktivitas(ss, projectId, isPusat ? 'DIRECT_APPROVAL_PUSAT' : 'SUBMIT_CABANG', auth.token, `Debitur: ${rowMap['Nama_Debitur_Utama']}`);

  return {
    status: 'success',
    success: true,
    projectId: projectId,
    Status_Approval: status,
    No_Adm_JO: noAdm,
    No_Lingkup_Penugasan: noLp,
    message: isPusat ? 'Pengajuan berhasil disimpan dan nomor resmi telah diterbitkan.' : 'Pengajuan berhasil dikirim ke antrean Kantor Pusat.'
  };
}

/**
 * Melakukan approval dari Admin Pusat untuk pengajuan Cabang
 */
function prosesApprovalPusat(ss, projectId, incomingData, auth) {
  if (!projectId) throw new Error('Project ID wajib disertakan untuk approval.');

  const sheetData = ss.getSheetByName(CONFIG.SHEET_DATA) || ss.getSheetByName('Database_Penugasan');
  if (!sheetData) throw new Error('Sheet database tidak ditemukan.');

  const data = sheetData.getDataRange().getValues();
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

  const dSurat = new Date(targetRow[7] || new Date());
  const romawi = getBulanRomawi(dSurat);
  const thn = dSurat.getFullYear();

  let noAdm = incomingData && (incomingData.No_Adm_JO || incomingData.nomor_adm);
  let noLp = incomingData && (incomingData.No_Lingkup_Penugasan || incomingData.nomor_lp);
  const jenisLap = incomingData && (incomingData.Jenis_Laporan || incomingData.jenis_laporan);
  const kodeLap = (jenisLap === 'RTL' || (noLp && String(noLp).indexOf('PN-RTL') !== -1)) ? 'PN-RTL' : 'PN-APP';

  if (!noLp || String(noLp).indexOf('Menunggu') !== -1 || !noAdm || String(noAdm).indexOf('Menunggu') !== -1) {
    const nextSeq = ambilDanKunciNomorUrut(ss, thn);
    const seqPadded = nextSeq.toString().padStart(4, '0');
    noAdm = nextSeq;
    noLp = `${seqPadded}/NSR/${kodeLap}/${romawi}/${thn}`;
  }

  // PROTEKSI HARD-BLOCK: Cek Duplikasi Nomor pada Approval
  const duplikat = cekDuplikasiBackend(sheetData, noLp, noAdm, projectId, thn);
  if (duplikat) {
    return {
      status: 'error',
      success: false,
      code: 'DUPLICATE_NUMBER',
      message: 'Nomor registrasi tersebut sudah terdaftar di sistem. Gunakan nomor urut lain.'
    };
  }

  // Auto-advance counter jika nomor manual lebih besar
  const manualNumberInt = parseInt(String(noLp || noAdm || "").split('/')[0].replace(/\D/g, ""), 10);
  if (manualNumberInt && !isNaN(manualNumberInt) && manualNumberInt > 0) {
    updateCounterMax(ss, manualNumberInt);
  }

  const nowIso = new Date().toISOString();

  // Update kolom di baris (1-indexed) secara dinamis sesuai header sheet
  const headers = sheetData.getRange(1, 1, 1, sheetData.getLastColumn()).getValues()[0].map(h => String(h).trim());
  const colStatus = headers.indexOf('Status_Approval') + 1;
  const colAdm = headers.indexOf('No_Adm_JO') + 1;
  const colLp = headers.indexOf('No_Lingkup_Penugasan') + 1;
  const colJenis = headers.indexOf('Jenis_Laporan') + 1;
  const colTglAppr = headers.indexOf('Tgl_Approval_Pusat') + 1;
  const colDisetujui = headers.indexOf('Disetujui_Oleh') + 1;

  if (colStatus > 0) sheetData.getRange(rowIndex, colStatus).setValue('APPROVED');
  if (colAdm > 0) sheetData.getRange(rowIndex, colAdm).setValue(noAdm);
  if (colLp > 0) sheetData.getRange(rowIndex, colLp).setValue(noLp);
  if (colJenis > 0 && (jenisLap || kodeLap)) sheetData.getRange(rowIndex, colJenis).setValue(jenisLap || (kodeLap === 'PN-RTL' ? 'RTL' : 'APP'));
  if (colTglAppr > 0) sheetData.getRange(rowIndex, colTglAppr).setValue(nowIso);
  if (colDisetujui > 0) sheetData.getRange(rowIndex, colDisetujui).setValue(`Admin Pusat (${auth.token})`);

  // Perbarui counter jika nomor lebih besar
  const usedSeq = extractSeq(noAdm) || extractSeq(noLp);
  if (usedSeq > 0) {
    updateCounterMax(ss, usedSeq);
  }

  catatLogAktivitas(ss, projectId, 'APPROVAL_RESMI_PUSAT', auth.token, `Nomor resmi: ${noLp} & JO: ${noAdm}`);

  return {
    status: 'success',
    success: true,
    projectId: projectId,
    Status_Approval: 'APPROVED',
    No_Adm_JO: noAdm,
    No_Lingkup_Penugasan: noLp,
    Tgl_Approval_Pusat: nowIso,
    Disetujui_Oleh: `Admin Pusat (${auth.token})`,
    message: 'Approval berhasil! Nomor resmi telah dikunci dan diterbitkan.'
  };
}

/**
 * Update data penugasan
 */
function prosesUpdateData(ss, projectId, updateData, auth) {
  if (!projectId || !updateData) throw new Error('Project ID dan data update wajib disertakan.');

  const sheetData = ss.getSheetByName(CONFIG.SHEET_DATA) || ss.getSheetByName('Database_Penugasan');
  const data = sheetData.getDataRange().getValues();
  let rowIndex = -1;

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === projectId) {
      rowIndex = i + 1;
      break;
    }
  }

  if (rowIndex === -1) throw new Error('Data penugasan ' + projectId + ' tidak ditemukan.');

  const newLp = updateData['No_Lingkup_Penugasan'] || updateData.nomor_lp;
  const newAdm = updateData['No_Adm_JO'] || updateData.nomor_adm;
  if (newLp || newAdm) {
    const tgl = updateData['Tgl_Dibuat'] || updateData.tanggal_surat || new Date();
    const thn = new Date(tgl).getFullYear() || 2026;
    const duplikat = cekDuplikasiBackend(sheetData, newLp, newAdm, projectId, thn);
    if (duplikat) {
      return {
        status: 'error',
        success: false,
        code: 'DUPLICATE_NUMBER',
        message: 'Nomor registrasi tersebut sudah terdaftar di sistem. Gunakan nomor urut lain.'
      };
    }
    const manualUpdateInt = parseInt(String(newLp || newAdm || "").split('/')[0].replace(/\D/g, ""), 10);
    if (manualUpdateInt && !isNaN(manualUpdateInt) && manualUpdateInt > 0) {
      updateCounterMax(ss, manualUpdateInt);
    }
  }

  HEADERS_DATA_PENUGASAN.forEach((header, colIdx) => {
    if (updateData[header] !== undefined) {
      sheetData.getRange(rowIndex, colIdx + 1).setValue(updateData[header]);
    }
  });

  // Rekalkulasi counter maksimum aktual untuk mencegah bug lompatan permanen
  if (newLp || newAdm) {
    const tgl = updateData['Tgl_Dibuat'] || updateData.tanggal_surat || new Date();
    const thn = new Date(tgl).getFullYear() || 2026;
    rekalkulasiCounterMax(ss, thn);
  }

  catatLogAktivitas(ss, projectId, 'UPDATE_DATA', auth.token, 'Pembaruan data penugasan');

  return { status: 'success', success: true, message: 'Data berhasil diperbarui.' };
}

/**
 * Mengambil dan menginkremen counter secara atomik dari sheet Config_Counter
 * Menghasilkan format LP dan format Adm JO yang siap digunakan
 */
function incrementAndGetCounter(shCounter, romawi, tahun, jenisLaporan) {
  if (!shCounter) return { nextAdm: 416, nextSeq: 416, nextLp: `0416/NSR/PN-APP/${romawi}/${tahun}`, nextNoAdm: `0416/JO/NSR/${romawi}/${tahun}` };

  const data = shCounter.getDataRange().getValues();
  let rowAdm = -1;
  let rowLp = -1;
  let currentCounter = 415;

  for (let i = 0; i < data.length; i++) {
    const k = String(data[i][0]).trim();
    if (k === 'LAST_NO_ADM_JO') {
      rowAdm = i + 1;
      currentCounter = Math.max(currentCounter, parseInt(data[i][1], 10) || 415);
    } else if (k === 'LAST_NO_LP_SPK') {
      rowLp = i + 1;
      currentCounter = Math.max(currentCounter, parseInt(data[i][1], 10) || 415);
    }
  }

  const nextAdm = currentCounter + 1;

  if (rowAdm !== -1) {
    shCounter.getRange(rowAdm, 2).setValue(nextAdm);
  } else {
    shCounter.appendRow(['LAST_NO_ADM_JO', nextAdm]);
  }

  if (rowLp !== -1) {
    shCounter.getRange(rowLp, 2).setValue(nextAdm);
  } else {
    shCounter.appendRow(['LAST_NO_LP_SPK', nextAdm]);
  }

  const kodeLap = (String(jenisLaporan || '').toUpperCase() === 'RTL') ? 'RTL' : 'APP';
  const seqPadded = String(nextAdm).padStart(4, "0");
  const nextLp = `${seqPadded}/NSR/PN-${kodeLap}/${romawi}/${tahun}`;
  const nextNoAdm = `${seqPadded}/JO/NSR/${romawi}/${tahun}`;

  return {
    nextAdm: nextAdm,
    nextSeq: nextAdm,
    nextLp: nextLp,
    nextNoAdm: nextNoAdm
  };
}

/**
 * Mengambil dan menginkremen nomor urut tahunan secara atomik dari Config_Counter
 */
function ambilDanKunciNomorUrut(ss, tahun, jenisLaporan, romawi) {
  let sheetCounter = ss.getSheetByName(CONFIG.SHEET_COUNTER);
  if (!sheetCounter) {
    sheetCounter = ss.insertSheet(CONFIG.SHEET_COUNTER);
    sheetCounter.appendRow(['PARAMETER_KEY', 'PARAMETER_VALUE']);
    sheetCounter.appendRow(['TAHUN_BERJALAN', tahun || 2026]);
    sheetCounter.appendRow(['LAST_NO_ADM_JO', 415]);
    sheetCounter.appendRow(['LAST_NO_LP_SPK', 415]);
    sheetCounter.appendRow(['FORMAT_SURAT_TUGAS', 'AKTIF']);
    sheetCounter.appendRow(['FORMAT_BAP_INSPEKSI', 'AKTIF']);
    sheetCounter.appendRow(['FORMAT_ETI', 'AKTIF']);
    sheetCounter.appendRow(['FORMAT_PI', 'AKTIF']);
    sheetCounter.setFrozenRows(1);
  }

  const r = romawi || getBulanRomawi(new Date());
  const res = incrementAndGetCounter(sheetCounter, r, tahun || 2026, jenisLaporan || 'APP');
  return res.nextSeq;
}

/**
 * Membaca Config_Counter
 */
function bacaConfigCounter(ss) {
  const sheetCounter = ss.getSheetByName(CONFIG.SHEET_COUNTER);
  const def = {
    TAHUN_BERJALAN: 2026,
    LAST_NO_ADM_JO: 415,
    LAST_NO_LP_SPK: 415,
    FORMAT_SURAT_TUGAS: 'AKTIF',
    FORMAT_BAP_INSPEKSI: 'AKTIF',
    FORMAT_ETI: 'AKTIF',
    FORMAT_PI: 'AKTIF'
  };

  if (!sheetCounter || sheetCounter.getLastRow() < 2) return def;

  const data = sheetCounter.getDataRange().getValues();
  for (let i = 0; i < data.length; i++) {
    const k = String(data[i][0]).trim();
    const v = data[i][1];
    if (k && v !== undefined && v !== '') {
      def[k] = (k.includes('LAST_NO') || k.includes('TAHUN')) ? (parseInt(v, 10) || v) : v;
    }
  }
  return def;
}

/**
 * Membaca semua submissions
 */
function bacaSemuaSubmissions(ss) {
  const sheetData = ss.getSheetByName(CONFIG.SHEET_DATA) || ss.getSheetByName('Database_Penugasan');
  if (!sheetData || sheetData.getLastRow() < 2) return [];

  const numCols = sheetData.getLastColumn();
  const headers = sheetData.getRange(1, 1, 1, numCols).getValues()[0].map(h => String(h).trim());
  const rows = sheetData.getRange(2, 1, sheetData.getLastRow() - 1, numCols).getValues();
  const list = [];
  for (let i = 0; i < rows.length; i++) {
    const item = {};
    for (let j = 0; j < headers.length; j++) {
      item[headers[j]] = rows[i][j];
    }
    list.push(item);
  }
  return list;
}

// -----------------------------------------------------------------------------------------
// 5. OTOMASI EKSPOR DOKUMEN GOOGLE DRIVE (DOCS & PDF)
// -----------------------------------------------------------------------------------------
function prosesGenerateDokumenDrive(projectId, docTypes) {
  const ss = getMasterSpreadsheet();
  const sheetDb = ss.getSheetByName(CONFIG.SHEET_DATA) || ss.getSheetByName('Database_Penugasan');
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
  if (p.Status_Approval !== 'APPROVED' && p.status !== 'APPROVED') {
    throw new Error('Dokumen hanya dapat diekspor resmi ke Google Drive setelah status APPROVED oleh Kantor Pusat.');
  }

  // 1. Dapatkan atau buat Folder di Google Drive
  const rootFolder = getOrCreateFolder(CONFIG.DRIVE_ROOT_FOLDER_NAME);
  const yearFolder = getOrCreateFolder(new Date().getFullYear().toString(), rootFolder);
  const branchFolder = getOrCreateFolder(p.Kantor_Wilayah || p.kantor_wilayah || 'Kantor Pusat', yearFolder);
  const projectFolder = getOrCreateFolder(`${p.Nama_Debitur_Utama || p.debitur_nama} (${p.ID_Penugasan || p.id})`, branchFolder);

  // 2. Buat Google Doc Berkas SPK & Representasi
  const docName = `Lingkup_Penugasan_SPK_${(p.Nama_Debitur_Utama || p.debitur_nama || 'PROYEK').replace(/\s+/g, '_')}`;
  const newDoc = DocumentApp.create(docName);
  const body = newDoc.getBody();

  // Susun isi dokumen di Google Docs
  body.appendParagraph("KANTOR JASA PENILAI PUBLIK").setHeading(DocumentApp.ParagraphHeading.HEADING1);
  body.appendParagraph("NANANG RAHAYU SIGIT PARYANTO DAN REKAN").setHeading(DocumentApp.ParagraphHeading.HEADING2);
  body.appendParagraph("Izin Usaha Kemenkeu RI No. 2.19.0160 | KMK RI No. 248/KM.1/2019");
  body.appendHorizontalRule();

  body.appendParagraph(`LINGKUP PENUGASAN (SPK) PENILAIAN PROPERTI\nNomor: ${p.No_Lingkup_Penugasan || p.nomor_lp}`).setHeading(DocumentApp.ParagraphHeading.TITLE);
  body.appendParagraph(`Tanggal: ${p.Tgl_Dibuat || p.tanggal_surat}`);
  body.appendParagraph(`Pemberi Tugas: ${p.Nama_Pemberi_Tugas || p.pemberi_tugas_nama}`);
  body.appendParagraph(`Nama Debitur: ${p.Nama_Debitur_Utama || p.debitur_nama}`);
  body.appendParagraph(`Maksud & Tujuan: ${p.Tujuan_Penilaian || p.tujuan_penilaian}`);
  body.appendParagraph(`Dasar Nilai: ${p.Dasar_Nilai || p.dasar_nilai}`);
  body.appendParagraph(`Total Biaya Kontrak: ${formatRupiah(p.Total_Biaya_All_In || p.biaya_total)} (${p.Terbilang_Biaya || p.terbilang})`);
  body.appendParagraph(`Rekan Penanggung Jawab: ${p.Rekan_Penilai_Publik || p.rekan_nama}`);

  newDoc.saveAndClose();

  // 3. Pindahkan berkas Google Doc ke folder proyek
  const docFile = DriveApp.getFileById(newDoc.getId());
  projectFolder.addFile(docFile);
  DriveApp.getRootFolder().removeFile(docFile);

  // 4. Konversi ke PDF
  const pdfBlob = docFile.getAs(MimeType.PDF);
  const pdfFile = projectFolder.createFile(pdfBlob).setName(`${docName}.pdf`);

  return {
    status: 'success',
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
  const t = String(token).trim().toUpperCase();

  // 1. ADMIN_PUSAT
  if (CONFIG.TOKENS.ADMIN_PUSAT && CONFIG.TOKENS.ADMIN_PUSAT.includes(t)) {
    return {
      valid: true,
      role: 'ADMIN_PUSAT',
      mode: 'PUSAT',
      wilayah: 'Kantor Pusat Jakarta',
      token: t,
      canApprove: true,
      canSubmit: true,
      seeFee: true
    };
  }

  // 2. ADMIN_CABANG
  if (CONFIG.TOKENS.ADMIN_CABANG && CONFIG.TOKENS.ADMIN_CABANG[t]) {
    return {
      valid: true,
      role: 'ADMIN_CABANG',
      mode: 'CABANG',
      wilayah: CONFIG.TOKENS.ADMIN_CABANG[t],
      token: t,
      canApprove: false, // Approval Pusat hanya oleh Admin Pusat
      canSubmit: true,
      seeFee: true
    };
  }

  // 3. MARKETING
  if (CONFIG.TOKENS.MARKETING && CONFIG.TOKENS.MARKETING[t]) {
    const wil = CONFIG.TOKENS.MARKETING[t];
    return {
      valid: true,
      role: 'MARKETING',
      mode: (wil !== 'Semua Wilayah' && wil !== 'Kantor Pusat Jakarta') ? 'CABANG' : 'PUSAT',
      wilayah: wil,
      token: t,
      canApprove: false,
      canSubmit: true,
      seeFee: true
    };
  }

  // 4. REVIEWER
  if (CONFIG.TOKENS.REVIEWER && CONFIG.TOKENS.REVIEWER[t]) {
    const wil = CONFIG.TOKENS.REVIEWER[t];
    return {
      valid: true,
      role: 'REVIEWER',
      mode: (wil !== 'Semua Wilayah' && wil !== 'Kantor Pusat Jakarta') ? 'CABANG' : 'PUSAT',
      wilayah: wil,
      token: t,
      canApprove: false,
      canSubmit: false,
      seeFee: false
    };
  }

  // 5. PENILAI
  if (CONFIG.TOKENS.PENILAI && CONFIG.TOKENS.PENILAI[t]) {
    const wil = CONFIG.TOKENS.PENILAI[t];
    return {
      valid: true,
      role: 'PENILAI',
      mode: (wil !== 'Semua Wilayah' && wil !== 'Kantor Pusat Jakarta') ? 'CABANG' : 'PUSAT',
      wilayah: wil,
      token: t,
      canApprove: false,
      canSubmit: false,
      seeFee: false
    };
  }

  return { valid: false };
}

/**
 * Standarisasi pengambilan instance Master Spreadsheet DB_PENUGASAN_JO_NSR
 * Membuka langsung via CONFIG.SPREADSHEET_ID dengan fallback aman ke getActiveSpreadsheet()
 */
function getMasterSpreadsheet() {
  if (CONFIG.SPREADSHEET_ID) {
    try {
      const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
      if (ss) return ss;
    } catch (e) {
      console.warn('Gagal membuka spreadsheet via openById(' + CONFIG.SPREADSHEET_ID + '):', e);
    }
  }
  const activeSs = SpreadsheetApp.getActiveSpreadsheet();
  if (activeSs) return activeSs;
  return inisialisasiSpreadsheetBaru();
}

function inisialisasiSpreadsheetBaru() {
  if (CONFIG.SPREADSHEET_ID) {
    try {
      const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
      if (ss) {
        buatSheetDatabase(ss);
        return ss;
      }
    } catch (e) {
      console.warn('Fallback inisialisasiSpreadsheetBaru openById gagal:', e);
    }
  }
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (ss) {
    buatSheetDatabase(ss);
    return ss;
  }
  throw new Error('Spreadsheet master tidak ditemukan. Pastikan script ini memiliki izin akses ke Spreadsheet ID: ' + CONFIG.SPREADSHEET_ID);
}

function buatSheetDatabase(ss) {
  let sheet = ss.getSheetByName(CONFIG.SHEET_DATA);
  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.SHEET_DATA);
    sheet.appendRow(HEADERS_DATA_PENUGASAN);
    sheet.getRange(1, 1, 1, HEADERS_DATA_PENUGASAN.length)
      .setFontWeight('bold')
      .setBackground('#1e293b')
      .setFontColor('#ffffff');
    sheet.setFrozenRows(1);
  } else {
    // Sinkronisasi header row jika kolom kurang dari 53 kolom resmi
    const curCols = sheet.getLastColumn();
    if (curCols < HEADERS_DATA_PENUGASAN.length) {
      sheet.getRange(1, 1, 1, HEADERS_DATA_PENUGASAN.length).setValues([HEADERS_DATA_PENUGASAN]);
      sheet.getRange(1, 1, 1, HEADERS_DATA_PENUGASAN.length)
        .setFontWeight('bold')
        .setBackground('#1e293b')
        .setFontColor('#ffffff');
    }
  }
  return sheet;
}

/**
 * Standarisasi Penulisan Formula Google Spreadsheet (Notasi Koma US)
 * Memastikan setiap penulisan formula di sheet menggunakan notasi koma ',' (bukan ';')
 * pada metode .setFormula(...) untuk mencegah error formula Google Sheets (#ERROR!).
 */
function applySheetFormula(range, formulaString) {
  if (!range || !formulaString) return;
  // Pastikan titik koma di luar tanda kutip string literal diubah menjadi koma
  const sanitizedFormula = formulaString.replace(/;(?=(?:[^"]*"[^"]*")*[^"]*$)/g, ',');
  range.setFormula(sanitizedFormula);
}

function catatLogAktivitas(ss, idProyek, tipeAksi, token, keterangan) {
  let sheet = ss.getSheetByName(CONFIG.SHEET_LOG);
  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.SHEET_LOG);
    sheet.appendRow(['Timestamp', 'ID_Penugasan', 'Tipe_Aksi', 'Token_Aktor', 'Keterangan']);
    sheet.getRange(1, 1, 1, 5).setFontWeight('bold').setBackground('#0f172a').setFontColor('#ffffff');
  }
  sheet.appendRow([new Date().toISOString(), idProyek, tipeAksi, token, keterangan]);
}

function hitungMasaBerlaku(dateInput) {
  try {
    const d = new Date(dateInput);
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  } catch (e) {
    return '';
  }
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

// -----------------------------------------------------------------------------------------
// 7. MODUL BACKEND BUKU AGENDA SURAT UMUM (SU) - ADMIN KANTOR PUSAT
// -----------------------------------------------------------------------------------------

/**
 * Inisialisasi sheet Buku_Surat_Umum jika belum tersedia di spreadsheet master
 */
function buatSheetSuratUmum(ss) {
  const sheetName = CONFIG.SHEET_SURAT_UMUM || 'Buku_Surat_Umum';
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    sheet.appendRow(HEADERS_SURAT_UMUM);
    sheet.getRange(1, 1, 1, HEADERS_SURAT_UMUM.length)
      .setFontWeight('bold')
      .setBackground('#0f172a')
      .setFontColor('#ffffff');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function getOrCreateSheetSuratUmum(ss) {
  return buatSheetSuratUmum(ss);
}

/**
 * Membaca seluruh data Buku_Surat_Umum untuk tahun berjalan (terurut descending)
 */
function bacaDaftarSuratUmum(ss, targetYear) {
  const yr = targetYear || new Date().getFullYear() || 2026;
  const sheet = buatSheetSuratUmum(ss);
  const items = [];
  let maxSeq = 0;

  if (sheet.getLastRow() >= 2) {
    const numRows = sheet.getLastRow() - 1;
    const numCols = Math.min(sheet.getLastColumn(), HEADERS_SURAT_UMUM.length);
    const rows = sheet.getRange(2, 1, numRows, numCols).getValues();

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const noSurat = String(r[2] || '').trim();
      if (!noSurat) continue;

      const rawSeq = parseInt(r[1], 10);
      const seq = (!isNaN(rawSeq) && rawSeq > 0) ? rawSeq : extractSeq(noSurat);

      // Cek tahun dari Tanggal_Surat atau Nomor Surat
      let rowYr = yr;
      if (r[3]) {
        try {
          const dt = new Date(r[3]);
          if (!isNaN(dt.getTime())) rowYr = dt.getFullYear();
        } catch (e) {}
      } else if (noSurat.includes(String(yr))) {
        rowYr = yr;
      }

      if (rowYr === yr && seq > maxSeq && seq < 50000) {
        maxSeq = seq;
      }

      const item = {
        Timestamp: r[0] ? (typeof r[0].toISOString === 'function' ? r[0].toISOString() : String(r[0])) : '',
        No_Urut: seq,
        No_Surat: noSurat,
        Tanggal_Surat: r[3] ? (typeof r[3].toISOString === 'function' ? r[3].toISOString().split('T')[0] : String(r[3])) : '',
        Tujuan_Penerima: String(r[4] || ''),
        Perihal: String(r[5] || ''),
        Klasifikasi_Perihal: String(r[6] || 'Lain-lain'),
        Penandatangan: String(r[7] || 'Pemimpin Rekan'),
        Link_Arsip_Final: String(r[8] || ''),
        Link_File_Mentah: String(r[9] || ''),
        File_ID_Final: String(r[10] || ''),
        File_ID_Mentah: String(r[11] || ''),
        Status_Arsip: String(r[12] || 'Kosong')
      };
      items.push(item);
    }
  }

  // Urutkan data secara descending (terbaru di atas) berdasarkan No_Urut
  items.sort(function(a, b) {
    return (b.No_Urut || 0) - (a.No_Urut || 0);
  });

  const romawi = getBulanRomawi(new Date());
  const nextSeq = maxSeq + 1;
  const suggestedNomor = String(nextSeq).padStart(4, '0') + '/NSR/SU-KET/' + romawi + '/' + yr;

  return {
    status: 'success',
    success: true,
    target_year: yr,
    maxSeq: maxSeq,
    nextSeq: nextSeq,
    suggestedNomor: suggestedNomor,
    data: items,
    totalCount: items.length
  };
}

/**
 * Menyimpan registrasi Surat Umum baru ke sheet Buku_Surat_Umum dengan validasi anti-duplikasi
 */
function prosesBuatSuratUmum(ss, data, authResult) {
  if (!data) throw new Error('Data surat umum tidak boleh kosong.');

  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const sheet = buatSheetSuratUmum(ss);
    const now = new Date();
    const dSurat = new Date(data.Tanggal_Surat || data.tanggal_surat || now);
    const romawi = getBulanRomawi(dSurat);
    const thn = dSurat.getFullYear() || now.getFullYear() || 2026;

    // Baca daftar surat umum untuk tahun berjalan guna menghitung maxSeq dan verifikasi duplikasi
    const curList = bacaDaftarSuratUmum(ss, thn);
    const currentMaxSeq = curList.maxSeq || 0;

    let seq = parseInt(data.No_Urut || data.no_urut, 10);
    let noSurat = String(data.No_Surat || data.no_surat || '').trim();

    const rawKategori = String(data.Klasifikasi_Perihal || data.klasifikasi_perihal || 'SU-KET').trim();
    const defaultKode = (function(k) {
      if (!k) return 'SU-KET';
      const s = String(k).toUpperCase();
      if (s.startsWith('SU-')) {
        const m = s.match(/SU-[A-Z]+/);
        if (m) return m[0];
      }
      if (s.includes('KETERANGAN')) return 'SU-KET';
      if (s.includes('REGULATOR') || s.includes('PPPK') || s.includes('OJK')) return 'SU-REG';
      if (s.includes('MAPPI') || s.includes('ASOSIASI')) return 'SU-MAP';
      if (s.includes('MITRA') || s.includes('REKANAN') || s.includes('BANK')) return 'SU-MIT';
      if (s.includes('OPERASIONAL') || s.includes('PENGADAAN') || s.includes('ADMINISTRASI')) return 'SU-OPS';
      if (s.includes('KLARIFIKASI') || s.includes('BALASAN')) return 'SU-KLR';
      return 'SU-KET';
    })(rawKategori);

    if (!noSurat) {
      if (!seq || isNaN(seq) || seq <= 0) {
        seq = currentMaxSeq + 1;
      }
      noSurat = String(seq).padStart(4, '0') + '/NSR/' + defaultKode + '/' + romawi + '/' + thn;
    } else {
      if (!seq || isNaN(seq) || seq <= 0) {
        seq = extractSeq(noSurat) || (currentMaxSeq + 1);
      }
    }

    // VALIDASI DUPLIKASI NOMOR DAN NO_URUT DI DATABASE
    for (let i = 0; i < curList.data.length; i++) {
      const existing = curList.data[i];
      if (existing.No_Surat && existing.No_Surat.toUpperCase() === noSurat.toUpperCase()) {
        return {
          status: 'error',
          success: false,
          code: 'DUPLICATE_NUMBER',
          message: 'Nomor surat (' + noSurat + ') sudah terdaftar di database untuk perihal: ' + existing.Perihal
        };
      }
      if (existing.No_Urut === seq) {
        return {
          status: 'error',
          success: false,
          code: 'DUPLICATE_NUMBER',
          message: 'Nomor urut ' + seq + ' sudah terdaftar untuk nomor ' + existing.No_Surat + ' (Perihal: ' + existing.Perihal + ')'
        };
      }
    }

    const timestampIso = now.toISOString();
    let tglSuratStr = '';
    try {
      tglSuratStr = Utilities.formatDate(dSurat, Session.getScriptTimeZone() || 'Asia/Jakarta', 'yyyy-MM-dd');
    } catch (e) {
      tglSuratStr = dSurat.toISOString().split('T')[0];
    }

    const tujuan = String(data.Tujuan_Penerima || data.tujuan_penerima || '').trim();
    const perihal = String(data.Perihal || data.perihal || '').trim();
    const klasifikasi = defaultKode;
    const ttd = String(data.Penandatangan || data.penandatangan || 'Pemimpin Rekan').trim();

    const newRow = [
      timestampIso,
      seq,
      noSurat,
      tglSuratStr,
      tujuan,
      perihal,
      klasifikasi,
      ttd,
      '', // Link_Arsip_Final
      '', // Link_File_Mentah
      '', // File_ID_Final
      '', // File_ID_Mentah
      'Kosong' // Status_Arsip
    ];

    sheet.appendRow(newRow);

    // Catat ke Log Aktivitas
    try {
      catatLogAktivitas(ss, noSurat, 'CREATE_SURAT_UMUM', (authResult && authResult.token) || 'NSR-PST-2026', 'Registrasi Surat Umum: ' + perihal);
    } catch (logErr) {
      console.warn('Gagal catatLogAktivitas:', logErr);
    }

    const newMax = Math.max(currentMaxSeq, seq);
    const nextSeq = newMax + 1;
    const suggestedNomor = String(nextSeq).padStart(4, '0') + '/NSR/' + defaultKode + '/' + getBulanRomawi(new Date()) + '/' + thn;

    return {
      status: 'success',
      success: true,
      message: 'Nomor Surat Umum berhasil dikunci dan dicatat di Buku Agenda!',
      data: {
        Timestamp: timestampIso,
        No_Urut: seq,
        No_Surat: noSurat,
        Tanggal_Surat: tglSuratStr,
        Tujuan_Penerima: tujuan,
        Perihal: perihal,
        Klasifikasi_Perihal: klasifikasi,
        Penandatangan: ttd,
        Link_Arsip_Final: '',
        Link_File_Mentah: '',
        File_ID_Final: '',
        File_ID_Mentah: '',
        Status_Arsip: 'Kosong'
      },
      currentMaxSeq: newMax,
      maxSeq: newMax,
      nextSeq: nextSeq,
      suggestedNomor: suggestedNomor
    };
  } finally {
    try { lock.releaseLock(); } catch (e) {}
  }
}

/**
 * Mengunggah file arsip (Final PDF atau Mentah Word/Excel) ke Google Drive
 * dan memperbarui kolom terkait di sheet Buku_Surat_Umum
 */
function prosesUploadArsipSuratUmum(ss, payload) {
  if (!payload || !payload.no_surat || !payload.file_base64) {
    throw new Error('Parameter upload tidak lengkap (no_surat dan file_base64 wajib diisi).');
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const sheet = buatSheetSuratUmum(ss);
    const targetNoSurat = String(payload.no_surat).trim().toUpperCase();
    const tipeSlot = String(payload.tipe_slot || 'FINAL').trim().toUpperCase(); // 'FINAL' atau 'MENTAH'

  if (sheet.getLastRow() < 2) {
    throw new Error('Belum ada data Surat Umum yang tersimpan.');
  }

  const numRows = sheet.getLastRow() - 1;
  const numCols = Math.min(sheet.getLastColumn(), HEADERS_SURAT_UMUM.length);
  const rows = sheet.getRange(2, 1, numRows, numCols).getValues();

  let targetRowIdx = -1;
  let rowData = null;

  for (let i = 0; i < rows.length; i++) {
    const curNoSurat = String(rows[i][2] || '').trim().toUpperCase();
    if (curNoSurat === targetNoSurat) {
      targetRowIdx = i + 2; // 1-based index (header = 1)
      rowData = rows[i];
      break;
    }
  }

  if (targetRowIdx === -1 || !rowData) {
    throw new Error('Surat Umum dengan nomor (' + payload.no_surat + ') tidak ditemukan di database.');
  }

  // Tentukan tahun dan perihal untuk pembuatan direktori dan penamaan file
  let thn = 2026;
  if (rowData[3]) {
    try {
      const dt = new Date(rowData[3]);
      if (!isNaN(dt.getTime())) thn = dt.getFullYear();
    } catch (e) {}
  }
  const perihal = String(rowData[5] || 'Surat').trim();

  // 1. Dapatkan atau buat Folder di Google Drive: ARSIP_SURAT_UMUM_NSR/[TAHUN]
  const rootFolderName = CONFIG.FOLDER_SURAT_UMUM || 'ARSIP_SURAT_UMUM_NSR';
  const rootFolder = getOrCreateFolder(rootFolderName);
  const yearFolder = getOrCreateFolder(String(thn), rootFolder);

  // 2. Decode Base64 ke Blob
  let rawB64 = String(payload.file_base64);
  if (rawB64.indexOf(',') !== -1) {
    rawB64 = rawB64.split(',')[1];
  }
  const decodedBytes = Utilities.base64Decode(rawB64);

  // 3. Standarisasi Nama File
  const noSuratSanitized = String(payload.no_surat).replace(/[/\\?%*:|"<>]/g, '_');
  const perihalRingkas = perihal.substring(0, 35).replace(/[/\\?%*:|"<>]/g, '_').trim();
  const originalFileName = String(payload.file_name || '');
  let ext = '';
  if (originalFileName.lastIndexOf('.') !== -1) {
    ext = originalFileName.substring(originalFileName.lastIndexOf('.'));
  } else {
    ext = (tipeSlot === 'FINAL' || payload.mime_type === 'application/pdf') ? '.pdf' : '.docx';
  }

  const targetFileName = (tipeSlot === 'FINAL')
    ? (noSuratSanitized + '_FINAL_' + perihalRingkas + ext)
    : (noSuratSanitized + '_DRAF_' + perihalRingkas + ext);

  const mimeType = payload.mime_type || (tipeSlot === 'FINAL' ? 'application/pdf' : 'application/octet-stream');
  const blob = Utilities.newBlob(decodedBytes, mimeType, targetFileName);

  // 4. Simpan File ke Drive & Berikan Izin Akses VIEW bagi siapapun yang memiliki tautan
  const driveFile = yearFolder.createFile(blob);
  driveFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  const fileUrl = driveFile.getUrl();
  const fileId = driveFile.getId();

  // 5. Perbarui baris terkait di Sheet Buku_Surat_Umum
  let currentFinalUrl = String(rowData[8] || '');
  let currentMentahUrl = String(rowData[9] || '');

  if (tipeSlot === 'FINAL') {
    sheet.getRange(targetRowIdx, 9).setValue(fileUrl);
    sheet.getRange(targetRowIdx, 11).setValue(fileId);
    currentFinalUrl = fileUrl;
  } else {
    sheet.getRange(targetRowIdx, 10).setValue(fileUrl);
    sheet.getRange(targetRowIdx, 12).setValue(fileId);
    currentMentahUrl = fileUrl;
  }

  // Evaluasi ulang Status_Arsip
  let newStatus = 'Kosong';
  if (currentFinalUrl && currentMentahUrl) {
    newStatus = 'Lengkap';
  } else if (currentFinalUrl) {
    newStatus = 'Hanya Scan';
  } else if (currentMentahUrl) {
    newStatus = 'Hanya Draf';
  }
  sheet.getRange(targetRowIdx, 13).setValue(newStatus);

  return {
    status: 'success',
    success: true,
    message: 'Berkas arsip ' + tipeSlot + ' berhasil disimpan di Google Drive!',
    no_surat: payload.no_surat,
    tipe_slot: tipeSlot,
    file_id: fileId,
    file_url: fileUrl,
    file_name: targetFileName,
    status_arsip: newStatus
  };
  } finally {
    try { lock.releaseLock(); } catch (e) {}
  }
}

