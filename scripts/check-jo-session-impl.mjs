import fs from 'fs';

const c = fs.readFileSync('portal-penugasan-jo.html', 'utf8').replace(/\r\n/g, '\n');
const lines = c.split('\n');

console.log(lines.slice(4225, 4280).join('\n'));
