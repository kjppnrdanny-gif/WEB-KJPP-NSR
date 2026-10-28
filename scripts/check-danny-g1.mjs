import fs from 'fs';

const c = fs.readFileSync('nolap-data-handler.php', 'utf8').replace(/\r\n/g, '\n');
const lines = c.split('\n');

const dIdx = lines.findIndex(l => l.includes("action === 'reviewDannyGerbang1'"));
console.log('dIdx:', dIdx);
console.log(lines.slice(dIdx, dIdx + 40).join('\n'));
