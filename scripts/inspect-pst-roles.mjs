import fs from 'node:fs';

const html = fs.readFileSync('portal-kwitansi.html', 'utf8');
const regex = /'([a-f0-9]{64})':\s*(\{[^}]+\})/g;
let m;
while ((m = regex.exec(html)) !== null) {
  try {
    const obj = JSON.parse(m[2]);
    if (obj.wilayahCode === 'PST' || (obj.wilayah && obj.wilayah.toLowerCase().includes('pusat'))) {
      const isPusatKeuangan = Boolean(obj.isSuperAdmin) || obj.role === 'ADMIN_PUSAT' || obj.role === 'SUPER ADMIN' || obj.role === 'SUPER_ADMIN' || obj.role === 'KEUANGAN';
      console.log(`Hash: ${m[1].slice(0, 8)}... | Role: ${obj.role} | isPusatKeuangan: ${isPusatKeuangan} | Label: ${obj.roleLabel || obj.label}`);
    }
  } catch (e) {}
}
