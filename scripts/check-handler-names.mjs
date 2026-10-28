import fs from 'fs';

const content = fs.readFileSync('nolap-data-handler.php', 'utf8');
const lines = content.split(/\r?\n/);

console.log('Checking nolap-data-handler.php for KJPP name and Cabang: Pusat...');
for (let i = 0; i < lines.length; i++) {
  const l = lines[i];
  if (l.match(/NANANG\s+RAHAYU.*REKAN/i) || l.includes('Cabang: Pusat')) {
    console.log(`[${i+1}] ${l.trim().slice(0, 110)}`);
  }
}
