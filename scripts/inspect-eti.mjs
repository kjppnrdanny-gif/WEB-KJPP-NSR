import fs from 'fs';

const html = fs.readFileSync('portal-penugasan-jo.html', 'utf8');

const idx = html.indexOf('function deklarasiSemuaIndependen');
console.log(html.substring(idx - 100, idx + 1500));
