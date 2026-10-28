import fs from 'node:fs';

const content = fs.readFileSync('index.html', 'utf8');
const lines = content.split('\n');

for (let i = 7480; i < 7550; i++) {
  if (lines[i]) console.log(`${i+1}: ${lines[i]}`);
}
