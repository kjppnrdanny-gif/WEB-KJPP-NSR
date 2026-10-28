import fs from 'fs';

const files = ['portal-penugasan-jo.html', 'portal-nolap.html', 'portal-nolap-cabang.html'];

files.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  const lines = content.split('\n');
  lines.forEach((l, idx) => {
    if (l.includes('Penilaian Bisnis') || l.includes('Personal Properti') || l.includes('Properti Sederhana') || l.includes('klasifikasiJasa') || l.includes('service_classification') || l.includes('Klasifikasi Jasa Penilaian')) {
      console.log(`${f}:${idx + 1}: ${l.trim()}`);
    }
  });
});
