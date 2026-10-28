import fs from 'fs';

const php = fs.readFileSync('nolap-data-handler.php', 'utf8');

const lines = php.split('\n');
for (let i = 0; i < 200; i++) {
  if (lines[i].includes('$dataDir') || lines[i].includes('nolap_database') || lines[i].includes('dual_gate')) {
    console.log(`L${i+1}: ${lines[i]}`);
  }
}
