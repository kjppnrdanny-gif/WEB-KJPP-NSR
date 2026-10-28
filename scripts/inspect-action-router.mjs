import fs from 'fs';

const c = fs.readFileSync('nolap-data-handler.php', 'utf8');
const lines = c.split('\n');

const actionLines = lines.filter(l => l.includes("case '") || l.includes('case "') || (l.includes('$action ===') || l.includes('$action ==')));
console.log('Total action branches found:', actionLines.length);
console.log(actionLines.slice(0, 30).join('\n'));
