import fs from 'fs';

const content = fs.readFileSync('portal-nolap.html', 'utf8');

const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
let m;
let scriptIdx = 0;
while ((m = scriptRegex.exec(content)) !== null) {
  scriptIdx++;
  if (m[1].includes('loginKeServer')) {
    console.log(`loginKeServer found in Script ${scriptIdx}`);
  }
}
