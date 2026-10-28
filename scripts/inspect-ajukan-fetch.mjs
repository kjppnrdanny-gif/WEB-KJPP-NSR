import fs from 'fs';

const content = fs.readFileSync('portal-nolap.html', 'utf8');
const lines = content.split('\r\n');

for (let i = 15580; i < 15680; i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}
