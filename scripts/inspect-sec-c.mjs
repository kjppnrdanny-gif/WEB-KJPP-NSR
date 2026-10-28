import fs from 'fs';

const content = fs.readFileSync('portal-nolap.html', 'utf8');
const lines = content.split(/\r?\n/);

for (let i = 920; i < 1010; i++) {
  console.log(`[${i+1}] ${lines[i]}`);
}
