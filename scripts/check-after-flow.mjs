import fs from 'node:fs';

const content = fs.readFileSync('index.html', 'utf8');
const sStart = content.lastIndexOf('<section', content.indexOf('id="sistem-mutu"'));
const lStart = content.lastIndexOf('<section', content.indexOf('id="layanan"'));
const sContent = content.substring(sStart, lStart);

const visualEnd = sContent.indexOf('</div><!-- end 4 cabang stack -->');
const afterFlow = visualEnd + '</div><!-- end 4 cabang stack -->\n\n                </div>\n              </div>'.length;

console.log('After flow preview:');
console.log(sContent.substring(afterFlow, afterFlow + 600));
