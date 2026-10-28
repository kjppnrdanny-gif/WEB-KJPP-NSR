import fs from 'node:fs';

const content = fs.readFileSync('index.html', 'utf8');
const kStart = content.lastIndexOf('<section', content.indexOf('id="kontak"'));
const faqStart = content.lastIndexOf('<section', content.indexOf('id="faq"'));
const sContent = content.substring(kStart, faqStart);

console.log(JSON.stringify(sContent.substring(sContent.length - 150)));
