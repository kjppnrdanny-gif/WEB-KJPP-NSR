import fs from 'node:fs';

const content = fs.readFileSync('index.html', 'utf8');
const sIdx = content.indexOf('id="sistem-mutu"');
const sStart = content.lastIndexOf('<section', sIdx);
const nextStart = content.indexOf('<section', sIdx + 15);
const sContent = content.substring(sStart, nextStart);

console.log('sistem-mutu total lines:', sContent.split('\n').length);
// print from line 100 to line 380
const lines = sContent.split('\n');
console.log('Lines 95 to 145:');
console.log(lines.slice(95, 145).join('\n'));
