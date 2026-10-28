import fs from 'node:fs';

const content = fs.readFileSync('index.html', 'utf8');

const regex = /<section[^>]*id="([^"]+)"/g;
let m;
while ((m = regex.exec(content)) !== null) {
  console.log(m[1].padEnd(20), 'at index:', m.index);
}
