import fs from 'fs';

const content = fs.readFileSync('portal-nolap.html', 'utf8');
const lines = content.split(/\r?\n/);

console.log('Checking portal-nolap.html for KJPP name...');
for (let i = 0; i < lines.length; i++) {
  const l = lines[i];
  if (l.match(/Nanang\s+Rahayu.*Rekan/i)) {
    console.log(`[${i+1}] ${l.trim().slice(0, 110)}`);
  }
}
