import fs from 'fs';

const reg = JSON.parse(fs.readFileSync('data/official_register_config.json', 'utf8'));
console.log(JSON.stringify(reg.slice(0, 5), null, 2));
