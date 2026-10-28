import fs from 'fs';

const content = fs.readFileSync('portal-nolap.html', 'utf8');

const idx = content.indexOf('const MASTER_KANTOR = {');
console.log(content.slice(idx, idx + 1000));
