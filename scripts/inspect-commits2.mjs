import { execSync } from 'child_process';

console.log('=== Checking commit 4bec580 ===');
try {
  console.log(execSync('git show --stat 4bec580', { encoding: 'utf8' }));
} catch (e) {
  console.log('Error:', e.message);
}

console.log('=== Checking commit 4588be2 ===');
try {
  console.log(execSync('git show --stat 4588be2', { encoding: 'utf8' }));
} catch (e) {
  console.log('Error:', e.message);
}
