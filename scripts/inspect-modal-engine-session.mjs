import fs from 'fs';

const c = fs.readFileSync('lib/opini-nsr-modal-engine.js', 'utf8');
const lines = c.split('\n');
console.log(lines.slice(830, 890).join('\n'));
