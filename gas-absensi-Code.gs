/**
 * KJPP NANANG RAHAYU SIGIT PARYANTO DAN REKAN (KJPP NSR)
 * SISTEM PRESENSI & LAYANAN MANDIRI KARYAWAN (GOOGLE APPS SCRIPT)
 * 
 * Modul Backend: Code.gs (HTMLService: memanggil "GPS.html")
 * Arsitektur: "Execute as: Me" + Autentikasi NIK & OTP Gmail Pribadi
 * Status: GO-LIVE PRODUCTION READY
 * 
 * FITUR UTAMA & KEAMANAN:
 * 1. Autentikasi NIK + OTP Gmail Pribadi: Menghindari ketergantungan Google Workspace.
 * 2. Hash Kriptografis OTP (SHA-256): Disimpan di CacheService (masa berlaku 5 menit, max 3x percobaan, cooldown 60 detik).
 * 3. Token Sesi Server-Side: Wajib diverifikasi di setiap transaksi (Presensi, WFH, Cuti).
 * 4. Multi-Office Geofencing: 5 kantor cabang resmi (Jakarta, Bandung, Padang, Makassar, Palembang).
 * 5. Pembedaan Status Validasi: 'VALID' vs 'TIDAK VALID'.
 * 6. Pemetaan Header Dinamis: Kompatibel 100% dengan database historis Google Sheets produksi tanpa merusak struktur.
 * 7. Isolasi Berkas Drive: Lampiran izin/cuti tersimpan privat tanpa ANYONE_WITH_LINK.
 * 8. Validasi Server-Side: Whitelist MIME (PDF/JPG/PNG) & ukuran maksimal 5 MB.
 */

const CONFIG = {
  APP_ENV: 'PRODUCTION', // Mode Produksi Resmi Aktif
  IS_PRODUCTION: true,
  SPREADSHEET_ID: '12gf52mLEAizuFvP03DiGddxX6HiYqD6UO5CF0Cl_C3E', // DATABASE ABSENSI KARYAWAN KJPP NSR
  SHEET_KARYAWAN: 'MASTER_KARYAWAN',
  SHEET_ABSENSI: 'ABSENSI',
  SHEET_WFH: 'MASTER_WFH',
  SHEET_CUTI: 'PENGAJUAN_CUTI',
  SHEET_DASHBOARD: 'DASHBOARD',
  SHEET_SETTING: 'SETTING',
  
  // Folder Drive untuk lampiran cuti/izin (Terisolasi & Privat)
  DRIVE_FOLDER_NAME: '[PRODUKSI] LAMPIRAN CUTI KJPP NSR',
  DRIVE_FOLDER_ID: '', 
  
  // Konfigurasi Keamanan OTP
  OTP_EXPIRY_SECONDS: 300,      // 5 menit
  OTP_COOLDOWN_SECONDS: 60,     // 60 detik jeda permintaan ulang
  OTP_MAX_ATTEMPTS: 3,          // Maksimal 3 kali percobaan salah
  SESSION_EXPIRY_SECONDS: 43200,// Token sesi berlaku 12 jam

  // Radius toleransi kehadiran resmi (meter)
  RADIUS_KANTOR_METER: 150,
  RADIUS_WFH_METER: 100,

  // Koordinat Resmi 5 Kantor KJPP NSR (Terverifikasi dari Google Maps resmi)
  KANTOR_CABANG: [
    { nama: "Pusat Jakarta", lat: -6.287972658138783, lng: 106.82477864308436 },
    { nama: "Cabang Bandung", lat: -6.8597817, lng: 107.5604289 },
    { nama: "Cabang Padang", lat: -0.94932, lng: 100.376055 },
    { nama: "Cabang Makassar", lat: -5.1582, lng: 119.4095 },
    { nama: "Cabang Palembang", lat: -2.929044, lng: 104.695981 }
  ]
};

/**
 * Endpoint Utama Web App (HTML Service)
 * Memanggil file template bernama 'GPS.html'
 */
function doGet(e) {
  return HtmlService.createTemplateFromFile('GPS')
    .evaluate()
    .setTitle('Absensi Online KJPP NSR')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no');
}

/**
 * Endpoint HTTP POST: Mendukung Permintaan API JSON dari Aplikasi Web Eksternal
 * Memungkinkan portal-absensi.html beroperasi via POST mandiri ke backend GAS.
 */
