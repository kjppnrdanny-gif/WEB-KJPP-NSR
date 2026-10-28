import fs from 'node:fs';

const content = fs.readFileSync('index.html', 'utf8');
const lines = content.split('\n');

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('bukaModal(\'modal-konsultasi-hukum\')') && i < 1000) {
    console.log('Surrounding lines around Hubungi Kami in header:');
    for (let j = Math.max(0, i - 10); j <= Math.min(lines.length - 1, i + 10); j++) {
      console.log(`  ${j + 1}: ${lines[j]}`);
    }
  }
}
