import fs from 'node:fs';

const orig = fs.readFileSync('index.html', 'utf8');

const profilStart = orig.lastIndexOf('<section', orig.indexOf('id="profil"'));
console.log('Right before profilStart:');
console.log(JSON.stringify(orig.substring(profilStart - 100, profilStart)));

const footerStart = orig.indexOf('<footer');
console.log('Right before footerStart:');
console.log(JSON.stringify(orig.substring(footerStart - 100, footerStart)));
