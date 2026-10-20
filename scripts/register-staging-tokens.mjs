import fs from 'node:fs';
import path from 'node:path';

const ROOT_DIR = process.cwd();

// Mapping Token Baru Staging
const STAGING_TOKENS_DEF = `
    // =============================================================
    // TOKENS DEMO STAGING BARU (ISOLASI PREVIEW)
    // =============================================================
    '16f051a1bb53eb07ba314e472103186abcbe945520af2028688be64eb4fea42a' => [ // NSR-STAGE-MASTER-77
        'sub'               => 'admin_master',
        'branch'            => 'PUSAT',
        'displayName'       => 'Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)',
        'role'              => 'SUPER ADMIN',
        'roleLabel'         => 'Pemimpin Rekan & Super Admin Master',
        'title'             => 'Super Admin Pusat',
        'wilayah'           => 'PUSAT',
        'wilayahLabel'      => 'Kantor Pusat Jakarta',
        'wilayahCode'       => '00',
        'isSuperAdmin'      => true,
        'isMaster'          => true,
        'isCabang'          => false,
        'canApprove'        => true,
        'canAccessKwitansi' => true,
        'seeFee'            => true,
        'mode'              => 'PUSAT',
        'tokenHash'         => '16f051a1bb53eb07ba314e472103186abcbe945520af2028688be64eb4fea42a'
    ],
    '1be766a50d815d7334e8e3fa45ad415d2a408f37a2dc3a9ef66bb0157eaad4d8' => [ // NSR-STAGE-PR-55
        'sub'               => 'partner_nanang',
        'branch'            => 'PUSAT',
        'displayName'       => 'Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)',
        'role'              => 'PEMIMPIN_REKAN',
        'roleLabel'         => 'Pemimpin Rekan (Penanggung Jawab)',
        'title'             => 'Pemimpin Rekan',
        'wilayah'           => 'PUSAT',
        'wilayahLabel'      => 'Kantor Pusat Jakarta',
        'wilayahCode'       => '00',
        'isSuperAdmin'      => true,
        'isMaster'          => true,
        'isCabang'          => false,
        'canApprove'        => true,
        'canAccessKwitansi' => true,
        'seeFee'            => true,
        'mode'              => 'PUSAT',
        'tokenHash'         => '1be766a50d815d7334e8e3fa45ad415d2a408f37a2dc3a9ef66bb0157eaad4d8'
    ],
    '15a002e04ebcc16e23dc324af0e0cd5d85fec1eb83cf72f51834e930215d3d10' => [ // NSR-STAGE-REK-22
        'sub'               => 'rekan_deni',
        'branch'            => 'PUSAT',
        'displayName'       => 'Deni Siswandi, S.T.',
        'role'              => 'REKAN',
        'roleLabel'         => 'Rekan (Mengetahui)',
        'title'             => 'Rekan Penilai',
        'wilayah'           => 'PUSAT',
        'wilayahLabel'      => 'Kantor Pusat Jakarta',
        'wilayahCode'       => '00',
        'isSuperAdmin'      => false,
        'isMaster'          => false,
        'isCabang'          => false,
        'canApprove'        => true,
        'canAccessKwitansi' => true,
        'seeFee'            => true,
        'mode'              => 'PUSAT',
        'tokenHash'         => '15a002e04ebcc16e23dc324af0e0cd5d85fec1eb83cf72f51834e930215d3d10'
    ],
    'd2440f745fd849aac4d73dde24c27a7cefcd85ae9e09611dafaa952bf09000ea' => [ // NSR-STAGE-ADM-33
        'sub'               => 'admin_danny',
        'branch'            => 'PUSAT',
        'displayName'       => 'Danny Taufik Hidayat, S.H.',
        'role'              => 'ADMIN_PUSAT',
        'roleLabel'         => 'Verifikasi Administrasi & Legal',
        'title'             => 'Verifikasi Administrasi',
        'wilayah'           => 'PUSAT',
        'wilayahLabel'      => 'Kantor Pusat Jakarta',
        'wilayahCode'       => '00',
        'isSuperAdmin'      => false,
        'isMaster'          => false,
        'isCabang'          => false,
        'canApprove'        => true,
        'canAccessKwitansi' => true,
        'seeFee'            => true,
        'mode'              => 'PUSAT',
        'tokenHash'         => 'd2440f745fd849aac4d73dde24c27a7cefcd85ae9e09611dafaa952bf09000ea'
    ],
    'fc6ce762316126e791fa636c7b962f45cbd5efdd76839374a3fa4f825767e9e7' => [ // NSR-STAGE-KEU-44
        'sub'               => 'keuangan_milda',
        'branch'            => 'PUSAT',
        'displayName'       => 'Milda H',
        'role'              => 'KEUANGAN',
        'roleLabel'         => 'Divisi Keuangan & Anggaran (Menyetujui)',
        'title'             => 'Divisi Keuangan Pusat',
        'wilayah'           => 'PUSAT',
        'wilayahLabel'      => 'Kantor Pusat Jakarta',
        'wilayahCode'       => '00',
        'isSuperAdmin'      => false,
        'isMaster'          => false,
        'isCabang'          => false,
        'canApprove'        => true,
        'canAccessKwitansi' => true,
        'seeFee'            => true,
        'mode'              => 'PUSAT',
        'tokenHash'         => 'fc6ce762316126e791fa636c7b962f45cbd5efdd76839374a3fa4f825767e9e7'
    ],
    'bd2866b4f8734fe13d5a7ae57e847de7bcb3a19d585ff928f70ea6cc0c81f07f' => [ // NSR-STAGE-SRV-11
        'sub'               => 'surveyor_holik',
        'branch'            => 'PUSAT',
        'displayName'       => 'Holik Kelana',
        'role'              => 'SURVEYOR',
        'roleLabel'         => 'Surveyor Lapangan (Yang Mengajukan)',
        'title'             => 'Surveyor Lapangan',
        'wilayah'           => 'PUSAT',
        'wilayahLabel'      => 'Kantor Pusat Jakarta',
        'wilayahCode'       => '00',
        'isSuperAdmin'      => false,
        'isMaster'          => false,
        'isCabang'          => false,
        'canApprove'        => true,
        'canAccessKwitansi' => false,
        'seeFee'            => false,
        'mode'              => 'PUSAT',
        'tokenHash'         => 'bd2866b4f8734fe13d5a7ae57e847de7bcb3a19d585ff928f70ea6cc0c81f07f'
    ],
    '94a006da9c2e0ba0768fc37d6e17c96c718fe47c4119b7bb0b717d8a57b692ce' => [ // NSR-STAGE-PLB-03
        'sub'               => 'cabang_plb',
        'branch'            => 'Palembang',
        'displayName'       => 'Kantor Cabang Palembang',
        'role'              => 'ADMIN_CABANG',
        'roleLabel'         => 'Admin Cabang Palembang',
        'title'             => 'Admin Cabang Palembang',
        'wilayah'           => 'Palembang',
        'wilayahLabel'      => 'Kantor Cabang Palembang',
        'wilayahCode'       => '03',
        'isSuperAdmin'      => false,
        'isCabang'          => true,
        'canApprove'        => true,
        'canAccessKwitansi' => true,
        'seeFee'            => true,
        'mode'              => 'CABANG',
        'kodeKemenkeu'      => '2.19.0160-03',
        'tokenHash'         => '94a006da9c2e0ba0768fc37d6e17c96c718fe47c4119b7bb0b717d8a57b692ce'
    ],
    '291e2e008eccedbb76fa1e55534fb2bd7e96f56e4e47b2e615e7f88a734ac1ff' => [ // NSR-STAGE-MKS-02
        'sub'               => 'cabang_mks',
        'branch'            => 'Makassar',
        'displayName'       => 'Kantor Cabang Makassar',
        'role'              => 'ADMIN_CABANG',
        'roleLabel'         => 'Admin Cabang Makassar',
        'title'             => 'Admin Cabang Makassar',
        'wilayah'           => 'Makassar',
        'wilayahLabel'      => 'Kantor Cabang Makassar',
        'wilayahCode'       => '02',
        'isSuperAdmin'      => false,
        'isCabang'          => true,
        'canApprove'        => true,
        'canAccessKwitansi' => true,
        'seeFee'            => true,
        'mode'              => 'CABANG',
        'kodeKemenkeu'      => '2.19.0160-02',
        'tokenHash'         => '291e2e008eccedbb76fa1e55534fb2bd7e96f56e4e47b2e615e7f88a734ac1ff'
    ],
    'a3eafd84b50efa1b7992bf278ef1621fa9bea60eadcb67edff62a6b92387633b' => [ // NSR-STAGE-PDG-01
        'sub'               => 'cabang_pdg',
        'branch'            => 'Padang',
        'displayName'       => 'Kantor Cabang Padang',
        'role'              => 'ADMIN_CABANG',
        'roleLabel'         => 'Admin Cabang Padang',
        'title'             => 'Admin Cabang Padang',
        'wilayah'           => 'Padang',
        'wilayahLabel'      => 'Kantor Cabang Padang',
        'wilayahCode'       => '01',
        'isSuperAdmin'      => false,
        'isCabang'          => true,
        'canApprove'        => true,
        'canAccessKwitansi' => true,
        'seeFee'            => true,
        'mode'              => 'CABANG',
        'kodeKemenkeu'      => '2.19.0160-01',
        'tokenHash'         => 'a3eafd84b50efa1b7992bf278ef1621fa9bea60eadcb67edff62a6b92387633b'
    ],
    '316c8000130d7798e0dff3cfc7053d661616598a7121d679f75a8d4d3d43625b' => [ // NSR-STAGE-BDG-04
        'sub'               => 'cabang_bdg',
        'branch'            => 'Bandung',
        'displayName'       => 'Kantor Cabang Bandung',
        'role'              => 'ADMIN_CABANG',
        'roleLabel'         => 'Admin Cabang Bandung',
        'title'             => 'Admin Cabang Bandung',
        'wilayah'           => 'Bandung',
        'wilayahLabel'      => 'Kantor Cabang Bandung',
        'wilayahCode'       => '04',
        'isSuperAdmin'      => false,
        'isCabang'          => true,
        'canApprove'        => true,
        'canAccessKwitansi' => true,
        'seeFee'            => true,
        'mode'              => 'CABANG',
        'kodeKemenkeu'      => '2.19.0160-04',
        'tokenHash'         => '316c8000130d7798e0dff3cfc7053d661616598a7121d679f75a8d4d3d43625b'
    ],
`;

