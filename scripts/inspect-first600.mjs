import fs from 'node:fs';

const content = fs.readFileSync('index.html', 'utf8');

const sMutuStart = content.lastIndexOf('<section', content.indexOf('id="sistem-mutu"'));
const layananStart = content.lastIndexOf('<section', content.indexOf('id="layanan"'));
const galeriStart = content.lastIndexOf('<section', content.indexOf('id="galeri"'));
const kontakStart = content.lastIndexOf('<section', content.indexOf('id="kontak"'));

console.log('--- MUTU START (first 600 chars) ---');
console.log(content.substring(sMutuStart, sMutuStart + 600));

console.log('--- LAYANAN START (first 600 chars) ---');
console.log(content.substring(layananStart, layananStart + 600));

console.log('--- GALERI START (first 600 chars) ---');
console.log(content.substring(galeriStart, galeriStart + 600));

console.log('--- KONTAK START (first 600 chars) ---');
console.log(content.substring(kontakStart, kontakStart + 600));
