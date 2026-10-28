import fs from 'fs';

const nolap = fs.readFileSync('portal-nolap.html', 'utf8');
const lines = nolap.split('\n');

const syncLines = lines.filter((l, i) => l.includes('sinkronkanDariServerProxy') || l.includes('action=getRecords') || l.includes('action=muatDatabase'));
console.log(syncLines);
