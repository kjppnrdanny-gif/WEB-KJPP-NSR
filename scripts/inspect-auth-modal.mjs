import fs from 'fs';

const content = fs.readFileSync('portal-nolap.html', 'utf8');

const idx = content.indexOf('id="input-auth-id"');
console.log(content.slice(idx - 300, idx + 600));
