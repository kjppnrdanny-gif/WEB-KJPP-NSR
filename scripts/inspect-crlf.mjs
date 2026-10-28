import fs from 'fs';

const content = fs.readFileSync('portal-penugasan-jo.html', 'utf8');
const idx = content.indexOf('pengaju_wa_display');
console.log(JSON.stringify(content.slice(idx - 50, idx + 350)));
