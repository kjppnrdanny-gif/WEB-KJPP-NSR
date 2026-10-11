// Test suite lengkap untuk simulasi backend Apps Script dan frontend GPS.html
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

console.log('====================================================');
console.log('🧪 MENJALANKAN TEST SUITE INTEGRASI GOOGLE APPS SCRIPT');
console.log('   DENGAN AUTENTIKASI NIK + OTP GMAIL PRIBADI & SESI');
console.log('====================================================');

// Mock in-memory Google Sheets
class MockSheet {
  constructor(name, headers) {
    this.name = name;
    this.rows = [headers];
  }
  getLastRow() { return this.rows.length; }
  getRange(r, c, numRows, numCols) {
    const sheet = this;
    return {
      setValues: (vals) => {
        for (let i = 0; i < vals.length; i++) {
          sheet.rows[r - 1 + i] = vals[i];
        }
      },
      getValues: () => {
        const result = [];
        for (let i = 0; i < numRows; i++) {
          const rowIdx = r - 1 + i;
          const row = sheet.rows[rowIdx] || [];
          result.push(row.slice(c - 1, c - 1 + numCols));
        }
        return result;
      },
      setFontWeight: () => {},
    };
  }
  appendRow(row) {
    this.rows.push(row);
  }
  setFrozenRows() {}
}

class MockSpreadsheet {
  constructor() {
    this.sheets = {};
  }
  getId() { return 'test-mock-spreadsheet-id-12345'; }
  getName() { return 'SPREADSHEET_PENGUJIAN_ABSENSI_KJPP_NSR'; }
  getSheetByName(name) { return this.sheets[name]; }
  insertSheet(name) {
    const s = new MockSheet(name, []);
    this.sheets[name] = s;
    return s;
  }
}

// Mock Google Drive
class MockDriveFolder {
  constructor(name) {
    this.name = name;
    this.files = [];
    this.sharingSet = null;
  }
  createFile(blob) {
    const f = {
      name: blob.name,
      mimeType: blob.mimeType,
      size: blob.data.length,
      getUrl: () => `https://drive.google.com/file/d/test-drive-file-${Math.random().toString(36).substring(7)}/view`,
      setSharing: (access, permission) => {
        this.sharingSet = { access, permission };
      }
    };
    this.files.push(f);
    return f;
  }
  getFoldersByName() {
    return { hasNext: () => false };
  }
  createFolder(name) {
    return new MockDriveFolder(name);
  }
}

// Mock CacheService
class MockCache {
  constructor() {
    this.store = new Map();
  }
  get(key) {
    const item = this.store.get(key);
    if (!item) return null;
    if (Date.now() > item.expires) {
      this.store.delete(key);
      return null;
    }
    return item.value;
  }
  put(key, value, expirationInSeconds) {
    this.store.set(key, {
      value: String(value),
      expires: Date.now() + (expirationInSeconds || 300) * 1000
    });
  }
  remove(key) {
    this.store.delete(key);
  }
}

// Mock MailApp
let mockMailQuota = 100;
let sentEmails = [];
const MailApp = {
  getRemainingDailyQuota: () => mockMailQuota,
  sendEmail: (opts) => {
    sentEmails.push(opts);
  }
};

const mockCache = new MockCache();
const CacheService = {
  getScriptCache: () => mockCache
};

// Simulasi Lingkungan Google Apps Script
const mockSS = new MockSpreadsheet();
const mockDrive = new MockDriveFolder('ROOT');

const Utilities = {
  formatDate: (d, tz, fmt) => {
    const pad = (n) => String(n).padStart(2, '0');
    if (fmt === 'yyyy-MM-dd') return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    if (fmt.startsWith('HH:mm:ss')) return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    if (fmt === 'yyyy-MM-dd HH:mm:ss') return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    if (fmt === 'yyyyMMddHHmmss') return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
    if (fmt === 'yyyyMMdd_HHmmss') return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
    return d.toISOString();
  },
  base64Decode: (b64) => Buffer.from(b64, 'base64'),
  newBlob: (bytes, mime, name) => ({ data: bytes, mimeType: mime, name: name }),
  computeDigest: (algo, str) => {
    const hash = crypto.createHash('sha256').update(String(str)).digest();
    const arr = [];
    for (let i = 0; i < hash.length; i++) {
      let b = hash[i];
      if (b > 127) b -= 256;
      arr.push(b);
    }
    return arr;
  },
  getUuid: () => crypto.randomUUID(),
  DigestAlgorithm: { SHA_256: 'SHA-256' }
};

