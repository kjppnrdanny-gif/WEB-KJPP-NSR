import fs from 'fs';

const content = fs.readFileSync('portal-nolap.html', 'utf8');
const lines = content.split('\r\n');

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('bukaModalSuksesPengajuan(finalRecord)')) {
    console.log(`bukaModalSuksesPengajuan at line ${i + 1}`);
    for (let j = i - 5; j < i + 15; j++) {
      console.log(`${j + 1}: ${lines[j]}`);
    }
    break;
  }
}
