import fs from 'fs';

const content = fs.readFileSync('portal-nolap.html', 'utf8');
const lines = content.split(/\r?\n/);

for (let i = 21900; i < 21950; i++) {
  if (lines[i].includes('Izin Usaha Kemenkeu No. 2.19.0160')) {
    for (let j = i - 5; j <= i + 15; j++) {
      console.log(`[${j+1}] ${lines[j]}`);
    }
  }
}
