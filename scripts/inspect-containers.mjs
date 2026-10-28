import fs from 'fs';

const content = fs.readFileSync('portal-nolap.html', 'utf8');
const lines = content.split('\n');

console.log('=== TANAH SECTION START (Lines 7720-7750) ===');
for (let i = 7719; i < 7750; i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}

console.log('\n=== RUISLAGH SECTION START (Lines 12950-12975) ===');
for (let i = 12949; i < 12975; i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}
