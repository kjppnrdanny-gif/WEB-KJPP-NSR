import fs from 'fs';

const html = fs.readFileSync('portal-penugasan-jo.html', 'utf8');

const idx = html.indexOf('id="panel_deklarasi_eti"');
console.log('panel_deklarasi_eti at:', idx);
if (idx !== -1) {
  console.log(html.substring(idx - 100, idx + 2500));
}
