import fs from 'node:fs';

const content = fs.readFileSync('index.html', 'utf8');
const lIdx = content.indexOf('id="layanan"');
const lStart = content.lastIndexOf('<section', lIdx);
const nextSection = content.indexOf('<section', lIdx + 20);
const lContent = content.substring(lStart, nextSection);

console.log('layanan tail lines:');
console.log(lContent.split('\n').slice(50).join('\n'));
