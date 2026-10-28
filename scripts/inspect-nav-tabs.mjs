import fs from 'fs';

const content = fs.readFileSync('portal-penugasan-jo.html', 'utf8');
const navIdx = content.indexOf('btn-tab-preview');
console.log(content.slice(navIdx - 400, navIdx + 600));
