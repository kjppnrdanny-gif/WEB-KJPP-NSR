import fs from 'fs';

const filePath = 'portal-penugasan-jo.html';
const lines = fs.readFileSync(filePath, 'utf8').split('\n');

console.log('--- updateNomorOtomatisPreview (6911) ---');
for (let i = 6910; i < 6960; i++) {
  console.log(`${i + 1}: ${JSON.stringify(lines[i])}`);
}

console.log('\n--- handleFormSubmit (7161) ---');
for (let i = 7160; i < 7220; i++) {
  console.log(`${i + 1}: ${JSON.stringify(lines[i])}`);
}
