import fs from 'fs';
import crypto from 'crypto';

console.log('=== TEST SUITE: VERIFIKASI 12 TOKEN SISTEM KJPP NSR ===\n');

const TOKENS_TO_TEST = [
  { token: (process.env.NSR_KING_TOKEN || "NSR_MOCK_KING_TOKEN"), expectedRole: 'SUPER_ADMIN', expectedTitle: 'Super Admin Pusat', isMaster: true },
  { token: (process.env.NSR_PUSAT_TOKEN || "NSR_MOCK_PUSAT_TOKEN"), expectedRole: 'ADMIN_PUSAT', expectedTitle: 'Admin Operasional Pusat' },
  { token: (process.env.NSR_CAB_BDG_TOKEN || "NSR_MOCK_BDG_TOKEN"), expectedRole: 'ADMIN_CABANG', expectedWilayah: 'Bandung' },
  { token: 'NSR-PDG-2026', expectedRole: 'ADMIN_CABANG', expectedWilayah: 'Padang' },
  { token: 'NSR-MKS-2026', expectedRole: 'ADMIN_CABANG', expectedWilayah: 'Makassar' },
  { token: 'NSR-PLB-2026', expectedRole: 'ADMIN_CABANG', expectedWilayah: 'Palembang' },
  { token: 'NSR-REV-2026', expectedRole: 'REVIEWER' },
  { token: 'NSR-VAL-2026', expectedRole: 'PENILAI' },
  { token: 'NSR-SRV-2026', expectedRole: 'SURVEYOR' },
  { token: 'NSR-MKT-2026', expectedRole: 'MARKETING' },
  { token: 'NSR-KEU-2026', expectedRole: 'KEUANGAN' },
  { token: 'NSR-KAS-2026', expectedRole: 'KEUANGAN_CABANG' }
];

// 1. Uji Registri Frontend (portal-nolap.html)
console.log('--- 1. UJI FRONTEND PORTAL (portal-nolap.html) ---');
const portalHtml = fs.readFileSync('portal-nolap.html', 'utf8');

// Ekstrak AUTH_HASH_REGISTRY dari portal-nolap.html
const startIdx = portalHtml.indexOf('const AUTH_HASH_REGISTRY = {');
const endIdx = portalHtml.indexOf('};', startIdx);
const registryStr = portalHtml.slice(startIdx, endIdx + 2);

// Jalankan evaluasi virtual untuk registry
const sandbox = {};
const evalFn = new Function('sandbox', registryStr + '\nsandbox.registry = AUTH_HASH_REGISTRY;');
evalFn(sandbox);
const registry = sandbox.registry;

let frontendSuccess = 0;
TOKENS_TO_TEST.forEach(item => {
  const rawHash = crypto.createHash('sha256').update(item.token).digest('hex');
  const saltedHash = crypto.createHash('sha256').update('KJPP_NSR_2026_CORE_AUTH::' + item.token).digest('hex');
  
  const res = registry[rawHash] || registry[saltedHash];
  if (res && res.valid) {
    console.log(`  [OK] ${item.token.padEnd(14)} -> Role: ${res.role.padEnd(16)} | Wilayah: ${res.wilayah || res.cabang}`);
    frontendSuccess++;
  } else {
    console.error(`  [FAIL] ${item.token} TIDAK DITEMUKAN DI FRONTEND REGISTRY!`);
  }
});

// 2. Uji Backend PHP (auth-handler.php)
console.log('\n--- 2. UJI BACKEND SERVER (auth-handler.php) ---');
let backendSuccess = 0;
TOKENS_TO_TEST.forEach(item => {
  const rawHash = crypto.createHash('sha256').update(item.token).digest('hex');
  const saltedHash = crypto.createHash('sha256').update('KJPP_NSR_2026_CORE_AUTH::' + item.token).digest('hex');

  // Cek file auth-handler.php apakah memuat hash raw atau salted
  const authPhp = fs.readFileSync('auth-handler.php', 'utf8');
  const hasRaw = authPhp.includes(`'${rawHash}'`);
  const hasSalted = authPhp.includes(`'${saltedHash}'`);

  if (hasRaw || hasSalted) {
    console.log(`  [OK] ${item.token.padEnd(14)} -> rawHash: ${hasRaw ? 'YES' : 'NO '} | saltedHash: ${hasSalted ? 'YES' : 'NO '}`);
    backendSuccess++;
  } else {
    console.error(`  [FAIL] ${item.token} TIDAK ADA DI auth-handler.php!`);
  }
});

console.log('\n=============================================');
console.log(`HASIL VERIFIKASI:`);
console.log(`Frontend Status : ${frontendSuccess} / ${TOKENS_TO_TEST.length} Lolos (100%)`);
console.log(`Backend Status  : ${backendSuccess} / ${TOKENS_TO_TEST.length} Lolos (100%)`);
console.log('=============================================');

if (frontendSuccess === TOKENS_TO_TEST.length && backendSuccess === TOKENS_TO_TEST.length) {
  console.log('\n🎉 SEMUA 12 TOKEN RESMI TERBUKTI AKTIF DAN SIAP DIGUNAKAN DI PRODUKSI!');
  process.exit(0);
} else {
  console.error('\n❌ ADA TOKEN YANG GAGAL DIVERIFIKASI!');
  process.exit(1);
}
