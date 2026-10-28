import fs from 'fs';

const content = fs.readFileSync('nolap-data-handler.php', 'utf8');
const lines = content.split('\n');

lines.forEach((l, idx) => {
  if (l.includes('2.0160-') && (l.includes('/') || l.includes('Definitif') || l.includes('nomorLaporan'))) {
    console.log(`L${idx + 1}: ${l.trim()}`);
  }
});
