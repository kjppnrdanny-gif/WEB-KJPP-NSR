import fs from 'node:fs';

const content = fs.readFileSync('index.html', 'utf8');
console.log('has main tag?', content.includes('<main'), content.includes('</main>'));
console.log('has footer tag?', content.includes('<footer'), content.includes('</footer>'));
const footerIdx = content.indexOf('<footer');
console.log('footer starts at:', footerIdx);
console.log('Between faqStart and footer:');
const faqStart = content.lastIndexOf('<section', content.indexOf('id="faq"'));
console.log(content.substring(footerIdx - 500, footerIdx + 300));