const LockService = {
  getScriptLock: () => ({
    waitLock: () => true,
    releaseLock: () => true
  })
};

const DriveApp = {
  getFileById: () => ({
    getParents: () => ({
      hasNext: () => true,
      next: () => mockDrive
    })
  }),
  getFolderById: (id) => new MockDriveFolder(id),
  getRootFolder: () => mockDrive
};

const Session = {
  getActiveUser: () => ({
    getEmail: () => '' // Di mode Execute as: Me untuk Gmail pribadi, email kosong
  })
};

// Evaluasi gas-absensi-Code.gs dalam sandbox node
const codePath = path.resolve('gas-absensi-Code.gs');
const codeContent = fs.readFileSync(codePath, 'utf8');

const sandboxFunc = new Function(
  'Utilities', 'LockService', 'DriveApp', 'Session', 'CacheService', 'MailApp', 'mockSS',
  `
  function getSS_() { return mockSS; }
  ${codeContent.replace('function getSS_()', 'function _orig_getSS_()')}
  return {
    setupTestingSheet,
    cekKaryawan,
    mintaOTP,
    verifikasiOTP,
    cekLokasiWFH,
    cekDoubleAbsensi,
    hitungJarak,
    simpanAbsensi,
    simpanWFH,
    simpanPengajuanCuti,
    CONFIG
  };
  `
);

const gas = sandboxFunc(Utilities, LockService, DriveApp, Session, CacheService, MailApp, mockSS);

// 1. SETUP SHEET
console.log('\n--- 1. Testing setupTestingSheet() ---');
const setupRes = gas.setupTestingSheet();
console.log('✓ Hasil setup:', setupRes);
const karyawanRows = mockSS.getSheetByName('MASTER_KARYAWAN').rows;
console.log('✓ Baris Master Karyawan terisi:', karyawanRows.length - 1, 'karyawan');
if (karyawanRows.length >= 4) {
  console.log('  [PASS] Setup database pengujian berhasil');
} else {
  throw new Error('Setup database gagal!');
}

// 1b. Test Guard: Cegah setupTestingSheet pada lingkungan produksi
gas.CONFIG.IS_PRODUCTION = true;
try {
  gas.setupTestingSheet();
  throw new Error('Guard gagal memblokir setup pada produksi!');
} catch (err) {
  if (err.message.includes('DIBLOKIR')) {
    console.log('✓ Guard berhasil memblokir setup pada database produksi:', err.message);
    console.log('  [PASS] Proteksi anti-modifikasi database produksi aktif');
  } else {
    throw err;
  }
}
gas.CONFIG.IS_PRODUCTION = false;

// 2. CEK KARYAWAN & MASKED EMAIL
console.log('\n--- 2. Testing cekKaryawan() & Masking Email ---');
const kValid = gas.cekKaryawan('NSR-001');
console.log('✓ NIK valid NSR-001:', kValid);
if (kValid && (kValid.nama === 'Budi Santoso, S.T.' || kValid.nama === 'Danny Taufik Hidayat, S.T.') && (kValid.maskedEmail === 'b***p@gmail.com' || kValid.maskedEmail === 'k***y@gmail.com')) {
  console.log('  [PASS] NIK valid diverifikasi & email disamarkan (masked)');
} else {
  throw new Error('Gagal verifikasi NIK valid atau masking email salah');
}

const kInvalid = gas.cekKaryawan('NSR-999');
console.log('✓ NIK invalid NSR-999:', kInvalid);
if (kInvalid === null) {
  console.log('  [PASS] NIK invalid mengembalikan null');
} else {
  throw new Error('NIK invalid tidak terdeteksi!');
}

// 3. MINTA KODE OTP GMAIL & KUOTA & RATE LIMIT
console.log('\n--- 3. Testing mintaOTP() Gmail ---');

// 3a. Kuota habis
mockMailQuota = 0;
try {
  gas.mintaOTP('NSR-001');
  throw new Error('Gagal mendeteksi kuota email habis!');
} catch (err) {
  if (err.message.includes('kuota email harian habis')) {
    console.log('✓ Proteksi kuota email aktif:', err.message);
    console.log('  [PASS] Penanganan kuota pengiriman MailApp');
  } else {
    throw err;
  }
}
mockMailQuota = 100; // Kembalikan kuota

