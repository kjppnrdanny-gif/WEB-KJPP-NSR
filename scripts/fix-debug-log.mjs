import fs from 'fs';

let content = fs.readFileSync('scripts/test-nolap-approval-smart-register.mjs', 'utf8');

// Replace Tahap 1 evaluate expression
content = content.replace(
  "console.log('Sesi Admin Pusat:', authPst);",
  "console.log('authPstRes raw:', JSON.stringify(authPstRes)); console.log('Sesi Admin Pusat:', authPst);"
);

fs.writeFileSync('scripts/test-nolap-approval-smart-register.mjs', content, 'utf8');
