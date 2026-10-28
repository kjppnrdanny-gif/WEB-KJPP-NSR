import fs from 'node:fs';

const content = fs.readFileSync('index.html', 'utf8');
const footerEnd = content.indexOf('</footer>') + '</footer>'.length;
const afterFooter = content.substring(footerEnd);

// find each modal
const modalRegex = /<div\s+id="(modal-[^"]+)"/g;
let m;
const modalNames = [];
while ((m = modalRegex.exec(afterFooter)) !== null) {
  modalNames.push({ name: m[1], index: m.index });
}

for (let i = 0; i < modalNames.length; i++) {
  const m1 = modalNames[i];
  const nextIdx = i < modalNames.length - 1 ? modalNames[i+1].index : afterFooter.indexOf('<script');
  const chunk = afterFooter.substring(m1.index, nextIdx);
  const o = (chunk.match(/<div\b/g) || []).length;
  const c = (chunk.match(/<\/div>/g) || []).length;
  if (o !== c) {
    console.log(`Modal ${m1.name}: open=${o}, close=${c} diff=${o - c}`);
  }
}
