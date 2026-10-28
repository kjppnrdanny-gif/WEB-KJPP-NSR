import fs from 'fs';

const lines = fs.readFileSync('portal-penugasan-jo.html', 'utf8').split(/\r?\n/);

lines.forEach((l, i) => {
  if (l.match(/<h3/i) || l.match(/biaya/i) || l.match(/termin/i) || l.match(/pembayaran/i)) {
    if (i > 1000 && i < 2000) {
      console.log(`${i + 1}: ${l.trim().slice(0, 100)}`);
    }
  }
});
