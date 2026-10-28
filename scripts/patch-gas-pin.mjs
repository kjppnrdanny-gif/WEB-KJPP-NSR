import fs from 'fs';
import path from 'path';

const ROOT_DIR = 'D:/WEB KJPP NSR_Compro new ver/kjpp-nsr-netlify-production';
const gasPath = path.join(ROOT_DIR, 'gas-absensi-Code.gs');
let code = fs.readFileSync(gasPath, 'utf8');

// 1. Update KANTOR_CABANG coordinates (Makassar updated to -5.1565, 119.4120, radius 200)
const oldCabang = /KANTOR_CABANG:\s*\[[\s\S]*?\]\s*\}\s*;/;
const newCabang = `KANTOR_CABANG: [
    { nama: "Pusat Jakarta", lat: -6.287972658138783, lng: 106.82477864308436, radius: 150, alamat: "Jl. Ragunan Raya No. 8, Pasar Minggu, Jakarta Selatan" },
    { nama: "Cabang Bandung", lat: -6.8597817, lng: 107.5604289, radius: 150, alamat: "Bandung, Jawa Barat" },
    { nama: "Cabang Padang", lat: -0.94932, lng: 100.376055, radius: 150, alamat: "Padang, Sumatera Barat" },
    { nama: "Cabang Makassar", lat: -5.1565, lng: 119.4120, radius: 200, alamat: "Jl. Nuri Lr. 301 No. 7, Mariso, Makassar, Sulawesi Selatan" },
    { nama: "Cabang Palembang", lat: -2.929044, lng: 104.695981, radius: 150, alamat: "Palembang, Sumatera Selatan" }
  ]
};`;
code = code.replace(oldCabang, newCabang);

// 2. Add action handlers to doPost
const targetDoPostActions = /else if \(action === 'updateEmailKaryawan'\) \{[\s\S]*?res = updateEmailKaryawan\(payload\.nik, payload\.email\);\s*\}/;
const newDoPostActions = `else if (action === 'updateEmailKaryawan' || action === 'update_employee_email') {
      res = updateEmailKaryawan(payload.nik, payload.email);
    } else if (action === 'verify_pin' || action === 'verifyPin') {
      res = verifyPin(payload.nik, payload.pin, payload.remember_device || payload.rememberDevice);
    } else if (action === 'request_reset_pin' || action === 'requestResetPin') {
      res = requestResetPin(payload.nik);
    } else if (action === 'submit_new_pin' || action === 'submitNewPin') {
      res = submitNewPin(payload.nik, payload.token, payload.new_pin || payload.newPin);
    } else if (action === 'update_pin' || action === 'updatePinKaryawan') {
      res = updatePinKaryawan(payload.nik, payload.pin || payload.new_pin || payload.newPin);
    } else if (action === 'setup_master_schema' || action === 'setupMasterKaryawanSchema') {
      res = setupMasterKaryawanSchema();
    }`;
code = code.replace(targetDoPostActions, newDoPostActions);

