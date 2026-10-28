import fs from 'fs';

const content = fs.readFileSync('nolap-data-handler.php', 'utf8');
const lines = content.split('\n');

lines.forEach((l, i) => {
  if (l.includes('$dualGateDbFile')) {
    console.log(`Line ${i + 1}: ${l}`);
  }
});
