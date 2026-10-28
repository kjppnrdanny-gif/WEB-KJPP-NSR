import fs from 'fs';

const content = fs.readFileSync('portal-penugasan-jo.html', 'utf8');

const idx = content.indexOf('function renderPratinjauDokumen');
console.log(content.slice(idx, idx + 2500));
