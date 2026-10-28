import fs from 'fs';

const content = fs.readFileSync('portal-nolap.html', 'utf8');
const lines = content.split(/\r?\n/);

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('box-auth-token') || lines[i].includes('input-token-nolap') || lines[i].includes('NSR8899') || lines[i].includes('NSR-KING')) {
    console.log(`Line ${i + 1}: ${lines[i].trim()}`);
    for (let j = Math.max(0, i - 5); j <= Math.min(lines.length - 1, i + 15); j++) {
      console.log(`  [${j + 1}] ${lines[j]}`);
    }
    console.log('---');
  }
}
