import fs from 'fs';

const content = fs.readFileSync('nolap-data-handler.php', 'utf8');
const lines = content.split('\n');

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('NSR-ADMIN-BDG-2026') || lines[i].includes('NSR-SRV-2026') || lines[i].includes('ADMIN-BDG')) {
    console.log(`${i + 1}: ${lines[i]}`);
  }
}
