import fs from 'fs';

const filePath = 'portal-penugasan-jo.html';
const lines = fs.readFileSync(filePath, 'utf8').split('\n');

for (let i = 1756; i < 1786; i++) {
  console.log(`${i + 1}: ${JSON.stringify(lines[i])}`);
}
