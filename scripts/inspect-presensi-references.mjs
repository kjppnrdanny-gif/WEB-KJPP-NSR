import fs from 'fs';

const pages = [
  'index.html',
  'portofolio-rekanan.html',
  'layanan.html',
  'profil-legalitas.html',
  'tim-cabang.html',
  'wawasan-regulasi.html',
  'portal-absensi.html',
  'portal-presensi.html'
];

for (const p of pages) {
  if (fs.existsSync(p)) {
    const content = fs.readFileSync(p, 'utf8');
    const lines = content.split('\n');
    console.log(`\n=== File: ${p} ===`);
    lines.forEach((l, i) => {
      if (l.toLowerCase().includes('presensi') || l.toLowerCase().includes('absensi') || l.toLowerCase().includes('script.google.com') || l.toLowerCase().includes('portal-presensi') || l.toLowerCase().includes('portal-absensi')) {
        console.log(`Line ${i + 1}: ${l.trim().substring(0, 140)}`);
      }
    });
  }
}
