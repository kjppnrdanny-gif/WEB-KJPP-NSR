import fs from 'node:fs';

const content = fs.readFileSync('index.html', 'utf8');
const lines = content.split('\n');

console.log('Searching for galeri-flex-carousel in index.html...');
lines.forEach((l, i) => {
  if (l.includes('galeri-flex-carousel') || l.includes('FlexCarousel') || l.includes('initGaleriCarousel') || l.includes('renderCarousel') || l.includes('initCarousel')) {
    console.log(`${i + 1}: ${l.trim()}`);
  }
});
