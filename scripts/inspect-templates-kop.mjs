import fs from 'fs';

const files = ['merge-tags-engine.php', 'nolap-data-handler.php'];

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (l.includes('getTemplate') || l.includes('Izin Usaha Kemenkeu No. 2.19.0160')) {
      console.log(`[${file}:${i+1}] ${l.trim().slice(0, 110)}`);
      for (let j = Math.max(0, i - 3); j <= Math.min(lines.length - 1, i + 10); j++) {
        console.log(`  [${j+1}] ${lines[j]}`);
      }
      console.log('---');
    }
  }
}
