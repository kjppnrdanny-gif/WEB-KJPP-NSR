import fs from 'fs';

const content = fs.readFileSync('portal-nolap.html', 'utf8');
console.log(content.slice(1091000, 1094000));
