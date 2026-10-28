import fs from 'fs';

const nolap = fs.readFileSync('portal-nolap.html', 'utf8');
const jo = fs.readFileSync('portal-penugasan-jo.html', 'utf8');

function findMatches(str, re) {
  const res = [];
  let m;
  while ((m = re.exec(str)) !== null) {
    res.push(m[1]);
  }
  return res;
}

console.log('=== PORTAL NOLAP FORM FIELDS ===');
const nolapFields = findMatches(nolap, /id=["'](f-[a-zA-Z0-9_-]+)["']/g);
console.log(nolapFields);

console.log('=== PORTAL PENUGASAN FORM FIELDS ===');
const joFields = findMatches(jo, /id=["']([a-zA-Z0-9_-]+)["']/g);
console.log(joFields.filter(id => id.includes('pemohon') || id.includes('pengaju') || id.includes('kontak') || id.includes('email') || id.includes('wa') || id.includes('pic') || id.includes('user')));
