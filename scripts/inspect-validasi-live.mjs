import fs from 'fs';

const content = fs.readFileSync('portal-nolap.html', 'utf8');
const lines = content.split('\n');

console.log('=== validasiFormDanMitigasiLive (Lines 21040-21120) ===');
for (let i = 21039; i < 21120; i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}