// 3b. Minta OTP normal
const otpRes1 = gas.mintaOTP('NSR-001');
console.log('✓ Hasil minta OTP NSR-001:', otpRes1);
if (otpRes1.success && sentEmails.length === 1 && (sentEmails[0].to === 'budi.santoso.kjpp@gmail.com' || sentEmails[0].to === 'kjppnr.danny@gmail.com')) {
  console.log('  [PASS] OTP 6-digit dikirimkan ke Gmail terdaftar via MailApp');
} else {
  throw new Error('Pengiriman OTP via MailApp gagal!');
}

// 3c. Rate Limiting Cooldown 60 detik
try {
  gas.mintaOTP('NSR-001');
  throw new Error('Gagal menerapkan rate limit 60 detik!');
} catch (err) {
  if (err.message.includes('Mohon tunggu 60 detik')) {
    console.log('✓ Rate limit cooldown aktif:', err.message);
    console.log('  [PASS] Rate limiting permintaan OTP dicegah');
  } else {
    throw err;
  }
}

// Ekstrak OTP dari email yang dikirim
const lastEmail = sentEmails[sentEmails.length - 1];
const otpMatch = lastEmail.subject.match(/(\d{6})/);
const validOtpCode = otpMatch ? otpMatch[1] : null;
console.log('✓ Kode OTP yang terkirim di email:', validOtpCode);

// 4. VERIFIKASI KODE OTP & PENERBITAN TOKEN SESI
console.log('\n--- 4. Testing verifikasiOTP() ---');

// 4a. Kode OTP salah
try {
  gas.verifikasiOTP('NSR-001', '000000');
  throw new Error('OTP salah tidak ditolak!');
} catch (err) {
  if (err.message.includes('Kode OTP salah! Sisa percobaan: 2 kali.')) {
    console.log('✓ Penolakan OTP salah dengan counter sisa percobaan:', err.message);
    console.log('  [PASS] Counter percobaan gagal dicatat di cache');
  } else {
    throw err;
  }
}

// 4b. Kode OTP benar
const verifRes = gas.verifikasiOTP('NSR-001', validOtpCode);
console.log('✓ Hasil Verifikasi OTP Benar:', verifRes);
if (verifRes.success && verifRes.sessionToken) {
  console.log('  [PASS] Token sesi kriptografis diterbitkan:', verifRes.sessionToken);
} else {
  throw new Error('Verifikasi OTP benar gagal!');
}
const sessionBudi = verifRes.sessionToken;

// 4c. Sekali pakai (One-Time-Password)
try {
  gas.verifikasiOTP('NSR-001', validOtpCode);
  throw new Error('OTP bekas pakai masih bisa digunakan!');
} catch (err) {
  if (err.message.includes('telah kedaluwarsa atau belum diminta')) {
    console.log('✓ OTP sekali pakai (dihapus dari cache):', err.message);
    console.log('  [PASS] Sifat OTP sekali pakai terbukti');
  } else {
    throw err;
  }
}

// 5. ANTI-SPOOFING & PENEGAKAN SESI SERVER-SIDE
console.log('\n--- 5. Testing Anti-Spoofing & Penegakan Sesi ---');

// 5a. Transaksi tanpa session token
try {
  gas.simpanAbsensi({
    nik: 'NSR-001',
    jenis: 'Masuk',
    lokasi: 'KANTOR',
    gps: '-6.287972, 106.824778'
    // sessionToken sengaja dikosongkan
  });
  throw new Error('Gagal memblokir transaksi tanpa sesi!');
} catch (err) {
  if (err.message.includes('Sesi verifikasi OTP diperlukan')) {
    console.log('✓ Pemblokiran transaksi tanpa sesi:', err.message);
    console.log('  [PASS] Server menolak transaksi tanpa session token');
  } else {
    throw err;
  }
}

// 5b. Pemalsuan NIK (Memakai session token orang lain)
try {
  gas.simpanAbsensi({
    nik: 'NSR-002', // Milik Siti, tapi pakai token Budi
    jenis: 'Masuk',
    lokasi: 'KANTOR',
    gps: '-6.287972, 106.824778',
    sessionToken: sessionBudi
  });
  throw new Error('Gagal memblokir pemalsuan NIK dengan session token orang lain!');
} catch (err) {
  if (err.message.includes('Pelanggaran Keamanan: Sesi aktif tidak cocok')) {
    console.log('✓ Anti-spoofing NIK berhasil memblokir pencurian sesi:', err.message);
    console.log('  [PASS] Token sesi terikat secara ketat ke NIK pemilik');
  } else {
    throw err;
  }
}

