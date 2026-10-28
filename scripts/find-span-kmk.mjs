import fs from 'fs';

const html = fs.readFileSync('index.html', 'utf8');
const formStart = html.indexOf('id="form-token-portal"');
const formEnd = html.indexOf('</form>', formStart);
const formHtml = html.slice(formStart, formEnd);

const spanIdx = formHtml.indexOf('KMK No.');
console.log('spanIdx:', spanIdx);
if (spanIdx !== -1) {
  console.log('Around KMK No.:', JSON.stringify(formHtml.slice(spanIdx - 30, spanIdx + 50)));
}
