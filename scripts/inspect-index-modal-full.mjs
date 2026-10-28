import fs from 'fs';

const html = fs.readFileSync('index.html', 'utf8');
const startIdx = html.indexOf('id="modal-portal"');
const endIdx = html.indexOf('<!-- /modal-portal -->', startIdx);
console.log('modal block length:', endIdx !== -1 ? endIdx - startIdx : 'no closing comment');
if (endIdx === -1) {
  // Let's print from startIdx for 4000 chars
  console.log(html.slice(startIdx, startIdx + 4500));
} else {
  console.log(html.slice(startIdx, endIdx + 30));
}
