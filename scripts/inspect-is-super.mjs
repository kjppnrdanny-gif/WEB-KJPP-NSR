import fs from 'fs';

const content = fs.readFileSync('portal-nolap.html', 'utf8');
const lines = content.split('\n');

console.log('=== isSuperOrAdminPusat (Lines 13935-13965) ===');
for (let i = 13934; i < 13965; i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}
