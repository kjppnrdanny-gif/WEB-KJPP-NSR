import fs from 'fs';

const content = fs.readFileSync('nolap-data-handler.php', 'utf8');
const lines = content.split('\n');

for (let i = 3045; i < 3090; i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}
