import fs from 'fs';

const content = fs.readFileSync('portal-nolap.html', 'utf8');
const lines = content.split('\n');

console.log('=== ajukanPermohonanNoLap (Lines 15570-15650) ===');
for (let i = 15570; i < 15650; i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}
