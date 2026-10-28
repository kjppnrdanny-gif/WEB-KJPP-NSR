import fs from 'fs';

const html = fs.readFileSync('index.html', 'utf8');
const formIdx = html.indexOf('id="form-token-portal"');
console.log(html.slice(formIdx, formIdx + 3000));
