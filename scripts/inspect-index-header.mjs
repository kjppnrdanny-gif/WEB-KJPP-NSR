import fs from 'node:fs';

const content = fs.readFileSync('index.html', 'utf8');
const headerStart = content.indexOf('<header');
const headerEnd = content.indexOf('</header>');
console.log(content.substring(headerStart, headerEnd + 9));
