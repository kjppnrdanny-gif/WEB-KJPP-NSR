import fs from 'fs';

const c = fs.readFileSync('scripts/verify-live-p0-finishing.mjs', 'utf8');
console.log(c.slice(0, 1200));
