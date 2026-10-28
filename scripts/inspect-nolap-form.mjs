import fs from 'fs';

const lines = fs.readFileSync('portal-nolap.html', 'utf8').split(/\r?\n/);

console.log('Total lines in portal-nolap.html:', lines.length);

lines.forEach((l, i) => {
  if (l.includes('<form') || l.includes('Formulir Pengajuan') || l.includes('f-klien') || l.includes('f-no-spk')) {
    if (i < 500) {
      console.log(`${i + 1}: ${l.trim().slice(0, 100)}`);
    }
  }
});
