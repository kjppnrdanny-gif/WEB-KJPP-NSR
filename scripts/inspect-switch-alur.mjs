import fs from 'node:fs';

const html = fs.readFileSync('portal-penugasan-jo.html', 'utf8');

const regex = /function\s+(?:setAlur|switchAlur|toggleAlur|pilihAlur|handleAlur)[^\(]*\(/g;
let match;
while ((match = regex.exec(html)) !== null) {
  console.log('Found function:', match[0], 'at', match.index);
  console.log(html.substring(match.index, match.index + 500));
}
