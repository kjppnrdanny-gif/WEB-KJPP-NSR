import fs from 'node:fs';

const content = fs.readFileSync('index.html', 'utf8');
const rStart = content.lastIndexOf('<section', content.indexOf('id="rekanan"'));
const sMutuStart = content.lastIndexOf('<section', content.indexOf('id="sistem-mutu"'));

console.log(content.substring(rStart, sMutuStart));
