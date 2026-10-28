import fs from 'node:fs';

const html = fs.readFileSync('portal-penugasan-jo.html', 'utf8');
const idx = html.indexOf('function eksekusiApprovalPusatSubmit');
console.log(html.substring(idx + 2400, idx + 5000));
