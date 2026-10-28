import fs from 'fs';

const html = fs.readFileSync('index.html', 'utf8');
const formStart = html.indexOf('id="form-token-portal"');
const formEnd = html.indexOf('</form>', formStart);
const formHtml = html.slice(formStart, formEnd);

console.log('Includes KMK No. 2.19.0160 in HTML:', formHtml.includes('KMK No. 2.19.0160'));
const kmkIdx = formHtml.indexOf('KMK');
console.log('Slice around KMK:', JSON.stringify(formHtml.slice(kmkIdx - 20, kmkIdx + 40)));
