import fs from 'fs';

const c = fs.readFileSync('portal-penugasan-jo.html', 'utf8').replace(/\r\n/g, '\n');
const lines = c.split('\n');

const subIdx = lines.findIndex(l => l.includes('function handleFormSubmit'));
console.log('subIdx:', subIdx);
console.log(lines.slice(subIdx, subIdx + 50).join('\n'));
