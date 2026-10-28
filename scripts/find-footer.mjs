import fs from 'node:fs';

const content = fs.readFileSync('index.html', 'utf8');

const kontakIdx = content.indexOf('<section id="kontak"');
// Find closing </section> of kontak
const closingKontak = content.indexOf('</section>', kontakIdx) + '</section>'.length;

console.log('kontakIdx:', kontakIdx);
console.log('closingKontak:', closingKontak);
console.log('Snippet after kontak:\n', content.substring(closingKontak, closingKontak + 200));

// Find footer start
const footerIdx = content.indexOf('<footer');
console.log('footerIdx:', footerIdx);
