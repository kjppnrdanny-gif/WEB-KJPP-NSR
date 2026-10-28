import fs from 'fs';

const c = fs.readFileSync('auth-handler.php', 'utf8');
const pos = c.indexOf('$OFFICIAL_TOKEN_HASHES');
console.log(c.slice(pos, pos + 2500));
