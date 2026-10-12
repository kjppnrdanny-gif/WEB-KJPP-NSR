// tests/verify-sop-refinement.mjs
import fs from 'fs';
import path from 'path';

const filesToTest = [
  'index.html',
  'layanan.html',
  'dist/index.html',
  'dist/layanan.html'
];

let allPassed = true;

const requiredTexts = [
  'Standard Operating Procedure',
  'Alur Penugasan Penilaian Resmi',
  // Tahap 1
  'Penelaahan permintaan penawaran, ruang lingkup pekerjaan, penerimaan penugasan, dan kesepakatan SPK.',
  // Tahap 2
  'Inspeksi objek jika dipersyaratkan, dokumentasi lapangan, serta verifikasi data dan dokumen pendukung.',
  // Tahap 3
  'Analisis data pasar dan penerapan pendekatan serta metode penilaian yang relevan sesuai SPI.',
  // Tahap 4
  'Penelaahan teknis, pemeriksaan kepatuhan, dan verifikasi oleh pihak berwenang sesuai prosedur kendali mutu.',
  // Tahap 5
  'Finalisasi laporan penilaian dan penyerahan dokumen kepada pemberi tugas setelah seluruh persyaratan terpenuhi.',
  // NoLap & eLSa-PK verification
  'Mekanisme Resmi Nomor Laporan (NoLap)',
  'eLSa-PK'
];

const requiredSelectorsOrClasses = [
  'id="alur-penugasan-sop"',
  'id="sop-detail-panel"',
  'pilihTahapSop',
  'navigasiTahapSop',
  'text-teal-300',
  'border-teal-500',
  'lg:grid-cols-5'
];

console.log('--- RUNNING SOP TIMELINE VERIFICATION TEST ---');

for (const relPath of filesToTest) {
  const filePath = path.join(process.cwd(), relPath);
  if (!fs.existsSync(filePath)) {
    console.error(`FAIL: File ${relPath} does not exist!`);
    allPassed = false;
    continue;
  }

  const content = fs.readFileSync(filePath, 'utf8');

  console.log(`\nTesting file: ${relPath} (${content.length} bytes)...`);

  // Check required texts
  for (const text of requiredTexts) {
    if (!content.includes(text)) {
      console.error(`  [X] Missing text: "${text.substring(0, 40)}..."`);
      allPassed = false;
    } else {
      console.log(`  [OK] Found text: "${text.substring(0, 35)}..."`);
    }
  }

  // Check selectors and classes
  for (const item of requiredSelectorsOrClasses) {
    if (!content.includes(item)) {
      console.error(`  [X] Missing feature: "${item}"`);
      allPassed = false;
    } else {
      console.log(`  [OK] Found feature: "${item}"`);
    }
  }
}

if (!allPassed) {
  console.error('\nTEST RESULT: FAILED! Some checks failed.');
  process.exit(1);
} else {
  console.log('\nTEST RESULT: ALL CHECKS PASSED (100% SUCCESS)!');
}
