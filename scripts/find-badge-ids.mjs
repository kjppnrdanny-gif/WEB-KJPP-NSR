import fs from 'fs';

const content = fs.readFileSync('portal-nolap.html', 'utf8');

const regex = /id=["']([^"']*(?:user|role|session|badge|profil|nama)[^"']*)["']/gi;
let m;
const ids = [];
while ((m = regex.exec(content)) !== null) {
  ids.push(m[1]);
}
console.log('Session / user badge IDs in portal-nolap:');
console.log([...new Set(ids)]);
