import fs from 'node:fs';

const content = fs.readFileSync('index.html', 'utf8');
const lazyIdx = content.indexOf('function setupMapLazyLoad');
console.log(content.substring(lazyIdx, lazyIdx + 600));
