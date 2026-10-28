import fs from 'node:fs';

const content = fs.readFileSync('index.html', 'utf8');

const sections = ['profil', 'rekanan', 'sistem-mutu', 'layanan', 'galeri', 'kontak', 'faq'];

for (let i = 0; i < sections.length; i++) {
  const sName = sections[i];
  const sStart = content.lastIndexOf('<section', content.indexOf(`id="${sName}"`));
  const sEnd = i < sections.length - 1 ? content.lastIndexOf('<section', content.indexOf(`id="${sections[i+1]}"`)) : content.indexOf('<footer');
  const sPart = content.substring(sStart, sEnd);
  const o = (sPart.match(/<div\b/g) || []).length;
  const c = (sPart.match(/<\/div>/g) || []).length;
  console.log(`${sName.padEnd(15)}: open=${o}, close=${c} diff=${o - c}`);
}

const footerPart = content.substring(content.indexOf('<footer'));
const fo = (footerPart.match(/<div\b/g) || []).length;
const fc = (footerPart.match(/<\/div>/g) || []).length;
console.log(`footer & after : open=${fo}, close=${fc} diff=${fo - fc}`);

const headPart = content.substring(0, content.lastIndexOf('<section', content.indexOf('id="profil"')));
const ho = (headPart.match(/<div\b/g) || []).length;
const hc = (headPart.match(/<\/div>/g) || []).length;
console.log(`head & header  : open=${ho}, close=${hc} diff=${ho - hc}`);
