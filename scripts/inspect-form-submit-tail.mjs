import fs from 'fs';

const filePath = 'portal-penugasan-jo.html';
const lines = fs.readFileSync(filePath, 'utf8').split('\n');

for (let i = 7230; i < 7275; i++) {
  console.log(`${i + 1}: ${JSON.stringify(lines[i])}`);
}
