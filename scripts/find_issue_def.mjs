import fs from 'fs';

const content = fs.readFileSync('nolap-data-handler.php', 'utf8');
const lines = content.split('\n');

lines.forEach((l, idx) => {
  if (l.includes('issueDefinitiveNoLap') || l.includes('PI/07') || l.includes('klasifikasiJasa') || l.includes('kodeJasa') || l.includes('/PI/')) {
    console.log(`Line ${idx + 1}: ${l.trim()}`);
  }
});
