import fs from 'node:fs';

const content = fs.readFileSync('index.html', 'utf8');
const headerStart = content.indexOf('<header');
const headerEnd = content.indexOf('</header>');
const h = content.substring(headerStart, headerEnd);
const actionsIdx = h.indexOf('bukaModalPortal');
console.log(h.substring(actionsIdx - 100, actionsIdx + 1100));
