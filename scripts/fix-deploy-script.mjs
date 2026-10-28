// scripts/fix-deploy-script.mjs
import fs from 'fs';

const p = 'scripts/deploy-integrated-gas.mjs';
let content = fs.readFileSync(p, 'utf8');

// Replace the problematic lines
const target = `  // Hapus doGet dan doPost dari JobTracking agar tidak bentrok dengan Kode.gs
  // Kita hilangkan deklarasi doGet dan doPost dari file JobTracking
  trackingSource = trackingSource.replace(
    /\\/\\*\\*[\\s\\S]*?Entry Point HTTP GET[\\s\\S]*?function doGet\\(e\\) \\{[\\s\\S]*?\\n\\}\\n/,
    '// doGet dipusatkan di Kode.gs\\n'
  );
  trackingSource = trackingSource.replace(
    /\\/\\*\\*[\\s\\S]*?Entry Point HTTP POST[\\s\\S]*?function doPost\\(e\\) \\{[\\s\\S]*?\\n\\}\\n/,
    '// doPost dipusatkan di Kode.gs\\n'
  );`;

const replacement = `  // Hindari bentrok doGet dan doPost dengan Kode.gs
  trackingSource = trackingSource.replace(/function doGet\\(e\\)/g, 'function trackingDoGet_(e)');
  trackingSource = trackingSource.replace(/function doPost\\(e\\)/g, 'function trackingDoPost_(e)');`;

content = content.replace(/\r\n/g, '\n');
content = content.replace(target, replacement);

fs.writeFileSync(p, content, 'utf8');
console.log('scripts/deploy-integrated-gas.mjs successfully updated!');
