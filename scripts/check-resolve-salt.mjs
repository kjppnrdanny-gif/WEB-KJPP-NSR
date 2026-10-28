import fs from 'fs';

const html = fs.readFileSync('index.html', 'utf8');
const rutPos = html.indexOf('resolveUnifiedToken');
console.log(html.slice(rutPos + 2500, rutPos + 4500));
