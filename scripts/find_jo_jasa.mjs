import fs from 'fs';

const html = fs.readFileSync('portal-penugasan-jo.html', 'utf8');
const lines = html.split('\n');

lines.forEach((l, idx) => {
  if (l.includes('klasifikasi_jasa') || l.includes('klasifikasiJasa') || l.includes('jenis_jasa') || l.includes('bidang_jasa') || l.includes('service_classification') || l.includes('Klasifikasi Jasa')) {
    console.log(`L${idx + 1}: ${l.trim()}`);
  }
});
