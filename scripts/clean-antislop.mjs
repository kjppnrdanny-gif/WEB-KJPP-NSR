import fs from 'fs';

console.log('--- Cleaning NIK spills & applying antislop-ui rules ---');

// 1. UPDATE index.html
let indexHtml = fs.readFileSync('index.html', 'utf8');

// Replace placeholder with spilled NIK
indexHtml = indexHtml.replace(
  'placeholder="Masukkan Token Akses atau NIK (cth: NSR-2019-005)"',
  'placeholder="Masukkan Token Akses atau NIK Karyawan"'
);

// Remove decorative arrow from submit button in OPINI token modal
indexHtml = indexHtml.replace(
  '<span id="btn-submit-text">Verifikasi &amp; Masuk</span>\n              <svg class="w-4 h-4 text-blue-200" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>',
  '<span id="btn-submit-text">Verifikasi &amp; Masuk</span>'
);
// Also try with \r\n
indexHtml = indexHtml.replace(
  '<span id="btn-submit-text">Verifikasi &amp; Masuk</span>\r\n              <svg class="w-4 h-4 text-blue-200" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>',
  '<span id="btn-submit-text">Verifikasi &amp; Masuk</span>'
);

// Replace lock emoji in footer
indexHtml = indexHtml.replace(
  '<span class="text-[10px] text-slate-500 font-medium">🔒 Enkripsi Server-Side SHA-256</span>',
  '<span class="inline-flex items-center gap-1.5 text-[10px] text-slate-400 font-medium"><svg class="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg><span>Enkripsi Server-Side SHA-256</span></span>'
);

// Remove decorative pulse on status dots in authenticated panel
indexHtml = indexHtml.replace(
  '<span class="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shrink-0"></span>',
  '<span class="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0"></span>'
);
indexHtml = indexHtml.replace(
  '<span class="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0 animate-pulse"></span>',
  '<span class="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0"></span>'
);

// Remove emojis and arrows from sublinks in OPINI modal
indexHtml = indexHtml.replace(
  '<span class="text-indigo-300">🏛️ Layanan Kantor Pusat (Kewenangan Penandatanganan)</span>',
  '<span class="text-indigo-300">Layanan Kantor Pusat (Kewenangan Penandatanganan)</span>'
);
indexHtml = indexHtml.replace(
  '<a href="portal-penugasan-jo.html?mode=pusat" class="text-amber-400 font-bold hover:underline">[Akses ➔]</a>',
  '<a href="portal-penugasan-jo.html?mode=pusat" class="text-amber-400 font-bold hover:underline">[Akses Wilayah Pusat]</a>'
);
indexHtml = indexHtml.replace(
  '<span class="text-sky-300">🏛️ Layanan Kantor Pusat (Kewenangan Penandatanganan)</span>',
  '<span class="text-sky-300">Layanan Kantor Pusat (Kewenangan Penandatanganan)</span>'
);
indexHtml = indexHtml.replace(
  '<a href="portal-nolap.html" class="text-amber-400 font-bold hover:underline">[Buka Portal Pusat ➔]</a>',
  '<a href="portal-nolap.html" class="text-amber-400 font-bold hover:underline">[Buka Portal Pusat]</a>'
);
indexHtml = indexHtml.replace(
  '<span class="text-amber-300">🏛️ Rekonsiliasi &amp; Penagihan Kantor Pusat</span>',
  '<span class="text-amber-300">Rekonsiliasi &amp; Penagihan Kantor Pusat</span>'
);
indexHtml = indexHtml.replace(
  '<a href="portal-kwitansi.html?mode=pusat" class="text-amber-400 font-bold hover:underline">[Akses ➔]</a>',
  '<a href="portal-kwitansi.html?mode=pusat" class="text-amber-400 font-bold hover:underline">[Akses Wilayah Pusat]</a>'
);

// WhatsApp request emoji
indexHtml = indexHtml.replace(
  '<span>📲 Kirim Request via WhatsApp Admin</span>',
  '<span>Kirim Permintaan via WhatsApp Admin</span>'
);

// Crown emoji in executive control tower
indexHtml = indexHtml.replace(
  '<span>👑</span> EXECUTIVE CONTROL TOWER &amp; SPM HUB',
  'EXECUTIVE CONTROL TOWER &amp; SPM HUB'
);

// Rocket emoji in submit button
indexHtml = indexHtml.replace(
  "btnSubmit.innerHTML = '<span>NIK Terverifikasi! Mengalihkan ke Presensi... 🚀</span>';",
  "btnSubmit.innerHTML = '<span>NIK Terverifikasi! Mengalihkan ke Presensi...</span>';"
);

