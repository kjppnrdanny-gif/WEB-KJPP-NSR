import fs from 'fs';

let content = fs.readFileSync('auth-handler.php', 'utf8');

const startStr = "    // Audited Token [REDACTED_ADMIN_PUSAT_TOKEN] - Hak approval dialihkan eksklusif ke NSR-ADM-2026";
const endStr = "    '116f1fc38a65e1f069d617ef30be1bd2c693e9cb69950ea475a694af2594dd99' => [";

const startIdx = content.indexOf(startStr);
const endIdx = content.indexOf(endStr);

if (startIdx === -1 || endIdx === -1) {
  throw new Error('Indices not found in auth-handler.php');
}

const replacement = `    // Token [REDACTED_ADMIN_PUSAT_TOKEN] - Admin Operasional Pusat
    '34e689e4b4b12f107e810fd8f48f8a4677e1a1645f0dd4232a9240fecc2d10c2' => [
        'sub'               => 'cabang_jkt',
        'branch'            => 'PUSAT',
        'displayName'       => 'Kantor Pusat Jakarta',
        'role'              => 'ADMIN_PUSAT',
        'roleLabel'         => 'ADMIN OPERASIONAL PUSAT',
        'title'             => 'Admin Operasional Pusat',
        'wilayah'           => 'PUSAT',
        'wilayahLabel'      => 'Kantor Pusat Jakarta',
        'wilayahCode'       => 'PST',
        'isSuperAdmin'      => false,
        'isKing'            => false,
        'isCabang'          => false,
        'canAccessKwitansi' => true,
        'canApprove'        => true,
        'canSubmit'         => true,
        'seeFee'            => true,
        'mode'              => 'PUSAT',
        'permissions'       => ['SUBMIT_OPR', 'VIEW_OPR', 'APPROVE_OPR', 'APPROVE_PUSAT', 'NOLAP_APPROVE'],
        'tokenHash'         => '87a9fd928aecca6f78beb856d1bb5a1399c1be00d5cbe97a8fd1b098dfdd7b2c'
    ],
    '87a9fd928aecca6f78beb856d1bb5a1399c1be00d5cbe97a8fd1b098dfdd7b2c' => [
        'sub'               => 'cabang_jkt',
        'branch'            => 'PUSAT',
        'displayName'       => 'Kantor Pusat Jakarta',
        'role'              => 'ADMIN_PUSAT',
        'roleLabel'         => 'ADMIN OPERASIONAL PUSAT',
        'title'             => 'Admin Operasional Pusat',
        'wilayah'           => 'PUSAT',
        'wilayahLabel'      => 'Kantor Pusat Jakarta',
        'wilayahCode'       => 'PST',
        'isSuperAdmin'      => false,
        'isKing'            => false,
        'isCabang'          => false,
        'canAccessKwitansi' => true,
        'canApprove'        => true,
        'canSubmit'         => true,
        'seeFee'            => true,
        'mode'              => 'PUSAT',
        'permissions'       => ['SUBMIT_OPR', 'VIEW_OPR', 'APPROVE_OPR', 'APPROVE_PUSAT', 'NOLAP_APPROVE'],
        'tokenHash'         => '87a9fd928aecca6f78beb856d1bb5a1399c1be00d5cbe97a8fd1b098dfdd7b2c'
    ],
`;

content = content.slice(0, startIdx) + replacement + content.slice(endIdx);
fs.writeFileSync('auth-handler.php', content, 'utf8');
console.log('✓ auth-handler.php successfully updated with ADMIN_PUSAT credentials');
