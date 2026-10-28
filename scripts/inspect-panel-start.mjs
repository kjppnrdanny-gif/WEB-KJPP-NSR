import fs from 'fs';

const c = fs.readFileSync('index.html', 'utf8');
const panelIdx = c.indexOf('id="panel-layanan"');
// Let's inspect 1200 chars of panel-layanan
console.log(c.slice(panelIdx, panelIdx + 1200));
