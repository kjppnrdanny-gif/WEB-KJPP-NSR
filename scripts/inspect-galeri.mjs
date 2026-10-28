import fs from 'node:fs';

const content = fs.readFileSync('index.html', 'utf8');
const gIdx = content.indexOf('id="galeri"');
const gStart = content.lastIndexOf('<section', gIdx);
const nextSection = content.indexOf('<section', gIdx + 20);
const gContent = content.substring(gStart, nextSection);

console.log('galeri total lines:', gContent.split('\n').length);
console.log('first 40 lines:');
console.log(gContent.split('\n').slice(0, 40).join('\n'));

// check where galeri-flex-carousel is
console.log('galeri-flex-carousel index:', gContent.indexOf('galeri-flex-carousel'));
