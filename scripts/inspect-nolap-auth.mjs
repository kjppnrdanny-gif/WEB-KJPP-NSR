import fs from 'fs';

const c = fs.readFileSync('nolap-data-handler.php', 'utf8');

function searchMatches(pattern) {
  const lines = c.split('\n');
  lines.forEach((l, i) => {
    if (pattern.test(l)) {
      console.log(`${i+1}: ${l.slice(0, 100)}`);
    }
  });
}

console.log('Session checks in nolap-data-handler.php:');
searchMatches(/session_start|nsr_user|HTTP_AUTHORIZATION|HTTP_X_AUTH/i);
