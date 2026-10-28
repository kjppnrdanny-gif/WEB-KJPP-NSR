import fs from 'fs';

const file = '.github/workflows/deploy-cpanel.yml';
let content = fs.readFileSync(file, 'utf8');
content = content.replace('run: sleep 10', 'run: sleep 20');
fs.writeFileSync(file, content, 'utf8');
console.log('Updated sleep in deploy-cpanel.yml');
