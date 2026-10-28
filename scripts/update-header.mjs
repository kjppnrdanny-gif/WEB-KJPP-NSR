import fs from 'fs';

let t = fs.readFileSync('scripts/test-p0-final-safety-lock.mjs', 'utf8');
t = t.replace(
  `'X-NSR-MAINTENANCE_KEY': 'c8a385e623ccc15d78c5c7d3632f07f089a873de23b1098cbafb2c21415f2b91'`,
  `'X-NSR-MAINTENANCE_KEY': 'NSR2026'`
);
fs.writeFileSync('scripts/test-p0-final-safety-lock.mjs', t, 'utf8');
console.log('✔ header updated in test script');
