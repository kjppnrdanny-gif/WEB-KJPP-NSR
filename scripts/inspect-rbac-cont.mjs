import fs from 'fs';

const content = fs.readFileSync('portal-nolap.html', 'utf8');
const lines = content.split('\n');

console.log('=== APPLYRBAC CONTINUATION (Lines 14061-14130) ===');
for (let i = 14060; i < 14130; i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}
