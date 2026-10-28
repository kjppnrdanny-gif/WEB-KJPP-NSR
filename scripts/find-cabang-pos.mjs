import fs from 'fs';

const html = fs.readFileSync('index.html', 'utf8');
const idx = html.indexOf('cabang terlebih dahulu');
console.log(html.slice(Math.max(0, idx - 100), Math.min(html.length, idx + 150)));
