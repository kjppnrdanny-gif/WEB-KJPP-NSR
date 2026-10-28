import fs from 'node:fs';

const content = fs.readFileSync('index.html', 'utf8');
const headerIdx = content.indexOf('<header');
const headerEnd = content.indexOf('</header>');
const headerHtml = content.substring(headerIdx, headerEnd);

const links = [...headerHtml.matchAll(/href=["'](#[^"']+)["']/g)];
console.log('Header hash links:', links.map(m => m[1]));
