import fs from 'fs';

const content = fs.readFileSync('tests/test-spm-divtek-rbac-workflow.mjs', 'utf8');
const lines = content.split('\n');

for (let i = 385; i < lines.length; i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}
