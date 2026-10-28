import fs from 'node:fs';
import path from 'node:path';

const p = path.resolve('netlify.toml');
let raw = fs.readFileSync(p, 'utf8');
const hadCrlf = raw.includes('\r\n');
let content = raw.replace(/\r\n/g, '\n');

const dupBlock = `[[redirects]]
  from = "/scratch/*"
  to = "/index.html"
  status = 404
  force = true

[[redirects]]
  from = "/data/*"
  to = "/index.html"
  status = 404
  force = true

[[redirects]]
  from = "/screenshots/*"`;

const cleanBlock = `[[redirects]]
  from = "/scratch/*"
  to = "/index.html"
  status = 404
  force = true

[[redirects]]
  from = "/screenshots/*"`;

if (!content.includes(dupBlock)) {
  console.error('dupBlock not found');
  process.exit(1);
}

content = content.replace(dupBlock, cleanBlock);
if (hadCrlf) {
  content = content.replace(/\n/g, '\r\n');
}
fs.writeFileSync(p, content, 'utf8');
console.log('Successfully cleaned duplicate redirect in netlify.toml');
