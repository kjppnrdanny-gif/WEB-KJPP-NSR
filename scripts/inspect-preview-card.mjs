import fs from 'fs';

const content = fs.readFileSync('portal-nolap.html', 'utf8');
const lines = content.split(/\r?\n/);

for (let i = 240; i < 305; i++) {
  console.log(`[${i+1}] ${lines[i]}`);
}
