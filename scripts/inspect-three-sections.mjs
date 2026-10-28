import fs from 'node:fs';

const content = fs.readFileSync('index.html', 'utf8');

const sMutuStart = content.lastIndexOf('<section', content.indexOf('id="sistem-mutu"'));
const layananStart = content.lastIndexOf('<section', content.indexOf('id="layanan"'));
const galeriStart = content.lastIndexOf('<section', content.indexOf('id="galeri"'));
const kontakStart = content.lastIndexOf('<section', content.indexOf('id="kontak"'));
const faqStart = content.lastIndexOf('<section', content.indexOf('id="faq"'));

console.log('sistem-mutu:', sMutuStart, 'to', layananStart, 'len:', layananStart - sMutuStart);
console.log('layanan:', layananStart, 'to', galeriStart, 'len:', galeriStart - layananStart);
console.log('kontak:', kontakStart, 'to', faqStart, 'len:', faqStart - kontakStart);
