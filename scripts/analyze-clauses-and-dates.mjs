import fs from 'fs';

const jo = fs.readFileSync('portal-penugasan-jo.html', 'utf8');

console.log('=== SEARCH DASAR NILAI & TUJUAN FORM FIELDS ===');
const lines = jo.split('\n');
lines.forEach((l, idx) => {
  if (l.includes('dasar_nilai') || l.includes('tujuan_penilaian') || l.includes('tgl_inspeksi') || l.includes('tanggal_penilaian') || l.includes('tanggal_laporan')) {
    if (l.includes('<input') || l.includes('<select') || l.includes('<textarea') || l.includes('<label')) {
      console.log(`${idx+1}: ${l.trim().substring(0, 100)}`);
    }
  }
});
