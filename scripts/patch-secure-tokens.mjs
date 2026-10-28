import fs from 'node:fs';

// 1. Patch operasional-data-handler.php
const oprPath = 'd:/WEB KJPP NSR_Compro new ver/kjpp-nsr-netlify-production/operasional-data-handler.php';
let opr = fs.readFileSync(oprPath, 'utf8');

const targetOpr = `    // 2. KEPALA KEUANGAN & PEMIMPIN REKAN (Ir. Nanang Rahayu, M.Ec.Dev. - [REDACTED_SUPER_ADMIN_TOKEN])
    '47e9420b3a60a28be92802a6b88515da8f3fdaa624a86a9d9e57d60b859ab7c0' => [ // [REDACTED_SUPER_ADMIN_TOKEN] (Raw SHA-256)
        'sub'               => 'kepala_keuangan',
        'branch'            => 'PUSAT',
        'displayName'       => 'Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)',
        'role'              => 'KEPALA_KEUANGAN',
        'roleLabel'         => 'Kepala Keuangan & Pemimpin Rekan (Tingkat 3)',
        'title'             => 'Kepala Keuangan',
        'wilayah'           => 'PUSAT',
        'wilayahCode'       => '00',
        'isSuperAdmin'      => true,
        'isMaster'          => true,
        'isCabang'          => false,
        'canApprove'        => true,
        'permissions'       => ['APPROVE_KEPALA_KEUANGAN', 'SUBMIT_OPR', 'VIEW_OPR'],
        'canAccessKwitansi' => true,
        'seeFee'            => true,
        'mode'              => 'PUSAT',
        'tokenHash'         => '387f1132894c759ea61674434d9e7f34958a5445dc4f20c408a4a5b251396e5f'
    ],
    '387f1132894c759ea61674434d9e7f34958a5445dc4f20c408a4a5b251396e5f' => [ // [REDACTED_SUPER_ADMIN_TOKEN] (Salted SHA-256)
        'sub'               => 'kepala_keuangan',
        'branch'            => 'PUSAT',
        'displayName'       => 'Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)',
        'role'              => 'KEPALA_KEUANGAN',
        'roleLabel'         => 'Kepala Keuangan & Pemimpin Rekan (Tingkat 3)',
        'title'             => 'Kepala Keuangan',
        'wilayah'           => 'PUSAT',
        'wilayahCode'       => '00',
        'isSuperAdmin'      => true,
        'isMaster'          => true,
        'isCabang'          => false,
        'canApprove'        => true,
        'permissions'       => ['APPROVE_KEPALA_KEUANGAN', 'SUBMIT_OPR', 'VIEW_OPR'],
        'canAccessKwitansi' => true,
        'seeFee'            => true,
        'mode'              => 'PUSAT',
        'tokenHash'         => '387f1132894c759ea61674434d9e7f34958a5445dc4f20c408a4a5b251396e5f'
    ],

    // 3. MANAGER ADMIN & UMUM (Danny Taufik Hidayat, S.H. - [REDACTED_ADMIN_PUSAT_TOKEN] & NSR-ADM-2026)
    '34e689e4b4b12f107e810fd8f48f8a4677e1a1645f0dd4232a9240fecc2d10c2' => [ // [REDACTED_ADMIN_PUSAT_TOKEN] (Raw SHA-256)
        'sub'               => 'admin_danny',
        'branch'            => 'PUSAT',
        'displayName'       => 'Danny Taufik Hidayat, S.H.',
        'role'              => 'MANAGER_ADMIN',
        'roleLabel'         => 'Manager Admin & Umum (Tingkat 1)',
        'title'             => 'Manager Admin & Umum',
        'wilayah'           => 'PUSAT',
        'wilayahCode'       => '00',
        'isSuperAdmin'      => false,
        'isMaster'          => false,
        'isCabang'          => false,
        'canApprove'        => true,
        'permissions'       => ['APPROVE_ADMIN', 'SUBMIT_OPR', 'VIEW_OPR'],
        'canAccessKwitansi' => true,
        'seeFee'            => true,
        'mode'              => 'PUSAT',
        'tokenHash'         => '87a9fd928aecca6f78beb856d1bb5a1399c1be00d5cbe97a8fd1b098dfdd7b2c'
    ],
    '87a9fd928aecca6f78beb856d1bb5a1399c1be00d5cbe97a8fd1b098dfdd7b2c' => [ // [REDACTED_ADMIN_PUSAT_TOKEN] (Salted SHA-256)
        'sub'               => 'admin_danny',
        'branch'            => 'PUSAT',
        'displayName'       => 'Danny Taufik Hidayat, S.H.',
        'role'              => 'MANAGER_ADMIN',
        'roleLabel'         => 'Manager Admin & Umum (Tingkat 1)',
        'title'             => 'Manager Admin & Umum',
        'wilayah'           => 'PUSAT',
        'wilayahCode'       => '00',
        'isSuperAdmin'      => false,
        'isMaster'          => false,
        'isCabang'          => false,
        'canApprove'        => true,
        'permissions'       => ['APPROVE_ADMIN', 'SUBMIT_OPR', 'VIEW_OPR'],
        'canAccessKwitansi' => true,
        'seeFee'            => true,
        'mode'              => 'PUSAT',
        'tokenHash'         => '87a9fd928aecca6f78beb856d1bb5a1399c1be00d5cbe97a8fd1b098dfdd7b2c'
    ],`;

