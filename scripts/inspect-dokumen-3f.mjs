import fs from 'fs';

const html = fs.readFileSync('portal-penugasan-jo.html', 'utf8');

const idx = html.indexOf('id="dokumen-3f"');
console.log('dokumen-3f at:', idx);
if (idx !== -1) {
  console.log(html.substring(idx - 100, idx + 2500));
} else {
  const m = html.indexOf('3F');
  console.log('3F search:', m);
  if (m !== -1) console.log(html.substring(m - 50, m + 500));
}
