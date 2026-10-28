import fs from 'node:fs';

const content = fs.readFileSync('index.html', 'utf8');

const sections = [];
const regex = /<section\b[^>]*id=["']([^"']*)["'][^>]*>/gi;
let match;
while ((match = regex.exec(content)) !== null) {
  sections.push({ id: match[1], index: match.index });
}

console.log('Sections in index.html:');
sections.forEach(s => console.log(`  - #${s.id} at index ${s.index}`));
