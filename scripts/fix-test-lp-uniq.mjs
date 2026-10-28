import fs from 'fs';

const testFile = 'tests/test-integrated-risk-mitigation.mjs';
let content = fs.readFileSync(testFile, 'utf8');

content = content.replace(
  "body: { idPenugasan: testIdNormal, nomorLpResmi: 'LP/001/MKS/2026' }",
  "body: { idPenugasan: testIdNormal, nomorLpResmi: `LP/${Date.now().toString().slice(-4)}/MKS/2026` }"
);

fs.writeFileSync(testFile, content, 'utf8');
console.log('Updated test-integrated-risk-mitigation.mjs with dynamic unique LP number.');
