import fs from 'node:fs';

const content = fs.readFileSync('index.html', 'utf8');
const sIdx = content.indexOf('id="sistem-mutu"');
const sStart = content.lastIndexOf('<section', sIdx);
const nextStart = content.indexOf('<section', sIdx + 15);
const sContent = content.substring(sStart, nextStart);

const lines = sContent.split('\n');
console.log('Lines 250 to 380:');
console.log(lines.slice(250, 380).join('\n'));
