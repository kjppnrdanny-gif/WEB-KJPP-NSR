import fs from 'node:fs';

const bundle = fs.readFileSync('lib/flex-carousel.bundle.js', 'utf8');
const lines = bundle.split('\n');

lines.forEach((l, i) => {
  if (l.includes('clientWidth') || l.includes('clientHeight') || l.includes('getBoundingClientRect') || l.includes('canvas')) {
    if (i < 300) {
      console.log(`${i+1}: ${l.slice(0, 120)}`);
    }
  }
});
