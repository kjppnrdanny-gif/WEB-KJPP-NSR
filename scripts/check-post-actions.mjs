import fs from 'fs';

const c = fs.readFileSync('nolap-data-handler.php', 'utf8');
const lines = c.split('\n');

const g1Idx = lines.findIndex(l => l.includes("action === 'submitGerbang1Awal'"));
console.log('g1Idx:', g1Idx);
console.log(lines.slice(g1Idx - 20, g1Idx + 20).join('\n'));
