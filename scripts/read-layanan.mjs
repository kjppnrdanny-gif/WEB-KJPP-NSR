import fs from 'node:fs';

const content = fs.readFileSync('index.html', 'utf8');
const lIdx = content.indexOf('id="layanan"');
const lStart = content.lastIndexOf('<section', lIdx);
const nextStart = content.indexOf('<section', lIdx + 15);
console.log(content.substring(lStart, nextStart));
