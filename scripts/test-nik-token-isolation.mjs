import fs from 'fs';

const data = JSON.parse(fs.readFileSync('data/.master_karyawan_cache.json', 'utf8'));
const nikList = data.roster.map(r => r.nik);

const tokenList = [
  'NSR8899', 'NSR2026', 'NSR-PST-2026', 'NSR-BDG-2026', 'NSR-PDG-2026', 'NSR-MKS-2026', 'NSR-PLB-2026', 'NSR-KEU-2026', 'NSR-ADM-2026',
  'TOKEN CABANG MAKASSAR', 'TOKEN CABANG BANDUNG', 'TOKEN CABANG PADANG', 'TOKEN CABANG PALEMBANG',
  'TOKEN ADMIN PUSAT', 'TOKEN MANAJEMEN'
];

const regexStrictNIK = /^NSR(-\w+)?-\d{4}-\d{2,3}$/i;

console.log('--- 1. Testing all 48 employee NIKs against regexStrictNIK ---');
let allNiksMatched = true;
for (const nik of nikList) {
  if (!regexStrictNIK.test(nik)) {
    console.log('FAIL:', nik, 'did not match regex!');
    allNiksMatched = false;
  }
}
if (allNiksMatched) console.log('✓ All 48 employee NIKs matched regexStrictNIK 100%!');

console.log('\n--- 2. Testing tokens against regexStrictNIK ---');
let anyTokenMatched = false;
for (const tok of tokenList) {
  if (regexStrictNIK.test(tok)) {
    console.log('ERROR: Token matched NIK regex:', tok);
    anyTokenMatched = true;
  }
}
if (!anyTokenMatched) console.log('✓ Zero tokens matched NIK regex (100% isolated)!');
