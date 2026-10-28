import fs from 'fs';

const content = fs.readFileSync('portal-nolap.html', 'utf8');

const idx = content.indexOf('function loginKeServer');
const scriptStart = content.lastIndexOf('<script', idx);
const scriptEnd = content.indexOf('</script>', idx);

console.log('scriptStart:', scriptStart, 'idx:', idx, 'scriptEnd:', scriptEnd);