// 1. Inject ke operasional-data-handler.php
const oprPath = path.join(ROOT_DIR, 'operasional-data-handler.php');
let oprContent = fs.readFileSync(oprPath, 'utf8');
if (!oprContent.includes('NSR-STAGE-MASTER-77')) {
  oprContent = oprContent.replace(
    '$OFFICIAL_TOKEN_HASHES = [',
    '$OFFICIAL_TOKEN_HASHES = [' + STAGING_TOKENS_DEF
  );
  fs.writeFileSync(oprPath, oprContent, 'utf8');
  console.log('✓ operasional-data-handler.php diperbarui dengan token staging baru!');
} else {
  console.log('ℹ operasional-data-handler.php sudah memuat token staging.');
}

// 2. Inject ke auth-handler.php
const authPath = path.join(ROOT_DIR, 'auth-handler.php');
let authContent = fs.readFileSync(authPath, 'utf8');
if (!authContent.includes('NSR-STAGE-MASTER-77')) {
  authContent = authContent.replace(
    '$OFFICIAL_TOKEN_HASHES = [',
    '$OFFICIAL_TOKEN_HASHES = [' + STAGING_TOKENS_DEF
  );
  fs.writeFileSync(authPath, authContent, 'utf8');
  console.log('✓ auth-handler.php diperbarui dengan token staging baru!');
} else {
  console.log('ℹ auth-handler.php sudah memuat token staging.');
}

