import fs from 'node:fs';

const orig = fs.readFileSync('index.html', 'utf8');
const headerIdx = orig.indexOf('<header');
const profilIdx = orig.indexOf('<section id="profil"');
const headerPart = orig.substring(headerIdx, profilIdx);

const lines = headerPart.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('#manajemen') || line.includes('#pengalaman') || line.includes('#visi-misi') || line.includes('#wawasan')) {
    console.log(`L${idx+1}: ${line.trim()}`);
  }
});
