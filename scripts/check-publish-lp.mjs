import fs from 'fs';

const c = fs.readFileSync('nolap-data-handler.php', 'utf8').replace(/\r\n/g, '\n');
const lines = c.split('\n');

const lpIdx = lines.findIndex(l => l.includes("action === 'publishOfficialLP'"));
console.log('lpIdx:', lpIdx);
console.log(lines.slice(lpIdx, lpIdx + 60).join('\n'));
