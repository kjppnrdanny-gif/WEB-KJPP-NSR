import fs from 'node:fs';

const content = fs.readFileSync('index.html', 'utf8');

const sMutuStart = content.lastIndexOf('<section', content.indexOf('id="sistem-mutu"'));
const layananStart = content.lastIndexOf('<section', content.indexOf('id="layanan"'));
const galeriStart = content.lastIndexOf('<section', content.indexOf('id="galeri"'));
const kontakStart = content.lastIndexOf('<section', content.indexOf('id="kontak"'));
const faqStart = content.lastIndexOf('<section', content.indexOf('id="faq"'));

const mutu = content.substring(sMutuStart, layananStart);
const layanan = content.substring(layananStart, galeriStart);
const galeri = content.substring(galeriStart, kontakStart);
const kontak = content.substring(kontakStart, faqStart);

console.log('MUTU starts with:', mutu.substring(0, 150));
console.log('MUTU ends with:', mutu.substring(mutu.length - 150));

console.log('LAYANAN starts with:', layanan.substring(0, 150));
console.log('LAYANAN ends with:', layanan.substring(layanan.length - 150));

console.log('GALERI starts with:', galeri.substring(0, 150));
console.log('GALERI ends with:', galeri.substring(galeri.length - 150));

console.log('KONTAK starts with:', kontak.substring(0, 150));
console.log('KONTAK ends with:', kontak.substring(kontak.length - 150));
