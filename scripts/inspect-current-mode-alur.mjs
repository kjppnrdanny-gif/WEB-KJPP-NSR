import fs from 'node:fs';

const html = fs.readFileSync('portal-penugasan-jo.html', 'utf8');
const idx = html.indexOf('let currentModeAlur');
if (idx !== -1) {
  console.log(html.substring(idx - 100, idx + 1500));
} else {
  const idx2 = html.indexOf('currentModeAlur');
  console.log(html.substring(idx2 - 100, idx2 + 1500));
}