// Stepper items in index.html (remove ✓ and ⏳, remove pulse)
indexHtml = indexHtml.replace(
  "badgeStatus = '<span class=\"px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30\">Selesai ✓</span>';",
  "badgeStatus = '<span class=\"px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30\">Selesai</span>';"
);
indexHtml = indexHtml.replace(
  "badgeStatus = '<span class=\"px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-400 animate-pulse\">Tahap Berjalan ⏳</span>';",
  "badgeStatus = '<span class=\"px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-400\">Tahap Berjalan</span>';"
);
indexHtml = indexHtml.replace(
  'nodeIcon = \'<span class="absolute -left-6 top-1 w-6 h-6 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center font-black text-xs shadow-md shadow-amber-500/40 ring-4 ring-slate-900 animate-pulse">',
  'nodeIcon = \'<span class="absolute -left-6 top-1 w-6 h-6 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center font-black text-xs shadow-md shadow-amber-500/40 ring-4 ring-slate-900">'
);

fs.writeFileSync('index.html', indexHtml, 'utf8');
console.log('✓ index.html updated');

// 2. UPDATE portal-tracking.html
let ptHtml = fs.readFileSync('portal-tracking.html', 'utf8');

// Remove pulse-amber-stage CSS class
ptHtml = ptHtml.replace(
  /\/\* Keyframe Pulse Glow \*\/[\s\S]*?\.pulse-amber-stage\s*\{[\s\S]*?\}/,
  '/* Keyframe Pulse Glow removed per antislop-ui */'
);

// Header active user display
ptHtml = ptHtml.replace(
  '<span id="user-display-avatar">DT</span>',
  '<span id="user-display-avatar">OP</span>'
);
ptHtml = ptHtml.replace(
  '<span class="text-xs text-slate-400">Profil Staf Aktif:</span>\n            <strong id="user-display-name" class="text-xs sm:text-sm font-extrabold text-white">Danny Taufik Hidayat, S.H.</strong>\n            <span id="user-display-nik" class="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">NSR-2019-005</span>',
  '<span class="text-xs text-slate-400">Profil Staf:</span>\n            <strong id="user-display-name" class="text-xs sm:text-sm font-extrabold text-white">Sesi Internal Staf</strong>\n            <span id="user-display-nik" class="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">-</span>'
);
ptHtml = ptHtml.replace(
  '<span class="text-xs text-slate-400">Profil Staf Aktif:</span>\r\n            <strong id="user-display-name" class="text-xs sm:text-sm font-extrabold text-white">Danny Taufik Hidayat, S.H.</strong>\r\n            <span id="user-display-nik" class="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">NSR-2019-005</span>',
  '<span class="text-xs text-slate-400">Profil Staf:</span>\r\n            <strong id="user-display-name" class="text-xs sm:text-sm font-extrabold text-white">Sesi Internal Staf</strong>\r\n            <span id="user-display-nik" class="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">-</span>'
);

ptHtml = ptHtml.replace(
  '<span>Jabatan: <strong id="user-display-jabatan" class="text-slate-300 font-semibold">Manager Admin &amp; Umum</strong></span>\n            <span>&bull;</span>\n            <span>Wilayah: <strong id="user-display-cabang" class="text-amber-400 font-bold">Pusat Jakarta</strong></span>',
  '<span>Jabatan: <strong id="user-display-jabatan" class="text-slate-300 font-semibold">Staf Penilai</strong></span>\n            <span>&bull;</span>\n            <span>Wilayah: <strong id="user-display-cabang" class="text-amber-400 font-bold">Kantor Pusat / Cabang</strong></span>'
);
ptHtml = ptHtml.replace(
  '<span>Jabatan: <strong id="user-display-jabatan" class="text-slate-300 font-semibold">Manager Admin &amp; Umum</strong></span>\r\n            <span>&bull;</span>\r\n            <span>Wilayah: <strong id="user-display-cabang" class="text-amber-400 font-bold">Pusat Jakarta</strong></span>',
  '<span>Jabatan: <strong id="user-display-jabatan" class="text-slate-300 font-semibold">Staf Penilai</strong></span>\r\n            <span>&bull;</span>\r\n            <span>Wilayah: <strong id="user-display-cabang" class="text-amber-400 font-bold">Kantor Pusat / Cabang</strong></span>'
);

ptHtml = ptHtml.replace(
  '<span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>',
  '<span class="w-2 h-2 rounded-full bg-emerald-400"></span>'
);

// Milestone update modal: remove spilled example
ptHtml = ptHtml.replace(
  'placeholder="Contoh: NSR-2019-005"',
  'placeholder="Masukkan NIK Karyawan"'
);