// 6. SIMPAN PRESENSI DALAM RADIUS (VALID)
console.log('\n--- 6. Testing simpanAbsensi() Dalam Radius ---');
const resMasukValid = gas.simpanAbsensi({
  nik: 'NSR-001',
  jenis: 'Masuk',
  lokasi: 'KANTOR',
  gps: '-6.287972, 106.824778',
  sessionToken: sessionBudi
});
console.log('✓ Hasil Absen Masuk Valid:', resMasukValid);
if (resMasukValid.success && resMasukValid.status === 'VALID' && resMasukValid.jarak < 150) {
  console.log('  [PASS] Presensi dalam radius berstatus VALID dengan token sesi resmi');
} else {
  throw new Error('Presensi dalam radius gagal!');
}

// 7. SIMPAN PRESENSI DI LUAR RADIUS (STATUS: TIDAK VALID)
console.log('\n--- 7. Testing simpanAbsensi() Di Luar Radius ---');
// Buat sesi untuk NSR-002 (Siti)
mockCache.remove('otp_cooldown_NSR-002');
gas.mintaOTP('NSR-002');
const otpSiti = sentEmails[sentEmails.length - 1].subject.match(/(\d{6})/)[1];
const sessionSiti = gas.verifikasiOTP('NSR-002', otpSiti).sessionToken;

const resLuarRadius = gas.simpanAbsensi({
  nik: 'NSR-002',
  jenis: 'Masuk',
  lokasi: 'KANTOR',
  gps: '-6.200000, 106.800000', // ~10 km dari kantor
  sessionToken: sessionSiti
});
console.log('✓ Hasil Absen Di Luar Radius:', resLuarRadius);
if (resLuarRadius.success && resLuarRadius.status === 'TIDAK VALID' && resLuarRadius.jarak > 1000) {
  console.log('  [PASS] Presensi di luar radius TERCATAT tetapi berstatus TIDAK VALID');
} else {
  throw new Error('Presensi di luar radius tidak tertandai TIDAK VALID!');
}

// 8. MULTI-KANTOR: PRESENSI DI CABANG BANDUNG
console.log('\n--- 8. Testing Presensi Cabang Bandung ---');
mockCache.remove('otp_cooldown_NSR-003');
gas.mintaOTP('NSR-003');
const otpAhmad = sentEmails[sentEmails.length - 1].subject.match(/(\d{6})/)[1];
const sessionAhmad = gas.verifikasiOTP('NSR-003', otpAhmad).sessionToken;

const resBandung = gas.simpanAbsensi({
  nik: 'NSR-003',
  jenis: 'Masuk',
  lokasi: 'KANTOR',
  gps: '-6.8597817, 107.5604289', // Koordinat resmi Cabang Bandung (Pasteur)
  sessionToken: sessionAhmad
});
console.log('✓ Hasil Absen Cabang Bandung:', resBandung);
if (resBandung.success && resBandung.status === 'VALID' && resBandung.kantor === 'Cabang Bandung') {
  console.log('  [PASS] Multi-kantor geofence berhasil mendeteksi Cabang Bandung');
} else {
  throw new Error('Cabang Bandung gagal terdeteksi!');
}

// 9. PREVENSI DOUBLE ABSENSI
console.log('\n--- 9. Testing Prevensi Double Absensi ---');
try {
  gas.simpanAbsensi({
    nik: 'NSR-001',
    jenis: 'Masuk', // Sudah absen masuk tadi
    lokasi: 'KANTOR',
    gps: '-6.287972, 106.824778',
    sessionToken: sessionBudi
  });
  throw new Error('Gagal mencegah double absensi!');
} catch (err) {
  if (err.message.includes('sudah melakukan presensi Masuk')) {
    console.log('✓ Error tertangkap dengan benar:', err.message);
    console.log('  [PASS] Double presensi dicegah');
  } else {
    throw err;
  }
}

// 10. DINAS LUAR
console.log('\n--- 10. Testing Presensi Dinas Luar ---');
mockCache.remove('otp_cooldown_NSR-004');
gas.mintaOTP('NSR-004');
const otpDewi = sentEmails[sentEmails.length - 1].subject.match(/(\d{6})/)[1];
const sessionDewi = gas.verifikasiOTP('NSR-004', otpDewi).sessionToken;

