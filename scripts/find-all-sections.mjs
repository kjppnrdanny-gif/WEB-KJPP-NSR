import fs from 'fs';

const content = fs.readFileSync('portal-penugasan-jo.html', 'utf8');

// Find all matches for "Section 0" or "Section"
const re = /Section\s+0?\d[^\n<]*/gi;
let m;
const results = [];
while ((m = re.exec(content)) !== null) {
  const lineNo = content.slice(0, m.index).split('\n').length;
  results.push({ line: lineNo, index: m.index, text: m[0] });
}

console.log('Total Section occurrences:', results.length);
console.log(results);
