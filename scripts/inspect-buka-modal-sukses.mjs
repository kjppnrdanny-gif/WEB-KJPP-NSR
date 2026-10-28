import fs from 'fs';

const content = fs.readFileSync('portal-nolap.html', 'utf8');
const lines = content.split('\r\n');

for (let i = 15804; i < 15860; i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}
