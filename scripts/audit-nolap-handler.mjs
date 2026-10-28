import fs from 'fs';

const php = fs.readFileSync('nolap-data-handler.php', 'utf8');
const lines = php.split('\n');

console.log('=== ACTIONS IN nolap-data-handler.php ===');
lines.forEach((l, i) => {
  if (l.includes("action === '") || l.includes('action === "') || l.includes("case '") || l.includes('$action =')) {
    console.log(`L${i+1}: ${l.trim()}`);
  }
});