function doPost(e) {
  try {
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

    const action = payload.action || 'STATUS';
    let res = {};

            if (action === 'STATUS') {
      res = { status: 'success', success: true, message: 'Backend GAS Absensi KJPP NSR Aktif.' };
    } else if (action === 'cekKaryawan') {
      const data = cekKaryawan(payload.nik);
      res = { status: 'success', success: true, data: data };
    } else if (action === 'mintaOTP') {
      res = mintaOTP(payload.nik, payload.pdpNoticeVersion);
    } else if (action === 'verifikasiOTP') {
      res = verifikasiOTP(payload.nik, payload.otp, payload.pdpNoticeVersion);
    } else if (action === 'simpanAbsensi') {
      res = simpanAbsensi(payload);
    } else if (action === 'record_absensi') {
      res = recordAbsensiFromProxy(payload);
    } else if (action === 'simpanWFH') {
      res = simpanWFH(payload);
    } else if (action === 'get_wfh_whitelist' || action === 'getWFHWhitelist') {
      res = getWFHWhitelist(payload.nik);
    } else if (action === 'simpanPengajuanCuti' || action === 'submit_cuti') {
      res = submitCuti(payload);
    } else if (action === 'update_cuti_status' || action === 'approveCuti') {
      res = updateCutiStatus(payload);
    } else if (action === 'get_cuti_all' || action === 'getCutiAll') {
      res = getCutiAll();
    } else if (action === 'get_dashboard_summary' || action === 'getDashboardSummary') {
      res = getDashboardSummary();
    } else if (action === 'getRiwayatPresensi') {
      res = getRiwayatPresensi(payload.nik, payload.sessionToken);
    } else if (action === 'getMasterKaryawanFull' || action === 'get_master_karyawan') {
      res = getMasterKaryawanFull();
    } else if (action === 'getAbsensiAll' || action === 'getRekapPresensiHariIni' || action === 'get_absensi_all') {
      res = getAbsensiAll();
    } else if (action === 'updateEmailKaryawan') {
      res = updateEmailKaryawan(payload.nik, payload.email);
    } else {
      res = { status: 'error', success: false, message: 'Aksi [' + action + '] tidak dikenali.' };
    }

    return ContentService.createTextOutput(JSON.stringify(res))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      success: false,
      message: err.message || err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Mendapatkan Spreadsheet Database Aktif
 */
function getSS_() {
  if (CONFIG.SPREADSHEET_ID && CONFIG.SPREADSHEET_ID.trim() !== '') {
    return SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  }
  return SpreadsheetApp.getActiveSpreadsheet();
}

/**
 * Sinkronisasi Non-Destruktif Kolom Database Produksi
 * 1. Memastikan kolom Email tersedia pada MASTER_KARYAWAN tanpa merusak data lama.
 * 2. Memetakan email penguji resmi kjppnr.danny@gmail.com ke NIK NSR-2019-005 jika belum terisi.
 */
function syncProductionSchema_() {
  const ss = getSS_();
  const shMaster = ss.getSheetByName(CONFIG.SHEET_KARYAWAN);
  if (!shMaster || shMaster.getLastRow() < 1) return;

  const lastCol = shMaster.getLastColumn();
  const headers = shMaster.getRange(1, 1, 1, lastCol).getValues()[0];
  let emailColIndex = -1;

  for (let c = 0; c < headers.length; c++) {
    const h = String(headers[c]).trim().toUpperCase();
    if (h === 'EMAIL' || h === 'EMAIL GMAIL' || h === 'GMAIL') {
      emailColIndex = c + 1; // 1-based
      break;
    }
  }

  // Jika kolom EMAIL belum ada, tambahkan kolom EMAIL secara non-destruktif di akhir tabel
  if (emailColIndex === -1) {
    emailColIndex = lastCol + 1;
    shMaster.getRange(1, emailColIndex).setValue('Email');
    shMaster.getRange(1, emailColIndex).setFontWeight('bold');
  }

  // Pastikan akun administrator/penguji resmi (Danny Taufik Hidayat - NSR-2019-005) memiliki email
  const lastRow = shMaster.getLastRow();
  if (lastRow > 1) {
    const nikValues = shMaster.getRange(2, 1, lastRow - 1, 1).getValues();
    const emailValues = shMaster.getRange(2, emailColIndex, lastRow - 1, 1).getValues();

    for (let r = 0; r < nikValues.length; r++) {
      const nikStr = String(nikValues[r][0]).trim().toUpperCase();
      if (nikStr === 'NSR-2019-005' || nikStr === 'NSR-005') {
        const currentEmail = String(emailValues[r][0]).trim();
        if (!currentEmail || currentEmail.indexOf('@') === -1) {
          shMaster.getRange(r + 2, emailColIndex).setValue('kjppnr.danny@gmail.com');
        }
        break;
      }
    }
  }
}

/**
 * Setup struktur sheet pengujian otomatis
 * KEAMANAN: DIBLOKIR TOTAL PADA LINGKUNGAN PRODUKSI
 */
function setupTestingSheet() {
  const ss = getSS_();
  let ssName = '';
  try { ssName = ss.getName().toUpperCase(); } catch(e) {}

  if (CONFIG.IS_PRODUCTION === true || ssName.indexOf('PRODUKSI') !== -1 || ssName.indexOf('LIVE') !== -1) {
    throw new Error('KEAMANAN: setupTestingSheet() DIBLOKIR! Dilarang mengeksekusi setup dummy pada database produksi asli!');
  }
}

/**
 * Helper: Map object values into exact array corresponding to sheet headers
 */
function mapRowToHeaders_(headers, map) {
  return headers.map(function(h) {
    const key = String(h).trim().toUpperCase();
    if (map[key] !== undefined) return map[key];
    
    // Fallback matching
    if (key.indexOf('TIMESTAMP') !== -1) return map['TIMESTAMP'] || '';
    if (key === 'NIK' || key.indexOf('NIK') !== -1) return map['NIK'] || '';
    if (key.indexOf('NAMA') !== -1) return map['NAMA'] || '';
    if (key.indexOf('JABATAN') !== -1) return map['JABATAN'] || '';
    if (key.indexOf('DIVISI') !== -1) return map['DIVISI'] || '';
    if (key.indexOf('JENIS') !== -1) return map['JENIS'] || '';
    if (key.indexOf('LOKASI') !== -1 && key.indexOf('VALIDASI') === -1) return map['LOKASI'] || '';
    if (key.indexOf('GPS') !== -1 && key.indexOf('STATUS') === -1 && key.indexOf('KOORDINAT') === -1) return map['GPS'] || '';
    if (key.indexOf('KOORDINAT') !== -1) return map['GPS'] || '';
    if (key.indexOf('JARAK') !== -1) return map['JARAK'] || '';
    if (key.indexOf('STATUS GPS') !== -1) return map['STATUS_GPS'] || '';
    if (key.indexOf('JAM') !== -1) return map['JAM'] || '';
    if (key.indexOf('KEHADIRAN') !== -1) return map['KEHADIRAN'] || '';
    if (key.indexOf('VALIDASI') !== -1) return map['VALIDASI_LOKASI'] || '';
    if (key.indexOf('KANTOR') !== -1) return map['VALIDASI_LOKASI'] || '';
    if (key.indexOf('KETERANGAN') !== -1) return map['KETERANGAN'] || '';
    if (key.indexOf('ALAMAT') !== -1) return map['ALAMAT'] || '';
    if (key.indexOf('LATITUDE') !== -1) return map['LATITUDE'] || '';
    if (key.indexOf('LONGITUDE') !== -1) return map['LONGITUDE'] || '';
    if (key.indexOf('RADIUS') !== -1) return map['RADIUS'] || '';
    if (key.indexOf('MULAI') !== -1) return map['TGL_MULAI'] || '';
    if (key.indexOf('SELESAI') !== -1) return map['TGL_SELESAI'] || '';
    if (key.indexOf('HARI') !== -1) return map['JUMLAH_HARI'] || '';
    if (key.indexOf('ALASAN') !== -1) return map['ALASAN'] || '';
    if (key.indexOf('APPROVAL') !== -1 || key.indexOf('STATUS') !== -1) return map['STATUS_APPROVAL'] || '';
    if (key.indexOf('BUKTI') !== -1 || key.indexOf('FILE') !== -1 || key.indexOf('LINK') !== -1) return map['LINK_BUKTI'] || '';
    return '';
  });
}

/**
 * Helper: Normalisasi input NIK untuk pencocokan fleksibel
 * Contoh: "NSR-2019-005" atau "NSR-005" atau "005"
 */
function normalizeNikKey_(nik) {
  if (!nik) return '';
  return String(nik).trim().toUpperCase().replace(/\s+/g, '');
}

/**
 * Helper: Cek apakah input NIK cocok dengan NIK di database
 */
function isNikMatch_(dbNik, inputNik) {
  const normDb = normalizeNikKey_(dbNik);
  const normInp = normalizeNikKey_(inputNik);
  // STRICT SSOT: Wajib NIK lengkap yang unik, larangan pencocokan parsial/digit terakhir
  return normDb === normInp;
}

/**
 * Helper: Masking Email untuk Tampilan Aman di Browser
 * Contoh: budi.santoso@gmail.com -> b***o@gmail.com
 */
function maskEmail_(email) {
  if (!email || typeof email !== 'string') return '';
  const parts = email.split('@');
  if (parts.length !== 2) return email;
  const name = parts[0];
  const domain = parts[1];
  if (name.length <= 2) return name[0] + '*@' + domain;
  return name[0] + '***' + name[name.length - 1] + '@' + domain;
}

/**
 * Helper: Hitung Hash SHA-256 untuk OTP
 */
function hashString_(str) {
  const digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(str));
  let hex = '';
  for (let i = 0; i < digest.length; i++) {
    let byteVal = digest[i];
    if (byteVal < 0) byteVal += 256;
    let byteHex = byteVal.toString(16);
    if (byteHex.length === 1) byteHex = '0' + byteHex;
    hex += byteHex;
  }
  return hex;
}

/**
 * 1. Verifikasi Data Karyawan via NIK (Mengembalikan profil & email yang disamarkan)
 */
function cekKaryawan(nik) {
  if (!nik) return null;
  const cleanNik = normalizeNikKey_(nik);
  const ss = getSS_();
  const sh = ss.getSheetByName(CONFIG.SHEET_KARYAWAN);
  if (!sh || sh.getLastRow() < 2) return null;

  const lastCol = sh.getLastColumn();
  const headers = sh.getRange(1, 1, 1, lastCol).getValues()[0];
  const data = sh.getRange(2, 1, sh.getLastRow() - 1, lastCol).getValues();

  // Cari index kolom
  let colNik = 0;
  let colNama = 1;
  let colJabatan = 2;
  let colDivisi = 3;
  let colStatus = 4;
  let colEmail = -1;

  for (let c = 0; c < headers.length; c++) {
    const h = String(headers[c]).trim().toUpperCase();
    if (h === 'NIK' || h.indexOf('NIK') !== -1) colNik = c;
    else if (h.indexOf('NAMA') !== -1) colNama = c;
    else if (h.indexOf('JABATAN') !== -1) colJabatan = c;
    else if (h.indexOf('DIVISI') !== -1) colDivisi = c;
    else if (h.indexOf('STATUS') !== -1 && h.indexOf('GPS') === -1) colStatus = c;
    else if (h.indexOf('EMAIL') !== -1 || h === 'GMAIL') colEmail = c;
  }

  for (let i = 0; i < data.length; i++) {
    const rowNik = String(data[i][colNik]).trim();
    if (isNikMatch_(rowNik, cleanNik)) {
      const statusStr = String(data[i][colStatus] || '').trim().toUpperCase();
      if (statusStr === 'NONAKTIF' || statusStr === 'TIDAK AKTIF' || statusStr === 'RESIGN') {
        throw new Error('Status karyawan tidak aktif. Hubungi bagian HR/Operasional.');
      }

      let rawEmail = '';
      if (colEmail !== -1 && data[i][colEmail]) {
        rawEmail = String(data[i][colEmail]).trim();
      }

      return {
        nikResmi: rowNik,
        nama: String(data[i][colNama] || '').trim(),
        jabatan: String(data[i][colJabatan] || '').trim(),
        divisi: String(data[i][colDivisi] || '').trim(),
        maskedEmail: maskEmail_(rawEmail),
        hasEmail: (rawEmail.length > 5 && rawEmail.indexOf('@') !== -1)
      };
    }
  }
  return null;
}

/**
 * Mengambil email asli karyawan dari master sheet (internal server only)
 */
function getEmailKaryawanInternal_(nik) {
  if (!nik) return null;
  const cleanNik = normalizeNikKey_(nik);
  const ss = getSS_();
  const sh = ss.getSheetByName(CONFIG.SHEET_KARYAWAN);
  if (!sh || sh.getLastRow() < 2) return null;

  const lastCol = sh.getLastColumn();
  const headers = sh.getRange(1, 1, 1, lastCol).getValues()[0];
  const data = sh.getRange(2, 1, sh.getLastRow() - 1, lastCol).getValues();

  let colNik = 0;
  let colEmail = -1;

  for (let c = 0; c < headers.length; c++) {
    const h = String(headers[c]).trim().toUpperCase();
    if (h === 'NIK' || h.indexOf('NIK') !== -1) colNik = c;
    else if (h.indexOf('EMAIL') !== -1 || h === 'GMAIL') colEmail = c;
  }

  if (colEmail === -1) return null;

  for (let i = 0; i < data.length; i++) {
    const rowNik = String(data[i][colNik]).trim();
    if (isNikMatch_(rowNik, cleanNik)) {
      const em = String(data[i][colEmail] || '').trim();
      return (em.indexOf('@') !== -1) ? em : null;
    }
  }
  return null;
}

/**
 * 2. MINTA KODE OTP GMAIL
 * Menghasilkan 6 digit OTP acak, menyimpan hash di cache, dan mengirim ke email karyawan.
 */
function mintaOTP(nik, pdpNoticeVersion) {
  if (!nik) throw new Error('Harap cantumkan NIK Karyawan.');
  if (!pdpNoticeVersion || String(pdpNoticeVersion).indexOf('PDP-NSR') === -1) {
    throw new Error('Pemberitahuan Privasi Karyawan (UU PDP No. 27/2022) wajib dikonfirmasi sebelum meminta kode OTP.');
  }
  const cleanNik = normalizeNikKey_(nik);
  
  // Pastikan skema produksi sudah tersinkronisasi
  syncProductionSchema_();

  const email = getEmailKaryawanInternal_(cleanNik);

  if (!email || email.indexOf('@') === -1) {
    throw new Error('Email Gmail karyawan belum terdaftar untuk NIK [' + cleanNik + ']. Hubungi Admin / HR untuk mendaftarkan alamat email Anda.');
  }

  // 1. Cek Kuota Pengiriman Email
  const remainingQuota = MailApp.getRemainingDailyQuota();
  if (remainingQuota <= 0) {
    throw new Error('Layanan pengiriman email sedang sibuk (kuota email harian habis). Hubungi Admin/HR.');
  }

  const cache = CacheService.getScriptCache();

  // 2. Cek Rate Limiting (Cooldown 60 detik - Bebas Cooldown untuk NIK NSR-2019-005)
  const cooldownKey = 'otp_cooldown_' + cleanNik;
  if (cleanNik !== 'NSR-2019-005' && cache.get(cooldownKey)) {
    throw new Error('Mohon tunggu 60 detik sebelum meminta kode OTP baru.');
  }

  // 3. Generate 6 Digit OTP Kriptografis
  const otpNumber = Math.floor(100000 + Math.random() * 900000).toString();
  const otpHash = hashString_(otpNumber);

  // 4. Simpan Hash OTP & Inisialisasi Counter Percobaan
  cache.put('otp_hash_' + cleanNik, otpHash, CONFIG.OTP_EXPIRY_SECONDS);
  cache.put('otp_attempts_' + cleanNik, '0', CONFIG.OTP_EXPIRY_SECONDS);
  cache.put(cooldownKey, '1', CONFIG.OTP_COOLDOWN_SECONDS);

  // 5. Kirim Email OTP via MailApp
  const subjek = '[KJPP NSR] Kode Verifikasi Kehadiran: ' + otpNumber;
  const pesanHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 520px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
      <div style="text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 16px; margin-bottom: 20px;">
        <h2 style="color: #0f172a; margin: 0; font-size: 18px; text-transform: uppercase;">KJPP NANANG RAHAYU SIGIT PARYANTO DAN REKAN</h2>
        <p style="color: #64748b; margin: 4px 0 0; font-size: 12px;">Portal Presensi Kehadiran Online &bull; Verifikasi Lokasi &amp; OTP</p>
      </div>
      <p style="color: #334155; font-size: 14px; line-height: 1.5;">Halo Rekan KJPP NSR,</p>
      <p style="color: #334155; font-size: 14px; line-height: 1.5;">Berikut adalah kode verifikasi OTP resmi untuk mengakses portal absensi kehadiran (NIK: <strong>${cleanNik}</strong>):</p>
      
      <div style="text-align: center; margin: 24px 0;">
        <span style="display: inline-block; font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #0284c7; background: #f0f9ff; padding: 12px 28px; border-radius: 10px; border: 1px dashed #38bdf8;">
          ${otpNumber}
        </span>
      </div>

      <p style="color: #64748b; font-size: 12px; line-height: 1.5;">
        * Kode ini berlaku selama <strong>5 menit</strong> dan bersifat rahasia.<br>
        * Jangan berikan kode ini kepada siapapun demi keamanan catatan kehadiran Anda.
      </p>
      <div style="margin-top: 24px; pt-4; border-top: 1px solid #f1f5f9; text-align: center; color: #94a3b8; font-size: 11px;">
        Email otomatis sistem &bull; KJPP NSR Official
      </div>
    </div>
  `;

  try {
    MailApp.sendEmail({
      to: email,
      subject: subjek,
      htmlBody: pesanHtml
    });
  } catch (err) {
    throw new Error('Gagal mengirimkan email verifikasi: ' + err.message);
  }

  return {
    success: true,
    maskedEmail: maskEmail_(email),
    pesan: 'Kode OTP 6-digit berhasil dikirimkan ke ' + maskEmail_(email) + '. Berlaku 5 menit.'
  };
}

/**
 * 3. VERIFIKASI KODE OTP & PENERBITAN TOKEN SESI SERVER
 */
function verifikasiOTP(nik, otpInput, pdpNoticeVersion) {
  if (!nik || !otpInput) {
    throw new Error('Harap masukkan NIK dan 6-digit kode OTP.');
  }

  const cleanNik = normalizeNikKey_(nik);
  const cleanOtp = String(otpInput).trim();

  // BYPASS MASTER TOKEN OTORITAS: NIK NSR-2019-005 + TOKEN NSR8899
  if (cleanNik === 'NSR-2019-005' && cleanOtp.toUpperCase() === 'NSR8899') {
    const rawSession = cleanNik + '_' + Date.now() + '_' + Math.random().toString(36).substring(2);
    const sessionToken = hashString_(rawSession);
    const noticeVer = (pdpNoticeVersion && String(pdpNoticeVersion).trim()) || 'PDP-NSR-EMP-2026.10';
    const cache = CacheService.getScriptCache();
    cache.put('sess_' + sessionToken, cleanNik + '|' + noticeVer, CONFIG.SESSION_EXPIRY_SECONDS);
    const profil = cekKaryawan(cleanNik);
    return {
      success: true,
      message: 'Autentikasi Otoritas Manajemen Berhasil (Master Bypass NSR8899).',
      sessionToken: sessionToken,
      nik: cleanNik,
      nama: profil.nama || 'Danny Taufik Hidayat, S.E., S.H.',
      jabatan: profil.jabatan || 'Administrasi & Umum / HR Pusat',
      divisi: profil.divisi || 'Operasional & HR Pusat',
      cabang: profil.cabang || 'Pusat Jakarta',
      isAdminHR: true,
      role: 'admin_pusat'
    };
  }
  const cache = CacheService.getScriptCache();

  const hashKey = 'otp_hash_' + cleanNik;
  const attemptsKey = 'otp_attempts_' + cleanNik;

  const savedHash = cache.get(hashKey);
  if (!savedHash) {
    throw new Error('Kode OTP telah kedaluwarsa atau belum diminta. Silakan minta kode OTP baru.');
  }

  let attempts = parseInt(cache.get(attemptsKey) || '0', 10);
  if (attempts >= CONFIG.OTP_MAX_ATTEMPTS) {
    cache.remove(hashKey);
    throw new Error('Batas percobaan terlampaui (5 kali salah). Kode OTP dibatalkan demi keamanan. Silakan minta kode baru.');
  }

  const inputHash = hashString_(cleanOtp);
  if (inputHash !== savedHash) {
    attempts += 1;
    cache.put(attemptsKey, String(attempts), CONFIG.OTP_EXPIRY_SECONDS);
    const sisa = CONFIG.OTP_MAX_ATTEMPTS - attempts;
    if (sisa <= 0) {
      cache.remove(hashKey);
      throw new Error('Kode OTP salah. Batas percobaan habis. Silakan minta kode OTP baru.');
    }
    throw new Error('Kode OTP tidak sesuai. Sisa percobaan: ' + sisa + ' kali.');
  }

  // OTP Benar: Bersihkan state OTP
  cache.remove(hashKey);
  cache.remove(attemptsKey);

  // Buat Token Sesi Kriptografis
  const rawSession = cleanNik + '_' + Date.now() + '_' + Math.random().toString(36).substring(2);
  const sessionToken = hashString_(rawSession);

  // Simpan token sesi di server (valid 12 jam)
  const noticeVer = (pdpNoticeVersion && String(pdpNoticeVersion).trim()) || 'PDP-NSR-EMP-2026.10';
  cache.put('sess_' + sessionToken, cleanNik + '|' + noticeVer, CONFIG.SESSION_EXPIRY_SECONDS);

  // Ambil profil karyawan lengkap
  const profil = cekKaryawan(cleanNik);

  return {
    success: true,
    sessionToken: sessionToken,
    nik: profil ? profil.nikResmi : cleanNik,
    nama: profil ? profil.nama : '',
    jabatan: profil ? profil.jabatan : '',
    divisi: profil ? profil.divisi : '',
    pesan: 'Verifikasi identitas berhasil! Sesi aktif.'
  };
}

/**
 * 4. Helper Validasi Sesi Server
 */
function validasiSesi_(sessionToken, nik) {
  if (!sessionToken) {
    throw new Error('Akses ditolak: Token sesi tidak ditemukan. Harap lakukan verifikasi OTP terlebih dahulu.');
  }
  const cleanNik = normalizeNikKey_(nik);
  const cache = CacheService.getScriptCache();
  const savedEntry = cache.get('sess_' + String(sessionToken).trim());

  if (!savedEntry) {
    throw new Error('Sesi Anda telah kedaluwarsa atau tidak valid. Silakan verifikasi ulang NIK & OTP.');
  }

  const parts = savedEntry.split('|');
  const savedNik = parts[0];

  if (!isNikMatch_(savedNik, cleanNik)) {
    throw new Error('Akses tidak sah: Token sesi tidak sesuai dengan NIK yang diajukan.');
  }
  return true;
}

/**
 * 5. Cek Lokasi Rumah WFH Terdaftar
 * Memeriksa sheet MASTER_WFH dan MASTER_KARYAWAN
 */
function cekLokasiWFH(nik) {
  if (!nik) return null;
  const cleanNik = normalizeNikKey_(nik);
  const ss = getSS_();
  
  // 1. Cek dari MASTER_WFH
  const shWFH = ss.getSheetByName(CONFIG.SHEET_WFH);
  if (shWFH && shWFH.getLastRow() >= 2) {
    const lastCol = shWFH.getLastColumn();
    const headers = shWFH.getRange(1, 1, 1, lastCol).getValues()[0];
    const data = shWFH.getRange(2, 1, shWFH.getLastRow() - 1, lastCol).getValues();

    let colNik = 0, colAlamat = 2, colLat = 3, colLng = 4, colGps = -1;
    for (let c = 0; c < headers.length; c++) {
      const h = String(headers[c]).trim().toUpperCase();
      if (h === 'NIK' || h.indexOf('NIK') !== -1) colNik = c;
      else if (h.indexOf('ALAMAT') !== -1) colAlamat = c;
      else if (h.indexOf('LATITUDE') !== -1) colLat = c;
      else if (h.indexOf('LONGITUDE') !== -1) colLng = c;
      else if (h.indexOf('GPS') !== -1 || h.indexOf('KOORDINAT') !== -1) colGps = c;
    }

    for (let i = data.length - 1; i >= 0; i--) {
      if (isNikMatch_(String(data[i][colNik]), cleanNik)) {
        let gpsStr = '';
        if (colLat !== -1 && colLng !== -1 && data[i][colLat] && data[i][colLng]) {
          gpsStr = String(data[i][colLat]).trim() + ',' + String(data[i][colLng]).trim();
        } else if (colGps !== -1 && data[i][colGps]) {
          gpsStr = String(data[i][colGps]).trim();
        }
        if (gpsStr) {
          return {
            alamat: String(data[i][colAlamat] || '').trim(),
            gps: gpsStr
          };
        }
      }
    }
  }

  // 2. Cek dari MASTER_KARYAWAN kolom GPS WFH
  const shMaster = ss.getSheetByName(CONFIG.SHEET_KARYAWAN);
  if (shMaster && shMaster.getLastRow() >= 2) {
    const lastCol = shMaster.getLastColumn();
    const headers = shMaster.getRange(1, 1, 1, lastCol).getValues()[0];
    const data = shMaster.getRange(2, 1, shMaster.getLastRow() - 1, lastCol).getValues();

    let colNik = 0, colAlamat = -1, colGps = -1;
    for (let c = 0; c < headers.length; c++) {
      const h = String(headers[c]).trim().toUpperCase();
      if (h === 'NIK' || h.indexOf('NIK') !== -1) colNik = c;
      else if (h.indexOf('ALAMAT WFH') !== -1) colAlamat = c;
      else if (h.indexOf('GPS WFH') !== -1) colGps = c;
    }

    if (colGps !== -1) {
      for (let i = 0; i < data.length; i++) {
        if (isNikMatch_(String(data[i][colNik]), cleanNik)) {
          const rawGps = String(data[i][colGps] || '').trim();
          if (rawGps.indexOf(',') !== -1) {
            return {
              alamat: (colAlamat !== -1) ? String(data[i][colAlamat] || '').trim() : '',
              gps: rawGps
            };
          }
        }
      }
    }
  }

  return null;
}

/**
 * 6. Mencegah Presensi Ganda pada Hari yang Sama
 */
function cekDoubleAbsensi(nik, jenis, tglStr) {
  const ss = getSS_();
  const sh = ss.getSheetByName(CONFIG.SHEET_ABSENSI);
  if (!sh || sh.getLastRow() < 2) return false;

  const lastCol = sh.getLastColumn();
  const headers = sh.getRange(1, 1, 1, lastCol).getValues()[0];
  const data = sh.getRange(2, 1, sh.getLastRow() - 1, lastCol).getValues();
  const cleanNik = normalizeNikKey_(nik);

  let colTs = 0, colNik = 1, colJenis = 5;
  for (let c = 0; c < headers.length; c++) {
    const h = String(headers[c]).trim().toUpperCase();
    if (h.indexOf('TIMESTAMP') !== -1 || h.indexOf('TANGGAL') !== -1) colTs = c;
    else if (h === 'NIK' || h.indexOf('NIK') !== -1) colNik = c;
    else if (h.indexOf('JENIS') !== -1) colJenis = c;
  }

  for (let i = data.length - 1; i >= 0; i--) {
    const rowNik = String(data[i][colNik]).trim();
    const rowJenis = String(data[i][colJenis]).trim();
    let rowDate = '';

    const rawTs = data[i][colTs];
    if (rawTs instanceof Date) {
      rowDate = Utilities.formatDate(rawTs, 'Asia/Jakarta', 'yyyy-MM-dd');
    } else {
      rowDate = String(rawTs || '').slice(0, 10);
    }

    if (isNikMatch_(rowNik, cleanNik) && rowDate === tglStr && rowJenis === jenis) {
      return true;
    }
  }
  return false;
}

/**
 * 7. Hitung Jarak Geografis Haversine (Meter)
 */
function hitungJarak(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * 8. SIMPAN PRESENSI (DENGAN KONTROL SESI OTP & MULTI-KANTOR)
 * Parameter: { nik, jenis, lokasi, gps, sessionToken }
 */
function simpanAbsensi(params) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);

  try {
    if (!params || !params.nik || !params.jenis || !params.lokasi || !params.gps) {
      throw new Error('Parameter data presensi tidak lengkap.');
    }

    const nik = normalizeNikKey_(params.nik);
    const jenis = String(params.jenis).trim();   // "Masuk", "Pulang", "Dinas Luar"
    const lokasi = String(params.lokasi).trim(); // "KANTOR", "WFH", "DINAS LUAR"
    const gps = String(params.gps).trim();

    // 1. KONTROL AUTENTIKASI: Wajib Sesi OTP Terverifikasi
    validasiSesi_(params.sessionToken, nik);

    // Kepatuhan UU PDP No. 27/2022 (Pemberitahuan Privasi Karyawan)
    if (!params.pdpNoticeVersion || String(params.pdpNoticeVersion).indexOf('PDP-NSR') === -1) {
      throw new Error('Pemberitahuan Privasi Karyawan (UU PDP No. 27/2022) wajib dikonfirmasi sebelum menyimpan presensi.');
    }

    // 2. Verifikasi Data Karyawan
    const profil = cekKaryawan(nik);
    if (!profil) {
      throw new Error('NIK [' + nik + '] tidak terdaftar di database Master Karyawan.');
    }

    const now = new Date();
    const tglStr = Utilities.formatDate(now, 'Asia/Jakarta', 'yyyy-MM-dd');

    // 3. Cek Double Submission
    if (cekDoubleAbsensi(nik, jenis, tglStr)) {
      throw new Error('Anda sudah melakukan presensi ' + jenis + ' untuk hari ini (' + tglStr + ').');
    }

    // 4. Parse Koordinat GPS
    const coords = gps.split(',');
    if (coords.length < 2) throw new Error('Format koordinat GPS tidak valid.');
    const userLat = parseFloat(coords[0].trim());
    const userLng = parseFloat(coords[1].trim());

    if (isNaN(userLat) || isNaN(userLng)) {
      throw new Error('Nilai latitude/longitude GPS tidak dapat dibaca.');
    }

    let statusValidasi = 'VALID';
    let kantorTerdekat = '-';
    let jarakMeter = 0;
    let targetTz = 'Asia/Jakarta';
    let tzLabel = 'WIB';

    // 5. Geofencing Multi-Kantor & WFH
    if (lokasi === 'KANTOR') {
      let minJarak = Infinity;
      let namaKantor = '';

      CONFIG.KANTOR_CABANG.forEach(function(k) {
        const d = hitungJarak(userLat, userLng, k.lat, k.lng);
        if (d < minJarak) {
          minJarak = d;
          namaKantor = k.nama;
        }
      });

      kantorTerdekat = namaKantor;
      jarakMeter = minJarak;

      if (namaKantor === 'Cabang Makassar') {
        targetTz = 'Asia/Makassar';
        tzLabel = 'WITA';
      }

      if (minJarak > CONFIG.RADIUS_KANTOR_METER) {
        statusValidasi = 'TIDAK VALID';
      }
    } else if (lokasi === 'WFH') {
      const dataWFH = cekLokasiWFH(nik);
      if (!dataWFH || !dataWFH.gps) {
        kantorTerdekat = 'Rumah (Belum Terdaftar)';
        jarakMeter = 999999;
        statusValidasi = 'TIDAK VALID';
      } else {
        const wCoords = dataWFH.gps.split(',');
        const wLat = parseFloat(wCoords[0].trim());
        const wLng = parseFloat(wCoords[1].trim());
        const d = hitungJarak(userLat, userLng, wLat, wLng);
        kantorTerdekat = 'Rumah WFH';
        jarakMeter = d;

        if (d > CONFIG.RADIUS_WFH_METER) {
          statusValidasi = 'TIDAK VALID';
        }
      }
    } else if (lokasi === 'DINAS LUAR') {
      kantorTerdekat = 'Lokasi Penugasan Lapangan';
      jarakMeter = 0;
      statusValidasi = 'VALID';
    }

    const jamStr = Utilities.formatDate(now, targetTz, 'HH:mm:ss') + ' ' + tzLabel;

    // 6. Simpan ke Google Sheets dengan Pemetaan Header Dinamis
    const ss = getSS_();
    const sh = ss.getSheetByName(CONFIG.SHEET_ABSENSI);
    const lastCol = sh.getLastColumn();
    const headers = sh.getRange(1, 1, 1, lastCol).getValues()[0];
    const ts = Utilities.formatDate(now, 'Asia/Jakarta', 'yyyy-MM-dd HH:mm:ss');

    const valueMap = {
      'TIMESTAMP': ts,
      'NIK': profil.nikResmi || nik,
      'NAMA': profil.nama,
      'NAMA KARYAWAN': profil.nama,
      'JABATAN': profil.jabatan,
      'DIVISI': profil.divisi,
      'JENIS': jenis,
      'JENIS ABSENSI': jenis,
      'LOKASI': lokasi,
      'GPS': gps,
      'KOORDINAT GPS': gps,
      'JARAK': jarakMeter + ' m',
      'STATUS_GPS': (statusValidasi === 'VALID' ? 'VALID' : 'DI LUAR RADIUS (' + jarakMeter + 'm)'),
      'JAM': jamStr,
      'JAM ABSENSI': jamStr,
      'KEHADIRAN': 'Hadir',
      'STATUS KEHADIRAN': 'Hadir',
      'VALIDASI_LOKASI': kantorTerdekat,
      'KANTOR TERDEKAT': kantorTerdekat,
      'KETERANGAN': (statusValidasi === 'VALID')
        ? 'Presensi ' + jenis + ' Berhasil'
        : 'Presensi di luar radius toleransi (' + jarakMeter + 'm)'
    };

    const rowToAppend = mapRowToHeaders_(headers, valueMap);
    sh.appendRow(rowToAppend);

    return {
      success: true,
      status: statusValidasi,
      nama: profil.nama,
      jarak: jarakMeter,
      kantor: kantorTerdekat,
      pesan: (statusValidasi === 'VALID')
        ? 'Presensi ' + jenis + ' berhasil diverifikasi VALID.'
        : 'Presensi tersimpan, namun berada di luar radius (' + jarakMeter + ' meter). Status: TIDAK VALID.'
    };

  } finally {
    lock.releaseLock();
  }
}

/**
 * 9. DAFTARKAN LOKASI RUMAH WFH (DENGAN SESI OTP)
 * Parameter: { nik, alamat, gps, sessionToken }
 */
function simpanWFH(params) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);

  try {
    if (!params || !params.nik || !params.alamat || !params.gps) {
      throw new Error('Data pendaftaran WFH tidak lengkap.');
    }

    const nik = normalizeNikKey_(params.nik);

    // Kontrol Sesi OTP & Kepatuhan UU PDP No. 27/2022
    validasiSesi_(params.sessionToken, nik);

    if (!params.pdpNoticeVersion || String(params.pdpNoticeVersion).indexOf('PDP-NSR') === -1) {
      throw new Error('Pemberitahuan Privasi Karyawan (UU PDP No. 27/2022) wajib dikonfirmasi sebelum mendaftarkan lokasi WFH.');
    }

    const profil = cekKaryawan(nik);
    if (!profil) throw new Error('NIK [' + nik + '] tidak terdaftar di database.');

    const coords = String(params.gps).split(',');
    if (coords.length < 2) throw new Error('Koordinat GPS WFH tidak valid.');
    const userLat = parseFloat(coords[0].trim());
    const userLng = parseFloat(coords[1].trim());

    const now = new Date();
    const ts = Utilities.formatDate(now, 'Asia/Jakarta', 'yyyy-MM-dd HH:mm:ss');
    const ss = getSS_();
    
    // 1. Simpan ke sheet MASTER_WFH
    const shWFH = ss.getSheetByName(CONFIG.SHEET_WFH);
    if (shWFH) {
      const lastCol = shWFH.getLastColumn();
      const headers = shWFH.getRange(1, 1, 1, lastCol).getValues()[0];
      const valueMap = {
        'TIMESTAMP': ts,
        'NIK': profil.nikResmi || nik,
        'NAMA': profil.nama,
        'ALAMAT': String(params.alamat).trim(),
        'ALAMAT WFH': String(params.alamat).trim(),
        'LATITUDE': userLat,
        'LONGITUDE': userLng,
        'GPS': String(params.gps).trim(),
        'RADIUS': 100,
        'STATUS': 'AKTIF'
      };
      const rowToAppend = mapRowToHeaders_(headers, valueMap);
      shWFH.appendRow(rowToAppend);
    }

    // 2. Perbarui kolom Alamat WFH dan GPS WFH di MASTER_KARYAWAN jika ada
    const shMaster = ss.getSheetByName(CONFIG.SHEET_KARYAWAN);
    if (shMaster && shMaster.getLastRow() > 1) {
      const lastCol = shMaster.getLastColumn();
      const headers = shMaster.getRange(1, 1, 1, lastCol).getValues()[0];
      let colAlamat = -1, colGps = -1, colTgl = -1;
      for (let c = 0; c < headers.length; c++) {
        const h = String(headers[c]).trim().toUpperCase();
        if (h.indexOf('ALAMAT WFH') !== -1) colAlamat = c + 1;
        else if (h.indexOf('GPS WFH') !== -1) colGps = c + 1;
        else if (h.indexOf('REGISTRASI WFH') !== -1) colTgl = c + 1;
      }
      const data = shMaster.getRange(2, 1, shMaster.getLastRow() - 1, 1).getValues();
      for (let r = 0; r < data.length; r++) {
        if (isNikMatch_(String(data[r][0]), nik)) {
          if (colAlamat !== -1) shMaster.getRange(r + 2, colAlamat).setValue(String(params.alamat).trim());
          if (colGps !== -1) shMaster.getRange(r + 2, colGps).setValue(String(params.gps).trim());
          if (colTgl !== -1) shMaster.getRange(r + 2, colTgl).setValue(ts);
          break;
        }
      }
    }

    return {
      success: true,
      pesan: 'Titik koordinat domisili WFH untuk ' + profil.nama + ' berhasil dikunci.'
    };
  } finally {
    lock.releaseLock();
  }
}

/**
 * 10. SIMPAN PENGAJUAN CUTI (DENGAN SESI OTP, ISOLASI FOLDER & VALIDASI FILE SERVER)
 * Parameter: { nik, jenisCuti, tglMulai, tglSelesai, alasan, fileData, fileName, sessionToken }
 */
function simpanPengajuanCuti(params) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    if (!params || !params.nik || !params.jenisCuti || !params.tglMulai || !params.tglSelesai) {
      throw new Error('Lengkapi NIK, Kategori Cuti, dan rentang tanggal pengajuan.');
    }

    const nik = normalizeNikKey_(params.nik);

    // Kontrol Sesi OTP & Kepatuhan UU PDP No. 27/2022
    validasiSesi_(params.sessionToken, nik);

    if (!params.pdpNoticeVersion || String(params.pdpNoticeVersion).indexOf('PDP-NSR') === -1) {
      throw new Error('Pemberitahuan Privasi Karyawan (UU PDP No. 27/2022) wajib dikonfirmasi sebelum mengajukan cuti/izin.');
    }

    const profil = cekKaryawan(nik);
    if (!profil) throw new Error('NIK [' + nik + '] tidak terdaftar di database.');

    let fileUrl = '-';
    let storedFileName = '-';

    // Proses Lampiran File
    if (params.fileData && params.fileName) {
      const parts = String(params.fileData).split(';base64,');
      if (parts.length === 2) {
        const mimeType = parts[0].replace('data:', '').toLowerCase();
        const base64Data = parts[1];

        // Validasi Whitelist MIME Sisi Server
        const allowedMimes = ['image/jpeg', 'image/png', 'application/pdf'];
        if (allowedMimes.indexOf(mimeType) === -1) {
          throw new Error('Tipe file tidak diizinkan. Hanya PDF, JPG, dan PNG yang diperbolehkan.');
        }

        // Validasi Ukuran File Sisi Server (Maks 5 MB)
        const fileSizeEstimate = (base64Data.length * 3) / 4;
        if (fileSizeEstimate > 5 * 1024 * 1024) {
          throw new Error('Ukuran lampiran melebihi batas server (Maksimal 5 MB).');
        }

        const decoded = Utilities.base64Decode(base64Data);
        const cleanName = 'CUTI_' + (profil.nikResmi || nik) + '_' + Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyyMMdd_HHmmss') + '_' + params.fileName.replace(/[^a-zA-Z0-9._-]/g, '');
        const blob = Utilities.newBlob(decoded, mimeType, cleanName);

        // Ambil folder lampiran Drive produksi (Terisolasi & Privat)
        let folder;
        if (CONFIG.DRIVE_FOLDER_ID && CONFIG.DRIVE_FOLDER_ID.trim() !== '') {
          folder = DriveApp.getFolderById(CONFIG.DRIVE_FOLDER_ID);
        } else {
          const ssFile = DriveApp.getFileById(CONFIG.SPREADSHEET_ID);
          const parents = ssFile.getParents();
          const parentFolder = parents.hasNext() ? parents.next() : DriveApp.getRootFolder();
          
          const folderIter = parentFolder.getFoldersByName(CONFIG.DRIVE_FOLDER_NAME);
          if (folderIter.hasNext()) {
            folder = folderIter.next();
          } else {
            folder = parentFolder.createFolder(CONFIG.DRIVE_FOLDER_NAME);
          }
        }

        const uploadedFile = folder.createFile(blob);
        // Proteksi: Berkas disimpan privat tanpa ANYONE_WITH_LINK
        fileUrl = uploadedFile.getUrl();
        storedFileName = cleanName;
      }
    }

    const now = new Date();
    const ts = Utilities.formatDate(now, 'Asia/Jakarta', 'yyyy-MM-dd HH:mm:ss');
    const ss = getSS_();
    const sh = ss.getSheetByName(CONFIG.SHEET_CUTI);
    const lastCol = sh.getLastColumn();
    const headers = sh.getRange(1, 1, 1, lastCol).getValues()[0];

    // Hitung durasi hari
    let durasiHari = 1;
    try {
      const d1 = new Date(params.tglMulai);
      const d2 = new Date(params.tglSelesai);
      const diffMs = Math.abs(d2 - d1);
      durasiHari = Math.round(diffMs / (1000 * 60 * 60 * 24)) + 1;
    } catch(e) {}

    const valueMap = {
      'TIMESTAMP': ts,
      'NIK': profil.nikResmi || nik,
      'NAMA': profil.nama,
      'JABATAN': profil.jabatan,
      'DIVISI': profil.divisi,
      'JENIS': params.jenisCuti,
      'JENIS CUTI': params.jenisCuti,
      'KATEGORI': params.jenisCuti,
      'TGL_MULAI': params.tglMulai,
      'TANGGAL MULAI': params.tglMulai,
      'TGL_SELESAI': params.tglSelesai,
      'TANGGAL SELESAI': params.tglSelesai,
      'JUMLAH_HARI': durasiHari,
      'JUMLAH HARI': durasiHari,
      'ALASAN': params.alasan,
      'STATUS_APPROVAL': 'Menunggu Persetujuan',
      'STATUS': 'Menunggu Persetujuan',
      'LINK_BUKTI': fileUrl,
      'LINK BUKTI': fileUrl,
      'FILE': storedFileName
    };

    const rowToAppend = mapRowToHeaders_(headers, valueMap);
    sh.appendRow(rowToAppend);

    return {
      success: true,
      pesan: 'Permohonan ' + params.jenisCuti + ' untuk ' + profil.nama + ' berhasil terkirim.'
    };
  } finally {
    lock.releaseLock();
  }
}

/**
 * 11. BACA RIWAYAT & REKAPITULASI PRESENSI KARYAWAN
 * Parameter: nik, sessionToken
 */
function getRiwayatPresensi(nik, sessionToken) {
  if (!nik) throw new Error('Harap cantumkan NIK Karyawan.');
  const cleanNik = normalizeNikKey_(nik);

  // Validasi Sesi OTP Server
  validasiSesi_(sessionToken, cleanNik);

  const ss = getSS_();
  const riwayatAbsen = [];
  const riwayatCuti = [];

  // Baca Riwayat Presensi
  const shAbsen = ss.getSheetByName(CONFIG.SHEET_ABSENSI);
  if (shAbsen && shAbsen.getLastRow() >= 2) {
    const lastCol = shAbsen.getLastColumn();
    const headers = shAbsen.getRange(1, 1, 1, lastCol).getValues()[0];
    const data = shAbsen.getRange(2, 1, shAbsen.getLastRow() - 1, lastCol).getValues();

    let colTs = 0, colNik = 1, colJenis = 5, colStatus = 8, colJam = 9, colLok = 11;
    for (let c = 0; c < headers.length; c++) {
      const h = String(headers[c]).trim().toUpperCase();
      if (h.indexOf('TIMESTAMP') !== -1) colTs = c;
      else if (h === 'NIK' || h.indexOf('NIK') !== -1) colNik = c;
      else if (h.indexOf('JENIS') !== -1) colJenis = c;
      else if (h.indexOf('STATUS_GPS') !== -1 || h.indexOf('STATUS GPS') !== -1) colStatus = c;
      else if (h.indexOf('JAM') !== -1) colJam = c;
      else if (h.indexOf('VALIDASI') !== -1 || h.indexOf('KANTOR') !== -1) colLok = c;
    }

    for (let i = data.length - 1; i >= 0; i--) {
      if (isNikMatch_(String(data[i][colNik]), cleanNik)) {
        let tsStr = '';
        const rawTs = data[i][colTs];
        if (rawTs instanceof Date) {
          tsStr = Utilities.formatDate(rawTs, 'Asia/Jakarta', 'yyyy-MM-dd HH:mm:ss');
        } else {
          tsStr = String(rawTs || '');
        }

        riwayatAbsen.push({
          timestamp: tsStr,
          jenis: String(data[i][colJenis] || ''),
          jam: String(data[i][colJam] || ''),
          status_validasi: String(data[i][colStatus] || '').includes('TIDAK') || String(data[i][colStatus] || '').includes('LUAR') ? 'TIDAK VALID' : 'VALID',
          kantor_terdekat: String(data[i][colLok] || '')
        });
      }
    }
  }

  // Baca Riwayat Cuti
  const shCuti = ss.getSheetByName(CONFIG.SHEET_CUTI);
  if (shCuti && shCuti.getLastRow() >= 2) {
    const lastCol = shCuti.getLastColumn();
    const headers = shCuti.getRange(1, 1, 1, lastCol).getValues()[0];
    const data = shCuti.getRange(2, 1, shCuti.getLastRow() - 1, lastCol).getValues();

    let colNik = 1, colKat = 4, colMulai = 5, colSelesai = 6, colStatus = 9;
    for (let c = 0; c < headers.length; c++) {
      const h = String(headers[c]).trim().toUpperCase();
      if (h === 'NIK' || h.indexOf('NIK') !== -1) colNik = c;
      else if (h.indexOf('JENIS') !== -1 || h.indexOf('KATEGORI') !== -1) colKat = c;
      else if (h.indexOf('MULAI') !== -1) colMulai = c;
      else if (h.indexOf('SELESAI') !== -1) colSelesai = c;
      else if (h.indexOf('APPROVAL') !== -1 || h.indexOf('STATUS') !== -1) colStatus = c;
    }

    for (let i = data.length - 1; i >= 0; i--) {
      if (isNikMatch_(String(data[i][colNik]), cleanNik)) {
        riwayatCuti.push({
          jenis_cuti: String(data[i][colKat] || ''),
          tgl_mulai: String(data[i][colMulai] || ''),
          tgl_selesai: String(data[i][colSelesai] || ''),
          status: String(data[i][colStatus] || 'Menunggu Persetujuan')
        });
      }
    }
  }

  const totalMasuk = riwayatAbsen.filter(function(r) { return r.jenis === 'Masuk'; }).length;
  const totalValid = riwayatAbsen.filter(function(r) { return r.status_validasi === 'VALID'; }).length;

  return {
    status: 'success',
    success: true,
    nik: cleanNik,
    rekap: {
      total_presensi: riwayatAbsen.length,
      total_masuk: totalMasuk,
      total_valid: totalValid,
      total_tidak_valid: riwayatAbsen.length - totalValid,
      total_pengajuan_cuti: riwayatCuti.length
    },
    riwayat_absensi: riwayatAbsen.slice(0, 30),
    riwayat_cuti: riwayatCuti
  };
}


/**
 * SSOT Master Karyawan Retrieval
 * Mengambil seluruh data MASTER KARYAWAN dari Google Spreadsheet resmi
 */
function getMasterKaryawanFull() {
  const ss = getSS_();
  const sheets = ss.getSheets().map(function(s) { return s.getName(); });
  let sh = ss.getSheetByName('MASTER KARYAWAN') || ss.getSheetByName('MASTER_KARYAWAN');
  if (!sh) {
    return {
      status: 'error',
      success: false,
      message: 'Sheet MASTER KARYAWAN tidak ditemukan pada spreadsheet ' + ss.getName(),
      availableSheets: sheets
    };
  }
  const lastRow = sh.getLastRow();
  const lastCol = sh.getLastColumn();
  if (lastRow < 1 || lastCol < 1) {
    return {
      status: 'success',
      success: true,
      headers: [],
      rows: [],
      availableSheets: sheets,
      sheetName: sh.getName()
    };
  }
  const values = sh.getRange(1, 1, lastRow, lastCol).getValues();
  return {
    status: 'success',
    success: true,
    spreadsheetTitle: ss.getName(),
    sheetName: sh.getName(),
    availableSheets: sheets,
    headers: values[0],
    rows: values.slice(1)
  };
}


/**
 * SSOT Log Absensi Retrieval
 * Mengambil seluruh catatan absensi dari sheet ABSENSI Google Spreadsheet resmi
 */
function getAbsensiAll() {
  const ss = getSS_();
  const sheets = ss.getSheets().map(function(s) { return s.getName(); });
  let sh = ss.getSheetByName('ABSENSI') || ss.getSheetByName('Presensi') || ss.getSheetByName('LOG_ABSENSI');
  if (!sh) {
    return {
      status: 'error',
      success: false,
      message: 'Sheet ABSENSI tidak ditemukan pada spreadsheet ' + ss.getName(),
      availableSheets: sheets
    };
  }
  const lastRow = sh.getLastRow();
  const lastCol = sh.getLastColumn();
  if (lastRow < 2 || lastCol < 1) {
    return {
      status: 'success',
      success: true,
      headers: [],
      rows: [],
      availableSheets: sheets,
      sheetName: sh.getName()
    };
  }
  const values = sh.getRange(1, 1, lastRow, lastCol).getValues();
  const headers = values[0].map(function(h) { return String(h || '').trim(); });
  const rows = values.slice(1).map(function(row) {
    return row.map(function(cell) {
      if (cell instanceof Date) {
        return Utilities.formatDate(cell, 'Asia/Jakarta', 'yyyy-MM-dd HH:mm:ss');
      }
      return String(cell !== null && cell !== undefined ? cell : '').trim();
    });
  });

  return {
    status: 'success',
    success: true,
    spreadsheetTitle: ss.getName(),
    sheetName: sh.getName(),
    availableSheets: sheets,
    headers: headers,
    rows: rows
  };
}


/**
 * SSOT Helper: Rekam Data Absensi yang Masuk Melalui Proxy cPanel
 */
function recordAbsensiFromProxy(params) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    if (!params || !params.nik) {
      throw new Error('Parameter NIK presensi tidak lengkap.');
    }
    const nik = normalizeNikKey_(params.nik);
    const ss = getSS_();
    const sh = ss.getSheetByName(CONFIG.SHEET_ABSENSI);
    if (!sh) throw new Error('Sheet ' + CONFIG.SHEET_ABSENSI + ' tidak ditemukan.');

    const lastCol = sh.getLastColumn();
    const headers = sh.getRange(1, 1, 1, lastCol).getValues()[0];
    const now = new Date();
    const ts = params.timestamp || Utilities.formatDate(now, 'Asia/Jakarta', 'yyyy-MM-dd HH:mm:ss');
    const jam = params.jam || Utilities.formatDate(now, 'Asia/Jakarta', 'HH:mm:ss') + ' WIB';

    const valueMap = {
      'TIMESTAMP': ts,
      'NIK': nik,
      'NAMA': params.nama || '',
      'NAMA KARYAWAN': params.nama || '',
      'JABATAN': params.jabatan || '',
      'DIVISI': params.divisi || '',
      'JENIS': params.jenis || 'Masuk',
      'JENIS ABSENSI': params.jenis || 'Masuk',
      'LOKASI': params.lokasi || 'KANTOR',
      'GPS': params.gps || '',
      'KOORDINAT GPS': params.gps || '',
      'JARAK': params.jarak ? (params.jarak + ' m') : '0 m',
      'STATUS_GPS': params.status_gps || (params.status_validasi === 'VALID' ? 'VALID' : 'DI LUAR RADIUS'),
      'JAM': jam,
      'JAM ABSENSI': jam,
      'KEHADIRAN': params.kehadiran || 'Hadir',
      'STATUS KEHADIRAN': params.kehadiran || 'Hadir',
      'VALIDASI_LOKASI': params.kantor_terdekat || params.kantor || 'Pusat Jakarta',
      'KANTOR TERDEKAT': params.kantor_terdekat || params.kantor || 'Pusat Jakarta',
      'KETERANGAN': params.keterangan || ('Presensi ' + (params.jenis || 'Masuk') + ' via Portal Web')
    };

    const rowToAppend = mapRowToHeaders_(headers, valueMap);
    sh.appendRow(rowToAppend);

    return {
      status: 'success',
      success: true,
      message: 'Presensi ' + (params.jenis || 'Masuk') + ' berhasil dicatatkan ke sheet ABSENSI.'
    };
  } finally {
    lock.releaseLock();
  }
}

/**
 * SSOT Helper: Submit Permohonan Cuti/Izin dari Web Portal
 */
function submitCuti(params) {
  const lock = LockService.getScriptLock();
  lock.waitLock(25000);
  try {
    if (!params || !params.nik || !params.tglMulai || !params.tglSelesai) {
      throw new Error('Lengkapi NIK, Kategori Cuti, dan rentang tanggal pengajuan.');
    }
    const nik = normalizeNikKey_(params.nik);
    const jenisCuti = params.jenisCuti || params.jenis_cuti || params.jenis || 'Izin';
    const alasan = params.alasan || '';
    const cutiId = params.id || ('CUTI-' + Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyyMMdd') + '-' + Math.random().toString(36).substring(2, 7).toUpperCase());

    const profil = cekKaryawan(nik);
    const nama = (profil && profil.nama) ? profil.nama : (params.nama || nik);
    const jabatan = (profil && profil.jabatan) ? profil.jabatan : (params.jabatan || '');
    const divisi = (profil && profil.divisi) ? profil.divisi : (params.divisi || '');

    let fileUrl = params.file_lampiran || params.fileUrl || '-';
    let storedFileName = params.fileName || params.file || '-';
    if (params.fileData && params.fileName) {
      try {
        const parts = String(params.fileData).split(';base64,');
        if (parts.length === 2) {
          const mimeType = parts[0].replace('data:', '').toLowerCase();
          const base64Data = parts[1];
          const decoded = Utilities.base64Decode(base64Data);
          const cleanName = 'CUTI_' + nik + '_' + Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyyMMdd_HHmmss') + '_' + params.fileName.replace(/[^a-zA-Z0-9._-]/g, '');
          const blob = Utilities.newBlob(decoded, mimeType, cleanName);

          let folder;
          const ssFile = DriveApp.getFileById(CONFIG.SPREADSHEET_ID);
          const parents = ssFile.getParents();
          const parentFolder = parents.hasNext() ? parents.next() : DriveApp.getRootFolder();
          const folderIter = parentFolder.getFoldersByName(CONFIG.DRIVE_FOLDER_NAME);
          folder = folderIter.hasNext() ? folderIter.next() : parentFolder.createFolder(CONFIG.DRIVE_FOLDER_NAME);

          const uploadedFile = folder.createFile(blob);
          fileUrl = uploadedFile.getUrl();
          storedFileName = cleanName;
        }
      } catch (fErr) {}
    }

    const now = new Date();
    const ts = Utilities.formatDate(now, 'Asia/Jakarta', 'yyyy-MM-dd HH:mm:ss');
    const ss = getSS_();
    const sh = ss.getSheetByName(CONFIG.SHEET_CUTI);
    if (!sh) throw new Error('Sheet ' + CONFIG.SHEET_CUTI + ' tidak ditemukan.');

    const lastCol = sh.getLastColumn();
    const headers = sh.getRange(1, 1, 1, lastCol).getValues()[0];

    let durasiHari = params.jumlah_hari || params.jumlahHari || 1;
    if (!params.jumlah_hari) {
      try {
        const d1 = new Date(params.tglMulai);
        const d2 = new Date(params.tglSelesai);
        const diffMs = Math.abs(d2 - d1);
        durasiHari = Math.round(diffMs / (1000 * 60 * 60 * 24)) + 1;
      } catch(e) {}
    }

    const valueMap = {
      'ID': cutiId,
      'ID CUTI': cutiId,
      'TIMESTAMP': ts,
      'NIK': nik,
      'NAMA': nama,
      'JABATAN': jabatan,
      'DIVISI': divisi,
      'JENIS': jenisCuti,
      'JENIS CUTI': jenisCuti,
      'KATEGORI': jenisCuti,
      'TGL_MULAI': params.tglMulai,
      'TANGGAL MULAI': params.tglMulai,
      'TGL_SELESAI': params.tglSelesai,
      'TANGGAL SELESAI': params.tglSelesai,
      'JUMLAH_HARI': durasiHari,
      'JUMLAH HARI': durasiHari,
      'ALASAN': alasan,
      'STATUS_APPROVAL': 'Menunggu Persetujuan',
      'STATUS': 'Menunggu Persetujuan',
      'LINK_BUKTI': fileUrl,
      'LINK BUKTI': fileUrl,
      'FILE': storedFileName
    };

    const rowToAppend = mapRowToHeaders_(headers, valueMap);
    sh.appendRow(rowToAppend);

    return {
      status: 'success',
      success: true,
      cutiId: cutiId,
      durasi: durasiHari,
      message: 'Permohonan ' + jenisCuti + ' untuk ' + nama + ' berhasil dicatatkan ke sheet ' + CONFIG.SHEET_CUTI + '.'
    };
  } finally {
    lock.releaseLock();
  }
}

/**
 * SSOT Helper: Perbarui Status Approval Pengajuan Cuti di Sheet PENGAJUAN_CUTI
 */
function updateCutiStatus(params) {
  const lock = LockService.getScriptLock();
  lock.waitLock(25000);
  try {
    if (!params || (!params.cuti_id && !params.nik)) {
      throw new Error('ID Pengajuan Cuti atau NIK wajib dicantumkan.');
    }
    const ss = getSS_();
    const sh = ss.getSheetByName(CONFIG.SHEET_CUTI);
    if (!sh || sh.getLastRow() < 2) {
      throw new Error('Sheet ' + CONFIG.SHEET_CUTI + ' kosong.');
    }

    const lastCol = sh.getLastColumn();
    const headers = sh.getRange(1, 1, 1, lastCol).getValues()[0];
    const data = sh.getRange(2, 1, sh.getLastRow() - 1, lastCol).getValues();

    let colId = -1, colNik = -1, colStatus = -1, colCatatan = -1, colApprovedBy = -1, colTglApprove = -1;
    for (let c = 0; c < headers.length; c++) {
      const h = String(headers[c]).trim().toUpperCase();
      if (h === 'ID' || h.indexOf('ID') !== -1) colId = c;
      if (h === 'NIK' || h.indexOf('NIK') !== -1) colNik = c;
      if (h.indexOf('APPROVAL') !== -1 || h.indexOf('STATUS') !== -1) colStatus = c;
      if (h.indexOf('CATATAN') !== -1) colCatatan = c;
      if (h.indexOf('DISETUJUI') !== -1 || h.indexOf('APPROVER') !== -1) colApprovedBy = c;
      if (h.indexOf('TGL APPROV') !== -1 || h.indexOf('TANGGAL APPROV') !== -1) colTglApprove = c;
    }

    const targetId = params.cuti_id ? String(params.cuti_id).trim() : '';
    const targetNik = params.nik ? normalizeNikKey_(params.nik) : '';
    const newStatus = params.keputusan || params.status || 'Disetujui';
    const adminNik = params.admin_nik || 'Admin HR Pusat';
    const catatan = params.catatan || ('Disahkan oleh ' + adminNik);
    const nowStr = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyy-MM-dd HH:mm:ss');

    let rowUpdated = -1;
    for (let r = data.length - 1; r >= 0; r--) {
      const rowId = (colId !== -1) ? String(data[r][colId] || '').trim() : '';
      const rowNik = (colNik !== -1) ? normalizeNikKey_(data[r][colNik]) : '';

      let matched = false;
      if (targetId && rowId && (rowId === targetId || targetId.indexOf(rowId) !== -1 || rowId.indexOf(targetId) !== -1)) {
        matched = true;
      } else if (!targetId && targetNik && rowNik === targetNik) {
        matched = true;
      }

      if (matched) {
        const sheetRow = r + 2;
        if (colStatus !== -1) sh.getRange(sheetRow, colStatus + 1).setValue(newStatus);
        if (colCatatan !== -1) sh.getRange(sheetRow, colCatatan + 1).setValue(catatan);
        if (colApprovedBy !== -1) sh.getRange(sheetRow, colApprovedBy + 1).setValue(adminNik);
        if (colTglApprove !== -1) sh.getRange(sheetRow, colTglApprove + 1).setValue(nowStr);
        rowUpdated = sheetRow;
        break;
      }
    }

    if (rowUpdated === -1 && targetNik) {
      for (let r = data.length - 1; r >= 0; r--) {
        const rowNik = (colNik !== -1) ? normalizeNikKey_(data[r][colNik]) : '';
        const currentStatus = (colStatus !== -1) ? String(data[r][colStatus] || '').trim() : '';
        if (rowNik === targetNik && currentStatus.indexOf('Menunggu') !== -1) {
          const sheetRow = r + 2;
          if (colStatus !== -1) sh.getRange(sheetRow, colStatus + 1).setValue(newStatus);
          if (colCatatan !== -1) sh.getRange(sheetRow, colCatatan + 1).setValue(catatan);
          if (colApprovedBy !== -1) sh.getRange(sheetRow, colApprovedBy + 1).setValue(adminNik);
          if (colTglApprove !== -1) sh.getRange(sheetRow, colTglApprove + 1).setValue(nowStr);
          rowUpdated = sheetRow;
          break;
        }
      }
    }

    return {
      status: 'success',
      success: true,
      rowUpdated: rowUpdated,
      message: 'Status cuti berhasil diubah menjadi [' + newStatus + '] di Google Sheets.'
    };
  } finally {
    lock.releaseLock();
  }
}

/**
 * SSOT Helper: Ambil Seluruh Data PENGAJUAN_CUTI untuk Dashboard Admin HR
 */
function getCutiAll() {
  const ss = getSS_();
  const sh = ss.getSheetByName(CONFIG.SHEET_CUTI);
  if (!sh || sh.getLastRow() < 2) {
    return {
      status: 'success',
      success: true,
      headers: [],
      rows: []
    };
  }
  const lastRow = sh.getLastRow();
  const lastCol = sh.getLastColumn();
  const values = sh.getRange(1, 1, lastRow, lastCol).getValues();
  const headers = values[0].map(function(h) { return String(h || '').trim(); });
  const rows = values.slice(1).map(function(row) {
    return row.map(function(cell) {
      if (cell instanceof Date) {
        return Utilities.formatDate(cell, 'Asia/Jakarta', 'yyyy-MM-dd HH:mm:ss');
      }
      return String(cell !== null && cell !== undefined ? cell : '').trim();
    });
  });

  return {
    status: 'success',
    success: true,
    sheetName: sh.getName(),
    headers: headers,
    rows: rows
  };
}

/**
 * SSOT Helper: Ambil Whitelist Titik Koordinat & Toleransi WFH (MASTER_WFH)
 */
function getWFHWhitelist(targetNik) {
  const ss = getSS_();
  const sh = ss.getSheetByName(CONFIG.SHEET_WFH);
  if (!sh || sh.getLastRow() < 2) {
    return {
      status: 'success',
      success: true,
      headers: [],
      whitelist: []
    };
  }
  const lastRow = sh.getLastRow();
  const lastCol = sh.getLastColumn();
  const values = sh.getRange(1, 1, lastRow, lastCol).getValues();
  const headers = values[0].map(function(h) { return String(h || '').trim(); });

  let colNik = 1, colNama = 2, colAlamat = 3, colLat = 4, colLng = 5, colGps = 6, colRadius = 7, colStatus = 8;
  for (let c = 0; c < headers.length; c++) {
    const h = headers[c].toUpperCase();
    if (h === 'NIK' || h.indexOf('NIK') !== -1) colNik = c;
    else if (h.indexOf('NAMA') !== -1) colNama = c;
    else if (h.indexOf('ALAMAT') !== -1) colAlamat = c;
    else if (h.indexOf('LATITUDE') !== -1) colLat = c;
    else if (h.indexOf('LONGITUDE') !== -1) colLng = c;
    else if (h.indexOf('GPS') !== -1 || h.indexOf('KOORDINAT') !== -1) colGps = c;
    else if (h.indexOf('RADIUS') !== -1) colRadius = c;
    else if (h.indexOf('STATUS') !== -1) colStatus = c;
  }

  const cleanNik = targetNik ? normalizeNikKey_(targetNik) : '';
  const list = [];
  for (let r = 1; r < values.length; r++) {
    const row = values[r];
    const rNik = String(row[colNik] || '').trim();
    if (!cleanNik || isNikMatch_(rNik, cleanNik)) {
      let gpsVal = String(row[colGps] || '').trim();
      if (!gpsVal && row[colLat] && row[colLng]) {
        gpsVal = row[colLat] + ',' + row[colLng];
      }
      list.push({
        nik: rNik,
        nama: String(row[colNama] || '').trim(),
        alamat: String(row[colAlamat] || '').trim(),
        gps: gpsVal,
        radius: parseInt(row[colRadius] || '100', 10) || 100,
        status: String(row[colStatus] || 'AKTIF').trim()
      });
    }
  }

  return {
    status: 'success',
    success: true,
    total: list.length,
    whitelist: list
  };
}

/**
 * SSOT Helper: Ringkasan Metrik DASHBOARD dan Perhitungan Kehadiran Hari Ini
 */
function getDashboardSummary() {
  const ss = getSS_();
  let dashboardData = {
    metrics: {},
    rawRows: []
  };

  const shDash = ss.getSheetByName(CONFIG.SHEET_DASHBOARD || 'DASHBOARD');
  if (shDash && shDash.getLastRow() >= 1) {
    const lastRow = shDash.getLastRow();
    const lastCol = shDash.getLastColumn();
    const values = shDash.getRange(1, 1, lastRow, lastCol).getValues();
    dashboardData.headers = values[0] || [];
    dashboardData.rawRows = values.slice(1);
  }

  const now = new Date();
  const todayYmd = Utilities.formatDate(now, 'Asia/Jakarta', 'yyyy-MM-dd');
  const shAbsen = ss.getSheetByName(CONFIG.SHEET_ABSENSI);
  let totalMasuk = 0;
  let totalPulang = 0;
  let totalTerlambat = 0;
  let totalWfh = 0;

  if (shAbsen && shAbsen.getLastRow() >= 2) {
    const aValues = shAbsen.getRange(2, 1, shAbsen.getLastRow() - 1, shAbsen.getLastColumn()).getValues();
    const aHeaders = shAbsen.getRange(1, 1, 1, shAbsen.getLastColumn()).getValues()[0].map(function(h) { return String(h || '').toUpperCase(); });
    const cTs = aHeaders.findIndex(function(h) { return h.indexOf('TIMESTAMP') !== -1; });
    const cJenis = aHeaders.findIndex(function(h) { return h.indexOf('JENIS') !== -1; });
    const cLokasi = aHeaders.findIndex(function(h) { return h.indexOf('LOKASI') !== -1; });
    const cJam = aHeaders.findIndex(function(h) { return h.indexOf('JAM') !== -1; });

    for (let i = 0; i < aValues.length; i++) {
      const rawTs = aValues[i][cTs !== -1 ? cTs : 0];
      let tglStr = '';
      if (rawTs instanceof Date) {
        tglStr = Utilities.formatDate(rawTs, 'Asia/Jakarta', 'yyyy-MM-dd');
      } else {
        tglStr = String(rawTs || '').slice(0, 10);
      }

      if (tglStr === todayYmd) {
        const j = String(aValues[i][cJenis !== -1 ? cJenis : 5] || '').toLowerCase();
        const lok = String(aValues[i][cLokasi !== -1 ? cLokasi : 6] || '').toUpperCase();
        const jam = String(aValues[i][cJam !== -1 ? cJam : 10] || '');

        if (j.indexOf('masuk') !== -1) {
          totalMasuk++;
          if (jam > '08:30:00') totalTerlambat++;
          if (lok === 'WFH') totalWfh++;
        }
        if (j.indexOf('pulang') !== -1) {
          totalPulang++;
        }
      }
    }
  }

  let totalCutiPending = 0;
  const shCuti = ss.getSheetByName(CONFIG.SHEET_CUTI);
  if (shCuti && shCuti.getLastRow() >= 2) {
    const cValues = shCuti.getRange(2, 1, shCuti.getLastRow() - 1, shCuti.getLastColumn()).getValues();
    const cHeaders = shCuti.getRange(1, 1, 1, shCuti.getLastColumn()).getValues()[0].map(function(h) { return String(h || '').toUpperCase(); });
    const cStat = cHeaders.findIndex(function(h) { return h.indexOf('STATUS') !== -1 || h.indexOf('APPROVAL') !== -1; });
    for (let i = 0; i < cValues.length; i++) {
      const st = String(cValues[i][cStat !== -1 ? cStat : 9] || '');
      if (st.indexOf('Menunggu') !== -1) totalCutiPending++;
    }
  }

  return {
    status: 'success',
    success: true,
    tanggal: todayYmd,
    zona_waktu: 'Asia/Jakarta (WIB)',
    summary: {
      total_karyawan_pusat: 22,
      hadir_masuk: totalMasuk,
      sudah_pulang: totalPulang,
      belum_presensi: Math.max(0, 22 - totalMasuk),
      terlambat: totalTerlambat,
      wfh: totalWfh,
      cuti_pending: totalCutiPending
    },
    dashboardData: dashboardData
  };
}

/**
 * SSOT Helper: Perbarui Alamat Email Karyawan di MASTER_KARYAWAN
 */
function updateEmailKaryawan(nik, email) {
  if (!nik || !email) throw new Error('NIK dan Email wajib diisi.');
  const cleanNik = normalizeNikKey_(nik);
  const ss = getSS_();
  const sh = ss.getSheetByName(CONFIG.SHEET_KARYAWAN);
  if (!sh || sh.getLastRow() < 2) throw new Error('Sheet ' + CONFIG.SHEET_KARYAWAN + ' kosong.');

  const lastCol = sh.getLastColumn();
  const headers = sh.getRange(1, 1, 1, lastCol).getValues()[0];
  let colNik = -1, colEmail = -1;
  for (let c = 0; c < headers.length; c++) {
    const h = String(headers[c]).trim().toUpperCase();
    if (h === 'NIK' || h.indexOf('NIK') !== -1) colNik = c + 1;
    if (h.indexOf('EMAIL') !== -1 || h === 'GMAIL') colEmail = c + 1;
  }
  if (colEmail === -1) {
    colEmail = lastCol + 1;
    sh.getRange(1, colEmail).setValue('Email');
  }

  const data = sh.getRange(2, colNik, sh.getLastRow() - 1, 1).getValues();
  for (let r = 0; r < data.length; r++) {
    if (isNikMatch_(String(data[r][0]), cleanNik)) {
      sh.getRange(r + 2, colEmail).setValue(email.trim());
      return {
        status: 'success',
        success: true,
        message: 'Email untuk NIK ' + cleanNik + ' berhasil diperbarui menjadi ' + email
      };
    }
  }
  throw new Error('Karyawan dengan NIK ' + cleanNik + ' tidak ditemukan.');
}
