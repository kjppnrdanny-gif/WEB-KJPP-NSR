import fs from 'fs';

const content = fs.readFileSync('auth-handler.php', 'utf8');
const lines = content.split('\n');
console.log(lines.slice(485, 535).join('\n'));
