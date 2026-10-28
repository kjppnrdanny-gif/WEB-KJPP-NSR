import fs from 'fs';

const content = fs.readFileSync('nolap-data-handler.php', 'utf8');
const lines = content.split('\n');

for (let i = 6330; i < 6380; i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}
