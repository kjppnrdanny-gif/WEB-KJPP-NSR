import fs from 'node:fs';

const orig = fs.readFileSync('index.html', 'utf8');
const footerIdx = orig.indexOf('<footer');
const footerEnd = orig.indexOf('</footer>', footerIdx) + '</footer>'.length;
const footerPart = orig.substring(footerIdx, footerEnd);

const links = [...footerPart.matchAll(/href="([^"]+)"/g)].map(m => m[1]);
console.log('Footer links:', Array.from(new Set(links)));
