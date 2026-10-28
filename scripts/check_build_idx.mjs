import fs from 'fs';

const c = fs.readFileSync('scripts/build-production.mjs', 'utf8');
const idx = c.indexOf('index.html');
console.log('index.html references in build-production.mjs:');
let pos = 0;
while ((pos = c.indexOf('index.html', pos)) !== -1) {
  console.log(c.substring(pos - 50, pos + 100));
  console.log('---');
  pos += 10;
}
