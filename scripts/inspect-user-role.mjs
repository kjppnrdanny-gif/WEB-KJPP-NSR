import fs from 'fs';

const content = fs.readFileSync('nolap-data-handler.php', 'utf8');
const lines = content.split('\n');

console.log('--- Occurrences of $userRole in nolap-data-handler.php ---');
lines.forEach((l, i) => {
  if (l.includes('$userRole')) {
    console.log(`${i+1}: ${l.trim()}`);
  }
});
