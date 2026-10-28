import fs from 'fs';

const c = fs.readFileSync('portal-penugasan-jo.html', 'utf8');
const lines = c.split('\n');
console.log(lines.slice(11615, 11640).join('\n'));