const replacementOpr = `    // 2. KEPALA KEUANGAN & PEMIMPIN REKAN (Ir. Nanang Rahayu, M.Ec.Dev. - NSR-KEPKEU-2026)
    // NSR-KEPKEU-2026: Token resmi baru tidak terekspos untuk otorisasi final Tingkat 3
    '6a19d17c1a36f87a4c8b385d3b1ceda599bf3342f5dd3197bb79e8f63898a6ed' => [ // NSR-KEPKEU-2026 (Raw SHA-256)
        'sub'               => 'kepala_keuangan',
        'branch'            => 'PUSAT',
        'displayName'       => 'Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)',
        'role'              => 'KEPALA_KEUANGAN',
        'roleLabel'         => 'Kepala Keuangan & Pemimpin Rekan (Tingkat 3)',
        'title'             => 'Kepala Keuangan',
        'wilayah'           => 'PUSAT',
        'wilayahCode'       => '00',
        'isSuperAdmin'      => true,
        'isMaster'          => true,
        'isCabang'          => false,
        'canApprove'        => true,
        'permissions'       => ['APPROVE_KEPALA_KEUANGAN', 'SUBMIT_OPR', 'VIEW_OPR'],
        'canAccessKwitansi' => true,
        'seeFee'            => true,
        'mode'              => 'PUSAT',
        'tokenHash'         => '27394fd65ac8cc90efd6270bb3371bb5e753d7838581457f9940a0734276bb50'
    ],
    '27394fd65ac8cc90efd6270bb3371bb5e753d7838581457f9940a0734276bb50' => [ // NSR-KEPKEU-2026 (Salted SHA-256)
        'sub'               => 'kepala_keuangan',
        'branch'            => 'PUSAT',
        'displayName'       => 'Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)',
        'role'              => 'KEPALA_KEUANGAN',
        'roleLabel'         => 'Kepala Keuangan & Pemimpin Rekan (Tingkat 3)',
        'title'             => 'Kepala Keuangan',
        'wilayah'           => 'PUSAT',
        'wilayahCode'       => '00',
        'isSuperAdmin'      => true,
        'isMaster'          => true,
        'isCabang'          => false,
        'canApprove'        => true,
        'permissions'       => ['APPROVE_KEPALA_KEUANGAN', 'SUBMIT_OPR', 'VIEW_OPR'],
        'canAccessKwitansi' => true,
        'seeFee'            => true,
        'mode'              => 'PUSAT',
        'tokenHash'         => '27394fd65ac8cc90efd6270bb3371bb5e753d7838581457f9940a0734276bb50'
    ],

    // AUDIT TOKEN TERESKPOS: [REDACTED_SUPER_ADMIN_TOKEN] - Hak approval dicabut total, hanya submit & view
    '47e9420b3a60a28be92802a6b88515da8f3fdaa624a86a9d9e57d60b859ab7c0' => [ // [REDACTED_SUPER_ADMIN_TOKEN] (Raw SHA-256)
        'sub'               => 'admin_master',
        'branch'            => 'PUSAT',
        'displayName'       => 'Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)',
        'role'              => 'KEPALA_KEUANGAN',
        'roleLabel'         => 'Kepala Keuangan (Kredensial Non-Approval)',
        'title'             => 'Kepala Keuangan',
        'wilayah'           => 'PUSAT',
        'wilayahCode'       => '00',
        'isSuperAdmin'      => false,
        'isMaster'          => false,
        'isCabang'          => false,
        'canApprove'        => false,
        'permissions'       => ['SUBMIT_OPR', 'VIEW_OPR'],
        'canAccessKwitansi' => true,
        'seeFee'            => true,
        'mode'              => 'PUSAT',
        'tokenHash'         => '387f1132894c759ea61674434d9e7f34958a5445dc4f20c408a4a5b251396e5f'
    ],
    '387f1132894c759ea61674434d9e7f34958a5445dc4f20c408a4a5b251396e5f' => [ // [REDACTED_SUPER_ADMIN_TOKEN] (Salted SHA-256)
        'sub'               => 'admin_master',
        'branch'            => 'PUSAT',
        'displayName'       => 'Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)',
        'role'              => 'KEPALA_KEUANGAN',
        'roleLabel'         => 'Kepala Keuangan (Kredensial Non-Approval)',
        'title'             => 'Kepala Keuangan',
        'wilayah'           => 'PUSAT',
        'wilayahCode'       => '00',
        'isSuperAdmin'      => false,
        'isMaster'          => false,
        'isCabang'          => false,
        'canApprove'        => false,
        'permissions'       => ['SUBMIT_OPR', 'VIEW_OPR'],
        'canAccessKwitansi' => true,
        'seeFee'            => true,
        'mode'              => 'PUSAT',
        'tokenHash'         => '387f1132894c759ea61674434d9e7f34958a5445dc4f20c408a4a5b251396e5f'
    ],

    // AUDIT TOKEN TERESKPOS: [REDACTED_ADMIN_PUSAT_TOKEN] - Hak approval dialihkan eksklusif ke NSR-ADM-2026
    '34e689e4b4b12f107e810fd8f48f8a4677e1a1645f0dd4232a9240fecc2d10c2' => [ // [REDACTED_ADMIN_PUSAT_TOKEN] (Raw SHA-256)
        'sub'               => 'admin_danny',
        'branch'            => 'PUSAT',
        'displayName'       => 'Danny Taufik Hidayat, S.H.',
        'role'              => 'MANAGER_ADMIN',
        'roleLabel'         => 'Manager Admin & Umum (Kredensial Non-Approval)',
        'title'             => 'Manager Admin & Umum',
        'wilayah'           => 'PUSAT',
        'wilayahCode'       => '00',
        'isSuperAdmin'      => false,
        'isMaster'          => false,
        'isCabang'          => false,
        'canApprove'        => false,
        'permissions'       => ['SUBMIT_OPR', 'VIEW_OPR'],
        'canAccessKwitansi' => true,
        'seeFee'            => true,
        'mode'              => 'PUSAT',
        'tokenHash'         => '87a9fd928aecca6f78beb856d1bb5a1399c1be00d5cbe97a8fd1b098dfdd7b2c'
    ],
    '87a9fd928aecca6f78beb856d1bb5a1399c1be00d5cbe97a8fd1b098dfdd7b2c' => [ // [REDACTED_ADMIN_PUSAT_TOKEN] (Salted SHA-256)
        'sub'               => 'admin_danny',
        'branch'            => 'PUSAT',
        'displayName'       => 'Danny Taufik Hidayat, S.H.',
        'role'              => 'MANAGER_ADMIN',
        'roleLabel'         => 'Manager Admin & Umum (Kredensial Non-Approval)',
        'title'             => 'Manager Admin & Umum',
        'wilayah'           => 'PUSAT',
        'wilayahCode'       => '00',
        'isSuperAdmin'      => false,
        'isMaster'          => false,
        'isCabang'          => false,
        'canApprove'        => false,
        'permissions'       => ['SUBMIT_OPR', 'VIEW_OPR'],
        'canAccessKwitansi' => true,
        'seeFee'            => true,
        'mode'              => 'PUSAT',
        'tokenHash'         => '87a9fd928aecca6f78beb856d1bb5a1399c1be00d5cbe97a8fd1b098dfdd7b2c'
    ],`;

// Normalize CRLF to LF for matching
const normOpr = opr.replace(/\r\n/g, '\n');
const normTargetOpr = targetOpr.replace(/\r\n/g, '\n');
const normReplOpr = replacementOpr.replace(/\r\n/g, '\n');

if (!normOpr.includes(normTargetOpr)) {
  console.error('Target not found in operasional-data-handler.php!');
  process.exit(1);
}

const updatedOpr = normOpr.replace(normTargetOpr, normReplOpr).replace(/\n/g, '\r\n');
fs.writeFileSync(oprPath, updatedOpr, 'utf8');
console.log('operasional-data-handler.php updated successfully!');
