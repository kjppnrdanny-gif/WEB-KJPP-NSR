import fs from 'fs';

const content = fs.readFileSync('portal-penugasan-jo.html', 'utf8');

console.log('--- Line 4910-4940 ---');
const idx1 = content.indexOf("0001/JO/NSR/X/2026 (DRAF)");
console.log(content.slice(idx1 - 400, idx1 + 600));

console.log('\n--- Line 9765-9795 ---');
const idx2 = content.indexOf("let noSeqClean = '0001'");
console.log(content.slice(idx2 - 300, idx2 + 500));
