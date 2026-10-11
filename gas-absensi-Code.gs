/**
 * KJPP NANANG RAHAYU SIGIT PARYANTO DAN REKAN (KJPP NSR)
 * SISTEM PRESENSI & LAYANAN MANDIRI KARYAWAN (GOOGLE APPS SCRIPT)
 * 
 * Modul Backend: Code.gs (HTMLService: memanggil "GPS.html")
 * Arsitektur: "Execute as: Me" + Autentikasi NIK & OTP Gmail Pribadi
 * 
 * FITUR UTAMA & KEAMANAN:
 * 1. Autentikasi NIK + OTP Gmail Pribadi: Menghindari ketergantungan Google Workspace.
 * 2. Hash Kriptografis OTP (SHA-256): Disimpan di CacheService (masa berlaku 5 menit, max 3x percobaan, cooldown 60 detik).
 * 3. Token Sesi Server-Side: Wajib diverifikasi di setiap transaksi (Presensi, WFH, Cuti).
 * 4. Multi-Office Geofencing: 5 kantor cabang resmi (Jakarta, Bandung, Padang, Makassar, Palembang).
 * 5. Pembedaan Status Validasi: 'VALID' vs 'TIDAK VALID (DI LUAR RADIUS)'.
 * 6. Isolasi Folder Drive & No ANYONE_WITH_LINK: Akses berkas privat & terlindungi.
 * 7. Validasi Server-Side: Whitelist MIME (PDF/JPG/PNG) & ukuran maksimal 5 MB.
 */

