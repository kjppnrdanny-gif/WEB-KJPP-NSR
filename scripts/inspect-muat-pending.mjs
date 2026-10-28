import fs from 'fs';

const content = fs.readFileSync('portal-nolap.html', 'utf8');

const idx = content.indexOf('const tbodyPending = document.getElementById(\'tabel-body-pending\');');
console.log(content.slice(idx, idx + 3500));
