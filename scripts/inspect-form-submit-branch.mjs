import fs from 'fs';

const filePath = 'portal-penugasan-jo.html';
const lines = fs.readFileSync(filePath, 'utf8').split('\n');

for (let i = 7335; i < 7375; i++) {
  console.log(`${i + 1}: ${JSON.stringify(lines[i])}`);
}
