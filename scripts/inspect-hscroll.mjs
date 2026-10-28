import fs from 'node:fs';

const content = fs.readFileSync('index.html', 'utf8');
const handleScrollIdx = content.indexOf('handleScrollOptimized');
console.log(content.substring(handleScrollIdx - 100, handleScrollIdx + 800));
