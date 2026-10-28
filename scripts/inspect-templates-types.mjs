import fs from 'fs';

const content = fs.readFileSync('nolap-data-handler.php', 'utf8');
const lines = content.split('\n');

for (let i = 7460; i < 7520; i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}
