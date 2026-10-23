import fs from 'fs';
const file = '.github/workflows/deploy-cpanel.yml';
let c = fs.readFileSync(file, 'utf8');

c = c.replace(
  "- name: 📥 Cadangkan public_html/index.html langsung dari Filesystem cPanel via FTPS\n        env:",
  "- name: 📥 Cadangkan public_html/index.html langsung dari Filesystem cPanel via FTPS\n        continue-on-error: true\n        env:"
);
c = c.replace(
  "- name: 📥 Cadangkan public_html/index.html langsung dari Filesystem cPanel via FTPS\r\n        env:",
  "- name: 📥 Cadangkan public_html/index.html langsung dari Filesystem cPanel via FTPS\r\n        continue-on-error: true\r\n        env:"
);

c = c.replace(
  "- name: 💾 Upload Backup Filesystem cPanel ke Artifacts\n        uses:",
  "- name: 💾 Upload Backup Filesystem cPanel ke Artifacts\n        continue-on-error: true\n        uses:"
);
c = c.replace(
  "- name: 💾 Upload Backup Filesystem cPanel ke Artifacts\r\n        uses:",
  "- name: 💾 Upload Backup Filesystem cPanel ke Artifacts\r\n        continue-on-error: true\r\n        uses:"
);

fs.writeFileSync(file, c, 'utf8');
console.log('Patch deploy-cpanel.yml completed!');
