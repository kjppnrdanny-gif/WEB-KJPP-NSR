import fs from 'fs';

const c = fs.readFileSync('index.html', 'utf8');
const lines = c.split('\n');
lines.forEach((l, i) => {
  if (l.includes('Ragunan Raya No. 8') || l.includes('Jl. Hankam')) {
    console.log(`Line ${i+1}: ${l.trim()}`);
  }
});
