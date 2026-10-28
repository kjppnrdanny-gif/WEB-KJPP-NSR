import fs from 'fs';

const content = fs.readFileSync('nolap-data-handler.php', 'utf8');
const lines = content.split('\n');

lines.forEach((l, idx) => {
  if (l.includes('alokasikanNomor') || l.includes('alokasi') && l.includes('nomor')) {
    console.log(`L${idx + 1}: ${l.trim()}`);
  }
});
