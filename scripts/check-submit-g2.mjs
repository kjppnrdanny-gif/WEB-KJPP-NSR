import fs from 'fs';

const c = fs.readFileSync('nolap-data-handler.php', 'utf8').replace(/\r\n/g, '\n');
const lines = c.split('\n');

const g2Idx = lines.findIndex(l => l.includes("action === 'submitGerbang2Akhir'"));
console.log('g2Idx:', g2Idx);
console.log(lines.slice(g2Idx, g2Idx + 60).join('\n'));
