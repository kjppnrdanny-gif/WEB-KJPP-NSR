import fs from 'fs';

const content = fs.readFileSync('portal-nolap.html', 'utf8');
const lines = content.split('\n');

console.log('=== ajukanPermohonanNoLap CONTINUATION 4 (Lines 15821-15920) ===');
for (let i = 15820; i < 15920; i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}
