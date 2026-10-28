import fs from 'fs';
import vm from 'vm';

const filePath = 'portal-nolap-dev.html';
let content = fs.readFileSync(filePath, 'utf8');

// Remove duplicate bridgeJs if present
const jsMarker = '// ==========================================================\n    // AUTO-POPULATE BRIDGE: TARIK DATA DARI DB PENUGASAN (SPK / LINGKUP PENUGASAN)';
const jsMarkerCrlf = '// ==========================================================\r\n    // AUTO-POPULATE BRIDGE: TARIK DATA DARI DB PENUGASAN (SPK / LINGKUP PENUGASAN)';

const firstIdx = content.indexOf('AUTO-POPULATE BRIDGE: TARIK DATA DARI DB PENUGASAN');
if (firstIdx !== -1) {
  const secondIdx = content.indexOf('AUTO-POPULATE BRIDGE: TARIK DATA DARI DB PENUGASAN', firstIdx + 50);
  if (secondIdx !== -1) {
    const cutStart = content.lastIndexOf('// =====', secondIdx);
    const cutEnd = content.indexOf('</script>', secondIdx);
    content = content.slice(0, cutStart) + content.slice(cutEnd);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Removed duplicate bridge in portal-nolap-dev.html');
  }
}

// Verify syntax
const html = fs.readFileSync(filePath, 'utf8');
const scriptMatches = [...html.matchAll(/<script(?:\s+[^>]*)?>([\s\S]*?)<\/script>/gi)];
scriptMatches.forEach((m, idx) => {
  const code = m[1];
  if (!code.trim()) return;
  new vm.Script(code);
  console.log(`portal-nolap-dev.html script block ${idx + 1} valid!`);
});
