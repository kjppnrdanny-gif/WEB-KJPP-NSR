import fs from 'fs';

const content = fs.readFileSync('portal-nolap.html', 'utf8');
const lines = content.split('\n');

console.log('--- Checking print-body-content and @media print ---');
lines.forEach((l, i) => {
  if (l.includes('print-body-content') || l.includes('@media print') || l.includes('print-area')) {
    console.log(`${i+1}: ${l.trim().substring(0, 100)}`);
  }
});
