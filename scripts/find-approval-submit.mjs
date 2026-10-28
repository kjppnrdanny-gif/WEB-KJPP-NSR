import fs from 'fs';

const html = fs.readFileSync('portal-penugasan-jo.html', 'utf8');

const idx = html.indexOf('function eksekusiApprovalPusat');
console.log('eksekusiApprovalPusat at:', idx);
if (idx !== -1) {
  console.log(html.substring(idx, idx + 2500));
}
