import fs from 'fs';

const c = fs.readFileSync('nolap-data-handler.php', 'utf8');
const lines = c.split('\n');

console.log('Line count:', lines.length);
// Find where getMasterPenilaiPublik is located
lines.forEach((l, i) => {
  if (l.includes('getMasterPenilaiPublik') || l.includes('muatMasterPenilaiPublik')) {
    console.log(`L${i+1}: ${l}`);
  }
});
