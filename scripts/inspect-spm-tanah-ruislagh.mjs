import fs from 'fs';

const content = fs.readFileSync('portal-nolap.html', 'utf8');
const lines = content.split('\n');

console.log('=== TANAH F-SECTION (Lines 7770-7815) ===');
for (let i = 7769; i < 7815; i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}

console.log('\n=== RUISLAGH F-SECTION (Lines 12970-13015) ===');
for (let i = 12969; i < 13015; i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}
