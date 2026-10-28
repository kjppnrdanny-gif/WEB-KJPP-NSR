import fs from 'fs';

const c = fs.readFileSync('auth-handler.php', 'utf8');
const idx = c.indexOf("action === 'login'");
console.log(c.slice(idx + 4000, idx + 5200));
