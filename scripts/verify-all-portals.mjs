import fs from 'fs';
import vm from 'vm';

const files = [
  'portal-penugasan-jo.html',
  'portal-nolap.html',
  'portal-nolap-dev.html',
  'portal-kwitansi.html'
];

console.log('====================================================');
console.log('MEMULAI VERIFIKASI SINTAKS & INTEGRASI 4 PORTAL');
console.log('====================================================');

let totalBlocks = 0;
let errors = 0;

files.forEach(f => {
  if (!fs.existsSync(f)) {
    console.error(`[ERROR] File ${f} does not exist!`);
    errors++;
    return;
  }
  const html = fs.readFileSync(f, 'utf8');
  const scriptMatches = [...html.matchAll(/<script(?:\s+[^>]*)?>([\s\S]*?)<\/script>/gi)];
  console.log(`\n📄 File: ${f} (Total script tags: ${scriptMatches.length})`);
  
  scriptMatches.forEach((m, idx) => {
    const code = m[1];
    if (!code.trim()) return;
    totalBlocks++;
    try {
      new vm.Script(code);
      console.log(`  ✓ Script #${idx + 1} valid (size: ${(code.length / 1024).toFixed(1)} KB)`);
    } catch (err) {
      errors++;
      console.error(`  ✗ Script #${idx + 1} INVALID:`, err.message);
    }
  });

  // Cek ketersediaan elemen Auto-Populate Bridge
  if (f.includes('portal-nolap') || f.includes('portal-kwitansi')) {
    const hasBridgeInput = html.includes('input_cari_spk_bridge') || html.includes('cari-spk-kwitansi-bridge');
    const hasBridgeFunc = html.includes('tarikDataDariPenugasan') || html.includes('tarikDataPenugasanKwitansi');
    console.log(`  ✓ Bridge UI Present: ${hasBridgeInput}`);
    console.log(`  ✓ Bridge Function Present: ${hasBridgeFunc}`);
    if (!hasBridgeInput || !hasBridgeFunc) {
      errors++;
      console.error(`  ✗ Missing bridge component in ${f}`);
    }
  }

  if (f === 'portal-penugasan-jo.html') {
    const hasBidang = html.includes('pemberi_tugas_bidang');
    const hasTermin = html.includes('setSkemaTerminPenugasan');
    const hasPengguna = html.includes('presetSameAsClientPenugasan');
    const hasTanah = html.includes('onKategoriSkalaTanahJoChange');
    console.log(`  ✓ Bidang Usaha Field: ${hasBidang}`);
    console.log(`  ✓ Skema Termin Penagihan: ${hasTermin}`);
    console.log(`  ✓ Pengguna Laporan Preset: ${hasPengguna}`);
    console.log(`  ✓ Pengadaan Tanah Logic: ${hasTanah}`);
    if (!hasBidang || !hasTermin || !hasPengguna || !hasTanah) {
      errors++;
      console.error(`  ✗ Missing penugasan standard components in ${f}`);
    }
  }
});

console.log('\n====================================================');
if (errors === 0) {
  console.log(`✨ SEMUA ${totalBlocks} BLOK SKRIP & FITUR TERVERIFIKASI 100% SUKSES!`);
} else {
  console.error(`❌ TERDAPAT ${errors} KESALAHAN!`);
  process.exit(1);
}
console.log('====================================================');
