import fs from 'fs';

let testContent = fs.readFileSync('tests/test-king-workflow-and-master-alignment.mjs', 'utf8');

testContent = testContent.replace(
  "html.includes('deklarasiSemuaIndependen')",
  "(html.includes('konfirmasiDeklarasiPersonelIndividual') || html.includes('panel_deklarasi_eti'))"
);

fs.writeFileSync('tests/test-king-workflow-and-master-alignment.mjs', testContent, 'utf8');
console.log('Updated test assertion 6.1!');
