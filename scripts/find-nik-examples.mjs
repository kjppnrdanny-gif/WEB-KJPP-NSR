import fs from 'fs';
import path from 'path';

const files = fs.readdirSync('.').filter(f => f.endsWith('.html') || f.endsWith('.js') || f.endsWith('.php'));

console.log('Searching for NIK examples and placeholder spills in root files...');

files.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    if (line.includes('cth: NSR') || line.includes('contoh: NSR') || line.includes('cth: 2019') || line.includes('contoh: 2019') || (line.includes('NSR-2019-005') && (line.includes('placeholder') || line.includes('value=') || line.includes('Contoh')))) {
      console.log(`${f}:${idx + 1}: ${line.trim()}`);
    }
  });
});
