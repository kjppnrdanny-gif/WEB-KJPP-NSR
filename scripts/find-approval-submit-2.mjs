import fs from 'fs';

const html = fs.readFileSync('portal-penugasan-jo.html', 'utf8');

const idx = html.indexOf('function eksekusiApprovalPusatSubmit');
console.log(html.substring(idx + 1800, idx + 4500));
