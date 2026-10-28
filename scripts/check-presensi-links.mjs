import fs from 'fs';

const files = [
  'portal-nolap.html',
  'portal-kwitansi.html',
  'portal-penugasan-jo.html',
  'index.html',
  'portal-operasional.html',
  'portal-surat-umum.html',
  'portal-presensi.html'
];

for (const f of files) {
  if (fs.existsSync(f)) {
    const content = fs.readFileSync(f, 'utf8');
    const matches = content.match(/href=["'][^"']*script\.google\.com[^"']*["']/g);
    if (matches) {
      console.log(f, matches);
    }
  }
}
