import fs from 'fs';

const c = fs.readFileSync('nolap-data-handler.php', 'utf8').replace(/\r\n/g, '\n');
const lines = c.split('\n');

const issIdx = lines.findIndex(l => l.includes("action === 'issueDefinitiveNoLap'"));
console.log('issIdx:', issIdx);
console.log(lines.slice(issIdx, issIdx + 70).join('\n'));
