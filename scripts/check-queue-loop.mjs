import fs from 'fs';

const c = fs.readFileSync('process-mail-queue.php', 'utf8');
const lines = c.split('\n');

console.log(lines.slice(150, 175).join('\n'));
