import fs from 'node:fs';

const content = fs.readFileSync('index.html', 'utf8');

function findSectionEnd(startIdx) {
  // Find </section> that balances
  const endIdx = content.indexOf('</section>', startIdx);
  return endIdx + '</section>'.length;
}

const markers = [
  'profil', 'rekanan', 'visi-misi', 'transformasi', 'keunggulan',
  'layanan', 'sistem-mutu', 'pengalaman', 'galeri', 'manajemen',
  'regulasi', 'wawasan', 'kepercayaan', 'faq', 'kontak'
];

for (let i = 0; i < markers.length; i++) {
  const name = markers[i];
  const start = content.indexOf(`id="${name}"`);
  const tagStart = content.lastIndexOf('<section', start);
  const nextStart = i < markers.length - 1 ? content.lastIndexOf('<section', content.indexOf(`id="${markers[i+1]}"`)) : content.indexOf('<footer');
  console.log(`${name.padEnd(15)}: starts at ${tagStart}, length ${nextStart - tagStart} chars`);
}

const footerStart = content.indexOf('<footer');
console.log('Footer starts at:', footerStart);
console.log('Scripts start after footer:', content.indexOf('<script', footerStart));
console.log('Total file length:', content.length);
