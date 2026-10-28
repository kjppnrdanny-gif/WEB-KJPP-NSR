import fs from 'node:fs';

const content = fs.readFileSync('index.html', 'utf8');
const gIdx = content.indexOf('id="galeri"');
const gStart = content.lastIndexOf('<section', gIdx);
const nextSection = content.indexOf('<section', gIdx + 20);
const gContent = content.substring(gStart, nextSection);

console.log(gContent.split('\n').slice(40).join('\n'));
