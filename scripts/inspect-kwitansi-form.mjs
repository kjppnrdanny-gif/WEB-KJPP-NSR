import fs from 'fs';

const lines = fs.readFileSync('portal-kwitansi.html', 'utf8').split(/\r?\n/);
console.log('Total lines in portal-kwitansi.html:', lines.length);

lines.forEach((l, i) => {
  if (l.includes('<form') || l.includes('input id=') || l.includes('select id=')) {
    if (i < 400) {
      console.log(`${i + 1}: ${l.trim().slice(0, 100)}`);
    }
  }
});
