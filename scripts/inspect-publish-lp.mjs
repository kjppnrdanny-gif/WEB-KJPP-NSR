import fs from 'fs';

const filePath = 'nolap-data-handler.php';
const lines = fs.readFileSync(filePath, 'utf8').split('\n');

for (let i = 3808; i < 3885; i++) {
  console.log(`${i + 1}: ${JSON.stringify(lines[i])}`);
}
