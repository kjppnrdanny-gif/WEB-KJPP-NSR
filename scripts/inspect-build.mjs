import fs from 'fs';

const c = fs.readFileSync('scripts/build-production.mjs', 'utf8');
console.log(c.slice(0, 1500));
