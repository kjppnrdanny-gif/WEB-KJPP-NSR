import fs from 'node:fs';

const content = fs.readFileSync('index.html', 'utf8');
const first = content.indexOf('id="sistem-mutu"');
const second = content.indexOf('id="sistem-mutu"', first + 20);

console.log('first:', first, 'second:', second);
console.log('Snippet leading up to second:');
console.log(content.substring(second - 300, second));
