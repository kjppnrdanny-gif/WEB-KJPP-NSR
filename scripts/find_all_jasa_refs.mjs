import fs from 'fs';

const html = fs.readFileSync('portal-nolap.html', 'utf8');
const lines = html.split('\n');

lines.forEach((l, idx) => {
  if (l.includes('klasifikasiJasa') || l.includes('f-jasa') || l.includes('f_jasa') || l.includes('kodeJasa')) {
    console.log(`L${idx + 1}: ${l.trim()}`);
  }
});
