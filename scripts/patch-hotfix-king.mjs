import fs from 'node:fs';
import path from 'node:path';

const authFile = 'auth-handler.php';
let authContent = fs.readFileSync(authFile, 'utf8');

// 1. Update auth-handler.php
const kingOldBlockPattern = /\/\/\s*Audited Token [REDACTED_SUPER_ADMIN_TOKEN][\s\S]*?'387f1132894c759ea61674434d9e7f34958a5445dc4f20c408a4a5b251396e5f'\s*=>\s*\[[\s\S]*?'tokenHash'\s*=>\s*'387f1132894c759ea61674434d9e7f34958a5445dc4f20c408a4a5b251396e5f'\s*\]\s*,/i;

const kingNewBlock = `// KREDENSIAL RESMI SUPER ADMIN — KING ([REDACTED_SUPER_ADMIN_TOKEN])
    '47e9420b3a60a28be92802a6b88515da8f3fdaa624a86a9d9e57d60b859ab7c0' => [
        'sub'               => 'super_admin_king',
        'branch'            => 'PUSAT',
        'displayName'       => 'SUPER ADMIN (KING)',
        'nama'              => 'Super Admin Operasional (KING)',
        'role'              => 'SUPER_ADMIN',
        'roleLabel'         => 'SUPER ADMIN • KING (Otoritas Sistem Tertinggi)',
        'title'             => 'Super Admin (KING)',
        'wilayah'           => 'PUSAT',
        'wilayahLabel'      => 'Kantor Pusat Jakarta',
        'wilayahCode'       => 'PST',
        'isSuperAdmin'      => true,
        'isKing'            => true,
        'isCabang'          => false,
        'canAccessKwitansi' => true,
        'canApprove'        => true,
        'canSubmit'         => true,
        'seeFee'            => true,
        'mode'              => 'PUSAT',
        'permissions'       => ['spm.review', 'divtek.review', 'lp.issue', 'nolap.issue', 'system.emergency_override', 'opr.view', 'opr.submit', 'admin.all'],
        'tokenHash'         => '47e9420b3a60a28be92802a6b88515da8f3fdaa624a86a9d9e57d60b859ab7c0'
    ],
    '387f1132894c759ea61674434d9e7f34958a5445dc4f20c408a4a5b251396e5f' => [
        'sub'               => 'super_admin_king',
        'branch'            => 'PUSAT',
        'displayName'       => 'SUPER ADMIN (KING)',
        'nama'              => 'Super Admin Operasional (KING)',
        'role'              => 'SUPER_ADMIN',
        'roleLabel'         => 'SUPER ADMIN • KING (Otoritas Sistem Tertinggi)',
        'title'             => 'Super Admin (KING)',
        'wilayah'           => 'PUSAT',
        'wilayahLabel'      => 'Kantor Pusat Jakarta',
        'wilayahCode'       => 'PST',
        'isSuperAdmin'      => true,
        'isKing'            => true,
        'isCabang'          => false,
        'canAccessKwitansi' => true,
        'canApprove'        => true,
        'canSubmit'         => true,
        'seeFee'            => true,
        'mode'              => 'PUSAT',
        'permissions'       => ['spm.review', 'divtek.review', 'lp.issue', 'nolap.issue', 'system.emergency_override', 'opr.view', 'opr.submit', 'admin.all'],
        'tokenHash'         => '387f1132894c759ea61674434d9e7f34958a5445dc4f20c408a4a5b251396e5f'
    ],`;

if (kingOldBlockPattern.test(authContent)) {
  authContent = authContent.replace(kingOldBlockPattern, kingNewBlock);
  fs.writeFileSync(authFile, authContent, 'utf8');
  console.log('✓ auth-handler.php updated with canonical SUPER_ADMIN KING credentials');
} else {
  console.log('⚠️ auth-handler.php pattern not matched');
}
