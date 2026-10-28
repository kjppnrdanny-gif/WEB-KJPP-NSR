import fs from 'fs';

const content = fs.readFileSync('portal-nolap.html', 'utf8');

const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
let m;
let scriptIdx = 0;
while ((m = scriptRegex.exec(content)) !== null) {
  scriptIdx++;
  if (scriptIdx === 2) {
    console.log('Script 2 start:');
    console.log(m[1].slice(0, 500));
  }
}
