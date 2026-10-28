import fs from 'fs';

const html = fs.readFileSync('portal-penugasan-jo.html', 'utf8');

const idx = html.indexOf('toolbar-cetak-dokumen');
console.log('toolbar-cetak-dokumen pos:', idx);
if (idx !== -1) {
  console.log(html.substring(idx - 200, idx + 2500));
}
