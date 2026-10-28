import fs from 'node:fs';

const html = fs.readFileSync('portal-penugasan-jo.html', 'utf8');
const lines = html.split('\n');

const idx = lines.findIndex(l => l.includes('function gantiTab('));
console.log('gantiTab found at line:', idx + 1);
for (let i = idx; i < idx + 75; i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}
