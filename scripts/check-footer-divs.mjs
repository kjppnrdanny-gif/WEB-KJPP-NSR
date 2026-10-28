import fs from 'node:fs';

const content = fs.readFileSync('index.html', 'utf8');

const footerStart = content.indexOf('<footer');
const footerEnd = content.indexOf('</footer>') + '</footer>'.length;
const footerOnly = content.substring(footerStart, footerEnd);
const fo = (footerOnly.match(/<div\b/g) || []).length;
const fc = (footerOnly.match(/<\/div>/g) || []).length;
console.log(`footerOnly: open=${fo}, close=${fc} diff=${fo - fc}`);

const afterFooter = content.substring(footerEnd);
const ao = (afterFooter.match(/<div\b/g) || []).length;
const ac = (afterFooter.match(/<\/div>/g) || []).length;
console.log(`afterFooter: open=${ao}, close=${ac} diff=${ao - ac}`);