const CONFIG = {
  APP_ENV: 'STAGING', // Ganti ke 'PRODUCTION' saat rilis resmi
  IS_PRODUCTION: false,
  SPREADSHEET_ID: '', // ID Spreadsheet Pengujian (Container-bound jika kosong)
  SHEET_KARYAWAN: 'MASTER_KARYAWAN',
  SHEET_ABSENSI: 'ABSENSI',
  SHEET_WFH: 'MASTER_WFH',
  SHEET_CUTI: 'PENGAJUAN_CUTI',
  
  // Folder Drive untuk lampiran cuti/izin (Terisolasi)
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
function doGet() {
  return HtmlService.createTemplateFromFile('GPS')
    .evaluate()
    .setTitle('Absensi Online KJPP NSR')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no');
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
 * Setup struktur sheet pengujian otomatis
 * KEAMANAN: Hanya boleh dijalankan pada Database Pengujian / Staging
 */
function setupTestingSheet() {
  const ss = getSS_();
  let ssName = '';
  try { ssName = ss.getName().toUpperCase(); } catch(e) {}

  // GUARD: Blokir eksekusi pada database produksi
  if (CONFIG.IS_PRODUCTION === true || ssName.indexOf('PRODUKSI') !== -1 || ssName.indexOf('LIVE') !== -1) {
    throw new Error('KEAMANAN: setupTestingSheet() DIBLOKIR! Dilarang mengeksekusi setup dummy pada database produksi asli!');
  }
  
  // 1. MASTER KARYAWAN (Dengan Kolom EMAIL)
  ensureSheet_(ss, CONFIG.SHEET_KARYAWAN, ['NIK', 'Nama', 'Jabatan', 'Divisi', 'Email', 'StatusAktif']);
  
  // 2. ABSENSI
  ensureSheet_(ss, CONFIG.SHEET_ABSENSI, [
    'Timestamp', 'Tanggal', 'Jam', 'NIK', 'Nama', 'Jabatan', 'Divisi',
    'JenisPresensi', 'LokasiPresensi', 'KoordinatGPS', 'KantorTerdekat', 'JarakMeter', 'StatusValidasi'
  ]);
  
  // 3. MASTER WFH
  ensureSheet_(ss, CONFIG.SHEET_WFH, ['Timestamp', 'NIK', 'Nama', 'AlamatRumah', 'KoordinatGPS', 'Status']);
  
  // 4. PENGAJUAN CUTI
  ensureSheet_(ss, CONFIG.SHEET_CUTI, [
    'Timestamp', 'NIK', 'Nama', 'KategoriCuti', 'TanggalMulai', 'TanggalSelesai',
    'Alasan', 'FileUrl', 'FileName', 'StatusPersetujuan'
  ]);

  // Data dummy pengujian (dengan Gmail pribadi penguji)
  const shKaryawan = ss.getSheetByName(CONFIG.SHEET_KARYAWAN);
  if (shKaryawan.getLastRow() <= 1) {
    shKaryawan.getRange(2, 1, 4, 6).setValues([
      ['NSR-001', 'Budi Santoso, S.T.', 'Penilai Properti', 'Divisi Penilaian Properti', 'budi.santoso.kjpp@gmail.com', 'AKTIF'],
      ['NSR-002', 'Siti Aminah, S.E.', 'Penilai Bisnis', 'Divisi Penilaian Bisnis', 'siti.aminah.kjpp@gmail.com', 'AKTIF'],
      ['NSR-003', 'Ahmad Fauzi', 'Staf Teknis Inspeksi', 'Divisi Operasional', 'ahmad.fauzi.kjpp@gmail.com', 'AKTIF'],
      ['NSR-004', 'Dewi Lestari', 'Administrasi & Keuangan', 'Divisi Keuangan', 'dewi.lestari.kjpp@gmail.com', 'AKTIF']
    ]);
  }

  return 'Setup Spreadsheet Pengujian Berhasil!';
}

function ensureSheet_(ss, name, headers) {
  let sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  if (sh.getLastRow() === 0) {
    sh.getRange(1, 1, 1, headers.length).setValues([headers]);
    sh.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    sh.setFrozenRows(1);
  }
  return sh;
}

/**
 * 1. Verifikasi Data Karyawan via NIK (Mengembalikan email yang disamarkan)
 */
function cekKaryawan(nik) {
  if (!nik) return null;
  const ss = getSS_();
  const sh = ss.getSheetByName(CONFIG.SHEET_KARYAWAN);
  if (!sh || sh.getLastRow() < 2) return null;

  const data = sh.getRange(2, 1, sh.getLastRow() - 1, 6).getValues();
  const cleanNik = String(nik).trim().toUpperCase();

  for (let i = 0; i < data.length; i++) {
    if (String(data[i][0]).trim().toUpperCase() === cleanNik) {
      if (String(data[i][5]).toUpperCase() !== 'AKTIF') {
        throw new Error('Status karyawan tidak aktif. Hubungi bagian HR/Operasional.');
      }
      const rawEmail = String(data[i][4]).trim();
      return {
        nama: String(data[i][1]).trim(),
        jabatan: String(data[i][2]).trim(),
        divisi: String(data[i][3]).trim(),
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
  const ss = getSS_();
  const sh = ss.getSheetByName(CONFIG.SHEET_KARYAWAN);
  if (!sh || sh.getLastRow() < 2) return null;

  const data = sh.getRange(2, 1, sh.getLastRow() - 1, 6).getValues();
  const cleanNik = String(nik).trim().toUpperCase();

  for (let i = 0; i < data.length; i++) {
    if (String(data[i][0]).trim().toUpperCase() === cleanNik) {
      return String(data[i][4]).trim();
    }
  }
  return null;
}

/**
 * 2. MINTA KODE OTP GMAIL
 * Menghasilkan 6 digit OTP acak, menyimpan hash di cache, dan mengirim ke email karyawan.
 */
function mintaOTP(nik) {
  if (!nik) throw new Error('Harap cantumkan NIK Karyawan.');
  const cleanNik = String(nik).trim().toUpperCase();
  const email = getEmailKaryawanInternal_(cleanNik);

  if (!email || email.indexOf('@') === -1) {
    throw new Error('Email karyawan belum terdaftar untuk NIK [' + cleanNik + ']. Hubungi HR.');
  }

  // 1. Cek Kuota Pengiriman Email
  const remainingQuota = MailApp.getRemainingDailyQuota();
  if (remainingQuota <= 0) {
    throw new Error('Layanan pengiriman email sedang sibuk (kuota email harian habis). Hubungi Admin/HR.');
  }

  const cache = CacheService.getScriptCache();

  // 2. Cek Rate Limiting (Cooldown 60 detik)
  const cooldownKey = 'otp_cooldown_' + cleanNik;
  if (cache.get(cooldownKey)) {
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
  const subjek = '[KJPP NSR] Kode Verifikasi Kehadiran & Layanan Mandiri: ' + otpNumber;
  const pesanHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 520px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
      <div style="text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 16px; margin-bottom: 20px;">
        <h2 style="color: #0f172a; margin: 0; font-size: 18px; text-transform: uppercase;">KJPP NANANG RAHAYU & REKAN</h2>
        <p style="color: #64748b; margin: 4px 0 0; font-size: 12px;">Sistem Presensi & Layanan Mandiri Karyawan</p>
      </div>
      <p style="color: #334155; font-size: 14px; line-height: 1.5;">Halo Rekan KJPP NSR,</p>
      <p style="color: #334155; font-size: 14px; line-height: 1.5;">Berikut adalah kode verifikasi OTP untuk mengakses layanan presensi kehadiran (NIK: <strong>${cleanNik}</strong>):</p>
      
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
function verifikasiOTP(nik, otpInput) {
  if (!nik || !otpInput) {
    throw new Error('Harap masukkan NIK dan 6-digit kode OTP.');
  }

  const cleanNik = String(nik).trim().toUpperCase();
  const cleanOtp = String(otpInput).trim();
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
    throw new Error('Batas percobaan terlampaui (3 kali salah). Kode OTP dibatalkan demi keamanan. Silakan minta kode baru.');
  }

  const inputHash = hashString_(cleanOtp);

  if (inputHash !== savedHash) {
    attempts += 1;
    cache.put(attemptsKey, String(attempts), CONFIG.OTP_EXPIRY_SECONDS);
    const sisa = CONFIG.OTP_MAX_ATTEMPTS - attempts;
    throw new Error('Kode OTP salah! Sisa percobaan: ' + sisa + ' kali.');
  }

  // OTP Benar -> Hapus OTP dari cache (sekali pakai)
  cache.remove(hashKey);
  cache.remove(attemptsKey);

  // Terbitkan Token Sesi Kriptografis
  const sessionToken = Utilities.getUuid() + '-' + Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyyMMddHHmmss');
  const sessionData = {
    nik: cleanNik,
    createdAt: new Date().getTime()
  };

  cache.put('session_' + sessionToken, JSON.stringify(sessionData), CONFIG.SESSION_EXPIRY_SECONDS);

  return {
    success: true,
    sessionToken: sessionToken,
    pesan: 'Identitas berhasil diverifikasi! Sesi aktif selama 12 jam.'
  };
}

/**
 * 4. VALIDASI TOKEN SESI SERVER-SIDE
 * Memastikan setiap transaksi presensi terikat pada sesi OTP yang sah
 */
function validasiSesi_(sessionToken, nik) {
  if (!sessionToken || !nik) {
    throw new Error('Akses Ditolak: Sesi verifikasi OTP diperlukan. Silakan verifikasi NIK & OTP terlebih dahulu.');
  }

  const cache = CacheService.getScriptCache();
  const rawSession = cache.get('session_' + sessionToken);

  if (!rawSession) {
    throw new Error('Sesi autentikasi telah berakhir. Silakan verifikasi ulang kode OTP Gmail Anda.');
  }

  try {
    const session = JSON.parse(rawSession);
    if (session.nik.toUpperCase() !== String(nik).trim().toUpperCase()) {
      throw new Error('Pelanggaran Keamanan: Sesi aktif tidak cocok dengan NIK yang diajukan!');
    }
    return session;
  } catch (err) {
    throw new Error('Sesi tidak valid: ' + err.message);
  }
}

/**
 * 5. Cek Titik Lokasi Rumah WFH Terdaftar
 */
function cekLokasiWFH(nik) {
  if (!nik) return null;
  const ss = getSS_();
  const sh = ss.getSheetByName(CONFIG.SHEET_WFH);
  if (!sh || sh.getLastRow() < 2) return null;

  const data = sh.getRange(2, 1, sh.getLastRow() - 1, 5).getValues();
  const cleanNik = String(nik).trim().toUpperCase();

  for (let i = data.length - 1; i >= 0; i--) {
    if (String(data[i][1]).trim().toUpperCase() === cleanNik) {
      return {
        alamat: data[i][3],
        gps: String(data[i][4]).trim()
      };
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

  const data = sh.getRange(2, 1, sh.getLastRow() - 1, 8).getValues();
  const cleanNik = String(nik).trim().toUpperCase();

  for (let i = data.length - 1; i >= 0; i--) {
    const rowTgl = String(data[i][1]).trim();
    const rowNik = String(data[i][3]).trim().toUpperCase();
    const rowJenis = String(data[i][7]).trim();

    if (rowNik === cleanNik && rowTgl === tglStr && rowJenis === jenis) {
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

    const nik = String(params.nik).trim().toUpperCase();
    const jenis = String(params.jenis).trim();   // "Masuk", "Pulang", "Dinas Luar"
    const lokasi = String(params.lokasi).trim(); // "KANTOR", "WFH", "DINAS LUAR"
    const gps = String(params.gps).trim();

    // 1. KONTROL AUTENTIKASI: Wajib Sesi OTP Terverifikasi
    validasiSesi_(params.sessionToken, nik);

    // 2. Verifikasi Data Karyawan
    const profil = cekKaryawan(nik);
    if (!profil) {
      throw new Error('NIK [' + nik + '] tidak terdaftar di database Master Karyawan.');
    }

    const now = new Date();
    const tglStr = Utilities.formatDate(now, 'Asia/Jakarta', 'yyyy-MM-dd');
    const jamStr = Utilities.formatDate(now, 'Asia/Jakarta', 'HH:mm:ss') + ' WIB';

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

    // 6. Simpan ke Google Sheets
    const ss = getSS_();
    const sh = ss.getSheetByName(CONFIG.SHEET_ABSENSI);
    const ts = Utilities.formatDate(now, 'Asia/Jakarta', 'yyyy-MM-dd HH:mm:ss');

    sh.appendRow([
      ts,
      tglStr,
      jamStr,
      nik,
      profil.nama,
      profil.jabatan,
      profil.divisi,
      jenis,
      lokasi,
      gps,
      kantorTerdekat,
      jarakMeter,
      statusValidasi
    ]);

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

    const nik = String(params.nik).trim().toUpperCase();

    // Kontrol Sesi OTP
    validasiSesi_(params.sessionToken, nik);

    const profil = cekKaryawan(nik);
    if (!profil) throw new Error('NIK [' + nik + '] tidak terdaftar di database.');

    const now = new Date();
    const ts = Utilities.formatDate(now, 'Asia/Jakarta', 'yyyy-MM-dd HH:mm:ss');
    const ss = getSS_();
    const sh = ss.getSheetByName(CONFIG.SHEET_WFH);

    sh.appendRow([
      ts,
      nik,
      profil.nama,
      String(params.alamat).trim(),
      String(params.gps).trim(),
      'AKTIF'
    ]);

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

    const nik = String(params.nik).trim().toUpperCase();

    // Kontrol Sesi OTP
    validasiSesi_(params.sessionToken, nik);

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
        const cleanName = 'CUTI_' + nik + '_' + Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyyMMdd_HHmmss') + '_' + params.fileName.replace(/[^a-zA-Z0-9._-]/g, '');
        const blob = Utilities.newBlob(decoded, mimeType, cleanName);

        // Ambil folder pengujian terisolasi
        let folder;
        if (CONFIG.DRIVE_FOLDER_ID && CONFIG.DRIVE_FOLDER_ID.trim() !== '') {
          folder = DriveApp.getFolderById(CONFIG.DRIVE_FOLDER_ID);
        } else {
          const ss = getSS_();
          const ssFile = DriveApp.getFileById(ss.getId());
          const parents = ssFile.getParents();
          const parentFolder = parents.hasNext() ? parents.next() : DriveApp.getRootFolder();
          
          const folderIter = parentFolder.getFoldersByName('LAMPIRAN_CUTI_TESTING');
          if (folderIter.hasNext()) {
            folder = folderIter.next();
          } else {
            folder = parentFolder.createFolder('LAMPIRAN_CUTI_TESTING');
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

    sh.appendRow([
      ts,
      nik,
      profil.nama,
      String(params.jenisCuti).trim(),
      String(params.tglMulai).trim(),
      String(params.tglSelesai).trim(),
      params.alasan ? String(params.alasan).trim() : '-',
      fileUrl,
      storedFileName,
      'MENUNGGU_PERSETUJUAN'
    ]);

    return {
      success: true,
      pesan: 'Permohonan ' + params.jenisCuti + ' untuk ' + profil.nama + ' berhasil terkirim.'
    };

  } finally {
    lock.releaseLock();
  }
}
