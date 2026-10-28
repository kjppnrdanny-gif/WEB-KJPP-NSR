import fs from 'fs';

const lines = fs.readFileSync('portal-penugasan-jo.html', 'utf8').split('\n');
lines.forEach((l, idx) => {
  if (l.includes('<h3') || l.includes('font-black text-amber-400')) {
    console.log(`${idx + 1}: ${l.trim()}`);
  }
});
