import { execSync } from 'child_process';
import fs from 'fs';

console.log('=== Checking commit 0f9e7fa and bf1a2e2 for portal-absensi ===');
try {
  console.log(execSync('git show --stat 0f9e7fa', { encoding: 'utf8' }));
} catch (e) {
  console.log('Error:', e.message);
}

try {
  console.log(execSync('git show --stat bf1a2e2', { encoding: 'utf8' }));
} catch (e) {
  console.log('Error:', e.message);
}
