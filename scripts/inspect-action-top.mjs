import fs from 'fs';

const content = fs.readFileSync('nolap-data-handler.php', 'utf8');
const lines = content.split('\n');

for (let i = 1400; i < 1550; i++) {
  if (lines[i].includes('$action') || lines[i].includes('REQUEST_METHOD') || lines[i].includes('== \'GET\'')) {
    console.log(`${i + 1}: ${lines[i]}`);
  }
}
