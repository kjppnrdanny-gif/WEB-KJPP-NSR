import fs from 'fs';

const html = fs.readFileSync('index.html', 'utf8');
const startIdx = html.indexOf('id="modal-portal"');
if (startIdx !== -1) {
  // find start of container div
  const divStart = html.lastIndexOf('<div', startIdx);
  // print next 2500 chars
  console.log(html.slice(divStart, divStart + 3500));
}
