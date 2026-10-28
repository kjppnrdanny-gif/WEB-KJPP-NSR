import fs from 'fs';

const c = fs.readFileSync('data/official_register_config.json', 'utf8');
console.log(c);
