import fs from 'node:fs';

const lines = fs.readFileSync('portal-nolap.html', 'utf8').split('\n');
lines.forEach((l, i) => {
  if (l.includes('id="panel-approval"')) {
    console.log(`Found panel-approval at line ${i+1}`);
    for (let j = i; j < Math.min(i + 50, lines.length); j++) {
      console.log(`${j+1}: ${lines[j].slice(0, 100)}`);
    }
  }
});
