import fs from 'node:fs';

const content = fs.readFileSync('index.html', 'utf8');
const sIdx = content.indexOf('id="sistem-mutu"');
const sStart = content.lastIndexOf('<section', sIdx);
const nextStart = content.indexOf('<section', sIdx + 15);
const sContent = content.substring(sStart, nextStart);

const lines = sContent.split('\n');
console.log('Lines 255 to 435:');
console.log(lines.slice(255, 435).join('\n'));
