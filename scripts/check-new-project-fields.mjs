import fs from 'fs';

const c = fs.readFileSync('portal-penugasan-jo.html', 'utf8').replace(/\r\n/g, '\n');
const lines = c.split('\n');

console.log(lines.slice(6850, 6920).join('\n'));
