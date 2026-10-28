import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const gasFile = path.join(ROOT_DIR, 'gas-absensi-Code.gs');
let code = fs.readFileSync(gasFile, 'utf8');

// Detect line endings
const isCRLF = code.includes('\r\n');
const nl = isCRLF ? '\r\n' : '\n';

// 1. Update KANTOR_CABANG
const oldBranchRegex = /KANTOR_CABANG:\s*\[[\s\S]*?\]\s*\}\;/;
const newBranch = `KANTOR_CABANG: [
    { nama: "Pusat Jakarta", lat: -6.28797, lng: 106.82478, radius: 150, alamat: "Jl. Hankam No. 5 RT.006 RW.001, Kel. Ragunan, Kec. Pasar Minggu, Jakarta Selatan 12550" },
    { nama: "Cabang Bandung", lat: -6.85978, lng: 107.56043, radius: 150, alamat: "Perumahan Pancanaka Royal Garden II, Jl. Pangrango II No. 1A RT.001 RW.012, Kel. Citeureup, Kec. Cimahi Utara, Kota Cimahi, Jawa Barat 40512" },
    { nama: "Cabang Padang", lat: -0.94932, lng: 100.37606, radius: 150, alamat: "Jl. Parak Gadang VIII No. 19, Kel. Simpang Haru, Kec. Padang Timur, Kota Padang, Sumatera Barat" },
    { nama: "Cabang Makassar", lat: -5.15650, lng: 119.41200, radius: 200, alamat: "Jl. Nuri Lr. 301 No. 7, Mariso, Makassar, Sulawesi Selatan" },
    { nama: "Cabang Palembang", lat: -2.92904, lng: 104.69598, radius: 150, alamat: "Komplek Griya Hero Abadi Maskarebet, Kec. Alang-Alang Lebar, Kota Palembang, Sumatera Selatan" }
  ]
};`.replace(/\n/g, nl);

if (!oldBranchRegex.test(code)) {
  throw new Error('Pattern KANTOR_CABANG not found');
}
code = code.replace(oldBranchRegex, newBranch);
console.log('1. KANTOR_CABANG updated.');

// 2. Add direct_change_pin to doPost
const targetDoPostRegex = /(\} else if \(action === 'update_pin' \|\| action === 'updatePinKaryawan'\) \{[\s\S]*?res = updatePinKaryawan\(payload\.nik, payload\.pin \|\| payload\.new_pin \|\| payload\.newPin\);)/;
const newDoPost = `$1${nl}    } else if (action === 'direct_change_pin' || action === 'directChangePin') {${nl}      res = directChangePin(payload.nik, payload.current_pin || payload.currentPin || payload.pin, payload.new_pin || payload.newPin);`;

if (!targetDoPostRegex.test(code)) {
  throw new Error('targetDoPostRegex not found');
}
code = code.replace(targetDoPostRegex, newDoPost);
console.log('2. doPost direct_change_pin route added.');

// 3. Update verifyPin body and add helper functions right after verifyPin
const targetVerifyEnd = `  var sessionToken = 'NSR_PIN_' + Utilities.getUuid();
  var cache = CacheService.getScriptCache();
  cache.put('sess_' + sessionToken, cleanNik + '|' + (new Date().toISOString()), 21600);
  
  return {
    status: 'success',
    success: true,
    needs_email_update: false,
    sessionToken: sessionToken,
    nik: cleanNik,
    nama: nama,
    jabatan: jabatan,
    divisi: divisi,
    cabang: kantor,
    isAdminHR: (cleanNik === 'NSR-2019-005'),
    role: (cleanNik === 'NSR-2019-005' ? 'admin_pusat' : 'karyawan'),
    message: 'Autentikasi Berhasil.'
  };
}`.replace(/\n/g, nl);

