import fs from 'node:fs';

const content = fs.readFileSync('index.html', 'utf8');
const mIdx = content.indexOf('id="mobile-menu"');
const mEnd = content.indexOf('</nav>', mIdx) !== -1 ? content.indexOf('</nav>', mIdx) : content.indexOf('</aside>', mIdx);
const mContent = content.substring(mIdx - 50, mIdx + 2500);

console.log(mContent);
