import fs from 'node:fs';

const content = fs.readFileSync('index.html', 'utf8');
const target = 'Minta Proposal &amp; Penawaran';
const idx = content.indexOf(target);
console.log(content.substring(idx - 600, idx + 400));
