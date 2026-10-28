import fs from 'fs';

const content = fs.readFileSync('portal-nolap.html', 'utf8');

const idx = content.indexOf('function loginKeServer');
console.log(content.slice(idx - 200, idx + 400));
