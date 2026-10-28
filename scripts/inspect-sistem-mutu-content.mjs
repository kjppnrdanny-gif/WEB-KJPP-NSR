import fs from 'node:fs';

const content = fs.readFileSync('index.html', 'utf8');
const sIdx = content.indexOf('id="sistem-mutu"');
const sEnd = content.indexOf('</section>', sIdx) + '</section>'.length;
const sContent = content.substring(content.lastIndexOf('<section', sIdx), sEnd);

console.log('sistem-mutu total lines:', sContent.split('\n').length);
console.log('first 40 lines:');
console.log(sContent.split('\n').slice(0, 40).join('\n'));
