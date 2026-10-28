import fs from 'node:fs';

const content = fs.readFileSync('portal-nolap.html', 'utf8');
const lines = content.split('\n');
console.log('Searching portal-nolap.html:');
lines.forEach((l, i) => {
  if (l.match(/id=["']tab/i) || l.match(/switchTab|pindahTab|nav-tab|tab-pane|role=["']tab/i)) {
    console.log(`${i+1}: ${l.trim().slice(0, 120)}`);
  }
});
