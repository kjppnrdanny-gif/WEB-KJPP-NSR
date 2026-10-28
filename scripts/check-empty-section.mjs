import fs from 'node:fs';

const content = fs.readFileSync('index.html', 'utf8');
const rekananIdx = content.indexOf('id="rekanan"');
const sistemMutuIdx = content.indexOf('id="sistem-mutu"');
const between = content.substring(rekananIdx, sistemMutuIdx);

const secIdx = between.indexOf('<section', 10);
if (secIdx !== -1) {
  console.log('Section found:');
  console.log(between.substring(secIdx, secIdx + 400));
} else {
  console.log('No extra section');
}