// Staff login modal: remove spilled example and subtitle
ptHtml = ptHtml.replace(
  '<p class="text-[11px] text-slate-400">Pilih simulasi wilayah atau login mandiri dengan NIK + PIN</p>',
  '<p class="text-[11px] text-slate-400">Autentikasi mandiri staf penugasan dengan NIK dan PIN</p>'
);
ptHtml = ptHtml.replace(
  'placeholder="Contoh: NSR-BDG-2020-39"',
  'placeholder="Masukkan NIK Karyawan"'
);

// DELETE Quick Switcher Profiles (5 Cabang) that leaked NIK & PINs!
const quickSwitcherRegex = /<!-- Quick Switcher Profiles \(5 Cabang\) -->[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/div>/;
ptHtml = ptHtml.replace(quickSwitcherRegex, '</div>\n      </div>\n    </div>');

// Default session in JS
ptHtml = ptHtml.replace(
  `let currentUserSession = {
      nik: 'NSR-2019-005',
      nama: 'Danny Taufik Hidayat, S.H.',
      jabatan: 'Manager Admin & Umum',
      divisi: 'Administrasi & Umum',
      kantor: 'Pusat Jakarta',
      cabang: 'Pusat Jakarta',
      branch_code: 'PUSAT',
      is_central: true,
      access_level: 'NATIONWIDE_FULL_ACCESS'
    };`,
  `let currentUserSession = {
      nik: '',
      nama: 'Otorisasi Staf Penugasan',
      jabatan: 'Staf Penilai',
      divisi: 'Operasional Penilaian',
      kantor: 'Kantor Pusat Jakarta',
      cabang: 'Kantor Pusat Jakarta',
      branch_code: 'PUSAT',
      is_central: true,
      access_level: 'NATIONWIDE_FULL_ACCESS'
    };`
);
// Also CRLF variant
ptHtml = ptHtml.replace(
  `let currentUserSession = {\r\n      nik: 'NSR-2019-005',\r\n      nama: 'Danny Taufik Hidayat, S.H.',\r\n      jabatan: 'Manager Admin & Umum',\r\n      divisi: 'Administrasi & Umum',\r\n      kantor: 'Pusat Jakarta',\r\n      cabang: 'Pusat Jakarta',\r\n      branch_code: 'PUSAT',\r\n      is_central: true,\r\n      access_level: 'NATIONWIDE_FULL_ACCESS'\r\n    };`,
  `let currentUserSession = {\r\n      nik: '',\r\n      nama: 'Otorisasi Staf Penugasan',\r\n      jabatan: 'Staf Penilai',\r\n      divisi: 'Operasional Penilaian',\r\n      kantor: 'Kantor Pusat Jakarta',\r\n      cabang: 'Kantor Pusat Jakarta',\r\n      branch_code: 'PUSAT',\r\n      is_central: true,\r\n      access_level: 'NATIONWIDE_FULL_ACCESS'\r\n    };`
);

// In initUserSession fallback
ptHtml = ptHtml.replace(
  "currentUserSession.nama = sessionData.nama || sessionData.displayName || 'Danny Taufik Hidayat, S.H.';\n            currentUserSession.jabatan = sessionData.roleLabel || sessionData.role || 'Manager Admin & Umum';\n            currentUserSession.nik = sessionData.nik || 'NSR-2019-005';",
  "currentUserSession.nama = sessionData.nama || sessionData.displayName || 'Staf Kantor Pusat';\n            currentUserSession.jabatan = sessionData.roleLabel || sessionData.role || 'Staf Operasional';\n            currentUserSession.nik = sessionData.nik || '';"
);
ptHtml = ptHtml.replace(
  "currentUserSession.nama = sessionData.nama || sessionData.displayName || 'Danny Taufik Hidayat, S.H.';\r\n            currentUserSession.jabatan = sessionData.roleLabel || sessionData.role || 'Manager Admin & Umum';\r\n            currentUserSession.nik = sessionData.nik || 'NSR-2019-005';",
  "currentUserSession.nama = sessionData.nama || sessionData.displayName || 'Staf Kantor Pusat';\r\n            currentUserSession.jabatan = sessionData.roleLabel || sessionData.role || 'Staf Operasional';\r\n            currentUserSession.nik = sessionData.nik || '';"
);

// In updateUserSessionUI: remove animate-pulse
ptHtml = ptHtml.replace(
  'badgeEl.innerHTML = `<span class="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span><span>Wilayah Terisolasi: ${currentUserSession.kantor}</span>`;',
  'badgeEl.innerHTML = `<span class="w-2 h-2 rounded-full bg-amber-400"></span><span>Wilayah Terisolasi: ${currentUserSession.kantor}</span>`;'
);
ptHtml = ptHtml.replace(
  'badgeEl.innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span><span>Akses Nasional (5 Kantor Wilayah)</span>`;',
  'badgeEl.innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-400"></span><span>Akses Nasional (5 Kantor Wilayah)</span>`;'
);

// In table row milestone pill
ptHtml = ptHtml.replace(
  "if (isM04) mPillClass = 'bg-amber-500/20 text-amber-300 border-amber-400 font-bold pulse-amber-stage';",
  "if (isM04) mPillClass = 'bg-amber-500/20 text-amber-300 border-amber-400 font-bold';"
);

// In vertical stepper modal
ptHtml = ptHtml.replace(
  "badgeStatus = '<span class=\"px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30\">Selesai ✓</span>';",
  "badgeStatus = '<span class=\"px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30\">Selesai</span>';"
);
ptHtml = ptHtml.replace(
  '<span class="absolute -left-6 top-1 w-6 h-6 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center font-black text-xs shadow-md shadow-amber-500/40 ring-4 ring-slate-900 animate-pulse">',
  '<span class="absolute -left-6 top-1 w-6 h-6 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center font-black text-xs shadow-md shadow-amber-500/40 ring-4 ring-slate-900">'
);
ptHtml = ptHtml.replace(
  "badgeStatus = '<span class=\"px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-400 animate-pulse\">Tahap Berjalan ⏳</span>';",
  "badgeStatus = '<span class=\"px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-400\">Tahap Berjalan</span>';"
);
ptHtml = ptHtml.replace(
  "boxStyle = 'border-amber-500/40 bg-gradient-to-r from-amber-500/10 via-slate-900 to-slate-900 pulse-amber-stage';",
  "boxStyle = 'border-amber-500/40 bg-gradient-to-r from-amber-500/10 via-slate-900 to-slate-900';"
);

// Alerts
ptHtml = ptHtml.replace("alert('✓ Sukses! Milestone berhasil diperbarui:\\n\\n' + res.message);", "alert('Sukses! Milestone berhasil diperbarui:\\n\\n' + res.message);");
ptHtml = ptHtml.replace("alert('✓ Sukses! Job Order baru berhasil diterbitkan:\\n\\n• Nomor JO: ' + res.data.jo_number + '\\n• Kode Lacak: ' + res.data.kode_lacak + '\\n• Debitur: ' + res.data.debitur);", "alert('Sukses! Job Order baru berhasil diterbitkan:\\n\\nNomor JO: ' + res.data.jo_number + '\\nKode Lacak: ' + res.data.kode_lacak + '\\nDebitur: ' + res.data.debitur);");
ptHtml = ptHtml.replace("alert('✓ Data simulasi berhasil direset ke kondisi awal (Lengkap 5 Kantor Wilayah).');", "alert('Data simulasi berhasil direset ke kondisi awal.');");

fs.writeFileSync('portal-tracking.html', ptHtml, 'utf8');
console.log('✓ portal-tracking.html updated');

// 3. UPDATE portal-penugasan-jo.html
let joHtml = fs.readFileSync('portal-penugasan-jo.html', 'utf8');
joHtml = joHtml.replace('placeholder="Contoh: NSR-2024-001"', 'placeholder="Masukkan NIK Pemohon"');
joHtml = joHtml.replace('placeholder="NSR-2026-..."', 'placeholder="Masukkan NIK Karyawan"');
fs.writeFileSync('portal-penugasan-jo.html', joHtml, 'utf8');
console.log('✓ portal-penugasan-jo.html updated');

// 4. UPDATE portal-nolap.html
let nolapHtml = fs.readFileSync('portal-nolap.html', 'utf8');
nolapHtml = nolapHtml.replace('placeholder="Contoh: NSR-2024-001"', 'placeholder="Masukkan NIK Pemohon"');
nolapHtml = nolapHtml.replace('placeholder="Contoh: NSR-2026-BDG-0012"', 'placeholder="Masukkan ID Penugasan"');
fs.writeFileSync('portal-nolap.html', nolapHtml, 'utf8');
console.log('✓ portal-nolap.html updated');

// 5. UPDATE gas-portal-absensi-template.html
if (fs.existsSync('gas-portal-absensi-template.html')) {
  let gasHtml = fs.readFileSync('gas-portal-absensi-template.html', 'utf8');
  gasHtml = gasHtml.replace('Contoh: NSR-[tahun masuk]-[nomor urut]', 'Format NIK Terdaftar');
  gasHtml = gasHtml.replace('placeholder="Contoh: NSR-001"', 'placeholder="Masukkan NIK Karyawan"');
  fs.writeFileSync('gas-portal-absensi-template.html', gasHtml, 'utf8');
  console.log('✓ gas-portal-absensi-template.html updated');
}

console.log('--- ALL UPDATES COMPLETED SUCCESSFULLY ---');
