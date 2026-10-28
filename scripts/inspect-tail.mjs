import fs from 'node:fs';

const content = fs.readFileSync('index.html', 'utf8');
console.log('Last 500 chars of index.html:');
console.log(content.substring(content.length - 500));
