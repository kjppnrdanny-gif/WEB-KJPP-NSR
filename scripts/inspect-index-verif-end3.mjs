import fs from 'fs';

const html = fs.readFileSync('index.html', 'utf8');
const fnIdx = html.indexOf('async function verifikasiTokenPortal');
console.log(html.slice(fnIdx + 6600, fnIdx + 8000));
