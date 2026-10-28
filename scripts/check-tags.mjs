import fs from 'node:fs';

const content = fs.readFileSync('index.html', 'utf8');

const sMutuStart = content.lastIndexOf('<section', content.indexOf('id="sistem-mutu"'));
const layananStart = content.lastIndexOf('<section', content.indexOf('id="layanan"'));
const galeriStart = content.lastIndexOf('<section', content.indexOf('id="galeri"'));
const kontakStart = content.lastIndexOf('<section', content.indexOf('id="kontak"'));
const faqStart = content.lastIndexOf('<section', content.indexOf('id="faq"'));

const sections = [
  { name: 'MUTU', text: content.substring(sMutuStart, layananStart).trim() },
  { name: 'LAYANAN', text: content.substring(layananStart, galeriStart).trim() },
  { name: 'GALERI', text: content.substring(galeriStart, kontakStart).trim() },
  { name: 'KONTAK', text: content.substring(kontakStart, faqStart).trim() }
];

sections.forEach(s => {
  const match = s.text.match(/^<section\b[^>]*>/i);
  console.log(`${s.name} tag:`, match ? match[0] : 'NO MATCH');
  const endMatch = s.text.match(/<\/section>$/i);
  console.log(`${s.name} ends with </section>:`, !!endMatch);
});
