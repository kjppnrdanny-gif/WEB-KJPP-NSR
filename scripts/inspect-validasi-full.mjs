import fs from 'fs';

const content = fs.readFileSync('portal-nolap.html', 'utf8');
const lines = content.split('\r\n');

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('function validasiFormDanMitigasiLive()')) {
    for (let j = i; j < i + 90; j++) {
      console.log(`${j + 1}: ${lines[j]}`);
    }
    break;
  }
}
