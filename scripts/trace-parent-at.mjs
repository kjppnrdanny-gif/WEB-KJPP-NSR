import fs from 'node:fs';

const html = fs.readFileSync('portal-penugasan-jo.html', 'utf8');
const lines = html.split('\n');

for (let i = 1395; i < 1415; i++) {
  console.log(`${i + 1}: ${JSON.stringify(lines[i])}`);
}
