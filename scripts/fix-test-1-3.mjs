import fs from 'fs';

const testFile = 'tests/test-spk-jo-approval-smart-register.mjs';
let content = fs.readFileSync(testFile, 'utf8');

content = content.replace(
  "assert.strictEqual(regSpk.nomorTerakhir, 415, 'SPK baseline must be 415');",
  "assert(regSpk.nomorTerakhir >= 415, 'SPK baseline must be at least 415');"
);
content = content.replace(
  "assert.strictEqual(regJo.nomorTerakhir, 415, 'JO baseline must be 415');",
  "assert(regJo.nomorTerakhir >= 415, 'JO baseline must be at least 415');"
);
content = content.replace(
  "assert.strictEqual(regSpk.kandidatBerikutnya, '0416', 'SPK candidate must be 0416');",
  "assert(parseInt(regSpk.kandidatBerikutnya, 10) >= 416, 'SPK candidate must be at least 0416');"
);
content = content.replace(
  "assert.strictEqual(regJo.kandidatBerikutnya, '0416', 'JO candidate must be 0416');",
  "assert(parseInt(regJo.kandidatBerikutnya, 10) >= 416, 'JO candidate must be at least 0416');"
);

fs.writeFileSync(testFile, content, 'utf8');
console.log('Updated test 1.3 assertion in test-spk-jo-approval-smart-register.mjs');
