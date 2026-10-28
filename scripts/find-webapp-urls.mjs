import fs from 'fs';

const buf = fs.readFileSync('C:\\Users\\HP\\AppData\\Local\\Temp\\ChromeHistoryCopy');
const text = buf.toString('latin1');

const regex = /https:\/\/script\.google\.com\/macros\/s\/[a-zA-Z0-9_-]+/g;
let m;
const webAppUrls = new Set();
while ((m = regex.exec(text)) !== null) {
  webAppUrls.add(m[0]);
}

console.log('Found Web App URLs:', webAppUrls.size);
for (const u of webAppUrls) {
  console.log(u);
}
