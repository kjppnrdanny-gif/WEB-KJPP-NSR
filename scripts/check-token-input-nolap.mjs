import fs from 'fs';

const content = fs.readFileSync('portal-nolap.html', 'utf8');

const idx = content.indexOf('token');
console.log('Search for input token in portal-nolap:');
const inputs = content.match(/<input[^>]+token[^>]*>/gi);
console.log(inputs);

const idxFunc = content.indexOf('function verifikasiToken');
if (idxFunc > -1) {
  console.log(content.slice(idxFunc, idxFunc + 600));
}
