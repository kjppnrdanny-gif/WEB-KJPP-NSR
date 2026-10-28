import { execSync } from 'child_process';

const out = execSync('git show HEAD~10:index.html', { maxBuffer: 15 * 1024 * 1024 }).toString('utf8');
const lines = out.split('\n');
lines.forEach((l, i) => {
  if (l.includes('DATA_KANTOR') || l.includes('DATA_MAPS') || (l.includes('pusat') && l.includes('mapUrl')) || l.includes('pb=!1m18')) {
    console.log((i+1) + ': ' + l.trim());
  }
});
