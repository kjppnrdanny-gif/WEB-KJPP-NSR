import fs from 'fs';

const path = 'absensi-data-handler.php';
let content = fs.readFileSync(path, 'utf8').replace(/\r\n/g, '\n');

const oldTarget = `        foreach ($db['master_karyawan'] as $k) {
            if (($k['cabang'] ?? '') === 'Pusat Jakarta' && strtoupper($k['status'] ?? '') === 'AKTIF') {
                $karyawanPusat[] = $k;
                $masterLookup[normalisasiNIK($k['nik'])] = $k;
            }
        }`;

const newTarget = `        foreach ($db['master_karyawan'] as $k) {
            if (strtoupper($k['status'] ?? '') === 'AKTIF') {
                $karyawanPusat[] = $k;
                $masterLookup[normalisasiNIK($k['nik'])] = $k;
            }
        }`;

if (!content.includes(oldTarget)) {
  console.error('Target not found!');
  process.exit(1);
}

content = content.replace(oldTarget, newTarget);
fs.writeFileSync(path, content.replace(/\n/g, '\r\n'), 'utf8');
console.log('✓ absensi-data-handler.php patched to include all active employees in dashboard!');
