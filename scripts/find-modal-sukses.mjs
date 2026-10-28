import fs from 'fs';

const content = fs.readFileSync('portal-nolap.html', 'utf8');
const lines = content.split('\r\n');

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('bukaModalSuksesPengajuan')) {
    console.log(`${i + 1}: ${lines[i].slice(0, 100)}`);
  }
}
