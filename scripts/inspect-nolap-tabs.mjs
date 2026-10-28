import fs from 'fs';

const content = fs.readFileSync('portal-nolap.html', 'utf8');

const idx = content.indexOf('gantiTabModul(\'approval\')');
console.log('Tab button approval:', content.slice(idx - 100, idx + 200));

// Find the panel that is shown when gantiTabModul('approval') is called
const idxFunc = content.indexOf('function gantiTabModul');
console.log('\n--- gantiTabModul function ---');
console.log(content.slice(idxFunc, idxFunc + 1500));
