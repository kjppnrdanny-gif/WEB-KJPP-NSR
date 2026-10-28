import fs from 'fs';

const testFile = fs.readFileSync('tests/test-king-workflow-and-master-alignment.mjs', 'utf8');
console.log(testFile.substring(2000));
