import fs from 'fs';

console.log('=== PEMBARUAN NOMENKLATUR PERSEKUTUAN PERDATA (KJPP NSR) ===');

// 1. alur-kerja-penugasan-nolap-kwitansi.html
let alur = fs.readFileSync('alur-kerja-penugasan-nolap-kwitansi.html', 'utf8');

alur = alur.replace(
  '<p class="font-bold text-slate-900">Pemimpin Rekan / Direktur Utama</p>',
  '<p class="font-bold text-slate-900">Pemimpin Rekan</p>'
);

alur = alur.replace(
  '<th class="p-2.5 w-16">Direksi</th>',
  '<th class="p-2.5 w-16">Pimp. Rekan</th>'
);

alur = alur.replace(
  'Untuk membantu Direksi &amp; Kepala Kantor dalam sosialisasi implementasi portal ke seluruh personel:',
  'Untuk membantu Manajemen &amp; Kepala Kantor Cabang dalam sosialisasi implementasi portal ke seluruh personel:'
);

alur = alur.replace(
  'Dokumen ini disusun sebagai panduan operasional tunggal bagi seluruh jajaran manajemen, Penilai Publik, tim penilai, surveyor, komite kendali mutu (QA), staf pemasaran, serta divisi keuangan',
  'Dokumen ini disusun sebagai panduan operasional tunggal bagi seluruh jajaran Manajemen, Penilai Publik, tim penilai, surveyor, komite kendali mutu (QA), staf pemasaran, serta divisi keuangan'
);

fs.writeFileSync('alur-kerja-penugasan-nolap-kwitansi.html', alur, 'utf8');
console.log('✓ alur-kerja-penugasan-nolap-kwitansi.html: Disahkan oleh "Pemimpin Rekan" & istilah Direksi diganti Manajemen/Pimp. Rekan');

// 2. daftar-token-akses-internal.html
let tokenHtml = fs.readFileSync('daftar-token-akses-internal.html', 'utf8');

tokenHtml = tokenHtml.replace(
  '<!-- BAGIAN 0: KUNCI INDUK MASTER DIREKSI (KHUSUS PEMILIK / DIREKTUR)  -->',
  '<!-- BAGIAN 0: KUNCI INDUK MASTER PEMIMPIN REKAN (KHUSUS PEMILIK / PEMIMPIN REKAN)  -->'
);

tokenHtml = tokenHtml.replace(
  '<span class="text-xs font-bold text-amber-300">HANYA UNTUK PEMILIK / DIREKTUR UTAMA</span>',
  '<span class="text-xs font-bold text-amber-300">HANYA UNTUK PEMILIK / PEMIMPIN REKAN</span>'
);

tokenHtml = tokenHtml.replace(
  '<span class="block text-[10px] text-slate-400 font-semibold uppercase tracking-wider">PIN Token Master Direksi</span>',
  '<span class="block text-[10px] text-slate-400 font-semibold uppercase tracking-wider">PIN Token Master Pemimpin Rekan</span>'
);

tokenHtml = tokenHtml.replace(
  'KUNCI INDUK SUPER ADMIN ROOT (MASTER OVERRIDE)',
  'KUNCI INDUK PEMIMPIN REKAN (MASTER OVERRIDE)'
);

tokenHtml = tokenHtml.replace(
  'DIREKSI &bull; KOMITE PENGENDALIAN MUTU &bull; KJPP NANANG RAHAYU &amp; REKAN',
  'MANAJEMEN &bull; KOMITE PENGENDALIAN MUTU &bull; KJPP NANANG RAHAYU &amp; REKAN'
);

tokenHtml = tokenHtml.replace(
  /Direktur Utama/g,
  'Pemimpin Rekan'
);

tokenHtml = tokenHtml.replace(
  /Direksi/g,
  'Manajemen'
);

fs.writeFileSync('daftar-token-akses-internal.html', tokenHtml, 'utf8');
console.log('✓ daftar-token-akses-internal.html: Berhasil menyesuaikan nomenklatur Persekutuan Perdata');

// 3. panduan-operasional-portal-nolap.html
let panduan = fs.readFileSync('panduan-operasional-portal-nolap.html', 'utf8');

panduan = panduan.replace(
  'diberikan oleh Direksi / Kantor Pusat ke dalam form login.',
  'diberikan oleh Manajemen / Kantor Pusat ke dalam form login.'
);

panduan = panduan.replace(
  /Direktur Utama/g,
  'Pemimpin Rekan'
);

panduan = panduan.replace(
  /Direksi/g,
  'Manajemen'
);

fs.writeFileSync('panduan-operasional-portal-nolap.html', panduan, 'utf8');
console.log('✓ panduan-operasional-portal-nolap.html: Berhasil menyesuaikan nomenklatur Persekutuan Perdata');

// 4. Update script helpers
let updateScript = fs.readFileSync('scripts/update-auth-system-tokens.mjs', 'utf8');
updateScript = updateScript.replace(/Super Admin Pusat \(Direksi\)/g, 'Super Admin Pusat (Pemimpin Rekan)');
fs.writeFileSync('scripts/update-auth-system-tokens.mjs', updateScript, 'utf8');

let testScript = fs.readFileSync('scripts/test-all-12-tokens.mjs', 'utf8');
testScript = testScript.replace(/Super Admin Pusat \(Direksi\)/g, 'Super Admin Pusat (Pemimpin Rekan)');
fs.writeFileSync('scripts/test-all-12-tokens.mjs', testScript, 'utf8');

console.log('=== PEMBARUAN NOMENKLATUR SELESAI DENGAN SUKSES ===');
