import fs from 'node:fs';

const content = fs.readFileSync('index.html', 'utf8');

const sMutuStart = content.lastIndexOf('<section', content.indexOf('id="sistem-mutu"'));
const layananStart = content.lastIndexOf('<section', content.indexOf('id="layanan"'));
const galeriStart = content.lastIndexOf('<section', content.indexOf('id="galeri"'));
const kontakStart = content.lastIndexOf('<section', content.indexOf('id="kontak"'));
const faqStart = content.lastIndexOf('<section', content.indexOf('id="faq"'));

console.log('--- SISTEM MUTU HEADER ---');
console.log(content.substring(sMutuStart, sMutuStart + 350));

console.log('--- LAYANAN HEADER ---');
console.log(content.substring(layananStart, layananStart + 350));

console.log('--- GALERI HEADER ---');
console.log(content.substring(galeriStart, galeriStart + 350));

console.log('--- KONTAK HEADER ---');
console.log(content.substring(kontakStart, kontakStart + 350));
