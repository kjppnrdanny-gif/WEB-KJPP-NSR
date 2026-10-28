import fs from 'node:fs';

const orig = fs.readFileSync('index.html', 'utf8');

const kontakStart = orig.lastIndexOf('<section', orig.indexOf('id="kontak"'));
const footerStart = orig.indexOf('<footer');
const fullKontak = orig.substring(kontakStart, footerStart);

console.log('fullKontak tail:');
console.log(JSON.stringify(fullKontak.substring(fullKontak.length - 200)));

const galeriStart = orig.lastIndexOf('<section', orig.indexOf('id="galeri"'));
const manajemenStart = orig.lastIndexOf('<section', orig.indexOf('id="manajemen"'));
const fullGaleri = orig.substring(galeriStart, manajemenStart);

console.log('fullGaleri tail:');
console.log(JSON.stringify(fullGaleri.substring(fullGaleri.length - 200)));
