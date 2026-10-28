import fs from 'fs';

const txt = fs.readFileSync('portal-presensi.html', 'utf8');
const lines = txt.split('\n');
lines.forEach((l, i) => {
  if (/['"]NSR8899['"]/i.test(l)) {
    console.log((i+1) + ': ' + l.trim());
  }
});
