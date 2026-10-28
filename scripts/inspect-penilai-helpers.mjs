import fs from 'fs';

const c = fs.readFileSync('nolap-data-handler.php', 'utf8');
const lines = c.split('\n');

console.log('=== L1310 - L1360 ===');
console.log(lines.slice(1310, 1360).join('\n'));

console.log('=== L2180 - L2210 ===');
console.log(lines.slice(2180, 2210).join('\n'));
