import fs from 'node:fs';

const content = fs.readFileSync('index.html', 'utf8');
const sIdx = content.indexOf('id="sistem-mutu"');
const sStart = content.lastIndexOf('<section', sIdx);
const nextStart = content.indexOf('<section', sIdx + 15);
console.log('sistem-mutu start to next section length:', nextStart - sStart);

const lines = content.substring(sStart, nextStart).split('\n');
console.log('Total lines in sistem-mutu:', lines.length);

// Print major comments or headings in sistem-mutu
lines.forEach((l, idx) => {
  if (l.includes('<!--') || l.includes('<h2') || l.includes('<h3') || l.includes('id=')) {
    console.log(`L${idx+1}: ${l.trim()}`);
  }
});
