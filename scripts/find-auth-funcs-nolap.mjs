import fs from 'fs';

const content = fs.readFileSync('portal-nolap.html', 'utf8');

const regex = /function\s+([a-zA-Z0-9_]*(?:Login|Auth|Token|Sesi)[a-zA-Z0-9_]*)/gi;
let m;
const funcs = [];
while ((m = regex.exec(content)) !== null) {
  funcs.push(m[1]);
}
console.log('Auth functions in portal-nolap:', [...new Set(funcs)]);
