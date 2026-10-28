import fs from 'node:fs';

const orig = fs.readFileSync('index.html', 'utf8');

const faqStart = orig.lastIndexOf('<section', orig.indexOf('id="faq"'));
const kontakStart = orig.lastIndexOf('<section', orig.indexOf('id="kontak"'));
const fullFaq = orig.substring(faqStart, kontakStart);

console.log('Original faq length:', fullFaq.length);
console.log('Original faq ends with </section>?', fullFaq.trim().endsWith('</section>'));

const openDivs = (fullFaq.match(/<div\b/g) || []).length;
const closeDivs = (fullFaq.match(/<\/div>/g) || []).length;
console.log(`Divs in fullFaq: open=${openDivs}, close=${closeDivs}`);
