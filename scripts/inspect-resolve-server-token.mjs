import fs from 'fs';

const c = fs.readFileSync('auth-handler.php', 'utf8');
const pos = c.indexOf('function resolveServerToken');
console.log(c.slice(pos, pos + 1000));
