import fs from 'fs';

const content = fs.readFileSync('portal-nolap.html', 'utf8');
const lines = content.split('\r\n');

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('PEMISAHAN MUTLAK UI: Panel Audit SPM')) {
    for (let j = i - 5; j < i + 35; j++) {
      console.log(`${j + 1}: ${lines[j]}`);
    }
    break;
  }
}
