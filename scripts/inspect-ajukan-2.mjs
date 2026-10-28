import fs from 'fs';

const content = fs.readFileSync('portal-nolap.html', 'utf8');
const lines = content.split('\n');

console.log('=== ajukanPermohonanNoLap CONTINUATION (Lines 15651-15730) ===');
for (let i = 15650; i < 15730; i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}
