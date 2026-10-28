import fs from 'fs';

const content = fs.readFileSync('portal-nolap.html', 'utf8');
const lines = content.split('\n');

console.log('=== MAIN TAB BAR (Lines 180-240) ===');
for (let i = 180; i < 240; i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}
