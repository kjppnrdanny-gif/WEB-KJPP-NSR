import fs from 'node:fs';

const content = fs.readFileSync('index.html', 'utf8');

const sMutuStart = content.lastIndexOf('<section', content.indexOf('id="sistem-mutu"'));
const layananStart = content.lastIndexOf('<section', content.indexOf('id="layanan"'));
const galeriStart = content.lastIndexOf('<section', content.indexOf('id="galeri"'));
const kontakStart = content.lastIndexOf('<section', content.indexOf('id="kontak"'));
const faqStart = content.lastIndexOf('<section', content.indexOf('id="faq"'));

// 1. Extract raw content of each section
let mutuRaw = content.substring(sMutuStart, layananStart).trim();
let layananRaw = content.substring(layananStart, galeriStart).trim();
let galeriRaw = content.substring(galeriStart, kontakStart).trim();
let kontakRaw = content.substring(kontakStart, faqStart).trim();

console.log('mutuRaw length:', mutuRaw.length);
console.log('layananRaw length:', layananRaw.length);
console.log('galeriRaw length:', galeriRaw.length);
console.log('kontakRaw length:', kontakRaw.length);

// Inside each section, it is:
// <section id="..." class="...">
//   [decorations like dot-field and glows]
//   <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
//     ... content ...
//   </div>
// </section>

// If we convert each <section id="..."> to a <div id="..." class="w-full">
// so that id="sistem-mutu", id="layanan", id="galeri", id="kontak" remain intact!
