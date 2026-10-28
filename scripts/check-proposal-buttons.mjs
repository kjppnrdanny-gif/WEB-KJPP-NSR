import fs from 'node:fs';

const pages = [
  'index.html',
  'profil-legalitas.html',
  'layanan.html',
  'tim-cabang.html',
  'portofolio-rekanan.html',
  'wawasan-regulasi.html'
];

for (const p of pages) {
  const content = fs.readFileSync(p, 'utf8');
  console.log(`\n=== PAGE: ${p} ===`);
  const matches = [...content.matchAll(/Minta Proposal|Proposal &amp; Penawaran|Proposal & Penawaran/gi)];
  console.log(`Matches found: ${matches.length}`);
  matches.forEach(m => {
    console.log('  -', content.substring(m.index - 80, m.index + 120).replace(/\r?\n/g, ' '));
  });
}
