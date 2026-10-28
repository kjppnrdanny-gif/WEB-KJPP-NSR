import fs from 'fs';

let content = fs.readFileSync('scripts/test-all-12-tokens.mjs', 'utf8');
content = content.replace(
  "{ token: (process.env.NSR_PUSAT_TOKEN || "NSR_MOCK_PUSAT_TOKEN"), expectedRole: 'SUPER_ADMIN', expectedTitle: 'Admin Operasional Pusat' }",
  "{ token: (process.env.NSR_PUSAT_TOKEN || "NSR_MOCK_PUSAT_TOKEN"), expectedRole: 'ADMIN_PUSAT', expectedTitle: 'Admin Operasional Pusat' }"
);
fs.writeFileSync('scripts/test-all-12-tokens.mjs', content, 'utf8');
console.log('✓ test-all-12-tokens.mjs updated');
