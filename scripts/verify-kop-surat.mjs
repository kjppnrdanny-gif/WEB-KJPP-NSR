import fs from 'node:fs';
import path from 'node:path';

const html = fs.readFileSync('portal-penugasan-jo.html', 'utf8');

console.log('--- AUDIT KOP SURAT RESMI DI portal-penugasan-jo.html ---');
const hasHelper = html.includes('function renderKopSuratResmiNSR()');
console.log('1. Helper renderKopSuratResmiNSR exists:', hasHelper);

const hasKopSuratImg = html.includes('images/kop-surat-nsr.png');
console.log('2. Image path images/kop-surat-nsr.png exists:', hasKopSuratImg);

const matches3D = html.includes('renderKopSuratResmiNSR()') && html.includes('SURAT TUGAS');
console.log('3. Dokumen 3D (Surat Tugas) integrated:', matches3D);

const matches3E = html.includes('BERITA ACARA PEMERIKSAAN / INSPEKSI LAPANGAN (BAP)');
console.log('4. Dokumen 3E (BAP) integrated:', matches3E);

const matches3F = html.includes('EVALUASI TINGKAT INDEPENDENSI (ETI)');
console.log('5. Dokumen 3F (ETI) integrated:', matches3F);

const matches3G = html.includes('PERNYATAAN INDEPENDENSI (PI)');
console.log('6. Dokumen 3G (PI) integrated:', matches3G);

const hasPrintCss = html.includes('.kop-surat-resmi, .kop-img-resmi');
console.log('7. Print CSS optimization exists:', hasPrintCss);

const countKopCalls = (html.match(/renderKopSuratResmiNSR\(\)/g) || []).length;
console.log('8. Total renderKopSuratResmiNSR invocations:', countKopCalls);

if (!hasHelper || !hasKopSuratImg || !matches3D || !matches3E || !matches3F || !matches3G || !hasPrintCss || countKopCalls < 5) {
  console.error('Audit failed!');
  process.exit(1);
} else {
  console.log('✅ ALL AUDIT CHECKS PASSED (Invocations: ' + countKopCalls + ')!');
}
