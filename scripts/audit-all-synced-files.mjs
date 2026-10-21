import fs from 'node:fs';

const FILES = [
  'index.html',
  'portofolio-rekanan.html',
  'layanan.html',
  'profil-legalitas.html',
  'tim-cabang.html',
  'wawasan-regulasi.html'
];

console.log('========================================================');
console.log('🔍 AUDIT INTEGRITAS GLOBAL OPINI NSR PADA 6 BERKAS HTML');
console.log('========================================================\n');

let allPassed = true;

for (const file of FILES) {
  const content = fs.readFileSync(file, 'utf8');
  console.log(`Pemeriksaan berkas: ${file}`);

  const checks = [
    { name: 'Navbar Desktop OPINI NSR', pass: content.includes('<span class="tracking-wide">OPINI NSR</span>') },
    { name: 'Navbar Mobile OPINI NSR', pass: content.includes('OPINI NSR &bull; Portal Internal') },
    { name: 'Header Modal OPINI NSR', pass: content.includes('OPINI NSR &bull; Dari Data Lapangan Menjadi Opini yang Andal') || content.includes('OPINI NSR • Dari Data Lapangan Menjadi Opini yang Andal') },
    { name: 'Akronim Resmi', pass: content.includes('Otorisasi Penilaian, Informasi, &amp; Navigasi Internal KJPP NSR') },
    { name: 'Badge KMK Resmi', pass: content.includes('Lembaga Berizin KMK No. 2.19.0160') },
    { name: 'Banner Warning ID', pass: content.includes('id="banner-warning-portal"') },
    { name: 'Kartu Biaya Operasional', pass: content.includes('id="kartu-e-operasional"') },
    { name: 'Kartu Surat Umum (Pusat Only)', pass: content.includes('data-access="pusat-only"') },
    { name: 'Kartu Presensi', pass: content.includes('id="kartu-presensi-wrapper"') },
    { name: 'Modal Request SOP', pass: content.includes('id="modal-request-sop"') },
    { name: 'Fungsi updateDynamicSmartCards', pass: content.includes('function updateDynamicSmartCards(auth)') },
    { name: 'Fungsi resolveUnifiedToken', pass: content.includes('function resolveUnifiedToken(rawToken)') },
    { name: 'Fungsi bukaModalPortal', pass: content.includes('function bukaModalPortal(targetPortal)') }
  ];

  let filePass = true;
  for (const c of checks) {
    if (!c.pass) {
      console.error(`  ❌ GAGAL: ${c.name}`);
      filePass = false;
      allPassed = false;
    }
  }

  if (filePass) {
    console.log('  ✅ SEMUA 13 TITIK INTEGRITAS PASS!\n');
  } else {
    console.log('  ❌ ADA KEGAGALAN!\n');
  }
}

if (!allPassed) {
  process.exit(1);
} else {
  console.log('========================================================');
  console.log('🎉 100% AUDIT BERHASIL: SELURUH 6 BERKAS IDENTIK & LENGKAP!');
  console.log('========================================================');
}
