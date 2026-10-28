import fs from 'fs';

const html = fs.readFileSync('portal-nolap.html', 'utf8');
const lines = html.split('\n');

lines.forEach((l, idx) => {
  if (l.includes('f-jasa') || l.includes('f_jasa')) {
    console.log(`Line ${idx + 1}: ${l.trim()}`);
  }
});
