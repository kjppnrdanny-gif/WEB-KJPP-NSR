import fs from 'node:fs';

const content = fs.readFileSync('index.html', 'utf8');
const toggleIdx = content.indexOf('function toggleExtraMutu');
console.log(content.substring(toggleIdx, toggleIdx + 800));