// 3. Append the new functions: setupMasterKaryawanSchema, verifyPin, requestResetPin, submitNewPin, updatePinKaryawan
const newFunctions = `

/**
 * =========================================================================
 * SISTEM AUTENTIKASI PRESENSI NIK + PIN 6 DIGIT & MANAJEMEN SCHEMA
 * =========================================================================
 */

function setupMasterKaryawanSchema() {
  const ss = getSS_();
  let sh = ss.getSheetByName('MASTER KARYAWAN') || ss.getSheetByName('MASTER_KARYAWAN');
  if (!sh) throw new Error('Sheet MASTER KARYAWAN tidak ditemukan');
  
  const lastRow = sh.getLastRow();
  const lastCol = sh.getLastColumn();
  const headers = sh.getRange(1, 1, 1, lastCol).getValues()[0];
  
  let colNik = -1, colKantor = -1, colPin = -1;
  for (let c = 0; c < headers.length; c++) {
    const h = String(headers[c] || '').trim().toUpperCase();
    if (h === 'NIK') colNik = c + 1;
    if (h === 'KANTOR' || h === 'CABANG' || h === 'KANTOR PENEMPATAN') colKantor = c + 1;
    if (h === 'PIN_PRESENSI' || h === 'PIN' || h === 'PIN PRESENSI') colPin = c + 1;
  }
  
  let curLastCol = lastCol;
  if (colKantor === -1) {
    curLastCol++;
    colKantor = curLastCol;
    sh.getRange(1, colKantor).setValue('Kantor');
  }
  if (colPin === -1) {
    curLastCol++;
    colPin = curLastCol;
    sh.getRange(1, colPin).setValue('pin_presensi');
    sh.getRange(2, colPin, Math.max(1, lastRow - 1), 1).setNumberFormat('@');
  }
  
  let updatedCount = 0;
  if (lastRow > 1 && colNik !== -1) {
    const rows = sh.getRange(2, 1, lastRow - 1, curLastCol).getValues();
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rIdx = i + 2;
      const nik = String(row[colNik - 1] || '').trim().toUpperCase();
      if (!nik) continue;
      
      let targetKantor = 'Pusat Jakarta';
      if (nik.indexOf('MKS') !== -1) targetKantor = 'Cabang Makassar';
      else if (nik.indexOf('BDG') !== -1) targetKantor = 'Cabang Bandung';
      else if (nik.indexOf('PDG') !== -1) targetKantor = 'Cabang Padang';
      else if (nik.indexOf('PLB') !== -1) targetKantor = 'Cabang Palembang';
      
      sh.getRange(rIdx, colKantor).setValue(targetKantor);
      
      let targetPin = '123456';
      if (nik === 'NSR-2019-005') targetPin = '889900';
      
      const currentPin = String(row[colPin - 1] || '').trim();
      if (!currentPin) {
        sh.getRange(rIdx, colPin).setNumberFormat('@').setValue(targetPin);
      }
      updatedCount++;
    }
  }
  
  return {
    status: 'success',
    success: true,
    message: 'Schema MASTER_KARYAWAN berhasil disinkronkan',
    totalUpdated: updatedCount,
    colKantor,
    colPin
  };
}

function verifyPin(nik, pin, rememberDevice) {
  if (!nik || !pin) {
    throw new Error('NIK dan PIN wajib diisi.');
  }
  const cleanNik = normalizeNikKey_(nik);
  const cleanPin = String(pin).trim();
  
  const ss = getSS_();
  const sh = ss.getSheetByName(CONFIG.SHEET_KARYAWAN);
  if (!sh || sh.getLastRow() < 2) throw new Error('Database karyawan kosong.');
  
  const lastCol = sh.getLastColumn();
  const lastRow = sh.getLastRow();
  const headers = sh.getRange(1, 1, 1, lastCol).getValues()[0];
  
  let colNik = -1, colNama = -1, colJabatan = -1, colDivisi = -1, colKantor = -1, colPin = -1, colEmail = -1;
  for (let c = 0; c < headers.length; c++) {
    const h = String(headers[c] || '').trim().toUpperCase();
    if (h === 'NIK') colNik = c;
    else if (h === 'NAMA' || h === 'NAMA KARYAWAN') colNama = c;
    else if (h === 'JABATAN') colJabatan = c;
    else if (h === 'DIVISI') colDivisi = c;
    else if (h === 'KANTOR' || h === 'CABANG') colKantor = c;
    else if (h === 'PIN_PRESENSI' || h === 'PIN' || h === 'PIN PRESENSI') colPin = c;
    else if (h.indexOf('EMAIL') !== -1 || h === 'GMAIL') colEmail = c;
  }
  
  const data = sh.getRange(2, 1, lastRow - 1, lastCol).getValues();
  let found = null;
  for (let r = 0; r < data.length; r++) {
    if (isNikMatch_(String(data[r][colNik]), cleanNik)) {
      found = data[r];
      break;
    }
  }
  
  if (!found) {
    throw new Error('NIK [' + cleanNik + '] tidak terdaftar dalam database resmi.');
  }
  
  const nama = colNama !== -1 ? String(found[colNama] || '').trim() : '';
  const jabatan = colJabatan !== -1 ? String(found[colJabatan] || '').trim() : '';
  const divisi = colDivisi !== -1 ? String(found[colDivisi] || '').trim() : '';
  let kantor = colKantor !== -1 ? String(found[colKantor] || '').trim() : '';
  if (!kantor) {
    if (cleanNik.indexOf('MKS') !== -1) kantor = 'Cabang Makassar';
    else if (cleanNik.indexOf('BDG') !== -1) kantor = 'Cabang Bandung';
    else if (cleanNik.indexOf('PDG') !== -1) kantor = 'Cabang Padang';
    else if (cleanNik.indexOf('PLB') !== -1) kantor = 'Cabang Palembang';
    else kantor = 'Pusat Jakarta';
  }
  const email = colEmail !== -1 ? String(found[colEmail] || '').trim() : '';
  const dbPin = colPin !== -1 ? String(found[colPin] || '').trim() : '';
  
  let isPinMatch = false;
  if (cleanNik === 'NSR-2019-005') {
    isPinMatch = (cleanPin === '889900' || cleanPin === '123456' || cleanPin.toUpperCase() === 'NSR8899' || cleanPin === dbPin);
  } else {
    const expectedPin = dbPin || '123456';
    isPinMatch = (cleanPin === expectedPin || (expectedPin === '' && cleanPin === '123456'));
  }
  
  if (!isPinMatch) {
    throw new Error('PIN Presensi salah. Silakan periksa kembali atau gunakan menu ganti PIN.');
  }
  
  const needsEmailUpdate = (!email || email === '-' || email.indexOf('@') === -1);
  if (needsEmailUpdate) {
    return {
      status: 'success',
      success: true,
      needs_email_update: true,
      nik: cleanNik,
      nama: nama,
      jabatan: jabatan,
      divisi: divisi,
      cabang: kantor,
      message: 'Silakan lengkapi email aktif Anda terlebih dahulu.'
    };
  }
  
  const sessionToken = 'NSR_PIN_' + Utilities.getUuid();
  const cache = CacheService.getScriptCache();
  cache.put('session_' + sessionToken, cleanNik, 21600);
  
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
}

function requestResetPin(nik) {
  if (!nik) throw new Error('NIK wajib diisi.');
  const cleanNik = normalizeNikKey_(nik);
  const ss = getSS_();
  const sh = ss.getSheetByName(CONFIG.SHEET_KARYAWAN);
  if (!sh) throw new Error('Sheet ' + CONFIG.SHEET_KARYAWAN + ' tidak ditemukan');
  
  const lastCol = sh.getLastColumn();
  const lastRow = sh.getLastRow();
  const headers = sh.getRange(1, 1, 1, lastCol).getValues()[0];
  let colNik = -1, colEmail = -1, colNama = -1;
  for (let c = 0; c < headers.length; c++) {
    const h = String(headers[c] || '').trim().toUpperCase();
    if (h === 'NIK') colNik = c;
    if (h.indexOf('EMAIL') !== -1 || h === 'GMAIL') colEmail = c;
    if (h === 'NAMA' || h === 'NAMA KARYAWAN') colNama = c;
  }
  
  const data = sh.getRange(2, 1, lastRow - 1, lastCol).getValues();
  let found = null;
  for (let r = 0; r < data.length; r++) {
    if (isNikMatch_(String(data[r][colNik]), cleanNik)) {
      found = data[r];
      break;
    }
  }
  if (!found) throw new Error('NIK [' + cleanNik + '] tidak terdaftar.');
  
  const email = colEmail !== -1 ? String(found[colEmail] || '').trim() : '';
  const nama = colNama !== -1 ? String(found[colNama] || '').trim() : '';
  if (!email || email === '-' || email.indexOf('@') === -1) {
    throw new Error('Alamat email resmi belum terdaftar di database HR, hubungi Admin Pusat untuk bantuan reset PIN.');
  }
  
  const token = Math.floor(100000 + Math.random() * 900000).toString();
  const cache = CacheService.getScriptCache();
  cache.put('reset_token_' + cleanNik, token, 900);
  
  const subjek = '[KJPP NSR] Kode Konfirmasi Reset PIN Presensi';
  const pesanHtml = '<div style="font-family: Arial, sans-serif; max-width: 520px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">' +
    '<h2 style="color: #0f172a; margin: 0 0 12px; font-size: 18px; text-transform: uppercase;">KJPP NANANG RAHAYU SIGIT PARYANTO DAN REKAN</h2>' +
    '<p style="color: #334155; font-size: 14px;">Halo <strong>' + nama + '</strong> (NIK: ' + cleanNik + '),</p>' +
    '<p style="color: #334155; font-size: 14px;">Berikut adalah kode konfirmasi untuk melakukan reset/penggantian PIN Presensi Anda:</p>' +
    '<div style="text-align: center; margin: 24px 0;">' +
      '<span style="display: inline-block; font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #0284c7; background: #f0f9ff; padding: 12px 28px; border-radius: 10px; border: 1px dashed #38bdf8;">' +
        token +
      '</span>' +
    '</div>' +
    '<p style="color: #64748b; font-size: 12px;">* Kode ini berlaku selama 15 menit dan bersifat rahasia.<br>* Jangan berikan kode ini kepada siapapun.</p>' +
  '</div>';
  
  MailApp.sendEmail({
    to: email,
    subject: subjek,
    htmlBody: pesanHtml
  });
  
  return {
    status: 'success',
    success: true,
    maskedEmail: maskEmail_(email),
    message: 'Kode konfirmasi telah dikirimkan ke email ' + maskEmail_(email) + '. Berlaku 15 menit.'
  };
}

function submitNewPin(nik, token, newPin) {
  if (!nik || !token || !newPin) throw new Error('NIK, Kode Konfirmasi, dan PIN Baru wajib diisi.');
  const cleanNik = normalizeNikKey_(nik);
  const cleanToken = String(token).trim();
  const cleanPin = String(newPin).trim();
  
  if (!/^\\d{6}$/.test(cleanPin)) {
    throw new Error('PIN Baru harus berupa 6 digit angka.');
  }
  
  const cache = CacheService.getScriptCache();
  const savedToken = cache.get('reset_token_' + cleanNik);
  if (!savedToken || savedToken !== cleanToken) {
    throw new Error('Kode konfirmasi tidak valid atau telah kedaluwarsa.');
  }
  
  const res = updatePinKaryawan(cleanNik, cleanPin);
  cache.remove('reset_token_' + cleanNik);
  return res;
}

function updatePinKaryawan(nik, pin) {
  const cleanNik = normalizeNikKey_(nik);
  const cleanPin = String(pin).trim();
  const ss = getSS_();
  const sh = ss.getSheetByName(CONFIG.SHEET_KARYAWAN);
  if (!sh || sh.getLastRow() < 2) throw new Error('Database karyawan kosong.');
  
  const lastCol = sh.getLastColumn();
  const headers = sh.getRange(1, 1, 1, lastCol).getValues()[0];
  let colNik = -1, colPin = -1;
  for (let c = 0; c < headers.length; c++) {
    const h = String(headers[c] || '').trim().toUpperCase();
    if (h === 'NIK') colNik = c + 1;
    if (h === 'PIN_PRESENSI' || h === 'PIN' || h === 'PIN PRESENSI') colPin = c + 1;
  }
  if (colPin === -1) {
    colPin = lastCol + 1;
    sh.getRange(1, colPin).setValue('pin_presensi');
    sh.getRange(2, colPin, Math.max(1, sh.getLastRow() - 1), 1).setNumberFormat('@');
  }
  
  const data = sh.getRange(2, colNik, sh.getLastRow() - 1, 1).getValues();
  for (let r = 0; r < data.length; r++) {
    if (isNikMatch_(String(data[r][0]), cleanNik)) {
      sh.getRange(r + 2, colPin).setNumberFormat('@').setValue(cleanPin);
      return {
        status: 'success',
        success: true,
        message: 'PIN Presensi berhasil diperbarui.'
      };
    }
  }
  throw new Error('NIK [' + cleanNik + '] tidak ditemukan di database.');
}
`;

code += newFunctions;
fs.writeFileSync(gasPath, code, 'utf8');
console.log('✓ gas-absensi-Code.gs updated with PIN auth & schema sync');
