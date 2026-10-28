import fs from 'fs';

const lines = fs.readFileSync('portal-nolap.html', 'utf8').split(/\r?\n/);

console.log('--- filter-cabang search ---');
lines.forEach((l, i) => {
  if (l.includes('filter-cabang') || l.includes('panel-riwayat')) {
    console.log(`${i + 1}: ${l.trim()}`);
  }
});
