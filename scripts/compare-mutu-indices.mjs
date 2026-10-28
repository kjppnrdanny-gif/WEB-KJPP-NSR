import fs from 'node:fs';

const content = fs.readFileSync('index.html', 'utf8');

console.log('Snippet at 102964:');
console.log(content.substring(102950, 103200));

console.log('Snippet at 146008:');
console.log(content.substring(146000, 146250));
