import fs from 'node:fs';

const content = fs.readFileSync('index.html', 'utf8');
const flexIdx = content.indexOf('galeri-flex-carousel');
console.log('galeri-flex-carousel index:', flexIdx);
if (flexIdx !== -1) {
  console.log(content.substring(flexIdx - 200, flexIdx + 800));
}
