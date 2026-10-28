import fs from 'fs';

const phpFiles = fs.readdirSync('.').filter(f => f.endsWith('.php'));

phpFiles.forEach(f => {
  const c = fs.readFileSync(f, 'utf8');
  const m = c.match(/session_name\([^)]+\)/g);
  if (m) {
    console.log(`${f}: ${m.join(', ')}`);
  } else if (c.includes('session_start')) {
    console.log(`${f}: uses default session_name (PHPSESSID)`);
  }
});