const newVerifyEnd = `  var wfhData = getWfhDataInternal_(ss, cleanNik);
  var attendanceCount = countRiwayatPresensiInternal_(ss, cleanNik);
  var isDefaultPin = (cleanPin === '123456' || (dbPin === '123456' && cleanPin === '123456'));
  var forceChangePin = (isDefaultPin && attendanceCount >= 1);
  var warningDefaultPin = (isDefaultPin && attendanceCount === 0);

  if (forceChangePin) {
    return {
      status: 'success',
      success: true,
      needs_email_update: false,
      force_change_pin: true,
      warning_default_pin: false,
      nik: cleanNik,
      nama: nama,
      jabatan: jabatan,
      divisi: divisi,
      cabang: kantor,
      email: email,
      gps_wfh: wfhData.gps_wfh,
      alamat_wfh: wfhData.alamat_wfh,
      attendance_count: attendanceCount,
      message: 'PIN Default (123456) wajib diganti demi keamanan sebelum presensi ke-2 dan seterusnya.'
    };
  }

  var sessionToken = 'NSR_PIN_' + Utilities.getUuid();
  var cache = CacheService.getScriptCache();
  cache.put('sess_' + sessionToken, cleanNik + '|' + (new Date().toISOString()), 21600);
  
  return {
    status: 'success',
    success: true,
    needs_email_update: false,
    force_change_pin: false,
    warning_default_pin: warningDefaultPin,
    sessionToken: sessionToken,
    nik: cleanNik,
    nama: nama,
    jabatan: jabatan,
    divisi: divisi,
    cabang: kantor,
    email: email,
    gps_wfh: wfhData.gps_wfh,
    alamat_wfh: wfhData.alamat_wfh,
    attendance_count: attendanceCount,
    isAdminHR: (cleanNik === 'NSR-2019-005'),
    role: (cleanNik === 'NSR-2019-005' ? 'admin_pusat' : 'karyawan'),
    message: 'Autentikasi Berhasil.'
  };
}

function countRiwayatPresensiInternal_(ss, cleanNik) {
  var shAbsen = ss.getSheetByName(CONFIG.SHEET_ABSENSI);
  if (!shAbsen || shAbsen.getLastRow() < 2) return 0;
  var lastCol = shAbsen.getLastColumn();
  var headers = shAbsen.getRange(1, 1, 1, lastCol).getValues()[0];
  var colNik = 1;
  for (var c = 0; c < headers.length; c++) {
    var h = String(headers[c] || '').trim().toUpperCase();
    if (h === 'NIK' || h.indexOf('NIK') !== -1) { colNik = c; break; }
  }
  var data = shAbsen.getRange(2, colNik + 1, shAbsen.getLastRow() - 1, 1).getValues();
  var count = 0;
  for (var i = 0; i < data.length; i++) {
    if (isNikMatch_(String(data[i][0]), cleanNik)) {
      count++;
    }
  }
  return count;
}

function getWfhDataInternal_(ss, cleanNik) {
  var shWfh = ss.getSheetByName(CONFIG.SHEET_WFH);
  if (shWfh && shWfh.getLastRow() >= 2) {
    var lastCol = shWfh.getLastColumn();
    var lastRow = shWfh.getLastRow();
    var headers = shWfh.getRange(1, 1, 1, lastCol).getValues()[0];
    var colNik = -1, colAlamat = -1, colLat = -1, colLng = -1, colGps = -1;
    for (var c = 0; c < headers.length; c++) {
      var h = String(headers[c] || '').trim().toUpperCase();
      if (h === 'NIK' || h.indexOf('NIK') !== -1) colNik = c;
      else if (h.indexOf('ALAMAT') !== -1) colAlamat = c;
      else if (h.indexOf('LATITUDE') !== -1) colLat = c;
      else if (h.indexOf('LONGITUDE') !== -1) colLng = c;
      else if (h.indexOf('GPS') !== -1 || h.indexOf('KOORDINAT') !== -1) colGps = c;
    }
    var data = shWfh.getRange(2, 1, lastRow - 1, lastCol).getValues();
    for (var r = 0; r < data.length; r++) {
      if (isNikMatch_(String(data[r][colNik]), cleanNik)) {
        var gpsVal = colGps !== -1 ? String(data[r][colGps] || '').trim() : '';
        if (!gpsVal && colLat !== -1 && colLng !== -1 && data[r][colLat] && data[r][colLng]) {
          gpsVal = data[r][colLat] + ',' + data[r][colLng];
        }
        var alamatVal = colAlamat !== -1 ? String(data[r][colAlamat] || '').trim() : '';
        if (gpsVal) {
          return { gps_wfh: gpsVal, alamat_wfh: alamatVal };
        }
      }
    }
  }
  return { gps_wfh: '', alamat_wfh: '' };
}

function directChangePin(nik, currentPin, newPin) {
  if (!nik) throw new Error('NIK wajib diisi.');
  if (!newPin) throw new Error('PIN baru wajib diisi.');
  var cleanNik = normalizeNikKey_(nik);
  var cleanNewPin = String(newPin).trim();
  
  if (!/^\\d{6}$/.test(cleanNewPin)) {
    throw new Error('PIN baru harus tepat 6 digit angka.');
  }
  if (cleanNewPin === '123456') {
    throw new Error('PIN baru tidak boleh menggunakan PIN default standar (123456). Silakan pilih 6 digit angka lain.');
  }
  
  var ss = getSS_();
  var sh = ss.getSheetByName(CONFIG.SHEET_KARYAWAN);
  if (!sh) throw new Error('Sheet ' + CONFIG.SHEET_KARYAWAN + ' tidak ditemukan');
  
  var lastCol = sh.getLastColumn();
  var lastRow = sh.getLastRow();
  var headers = sh.getRange(1, 1, 1, lastCol).getValues()[0];
  var colNik = -1, colPin = -1, colEmail = -1, colNama = -1;
  for (var c = 0; c < headers.length; c++) {
    var h = String(headers[c] || '').trim().toUpperCase();
    if (h === 'NIK') colNik = c;
    else if (h === 'PIN_PRESENSI' || h === 'PIN' || h === 'PIN PRESENSI') colPin = c;
    else if (h.indexOf('EMAIL') !== -1 || h === 'GMAIL') colEmail = c;
    else if (h === 'NAMA' || h === 'NAMA KARYAWAN') colNama = c;
  }
  
  if (colNik === -1) throw new Error('Kolom NIK tidak ditemukan.');
  if (colPin === -1) {
    colPin = lastCol;
    sh.getRange(1, lastCol + 1).setValue('PIN_PRESENSI');
  }
  
  var data = sh.getRange(2, 1, lastRow - 1, sh.getLastColumn()).getValues();
  var targetRow = -1;
  var karyawanEmail = '';
  var karyawanNama = '';
  
  for (var r = 0; r < data.length; r++) {
    if (isNikMatch_(String(data[r][colNik]), cleanNik)) {
      targetRow = r + 2;
      karyawanNama = colNama !== -1 ? String(data[r][colNama] || '').trim() : '';
      karyawanEmail = colEmail !== -1 ? String(data[r][colEmail] || '').trim() : '';
      break;
    }
  }
  
  if (targetRow === -1) {
    throw new Error('NIK [' + cleanNik + '] tidak ditemukan.');
  }
  
  // Set value as string
  sh.getRange(targetRow, colPin + 1).setValue("'" + cleanNewPin);
  
  // Kirim notifikasi email jika terdaftar
  if (karyawanEmail && karyawanEmail.indexOf('@') !== -1) {
    try {
      var subject = '[KJPP NSR] Notifikasi Penggantian PIN Presensi Karyawan';
      var body = 'Halo ' + (karyawanNama || cleanNik) + ',\\n\\n'
        + 'PIN Presensi Anda untuk NIK ' + cleanNik + ' telah berhasil diubah secara langsung di Portal Presensi KJPP NSR.\\n\\n'
        + 'Waktu Perubahan: ' + Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyy-MM-dd HH:mm:ss') + ' WIB\\n'
        + 'Gunakan PIN 6 digit baru ini untuk seluruh pencatatan kehadiran berikutnya.\\n\\n'
        + 'Apabila Anda tidak merasa melakukan perubahan ini, segera hubungi Divisi Administrasi & HR KJPP NSR.\\n\\n'
        + 'Salam,\\nTim HR & Operasional KJPP Nanang Rahayu Sigit Paryanto & Rekan';
      MailApp.sendEmail(karyawanEmail, subject, body);
    } catch (e) {
      Logger.log('Gagal kirim notifikasi email: ' + e.message);
    }
  }
  
  var sessionToken = 'NSR_PIN_' + Utilities.getUuid();
  var cache = CacheService.getScriptCache();
  cache.put('sess_' + sessionToken, cleanNik + '|' + (new Date().toISOString()), 21600);
  
  return {
    status: 'success',
    success: true,
    sessionToken: sessionToken,
    message: 'PIN baru berhasil disimpan dan diaktifkan. Anda dapat langsung melanjutkan presensi.'
  };
}`.replace(/\n/g, nl);

