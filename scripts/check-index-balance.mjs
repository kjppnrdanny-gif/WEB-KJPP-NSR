import fs from 'fs';

const html = fs.readFileSync('index.html', 'utf8');
const modalStart = html.indexOf('id="modal-portal"');
const tagStart = html.lastIndexOf('<div', modalStart);

let depth = 0;
const tagRegex = /<\/?div\b[^>]*>/gi;
tagRegex.lastIndex = tagStart;

let match;
let modalEnd = -1;
while ((match = tagRegex.exec(html)) !== null) {
  const tag = match[0];
  if (!tag.endsWith('/>')) {
    if (tag.startsWith('</')) {
      depth--;
      if (depth === 0) {
        modalEnd = match.index + tag.length;
        break;
      }
    } else {
      depth++;
    }
  }
}

console.log('index.html tagStart:', tagStart, 'modalEnd:', modalEnd, 'depth:', depth);
console.log('end slice:', JSON.stringify(html.slice(modalEnd - 30, modalEnd + 30)));
