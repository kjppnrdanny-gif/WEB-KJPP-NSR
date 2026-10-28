import fs from 'node:fs';

const html = fs.readFileSync('portal-penugasan-jo.html', 'utf8');
const idx = html.indexOf('function eksekusiApprovalPusatSubmit');
if (idx !== -1) {
  console.log(html.substring(idx, idx + 2500));
} else {
  console.log('function eksekusiApprovalPusatSubmit not found');
}
