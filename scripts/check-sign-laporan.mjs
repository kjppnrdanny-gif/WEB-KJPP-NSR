import fs from 'fs';

const c = fs.readFileSync('nolap-data-handler.php', 'utf8').replace(/\r\n/g, '\n');
const lines = c.split('\n');

const sIdx = lines.findIndex(l => l.includes("action === 'signLaporanPenilaiPublik'"));
console.log('sIdx:', sIdx);
console.log(lines.slice(sIdx, sIdx + 70).join('\n'));
