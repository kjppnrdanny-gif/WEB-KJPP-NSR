import fs from 'node:fs';

const content = fs.readFileSync('index.html', 'utf8');
const kIdx = content.indexOf('id="kontak"');
const kStart = content.lastIndexOf('<section', kIdx);
const kEnd = content.indexOf('<footer', kIdx);
const kContent = content.substring(kStart, kEnd);

const lines = kContent.split('\n');
console.log('Lines 240 to end of kontak:');
console.log(lines.slice(240).join('\n'));
