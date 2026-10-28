import fs from 'fs';

const html = fs.readFileSync('index.html', 'utf8');
const rutPos = html.indexOf('resolveUnifiedToken');
console.log(html.slice(rutPos + 1000, rutPos + 3000));
