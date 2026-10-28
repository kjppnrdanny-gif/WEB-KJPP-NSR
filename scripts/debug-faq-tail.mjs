import fs from 'node:fs';

const orig = fs.readFileSync('index.html', 'utf8');

const faqStart = orig.lastIndexOf('<section', orig.indexOf('id="faq"'));
const kontakStart = orig.lastIndexOf('<section', orig.indexOf('id="kontak"'));
const fullFaq = orig.substring(faqStart, kontakStart);

console.log(JSON.stringify(fullFaq.substring(fullFaq.length - 200)));
