import fs from 'fs';

const nolap = fs.readFileSync('portal-nolap.html', 'utf8');
const lines = nolap.split('\n');

lines.forEach((l, i) => {
  if (l.includes('f-email-pemohon') || l.includes('f-wa-pemohon') || l.includes('f-pemohon')) {
    console.log(`L${i+1}: ${l.trim()}`);
  }
});
