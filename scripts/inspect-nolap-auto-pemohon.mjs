import fs from 'fs';

const nolap = fs.readFileSync('portal-nolap.html', 'utf8');
const lines = nolap.split('\n');

console.log(lines.slice(14375, 14460).join('\n'));
