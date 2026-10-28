import fs from 'fs';

const html = fs.readFileSync('index.html', 'utf8');
const rutPos = html.indexOf('resolveUnifiedToken');
console.log('resolveUnifiedToken pos:', rutPos);
if (rutPos !== -1) {
  console.log(html.slice(rutPos, rutPos + 1000));
}
