import fs from 'fs';

const content = fs.readFileSync('portal-nolap.html', 'utf8');
const lines = content.split('\n');

console.log('=== validasiFormDanMitigasiLive CONTINUATION (Lines 21121-21155) ===');
for (let i = 21120; i < 21155; i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}
