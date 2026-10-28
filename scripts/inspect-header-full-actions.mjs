import fs from 'node:fs';

const content = fs.readFileSync('index.html', 'utf8');
const idx = content.indexOf('Minta Proposal &amp; Penawaran');
console.log(content.substring(idx - 400, idx + 600));
