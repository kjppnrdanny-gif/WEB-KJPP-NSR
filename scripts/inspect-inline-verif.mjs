import fs from 'fs';

const html = fs.readFileSync('index.html', 'utf8');
const inlinePos = html.indexOf('function verifikasiTokenPortal');
console.log(html.slice(inlinePos - 100, inlinePos + 800));
