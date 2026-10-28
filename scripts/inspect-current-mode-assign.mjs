import fs from 'node:fs';

const html = fs.readFileSync('portal-penugasan-jo.html', 'utf8');

const regex = /currentModeAlur\s*=\s*[^;\n]+/g;
let match;
while ((match = regex.exec(html)) !== null) {
  console.log('Assignment at', match.index, ':', match[0]);
  console.log(html.substring(Math.max(0, match.index - 100), Math.min(html.length, match.index + 300)));
  console.log('---');
}
