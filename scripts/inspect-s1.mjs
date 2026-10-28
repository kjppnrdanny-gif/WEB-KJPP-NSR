import fs from 'node:fs';

const html = fs.readFileSync('portal-penugasan-jo.html', 'utf8');
console.log(html.substring(29500, 36000));
