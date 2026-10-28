import fs from 'fs';

const buf = fs.readFileSync('C:\\Users\\HP\\AppData\\Local\\Temp\\ChromeHistoryCopy');
const text = buf.toString('latin1');
const matches = new Set();

const regex = /https:\/\/(?:script\.google\.com[^\s"'\x00-\x1f]*|docs\.google\.com\/spreadsheets\/d\/[^\s"'\x00-\x1f]*)/g;
let m;
while ((m = regex.exec(text)) !== null) {
  matches.add(m[0]);
}

console.log('Found matches:', matches.size);
for (const url of matches) {
  console.log(url);
}
