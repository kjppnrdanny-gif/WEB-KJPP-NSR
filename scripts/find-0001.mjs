import fs from 'fs';

const content = fs.readFileSync('portal-penugasan-jo.html', 'utf8');

const regex = /0001/g;
let m;
const occurrences = [];
while ((m = regex.exec(content)) !== null) {
  const lineNo = content.slice(0, m.index).split('\n').length;
  occurrences.push({ line: lineNo, index: m.index, snippet: content.slice(Math.max(0, m.index - 50), m.index + 80).replace(/\r?\n/g, ' ') });
}
console.log('Occurrences of 0001:', occurrences.length);
console.log(occurrences);
