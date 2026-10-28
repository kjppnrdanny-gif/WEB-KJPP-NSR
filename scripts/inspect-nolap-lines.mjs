import fs from 'fs';

const c = fs.readFileSync('nolap-data-handler.php', 'utf8');
const lines = c.split('\n');
console.log(lines.slice(1140, 1200).join('\n'));
