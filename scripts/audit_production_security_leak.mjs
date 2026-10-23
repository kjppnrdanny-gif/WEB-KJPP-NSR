import fs from 'node:fs';
import path from 'node:path';

const files = fs.readdirSync('.').filter(f => f.endsWith('.html') || (f.endsWith('.js') && !f.includes('node_modules')));

console.log('Auditing frontend HTML & JS files for raw credentials...');
const patterns = [
  { name: 'SUPER_ADMIN_RAW_KEY', regex: /NSR8899/ },
  { name: 'MAINTENANCE_RAW_KEY', regex: /NSR2026/ },
  { name: 'HARDCODED_AUTH_TOKEN_KEY', regex: /NSR_AUTH_TOKEN/ },
  { name: 'HARDCODED_OVERRIDE_KEY', regex: /X-NSR-Override-Key['"]?\s*:\s*['"][a-zA-Z0-9]+['"]/ }
];

let leakCount = 0;
for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  for (const pat of patterns) {
    if (pat.regex.test(content)) {
      console.log(`⚠️ Match in ${file}: ${pat.name}`);
      leakCount++;
    }
  }
}

// Also check lib/
if (fs.existsSync('lib')) {
  for (const f of fs.readdirSync('lib')) {
    const full = path.join('lib', f);
    if (fs.statSync(full).isFile()) {
      const content = fs.readFileSync(full, 'utf8');
      for (const pat of patterns) {
        if (pat.regex.test(content)) {
          console.log(`⚠️ Match in ${full}: ${pat.name}`);
          leakCount++;
        }
      }
    }
  }
}

if (leakCount === 0) {
  console.log('✅ ZERO credential leaks found in frontend HTML & JS files.');
} else {
  console.log(`⚠️ Found ${leakCount} matches to inspect.`);
}
