import crypto from 'crypto';

const targetHash = '34e689e4b4b12f107e810fd8f48f8a4677e1a1645f0dd4232a9240fecc2d10c2';
const targetHash2 = 'c8a385e623ccc15d78c5c7d3632f07f089a873de23b1098cbafb2c21415f2b91';
const targetHash3 = '47e9420b3a60a28be92802a6b88515da8f3fdaa624a86a9d9e57d60b859ab7c0';

const tokens = ['NSR8899', 'NSR-PUSAT-2026', 'PUSAT2026', 'ADMIN_PUSAT', 'NSR2026', 'SUPERADMIN', 'NSR-2019-005', 'NSR-KING-2026', 'KJPP-NSR-2026', 'ADMIN', 'PUSAT', 'NSR8888', 'NSR9999', 'NSR_PUSAT_2026', 'NSR-ADMIN-2026', 'NSR-ADM-PST-2026'];

for (const t of tokens) {
  const h = crypto.createHash('sha256').update(t).digest('hex');
  if (h === targetHash || h === targetHash2 || h === targetHash3) {
    console.log('MATCH FOUND:', t, '->', h);
  }
}
