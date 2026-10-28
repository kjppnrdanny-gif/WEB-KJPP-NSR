import fs from 'node:fs';

const content = fs.readFileSync('index.html', 'utf8');
const sStart = content.lastIndexOf('<section', content.indexOf('id="sistem-mutu"'));
const lStart = content.lastIndexOf('<section', content.indexOf('id="layanan"'));
const sContent = content.substring(sStart, lStart);

// find where visual system flow ends:
const visualEnd = sContent.indexOf('</div><!-- end 4 cabang stack -->');
console.log('visualEnd index:', visualEnd);
console.log(sContent.substring(visualEnd - 100, visualEnd + 200));
