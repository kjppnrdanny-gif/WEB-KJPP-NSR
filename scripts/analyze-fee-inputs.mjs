import fs from 'fs';

const jo = fs.readFileSync('portal-penugasan-jo.html', 'utf8');

console.log('=== CHECKING HONORARIUM / TAX INPUTS IN TAB 1 ===');
const lines = jo.split('\n');
lines.forEach((l, idx) => {
  if (l.includes('biaya_jasa') || l.includes('biaya_penugasan') || l.includes('ppn') || l.includes('biaya_transportasi') || l.includes('biaya_akomodasi')) {
    if (l.includes('<input') || l.includes('<select') || l.includes('<label')) {
      console.log(`${idx+1}: ${l.trim().substring(0, 100)}`);
    }
  }
});
