import fs from 'node:fs';

const content = fs.readFileSync('portal-nolap.html', 'utf8');
const lines = content.split('\n');

lines.forEach((l, i) => {
  if (l.includes('id="panel-spm"')) {
    console.log(`Found panel-spm at line ${i+1}`);
    for (let j = i; j < Math.min(i + 45, lines.length); j++) {
      console.log(`${j+1}: ${lines[j]}`);
    }
  }
});
