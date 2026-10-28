import fs from 'node:fs';

const content = fs.readFileSync('index.html', 'utf8');
const lIdx = content.indexOf('id="layanan"');
const lStart = content.lastIndexOf('<section', lIdx);
const lEnd = content.indexOf('<!-- ==================== 6A. NSR CLOUD', lIdx);
const lContent = content.substring(lStart, lEnd !== -1 ? lEnd : content.indexOf('</section>', lIdx) + 10);

console.log('layanan length:', lContent.length);
console.log('layanan lines:', lContent.split('\n').length);
console.log(lContent.split('\n').slice(0, 50).join('\n'));
