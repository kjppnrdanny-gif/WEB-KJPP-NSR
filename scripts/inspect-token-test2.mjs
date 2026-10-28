import fs from 'fs';

const content = fs.readFileSync('scripts/test-all-12-tokens.mjs', 'utf8');
console.log(content.slice(800, 2000));
