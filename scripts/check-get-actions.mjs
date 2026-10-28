import fs from 'fs';

const c = fs.readFileSync('nolap-data-handler.php', 'utf8');
const lines = c.split('\n');

console.log(lines.slice(2170, 2220).join('\n'));
