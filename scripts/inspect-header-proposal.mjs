import fs from 'node:fs';

const content = fs.readFileSync('index.html', 'utf8');
const headerStart = content.indexOf('<header');
const headerEnd = content.indexOf('</header>');
const headerHtml = content.substring(headerStart, headerEnd);

const idx = headerHtml.indexOf('Minta Proposal');
console.log('Index of Minta Proposal in header:', idx);
if (idx !== -1) {
  console.log(headerHtml.substring(idx - 250, idx + 250));
}
