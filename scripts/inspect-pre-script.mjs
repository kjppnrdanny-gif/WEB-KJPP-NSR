import fs from 'node:fs';

const content = fs.readFileSync('index.html', 'utf8');
console.log(content.substring(362000, 362700));
