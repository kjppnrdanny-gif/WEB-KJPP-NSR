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
  const lastSectionIdx = s.text.lastIndexOf('</section>');
  console.log(`${s.name} has </section> at:`, lastSectionIdx, 'length:', s.text.length);
  if (lastSectionIdx !== -1) {
    console.log(`Trailing chars after </section>:`, JSON.stringify(s.text.substring(lastSectionIdx + 10)));
  }
});
