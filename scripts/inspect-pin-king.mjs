import fs from 'fs';

const html = fs.readFileSync('portal-penugasan-jo.html', 'utf8');

const idx = html.indexOf('function verifikasiKredensialPengesahKing');
console.log(html.substring(idx, idx + 1500));
