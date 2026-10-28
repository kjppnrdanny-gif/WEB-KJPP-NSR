import fs from 'fs';

const content = fs.readFileSync('portal-nolap.html', 'utf8');
const lines = content.split('\r\n');

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('async function ajukanPermohonanNoLap')) {
    console.log(`Line ${i + 1}:`);
    for (let j = i; j < i + 40; j++) {
      console.log(`${j + 1}: ${JSON.stringify(lines[j])}`);
    }
    break;
  }
}
