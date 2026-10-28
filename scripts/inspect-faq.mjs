import fs from 'node:fs';

const content = fs.readFileSync('index.html', 'utf8');
const fIdx = content.indexOf('id="faq"');
const fStart = content.lastIndexOf('<section', fIdx);
const nextSection = content.indexOf('<section', fIdx + 20);
const fContent = content.substring(fStart, nextSection);

console.log('faq total lines:', fContent.split('\n').length);
console.log('first 40 lines:');
console.log(fContent.split('\n').slice(0, 40).join('\n'));
