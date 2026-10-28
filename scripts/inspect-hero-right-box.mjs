import fs from 'node:fs';

const content = fs.readFileSync('index.html', 'utf8');
const pStart = content.lastIndexOf('<section', content.indexOf('id="profil"'));
const rStart = content.lastIndexOf('<section', content.indexOf('id="rekanan"'));
const heroContent = content.substring(pStart, rStart);

const lines = heroContent.split('\n');
console.log('Hero right box lines (around L50-L120):');
console.log(lines.slice(50, 125).join('\n'));
