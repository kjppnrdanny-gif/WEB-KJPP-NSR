import fs from 'fs';

const content = fs.readFileSync('portal-nolap.html', 'utf8');
console.log(content.slice(1083800, 1086000));
