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
  // Tahap 1 Revised Content (SPI 103 & Surat Representasi)
  'Permintaan &amp; Lingkup Penugasan (SPK)',
  'Penelaahan permintaan penawaran (RFP), evaluasi penerimaan penugasan, penetapan Lingkup Penugasan sesuai SPI 103, kesepakatan SPK, serta permintaan Surat Representasi Pemberi Tugas atas data dan dokumen penilaian.',
  'Evaluasi Penerimaan Penugasan',
  'Penelaahan permintaan klien, kompetensi, independensi, potensi benturan kepentingan, serta kelayakan penerimaan penugasan sesuai KEPI dan ketentuan profesi.',
  'Kesepakatan mengenai identitas para pihak, objek dan hak yang dinilai, tujuan penilaian, dasar nilai, tanggal penilaian, mata uang, lingkup investigasi, sumber informasi, asumsi dan batasan, bentuk laporan, serta ketentuan penggunaan dan publikasinya.',
  'Penetapan ruang lingkup pekerjaan, hak dan kewajiban para pihak, biaya jasa, jadwal pelaksanaan, serta persyaratan dokumen penugasan.',
  'Permintaan pernyataan tertulis dari Pemberi Tugas mengenai kebenaran, kelengkapan, keabsahan, kewenangan penyampaian, dan pengungkapan informasi material atas data serta dokumen bahan penilaian.',
  'Surat Representasi tidak menggantikan kewajiban verifikasi dan pertimbangan profesional Penilai. Penerimaan surat mengikuti persyaratan penugasan dan SOP KJPP sebelum finalisasi laporan, apabila dipersyaratkan.',
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

console.log('--- RUNNING SOP TIMELINE & TAHAP 01 SPI 103 VERIFICATION TEST ---');

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
      console.error(`  [X] Missing text: "${text.substring(0, 45)}..."`);
      allPassed = false;
    } else {
      console.log(`  [OK] Found text: "${text.substring(0, 40)}..."`);
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
