import fs from 'fs';

const content = fs.readFileSync('index.html', 'utf8');
const pidx = content.indexOf('Portal Layanan Internal NSR');
console.log(content.substring(pidx - 800, pidx + 100));