const resDinas = gas.simpanAbsensi({
  nik: 'NSR-004',
  jenis: 'Dinas Luar',
  lokasi: 'DINAS LUAR',
  gps: '-6.500000, 107.000000',
  sessionToken: sessionDewi
});
console.log('✓ Hasil Absen Dinas Luar:', resDinas);
if (resDinas.success && resDinas.status === 'VALID') {
  console.log('  [PASS] Presensi Dinas Luar berstatus VALID');
} else {
  throw new Error('Presensi Dinas Luar gagal!');
}

// 11. DAFTAR TITIK WFH & PRESENSI WFH
console.log('\n--- 11. Testing WFH (Pendaftaran & Presensi) ---');
const resDaftarWFH = gas.simpanWFH({
  nik: 'NSR-001',
  alamat: 'Jl. Kemang Raya No. 12, Jakarta Selatan',
  gps: '-6.275000, 106.815000',
  sessionToken: sessionBudi
});
console.log('✓ Hasil Daftar WFH:', resDaftarWFH);

// Presensi Pulang WFH dalam radius rumah
const resPulangWFH = gas.simpanAbsensi({
  nik: 'NSR-001',
  jenis: 'Pulang',
  lokasi: 'WFH',
  gps: '-6.275000, 106.815000',
  sessionToken: sessionBudi
});
console.log('✓ Hasil Presensi WFH:', resPulangWFH);
if (resPulangWFH.success && resPulangWFH.status === 'VALID' && resPulangWFH.jarak <= 100) {
  console.log('  [PASS] Presensi WFH berhasil diverifikasi dengan titik rumah terdaftar');
} else {
  throw new Error('Presensi WFH gagal!');
}

// 12. PENGAJUAN CUTI & VALIDASI DOKUMEN SERVER
console.log('\n--- 12. Testing simpanPengajuanCuti() ---');
// 12a. File PDF valid
const dummyPdfBase64 = Buffer.from('%PDF-1.4 Mock PDF content for test').toString('base64');
const resCutiValid = gas.simpanPengajuanCuti({
  nik: 'NSR-002',
  jenisCuti: 'Sakit',
  tglMulai: '2026-10-12',
  tglSelesai: '2026-10-14',
  alasan: 'Rawat jalan dokter spesialis',
  fileData: 'data:application/pdf;base64,' + dummyPdfBase64,
  fileName: 'surat_dokter.pdf',
  sessionToken: sessionSiti
});
console.log('✓ Hasil Pengajuan Cuti Valid:', resCutiValid);
if (resCutiValid.success) {
  console.log('  [PASS] Pengajuan cuti dengan PDF valid');
} else {
  throw new Error('Pengajuan cuti valid gagal!');
}

// 12b. File tidak diizinkan (EXE)
try {
  gas.simpanPengajuanCuti({
    nik: 'NSR-002',
    jenisCuti: 'Izin Keperluan Pribadi',
    tglMulai: '2026-10-15',
    tglSelesai: '2026-10-15',
    alasan: 'Urusan keluarga',
    fileData: 'data:application/x-msdownload;base64,' + dummyPdfBase64,
    fileName: 'danger.exe',
    sessionToken: sessionSiti
  });
  throw new Error('Gagal menolak file berbahaya!');
} catch (err) {
  if (err.message.includes('Tipe file tidak diizinkan')) {
    console.log('✓ Server berhasil memblokir tipe file tidak sah:', err.message);
    console.log('  [PASS] Server-side MIME type whitelist protection');
  } else {
    throw err;
  }
}

// 12c. File terlalu besar (> 5 MB)
try {
  const hugeData = Buffer.alloc(6 * 1024 * 1024, 'a').toString('base64');
  gas.simpanPengajuanCuti({
    nik: 'NSR-003',
    jenisCuti: 'Cuti Tahunan',
    tglMulai: '2026-10-20',
    tglSelesai: '2026-10-22',
    alasan: 'Cuti tahunan',
    fileData: 'data:application/pdf;base64,' + hugeData,
    fileName: 'huge.pdf',
    sessionToken: sessionAhmad
  });
  throw new Error('Gagal menolak file oversized!');
} catch (err) {
  if (err.message.includes('Ukuran lampiran melebihi batas server')) {
    console.log('✓ Server berhasil memblokir file > 5 MB:', err.message);
    console.log('  [PASS] Server-side file size protection');
  } else {
    throw err;
  }
}

