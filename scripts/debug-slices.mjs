import fs from 'node:fs';

const orig = fs.readFileSync('index.html', 'utf8');

const galeriStart = orig.lastIndexOf('<section', orig.indexOf('id="galeri"'));
const manajemenStart = orig.lastIndexOf('<section', orig.indexOf('id="manajemen"'));
const fullGaleri = orig.substring(galeriStart, manajemenStart);

console.log('fullGaleri length:', fullGaleri.length);
const flexEndIdx = fullGaleri.indexOf('<!-- Interactive WebGL 3D FlexCarousel Component -->');
console.log('flexEndIdx:', flexEndIdx);
const footerBoxIdx = fullGaleri.indexOf('<!-- Footer Info Box & Direct Link ke Galeri Lengkap -->');
console.log('footerBoxIdx:', footerBoxIdx);

const kontakStart = orig.lastIndexOf('<section', orig.indexOf('id="kontak"'));
const footerStart = orig.indexOf('<footer');
const fullKontak = orig.substring(kontakStart, footerStart);
console.log('fullKontak length:', fullKontak.length);
const kontakCloseIdx = fullKontak.lastIndexOf('</div>\n  </section>');
console.log('kontakCloseIdx:', kontakCloseIdx);
