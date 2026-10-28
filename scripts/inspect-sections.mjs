import fs from 'node:fs';

const content = fs.readFileSync('index.html', 'utf8');
console.log('Total bytes:', content.length);
console.log('Total lines:', content.split('\n').length);

const sections = [
  'profil', 'rekanan', 'visi-misi', 'transformasi', 'keunggulan',
  'layanan', 'sistem-mutu', 'pengalaman', 'galeri', 'manajemen',
  'regulasi', 'wawasan', 'kepercayaan', 'faq', 'kontak'
];

for (const s of sections) {
  const start = content.indexOf(`id="${s}"`);
  console.log(`${s.padEnd(15)}: index ${start}`);
}

const footerIndex = content.indexOf('<footer');
console.log('footer'.padEnd(15) + `: index ${footerIndex}`);

// Find script tags at the bottom
const lastSectionEnd = content.indexOf('</main>');
console.log('</main> index:'.padEnd(15) + `: index ${lastSectionEnd}`);
