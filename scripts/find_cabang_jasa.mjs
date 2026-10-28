import fs from 'fs';

const html = fs.readFileSync('portal-nolap-cabang.html', 'utf8');
const lines = html.split('\n');

lines.forEach((l, idx) => {
  if (l.includes('jenis_jasa') || l.includes('seg-jasa')) {
    console.log(`L${idx + 1}: ${l.trim()}`);
  }
});
