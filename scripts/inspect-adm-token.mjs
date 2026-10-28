import fs from 'fs';

const content = fs.readFileSync('auth-handler.php', 'utf8');

const idx = content.indexOf('NSR-ADM-2026');
console.log(content.slice(idx - 100, idx + 1500));
