import fs from 'node:fs';

const orig = fs.readFileSync('index.html', 'utf8');
const headerIdx = orig.indexOf('<header');
const profilIdx = orig.indexOf('<section id="profil"');
const headerPart = orig.substring(headerIdx, profilIdx);

const targets = ['#visi-misi', '#transformasi', '#keunggulan', '#pengalaman', '#manajemen', '#regulasi', '#wawasan', '#kepercayaan'];

for (const t of targets) {
  const matches = (headerPart.match(new RegExp(t, 'g')) || []).length;
  console.log(`${t.padEnd(15)} appears ${matches} times in header/nav`);
}
