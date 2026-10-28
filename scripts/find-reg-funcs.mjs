import fs from 'fs';

const content = fs.readFileSync('portal-nolap.html', 'utf8');

console.log('gantiTabRegister index:', content.indexOf('gantiTabRegister'));
console.log('tutupModalPengaturanRegister index:', content.indexOf('tutupModalPengaturanRegister'));
