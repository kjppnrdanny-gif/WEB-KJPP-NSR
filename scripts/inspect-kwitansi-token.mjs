import fs from 'fs';

const c = fs.readFileSync('portal-kwitansi.html', 'utf8');
const lines = c.split('\n');
console.log(lines.slice(2305, 2320).join('\n'));
