import fs from 'fs';

const content = fs.readFileSync('portal-penugasan-jo.html', 'utf8');

const idx = content.indexOf('if (harusKunci)');
console.log(content.slice(idx, idx + 2500));
