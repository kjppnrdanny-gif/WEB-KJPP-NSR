import fs from 'fs';

const c = fs.readFileSync('operasional-data-handler.php', 'utf8');
const lines = c.split('\n');
console.log(lines.slice(0, 100).join('\n'));
