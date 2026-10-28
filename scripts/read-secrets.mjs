import fs from 'fs';

const content = fs.readFileSync('data/config/credentials.secrets.php', 'utf8');
console.log('credentials.secrets.php length:', content.length);
console.log(content.substring(0, 500));
