import fs from 'node:fs';

const content = fs.readFileSync('index.html', 'utf8');
const bttIdx = content.indexOf('id="back-to-top"');
console.log(content.substring(bttIdx - 300, bttIdx + 400));
