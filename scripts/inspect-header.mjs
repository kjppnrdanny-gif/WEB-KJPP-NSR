import fs from 'node:fs';

const content = fs.readFileSync('index.html', 'utf8');
const headerIdx = content.indexOf('<header');
const headerEnd = content.indexOf('</header>') + '</header>'.length;
const headerContent = content.substring(headerIdx, headerEnd);

console.log('header length:', headerContent.length);
console.log('header lines:', headerContent.split('\n').length);
// Extract links from header
const links = [...headerContent.matchAll(/href="([^"]+)"/g)].map(m => m[1]);
console.log('links in header:', Array.from(new Set(links)));
