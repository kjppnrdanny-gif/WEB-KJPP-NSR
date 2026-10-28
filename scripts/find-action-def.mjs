import fs from 'fs';

const content = fs.readFileSync('nolap-data-handler.php', 'utf8');
const lines = content.split('\n');

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('$action =') || lines[i].includes('$action=')) {
    console.log(`${i + 1}: ${lines[i]}`);
  }
}
