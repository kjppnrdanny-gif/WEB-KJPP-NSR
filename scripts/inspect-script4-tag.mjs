import fs from 'fs';

const content = fs.readFileSync('portal-nolap.html', 'utf8');

const idx = content.indexOf('function loginKeServer');
const scriptStart = content.lastIndexOf('<script', idx);
const scriptEnd = content.indexOf('</script>', idx);

console.log('Script tag opening:', content.slice(scriptStart, scriptStart + 100));
console.log('Script tag closing:', content.slice(scriptEnd, scriptEnd + 50));
console.log('First 300 chars of script:', content.slice(scriptStart, scriptStart + 300));
