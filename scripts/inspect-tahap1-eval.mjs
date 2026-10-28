import fs from 'fs';

const content = fs.readFileSync('scripts/test-nolap-approval-smart-register.mjs', 'utf8');
const idx = content.indexOf('TAHAP 1: AUDIT RBAC');
console.log(content.slice(idx, idx + 1000));
