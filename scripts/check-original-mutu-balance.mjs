import fs from 'node:fs';

const content = fs.readFileSync('index.html', 'utf8');
const sStart = content.lastIndexOf('<section', content.indexOf('id="sistem-mutu"'));
const lStart = content.lastIndexOf('<section', content.indexOf('id="layanan"'));
const sContent = content.substring(sStart, lStart);

console.log('Total characters in sistem-mutu:', sContent.length);

const openDivs = (sContent.match(/<div\b/g) || []).length;
const closeDivs = (sContent.match(/<\/div>/g) || []).length;
console.log(`Original sistem-mutu: open=${openDivs}, close=${closeDivs}`);
