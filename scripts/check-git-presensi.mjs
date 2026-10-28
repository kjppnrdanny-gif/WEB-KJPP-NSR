import { execSync } from 'child_process';

console.log('=== GIT LOG FOR portal-absensi.html ===');
try {
  console.log(execSync('git log --oneline -n 10 portal-absensi.html', { encoding: 'utf8' }));
} catch (e) {
  console.log('Error / not tracked:', e.message);
}

console.log('=== GIT LOG FOR portal-presensi.html ===');
try {
  console.log(execSync('git log --oneline -n 10 portal-presensi.html', { encoding: 'utf8' }));
} catch (e) {
  console.log('Error / not tracked:', e.message);
}
