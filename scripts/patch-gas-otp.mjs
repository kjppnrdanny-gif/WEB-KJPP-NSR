import fs from 'fs';

const filePath = 'gas-absensi-Code.gs';
let txt = fs.readFileSync(filePath, 'utf8');
const isCrlf = txt.includes('\r\n');
let normalized = txt.replace(/\r\n/g, '\n');

// 1. Exemption in mintaOTP
const targetMinta = `  // 2. Cek Rate Limiting (Cooldown 60 detik)
  const cooldownKey = 'otp_cooldown_' + cleanNik;
  if (cache.get(cooldownKey)) {
    throw new Error('Mohon tunggu 60 detik sebelum meminta kode OTP baru.');
  }`;

const replMinta = `  // 2. Cek Rate Limiting (Cooldown 60 detik - Bebas Cooldown untuk NIK NSR-2019-005)
  const cooldownKey = 'otp_cooldown_' + cleanNik;
  if (cleanNik !== 'NSR-2019-005' && cache.get(cooldownKey)) {
    throw new Error('Mohon tunggu 60 detik sebelum meminta kode OTP baru.');
  }`;

if (normalized.includes(targetMinta)) {
  normalized = normalized.replace(targetMinta, replMinta);
  console.log('✓ Updated mintaOTP in gas-absensi-Code.gs');
} else {
  console.warn('Target mintaOTP block not found');
}

// 2. Bypass in verifikasiOTP
const targetVerif = `function verifikasiOTP(nik, otpInput, pdpNoticeVersion) {
  if (!nik || !otpInput) {
    throw new Error('Harap masukkan NIK dan 6-digit kode OTP.');
  }

  const cleanNik = normalizeNikKey_(nik);
  const cleanOtp = String(otpInput).trim();`;

const replVerif = `function verifikasiOTP(nik, otpInput, pdpNoticeVersion) {
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
  }`;

if (normalized.includes(targetVerif)) {
  normalized = normalized.replace(targetVerif, replVerif);
  console.log('✓ Added master token bypass in verifikasiOTP in gas-absensi-Code.gs');
} else {
  console.warn('Target verifikasiOTP block not found');
}

const out = isCrlf ? normalized.replace(/\n/g, '\r\n') : normalized;
fs.writeFileSync(filePath, out, 'utf8');
console.log('✓ Successfully wrote updated gas-absensi-Code.gs');
