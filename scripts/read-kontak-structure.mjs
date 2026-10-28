import fs from 'node:fs';

const content = fs.readFileSync('index.html', 'utf8');
const kIdx = content.indexOf('id="kontak"');
const kStart = content.lastIndexOf('<section', kIdx);
const nextStart = content.indexOf('<section', kIdx + 15);
console.log('kontak length:', nextStart - kStart);

const lines = content.substring(kStart, nextStart).split('\n');
console.log('Total lines in kontak:', lines.length);

lines.forEach((l, idx) => {
  if (l.includes('<!--') || l.includes('<h2') || l.includes('<h3') || l.includes('id=')) {
    console.log(`L${idx+1}: ${l.trim()}`);
  }
});
