import fs from 'fs';

const content = fs.readFileSync('nolap-data-handler.php', 'utf8');
const lines = content.split('\n');

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('renderDocumentTemplate')) {
    console.log(`Line ${i + 1}: ${lines[i]}`);
    for (let j = Math.max(0, i - 10); j < Math.min(lines.length, i + 30); j++) {
      console.log(`${j + 1}: ${lines[j]}`);
    }
    break;
  }
}
