import fs from 'fs';

const content = fs.readFileSync('nolap-data-handler.php', 'utf8');
const lines = content.split('\n');

lines.forEach((l, idx) => {
  if (l.includes('getRiskMasters') || l.includes('getDynamicRiskChecklist')) {
    console.log(`L${idx + 1}: ${l.trim()}`);
  }
});
