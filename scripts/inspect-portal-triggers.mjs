import fs from 'node:fs';

const content = fs.readFileSync('index.html', 'utf8');
const lines = content.split('\n');

lines.forEach((l, i) => {
  if (l.includes('modal-portal-login') || l.includes('Portal Internal') || l.includes('NSR Cloud') || l.includes('ekosistem-utama')) {
    console.log(`${i+1}: ${l.trim().slice(0, 110)}`);
  }
});
