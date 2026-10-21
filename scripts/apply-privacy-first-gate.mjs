import fs from 'node:fs';

console.log('=== APPLY PRIVACY FIRST GATE (REFINEMENT) ===');

function normalizeEol(str) {
  return str.replace(/\r\n/g, '\n');
}

// 1. GPS.html
let gps = normalizeEol(fs.readFileSync('GPS.html', 'utf8'));

// Modal header badge
gps = gps.replace(
  /<h3 id="modal-privasi-title" class="text-sm sm:text-base font-extrabold text-white">\s*Pemberitahuan Privasi Karyawan\s*<\/h3>/,
  `<div class="flex items-center gap-1.5 flex-wrap">
              <h3 id="modal-privasi-title" class="text-sm sm:text-base font-extrabold text-white">
                Pemberitahuan Privasi Karyawan
              </h3>
              <span id="badge-gate-wajib" class="hidden px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-amber-400/20 text-amber-300 border border-amber-400/40">Wajib Dikonfirmasi</span>
            </div>`
);

// Modal footer button
gps = gps.replace(
  /<button type="button"\s+id="btn-tutup-privasi-bawah"[\s\S]*?Saya Mengerti\s*<\/button>/,
  `<button type="button"
                id="btn-konfirmasi-privasi"
                onclick="konfirmasiPrivasiKaryawan()"
                class="py-2.5 px-5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs transition border border-emerald-400/40 focus:outline-none focus:ring-2 focus:ring-emerald-400 cursor-pointer shadow-lg shadow-emerald-950/60 btn-tactile">
          Saya Mengerti &amp; Lanjutkan
        </button>`
);

// Remove immediate ambilGPS()
gps = gps.replace(
  /ambilGPS\(\);\s*\n\s*\/\/ 4\. KIRIM PRESENSI/,
  `// Privacy First: ambilGPS() hanya dipanggil setelah konfirmasi privasi karyawan\n\n    // 4. KIRIM PRESENSI`
);

