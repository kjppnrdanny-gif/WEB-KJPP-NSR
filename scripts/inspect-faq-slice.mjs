import fs from 'node:fs';

const content = fs.readFileSync('index.html', 'utf8');
const faqStart = content.lastIndexOf('<section', content.indexOf('id="faq"'));
console.log('faqStart:', faqStart);
console.log('FAQ slice summary:');
console.log(content.substring(faqStart, faqStart + 1500));
console.log('--- end of FAQ slice ---');
const mainEnd = content.indexOf('</main>');
console.log(content.substring(mainEnd - 500, mainEnd + 200));
