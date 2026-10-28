import fs from 'fs';

let t = fs.readFileSync('scripts/test-p0-final-safety-lock.mjs', 'utf8');
t = t.replace(
  `maintenanceKey: 'NSR_SPECIAL_MAINTENANCE_KEY_2026',`,
  `maintenanceKey: 'NSR2026',`
);
fs.writeFileSync('scripts/test-p0-final-safety-lock.mjs', t, 'utf8');
console.log('✔ maintenanceKey updated in test script');
