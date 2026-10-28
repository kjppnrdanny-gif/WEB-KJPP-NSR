import fs from 'fs';

const content = fs.readFileSync('portal-nolap.html', 'utf8');

const regex = /tutupModalPengaturanRegister/g;
let m;
while ((m = regex.exec(content)) !== null) {
  console.log('Found at:', m.index);
}