// 3. Update portal-kwitansi.html (PIN & token mapping)
const kwitansiPath = path.join(ROOT_DIR, 'portal-kwitansi.html');
let kwitansiContent = fs.readFileSync(kwitansiPath, 'utf8');

// A. Ganti PIN Finance Cabang menjadi 9926
kwitansiContent = kwitansiContent.replace(
  /const PIN_FINANCE_CABANG = \{[\s\S]*?\};/,
  `const PIN_FINANCE_CABANG = {
      'Bandung': '9926',
      'Padang': '9926',
      'Makassar': '9926',
      'Palembang': '9926'
    };`
);

// B. Tambahkan mapping token staging ke AUTH_HASH_REGISTRY
const STAGING_KW_HASHES = `
      // Staging Demo Tokens
      '16f051a1bb53eb07ba314e472103186abcbe945520af2028688be64eb4fea42a': {"valid":true,"role":"SUPER ADMIN","roleLabel":"SUPER ADMIN • KANTOR PUSAT","wilayah":"PUSAT","wilayahLabel":"Kantor Pusat Jakarta","wilayahCode":"PST","cabang":"Pusat","isCabang":false,"isSuperAdmin":true,"canAccessKwitansi":true,"seeFee":true,"canApprove":true,"canApprovePusat":true,"canApproveCabang":true,"canSubmit":true,"canInputForm":true,"tokenHash":"16f051a1bb53eb07ba314e472103186abcbe945520af2028688be64eb4fea42a"},
      '1be766a50d815d7334e8e3fa45ad415d2a408f37a2dc3a9ef66bb0157eaad4d8': {"valid":true,"role":"SUPER ADMIN","roleLabel":"Pemimpin Rekan (Ir. Nanang Rahayu)","wilayah":"PUSAT","wilayahLabel":"Kantor Pusat Jakarta","wilayahCode":"PST","cabang":"Pusat","isCabang":false,"isSuperAdmin":true,"canAccessKwitansi":true,"seeFee":true,"canApprove":true,"canApprovePusat":true,"canApproveCabang":true,"canSubmit":true,"canInputForm":true,"tokenHash":"1be766a50d815d7334e8e3fa45ad415d2a408f37a2dc3a9ef66bb0157eaad4d8"},
      '15a002e04ebcc16e23dc324af0e0cd5d85fec1eb83cf72f51834e930215d3d10': {"valid":true,"role":"SUPER ADMIN","roleLabel":"Rekan Pengesah (Deni Siswandi, S.T.)","wilayah":"PUSAT","wilayahLabel":"Kantor Pusat Jakarta","wilayahCode":"PST","cabang":"Pusat","isCabang":false,"isSuperAdmin":true,"canAccessKwitansi":true,"seeFee":true,"canApprove":true,"canApprovePusat":true,"canApproveCabang":true,"canSubmit":true,"canInputForm":true,"tokenHash":"15a002e04ebcc16e23dc324af0e0cd5d85fec1eb83cf72f51834e930215d3d10"},
      'fc6ce762316126e791fa636c7b962f45cbd5efdd76839374a3fa4f825767e9e7': {"valid":true,"role":"KEUANGAN","roleLabel":"Keuangan Pusat (Milda H)","wilayah":"PUSAT","wilayahLabel":"Kantor Pusat Jakarta","wilayahCode":"PST","cabang":"Pusat","isCabang":false,"isSuperAdmin":false,"canAccessKwitansi":true,"seeFee":true,"canApprove":false,"canSubmit":true,"canInputForm":true,"tokenHash":"fc6ce762316126e791fa636c7b962f45cbd5efdd76839374a3fa4f825767e9e7"},
      '94a006da9c2e0ba0768fc37d6e17c96c718fe47c4119b7bb0b717d8a57b692ce': {"valid":true,"role":"ADMIN_CABANG","roleLabel":"Admin Cabang Palembang","wilayah":"Palembang","wilayahLabel":"Kantor Cabang Palembang","wilayahCode":"PLB","cabang":"Palembang","isCabang":true,"isSuperAdmin":false,"canAccessKwitansi":true,"seeFee":true,"canApprove":false,"canApproveCabang":true,"canSubmit":true,"canInputForm":true,"lockWilayah":true,"tokenHash":"94a006da9c2e0ba0768fc37d6e17c96c718fe47c4119b7bb0b717d8a57b692ce"},
      '291e2e008eccedbb76fa1e55534fb2bd7e96f56e4e47b2e615e7f88a734ac1ff': {"valid":true,"role":"ADMIN_CABANG","roleLabel":"Admin Cabang Makassar","wilayah":"Makassar","wilayahLabel":"Kantor Cabang Makassar","wilayahCode":"MKS","cabang":"Makassar","isCabang":true,"isSuperAdmin":false,"canAccessKwitansi":true,"seeFee":true,"canApprove":false,"canApproveCabang":true,"canSubmit":true,"canInputForm":true,"lockWilayah":true,"tokenHash":"291e2e008eccedbb76fa1e55534fb2bd7e96f56e4e47b2e615e7f88a734ac1ff"},
      'a3eafd84b50efa1b7992bf278ef1621fa9bea60eadcb67edff62a6b92387633b': {"valid":true,"role":"ADMIN_CABANG","roleLabel":"Admin Cabang Padang","wilayah":"Padang","wilayahLabel":"Kantor Cabang Padang","wilayahCode":"PDG","cabang":"Padang","isCabang":true,"isSuperAdmin":false,"canAccessKwitansi":true,"seeFee":true,"canApprove":false,"canApproveCabang":true,"canSubmit":true,"canInputForm":true,"lockWilayah":true,"tokenHash":"a3eafd84b50efa1b7992bf278ef1621fa9bea60eadcb67edff62a6b92387633b"},
      '316c8000130d7798e0dff3cfc7053d661616598a7121d679f75a8d4d3d43625b': {"valid":true,"role":"ADMIN_CABANG","roleLabel":"Admin Cabang Bandung","wilayah":"Bandung","wilayahLabel":"Kantor Cabang Bandung","wilayahCode":"BDG","cabang":"Bandung","isCabang":true,"isSuperAdmin":false,"canAccessKwitansi":true,"seeFee":true,"canApprove":false,"canApproveCabang":true,"canSubmit":true,"canInputForm":true,"lockWilayah":true,"tokenHash":"316c8000130d7798e0dff3cfc7053d661616598a7121d679f75a8d4d3d43625b"},
`;

if (!kwitansiContent.includes('16f051a1bb53eb07ba314e472103186abcbe945520af2028688be64eb4fea42a')) {
  kwitansiContent = kwitansiContent.replace(
    'const AUTH_HASH_REGISTRY = {',
    'const AUTH_HASH_REGISTRY = {' + STAGING_KW_HASHES
  );
}

// C. Isolasi API Prefix agar mendukung /staging/
kwitansiContent = kwitansiContent.replaceAll("'/api/", "((window.location.pathname.includes('/staging') ? '/staging/api/' : '/api/')) + '");
kwitansiContent = kwitansiContent.replaceAll("((window.location.pathname.includes('/staging') ? '/staging/api/' : '/api/')) + '", "((window.location.pathname.includes('/staging') ? '/staging/api/' : '/api/')) + '");

fs.writeFileSync(kwitansiPath, kwitansiContent, 'utf8');
console.log('✓ portal-kwitansi.html diperbarui dengan PIN baru 9926 dan token staging!');
