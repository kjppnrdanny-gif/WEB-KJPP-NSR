import fs from 'fs';

const absensi = fs.readFileSync('portal-absensi.html', 'utf8');

console.log('=== SECTIONS IN portal-absensi.html ===');
const lines = absensi.split('\n');
lines.forEach((l, i) => {
  if (l.includes('<h1') || l.includes('<h2') || l.includes('<h3') || l.includes('tab-') || l.includes('panel') || l.includes('form') || l.includes('BACKEND') || l.includes('GAS_')) {
    if (l.trim().length < 120) {
      console.log(`Line ${i + 1}: ${l.trim()}`);
    }
  }
});
