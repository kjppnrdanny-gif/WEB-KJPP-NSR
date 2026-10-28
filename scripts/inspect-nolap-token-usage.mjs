import fs from 'fs';

const c = fs.readFileSync('portal-nolap.html', 'utf8');
const lines = c.split('\n');
lines.forEach((l, i) => {
  if (l.includes('NSR_AUTH_TOKEN') || l.includes('TOKEN_AUTH_NSR') || l.includes('CURRENT_AUTH_TOKEN')) {
    console.log(`${i+1}: ${l.trim().slice(0, 110)}`);
  }
});
