import fs from 'fs';

const content = fs.readFileSync('portal-nolap.html', 'utf8');
const lines = content.split('\n');

console.log('=== bukaModalReviewGerbang2 (Lines 22235-22335) ===');
for (let i = 22234; i < 22335; i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}
