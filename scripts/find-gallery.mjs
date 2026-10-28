import fs from 'node:fs';

const content = fs.readFileSync('index.html', 'utf8');
const lines = content.split('\n');

console.log('Searching for gallery keywords in index.html...');
lines.forEach((l, i) => {
  if (l.includes('Eksplorasi WebGL') || l.includes('tab-panel-galeri') || l.includes('tab-btn-galeri') || l.toLowerCase().includes('three') || l.includes('PSN Tol Sigli') || l.includes('galeri-container') || l.includes('id="galeri"')) {
    console.log(`${i + 1}: ${l.trim()}`);
  }
});
