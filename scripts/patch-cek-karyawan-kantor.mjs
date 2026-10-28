import fs from 'fs';
let c = fs.readFileSync('absensi-data-handler.php', 'utf8').replace(/\r\n/g, '\n');
const target = `'cabang' => $found['cabang'] ?? 'Pusat Jakarta',`;
const replacement = `'cabang' => $found['cabang'] ?? 'Pusat Jakarta',\n            'kantor' => $found['kantor'] ?? $found['cabang'] ?? 'Pusat Jakarta',`;
if (c.includes(target)) {
  c = c.replace(target, replacement);
  fs.writeFileSync('absensi-data-handler.php', c.replace(/\n/g, '\r\n'), 'utf8');
  console.log('✓ Added kantor field to cekKaryawan response');
} else {
  console.log('Target not found in absensi-data-handler.php');
}
