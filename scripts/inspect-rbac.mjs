import fs from 'fs';

const content = fs.readFileSync('portal-nolap.html', 'utf8');
const lines = content.split('\n');

console.log('=== APPLYRBAC (Lines 13968-14060) ===');
for (let i = 13968; i < 14060; i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}
