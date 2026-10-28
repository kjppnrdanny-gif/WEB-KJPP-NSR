import fs from 'fs';

const nolap = fs.readFileSync('portal-nolap.html', 'utf8');
const lines = nolap.split('\n');

const idx = lines.findIndex(l => l.includes('async function sinkronkanDariServerProxy'));
console.log(lines.slice(idx, idx + 40).join('\n'));
