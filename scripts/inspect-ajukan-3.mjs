import fs from 'fs';

const content = fs.readFileSync('portal-nolap.html', 'utf8');
const lines = content.split('\n');

console.log('=== ajukanPermohonanNoLap CONTINUATION 3 (Lines 15731-15820) ===');
for (let i = 15730; i < 15820; i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}
