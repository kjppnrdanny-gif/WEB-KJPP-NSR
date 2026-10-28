import fs from 'node:fs';

const content = fs.readFileSync('index.html', 'utf8');
const lines = content.split('\n');

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('Minta Proposal &amp; Penawaran')) {
    console.log(`Line ${i + 1}:`);
    for (let j = Math.max(0, i - 5); j <= Math.min(lines.length - 1, i + 5); j++) {
      console.log(`  ${j + 1}: ${lines[j]}`);
    }
  }
}
