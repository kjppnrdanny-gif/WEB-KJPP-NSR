import fs from 'node:fs';

const content = fs.readFileSync('index.html', 'utf8');

const footerIdx = content.indexOf('<footer');
const footerEnd = content.indexOf('</footer>', footerIdx) + '</footer>'.length;

console.log('footer length:', footerEnd - footerIdx);
// Find all modals between footerEnd and the scripts
const afterFooter = content.substring(footerEnd);
const modalMatches = [...afterFooter.matchAll(/id="(modal-[^"]+)"/g)].map(m => m[1]);
console.log('Modals found after footer:', modalMatches);

// Check if any modal is before footer
const beforeFooter = content.substring(0, footerIdx);
const beforeMatches = [...beforeFooter.matchAll(/id="(modal-[^"]+)"/g)].map(m => m[1]);
console.log('Modals found before footer:', beforeMatches);
