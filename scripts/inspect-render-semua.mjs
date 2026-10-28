import fs from 'fs';

const content = fs.readFileSync('portal-penugasan-jo.html', 'utf8');

const idx = content.indexOf('function renderSemuaDokumen');
console.log(content.slice(idx + 1000, idx + 3500));
