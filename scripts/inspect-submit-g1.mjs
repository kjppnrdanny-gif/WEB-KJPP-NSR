import fs from 'fs';

const c = fs.readFileSync('nolap-data-handler.php', 'utf8');
const lines = c.split('\n');

const sIdx = lines.findIndex(l => l.includes("action === 'submitGerbang1Awal'"));
console.log(lines.slice(sIdx, sIdx + 70).join('\n'));
