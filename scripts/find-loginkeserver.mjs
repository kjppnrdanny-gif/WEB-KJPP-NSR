import fs from 'fs';

const content = fs.readFileSync('portal-nolap.html', 'utf8');

let pos = 0;
while (true) {
  const idx = content.indexOf('loginKeServer', pos);
  if (idx === -1) break;
  console.log(`loginKeServer at ${idx}:`);
  console.log(content.slice(idx - 50, idx + 80));
  pos = idx + 14;
}
