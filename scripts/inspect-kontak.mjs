import fs from 'node:fs';

const content = fs.readFileSync('index.html', 'utf8');
const kIdx = content.indexOf('id="kontak"');
const kStart = content.lastIndexOf('<section', kIdx);
const kEnd = content.indexOf('<footer', kIdx);
const kContent = content.substring(kStart, kEnd);

console.log('kontak total lines:', kContent.split('\n').length);
console.log('kontak total chars:', kContent.length);
console.log('first 40 lines:');
console.log(kContent.split('\n').slice(0, 40).join('\n'));
