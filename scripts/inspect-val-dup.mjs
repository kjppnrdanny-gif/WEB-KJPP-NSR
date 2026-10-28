import fs from 'fs';

const filePath = 'portal-penugasan-jo.html';
const lines = fs.readFileSync(filePath, 'utf8').split('\n');

for (let i = 2570; i < 2620; i++) {
  console.log(`${i + 1}: ${JSON.stringify(lines[i])}`);
}
