import fs from 'fs';

const testFile = fs.readFileSync('tests/test-master-kontak-notification-center.mjs', 'utf8');
const lines = testFile.split('\n');

lines.forEach((l, i) => {
  if (l.includes('headers') || l.includes('Authorization') || l.includes('X-') || l.includes('auth')) {
    console.log(`Line ${i + 1}: ${l.trim().substring(0, 100)}`);
  }
});