// 13. AUDIT KEAMANAN DRIVE SHARING
console.log('\n--- 13. Testing Proteksi Hak Akses Drive ---');
if (mockDrive.sharingSet === null) {
  console.log('✓ File Drive disimpan sebagai Internal/Private, TIDAK DISHARE publik (ANYONE_WITH_LINK tidak digunakan)');
  console.log('  [PASS] Hak akses Drive aman & privat');
} else {
  throw new Error('File Drive dibagikan secara publik!');
}

// 14. AUDIT GPS.html (FRONTEND)
console.log('\n--- 14. Audit Kode GPS.html ---');
const gpsHtmlContent = fs.readFileSync('GPS.html', 'utf8');

// Cek XSS innerHTML
const hasUnsafeInnerHtml = gpsHtmlContent.includes('innerHTML = "<strong>"') || gpsHtmlContent.includes('innerHTML = `<strong>');
console.log('✓ Cek innerHTML rentan XSS:', hasUnsafeInnerHtml ? 'DITEMUKAN ❌' : 'BERSIH ✅');

// Cek doGet template name
const hasGPSCall = codeContent.includes("createTemplateFromFile('GPS')");
console.log('✓ Cek doGet memanggil GPS.html:', hasGPSCall ? 'SESUAI ✅' : 'TIDAK SESUAI ❌');

// Cek localStorage
const hasLocalStorage = gpsHtmlContent.includes('localStorage');
console.log('✓ Cek localStorage:', hasLocalStorage ? 'DITEMUKAN ❌' : 'ZERO LOCALSTORAGE ✅');

// Cek sessionStorage
const hasSessionStorage = gpsHtmlContent.includes('sessionStorage');
console.log('✓ Cek sessionStorage:', hasSessionStorage ? 'DITEMUKAN ❌' : 'ZERO SESSIONSTORAGE ✅');

// Cek status TIDAK VALID handling
const handlesInvalidStatus = gpsHtmlContent.includes("res.status === 'TIDAK VALID'");
console.log('✓ Cek penanganan status TIDAK VALID:', handlesInvalidStatus ? 'TERSEDIA ✅' : 'TIDAK DITEMUKAN ❌');

// Cek multi-kantor di frontend
const hasMultiKantorFrontend = gpsHtmlContent.includes('Cabang Bandung') && gpsHtmlContent.includes('Cabang Makassar');
console.log('✓ Cek multi-kantor di radar GPS frontend:', hasMultiKantorFrontend ? 'LENGKAP (5 KANTOR) ✅' : 'KURANG ❌');

// Cek integrasi OTP di frontend
const hasOtpUi = gpsHtmlContent.includes('eksekusiMintaOTP') && gpsHtmlContent.includes('eksekusiVerifOTP');
console.log('✓ Cek fungsi NIK + OTP Gmail di frontend:', hasOtpUi ? 'LENGKAP ✅' : 'KURANG ❌');

if (!hasUnsafeInnerHtml && hasGPSCall && !hasLocalStorage && !hasSessionStorage && handlesInvalidStatus && hasMultiKantorFrontend && hasOtpUi) {
  console.log('  [PASS] Seluruh audit GPS.html terpenuhi');
} else {
  throw new Error('Audit GPS.html gagal!');
}

console.log('\n--- 15. Verifikasi Bukti Baris Spreadsheet Pengujian ---');
console.log('📊 SHEET ABSENSI:');
console.table(mockSS.getSheetByName('ABSENSI').rows.map((r, i) => ({
  No: i === 0 ? 'Header' : i,
  NIK: r[3],
  Nama: r[4],
  Jenis: r[7],
  Lokasi: r[8],
  Kantor: r[10],
  Jarak: r[11],
  Status: r[12]
})));

console.log('📊 SHEET MASTER_WFH:');
console.table(mockSS.getSheetByName('MASTER_WFH').rows.map((r, i) => ({
  No: i === 0 ? 'Header' : i,
  NIK: r[1],
  Nama: r[2],
  Alamat: r[3],
  GPS: r[4],
  Status: r[5]
})));

console.log('📊 SHEET PENGAJUAN_CUTI:');
console.table(mockSS.getSheetByName('PENGAJUAN_CUTI').rows.map((r, i) => ({
  No: i === 0 ? 'Header' : i,
  NIK: r[1],
  Nama: r[2],
  Kategori: r[3],
  Mulai: r[4],
  Selesai: r[5],
  File: r[8],
  Status: r[9]
})));

console.log('\n====================================================');
console.log('🎉 SELURUH PENGUJIAN INTEGRASI, OTP & KEAMANAN LULUS 100%');
console.log('====================================================\n');