// ambilGPS check
if (!gps.includes('if (!privasiConfirmed) {')) {
  gps = gps.replace(
    /function ambilGPS\(\) \{\s*const badge = document\.getElementById\('gps-status-badge'\);/,
    `function ambilGPS() {\n      if (!privasiConfirmed) {\n        tampilkanModalPrivasiGate();\n        return;\n      }\n      const badge = document.getElementById('gps-status-badge');`
  );
}

// eksekusiMintaOTP guard
if (!gps.includes('if (!privasiConfirmed) {\n        tampilkanModalPrivasiGate();\n        bukaModalNotif("Persetujuan Diperlukan')) {
  gps = gps.replace(
    /function eksekusiMintaOTP\(\) \{\s*const input = document\.getElementById\('auth-nik-input'\);/,
    `function eksekusiMintaOTP() {\n      if (!privasiConfirmed) {\n        tampilkanModalPrivasiGate();\n        bukaModalNotif("Persetujuan Diperlukan 🛡️", "Harap konfirmasi Pemberitahuan Privasi Karyawan terlebih dahulu sebelum meminta OTP.", false);\n        return;\n      }\n      const input = document.getElementById('auth-nik-input');`
  );
}

// kirimAbsensi guard
if (!gps.includes('if (!privasiConfirmed) {\n        tampilkanModalPrivasiGate();\n        bukaModalNotif("Persetujuan Privasi Diperlukan')) {
  gps = gps.replace(
    /function kirimAbsensi\(\) \{\s*const jenis = document\.getElementById\("jenis"\)\.value;/,
    `function kirimAbsensi() {\n      if (!privasiConfirmed) {\n        tampilkanModalPrivasiGate();\n        bukaModalNotif("Persetujuan Privasi Diperlukan 🛡️", "Harap konfirmasi Pemberitahuan Privasi Karyawan terlebih dahulu.", false);\n        return;\n      }\n      const jenis = document.getElementById("jenis").value;`
  );
}

// simpanAbsensi payload
gps = gps.replace(
  /(\.simpanAbsensi\(\{\s*nik:\s*sessionNik,\s*jenis:\s*jenis,\s*lokasi:\s*lokasi,\s*gps:\s*gpsUser,\s*sessionToken:\s*sessionToken)(\s*\}\);)/,
  `$1,\n            pdpNoticeVersion: PRIVACY_NOTICE_VERSION,\n            pdpConfirmedAt: privasiConfirmedAt$2`
);

// simpanWFH payload
gps = gps.replace(
  /(\.simpanWFH\(\{\s*nik:\s*sessionNik,\s*alamat:\s*alamat,\s*gps:\s*gpsUser,\s*sessionToken:\s*sessionToken)(\s*\}\);)/,
  `$1,\n            pdpNoticeVersion: PRIVACY_NOTICE_VERSION,\n            pdpConfirmedAt: privasiConfirmedAt$2`
);

// simpanPengajuanCuti payload
gps = gps.replace(
  /(sessionToken:\s*sessionToken)(\s*\n\s*\};[\s\S]*?\.simpanPengajuanCuti\(payload\);)/,
  `$1,\n        pdpNoticeVersion: PRIVACY_NOTICE_VERSION,\n        pdpConfirmedAt: privasiConfirmedAt$2`
);

// Write GPS.html and gas-portal-absensi-template.html
fs.writeFileSync('GPS.html', gps, 'utf8');
fs.writeFileSync('gas-portal-absensi-template.html', gps, 'utf8');
console.log('✓ GPS.html & gas-portal-absensi-template.html updated');

// 2. gas-absensi-Code.gs
let code = normalizeEol(fs.readFileSync('gas-absensi-Code.gs', 'utf8'));

// simpanAbsensi guard
code = code.replace(
  /validasiSesi_\(params\.sessionToken,\s*nik\);/,
  `validasiSesi_(params.sessionToken, nik);

    // Kepatuhan UU PDP No. 27/2022 (Pemberitahuan Privasi Karyawan)
    if (!params.pdpNoticeVersion || String(params.pdpNoticeVersion).indexOf('PDP-NSR') === -1) {
      throw new Error('Pemberitahuan Privasi Karyawan (UU PDP No. 27/2022) wajib dikonfirmasi sebelum menyimpan presensi.');
    }`
);

// simpanWFH guard
code = code.replace(
  /\/\/ Kontrol Sesi OTP\s*\n\s*validasiSesi_\(params\.sessionToken,\s*nik\);/,
  `// Kontrol Sesi OTP & Kepatuhan UU PDP No. 27/2022
    validasiSesi_(params.sessionToken, nik);

    if (!params.pdpNoticeVersion || String(params.pdpNoticeVersion).indexOf('PDP-NSR') === -1) {
      throw new Error('Pemberitahuan Privasi Karyawan (UU PDP No. 27/2022) wajib dikonfirmasi sebelum mendaftarkan lokasi WFH.');
    }`
);

// simpanPengajuanCuti guard
code = code.replace(
  /\/\/ Kontrol Sesi OTP\s*\n\s*validasiSesi_\(params\.sessionToken,\s*nik\);/,
  `// Kontrol Sesi OTP & Kepatuhan UU PDP No. 27/2022
    validasiSesi_(params.sessionToken, nik);

    if (!params.pdpNoticeVersion || String(params.pdpNoticeVersion).indexOf('PDP-NSR') === -1) {
      throw new Error('Pemberitahuan Privasi Karyawan (UU PDP No. 27/2022) wajib dikonfirmasi sebelum mengajukan cuti/izin.');
    }`
);

// Session storage update
code = code.replace(
  /cache\.put\('sess_' \+ sessionToken, cleanNik, CONFIG\.SESSION_EXPIRY_SECONDS\);/,
  `const noticeVer = (pdpNoticeVersion && String(pdpNoticeVersion).trim()) || 'PDP-NSR-EMP-2026.10';\n  cache.put('sess_' + sessionToken, cleanNik + '|' + noticeVer, CONFIG.SESSION_EXPIRY_SECONDS);`
);

// validasiSesi_ update
code = code.replace(
  /const savedNik = cache\.get\('sess_' \+ String\(sessionToken\)\.trim\(\)\);\s*\n\s*if \(!savedNik\) \{[\s\S]*?if \(!isNikMatch_\(savedNik, cleanNik\)\) \{/,
  `const savedEntry = cache.get('sess_' + String(sessionToken).trim());

  if (!savedEntry) {
    throw new Error('Sesi Anda telah kedaluwarsa atau tidak valid. Silakan verifikasi ulang NIK & OTP.');
  }

  const parts = savedEntry.split('|');
  const savedNik = parts[0];

  if (!isNikMatch_(savedNik, cleanNik)) {`
);

fs.writeFileSync('gas-absensi-Code.gs', code, 'utf8');
console.log('✓ gas-absensi-Code.gs updated');

console.log('=== FINISHED REFINEMENT ===');
