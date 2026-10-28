import fs from 'fs';

const content = fs.readFileSync('portal-nolap.html', 'utf8');
const lines = content.split('\n');

console.log('=== FORM HEADER (Lines 305-335) ===');
for (let i = 304; i < 335; i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}

console.log('\n=== AROUND SEKSI D EMBEDDED (Lines 970-1010) ===');
for (let i = 969; i < 1010; i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}

console.log('\n=== AROUND END OF FORM (Lines 1090-1135) ===');
for (let i = 1089; i < 1135; i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}