if (!code.includes(targetVerifyEnd)) {
  throw new Error('targetVerifyEnd not found');
}
code = code.replace(targetVerifyEnd, newVerifyEnd);
console.log('3. verifyPin logic updated and helper functions appended.');

// 4. Update simpanAbsensi
const targetSimpanRegex = /(\/\/\s*2\.\s*Verifikasi Data Karyawan[\s\S]*?if \(!profil\) \{[\s\S]*?throw new Error\('NIK \[' \+ nik \+ '\] tidak terdaftar di database Master Karyawan\.'\);[\s\S]*?\})/;

const newSimpanAbsenCheck = `$1${nl}${nl}    // 2b. Cek Penggunaan PIN Default pada Presensi Ke-2${nl}    const ssCheck = getSS_();${nl}    const attCountSimpan = countRiwayatPresensiInternal_(ssCheck, nik);${nl}    if (attCountSimpan >= 1 && (params.currentPin === '123456' || params.pin === '123456')) {${nl}      throw new Error('PIN default standar (123456) tidak diizinkan untuk presensi ke-2 dan seterusnya. Silakan ganti PIN Presensi Anda terlebih dahulu.');${nl}    }`;

if (!targetSimpanRegex.test(code)) {
  throw new Error('targetSimpanRegex not found');
}
code = code.replace(targetSimpanRegex, newSimpanAbsenCheck);
console.log('4. simpanAbsensi default PIN rejection added.');

fs.writeFileSync(gasFile, code, 'utf8');
console.log('gas-absensi-Code.gs successfully patched!');
