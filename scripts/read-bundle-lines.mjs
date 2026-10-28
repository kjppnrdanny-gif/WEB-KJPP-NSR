import fs from 'node:fs';

const bundle = fs.readFileSync('lib/flex-carousel.bundle.js', 'utf8');
const lines = bundle.split('\n');

for (let i = 160; i < 200; i++) {
  if (lines[i]) console.log(`${i+1}: ${lines[i]}`);
}
