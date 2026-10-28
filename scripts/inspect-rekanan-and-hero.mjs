import fs from 'node:fs';

const content = fs.readFileSync('index.html', 'utf8');
const pStart = content.lastIndexOf('<section', content.indexOf('id="profil"'));
const sMutuStart = content.lastIndexOf('<section', content.indexOf('id="sistem-mutu"'));

console.log('From profil to sistem-mutu length:', sMutuStart - pStart);

const lines = content.substring(pStart, sMutuStart).split('\n');
console.log('Total lines:', lines.length);

lines.forEach((l, idx) => {
  if (l.includes('<section') || l.includes('id=') || l.includes('<!--') || l.includes('<h2') || l.includes('<h3')) {
    console.log(`L${idx+1}: ${l.trim()}`);
  }
});
