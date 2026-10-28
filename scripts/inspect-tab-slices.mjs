import fs from 'node:fs';

const content = fs.readFileSync('index.html', 'utf8');

const sMutuStart = content.lastIndexOf('<section', content.indexOf('id="sistem-mutu"'));
const layananStart = content.lastIndexOf('<section', content.indexOf('id="layanan"'));
const galeriStart = content.lastIndexOf('<section', content.indexOf('id="galeri"'));
const kontakStart = content.lastIndexOf('<section', content.indexOf('id="kontak"'));
const faqStart = content.lastIndexOf('<section', content.indexOf('id="faq"'));

console.log('sMutuStart:', sMutuStart);
console.log('layananStart:', layananStart);
console.log('galeriStart:', galeriStart);
console.log('kontakStart:', kontakStart);
console.log('faqStart:', faqStart);

const mutuHtml = content.substring(sMutuStart, layananStart);
const layananHtml = content.substring(layananStart, galeriStart);
const galeriHtml = content.substring(galeriStart, kontakStart);
const kontakHtml = content.substring(kontakStart, faqStart);

console.log('mutuHtml length:', mutuHtml.length);
console.log('layananHtml length:', layananHtml.length);
console.log('galeriHtml length:', galeriHtml.length);
console.log('kontakHtml length:', kontakHtml.length);
