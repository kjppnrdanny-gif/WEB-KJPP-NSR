import fs from 'fs';

const php = fs.readFileSync('nolap-data-handler.php', 'utf8');
const lines = php.split('\n');

for (let i = 4950; i < 5000; i++) {
  if (lines[i]) console.log(`L${i+1}: ${lines[i]}`);
}
