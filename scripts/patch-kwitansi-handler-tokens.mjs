import fs from 'node:fs';

let php = fs.readFileSync('kwitansi-data-handler.php', 'utf8');

// 1. Add Staging Demo & Official Keuangan Hashes to $OFFICIAL_TOKEN_HASHES
const stagingTokensPhp = `    // STAGING DEMO TOKENS (NSR-STAGE-*)
    '16f051a1bb53eb07ba314e472103186abcbe945520af2028688be64eb4fea42a' => [ // NSR-STAGE-MASTER-77
        'sub'               => 'admin_master',
        'branch'            => 'PUSAT',
        'displayName'       => 'Super Admin Staging',
        'role'              => 'SUPER ADMIN',
        'roleLabel'         => 'SUPER ADMIN • KANTOR PUSAT',
        'title'             => 'Super Admin Pusat',
        'wilayah'           => 'PUSAT',
        'wilayahLabel'      => 'Kantor Pusat Jakarta',
        'wilayahCode'       => 'PST',
        'isSuperAdmin'      => true,
        'isCabang'          => false,
        'canAccessKwitansi' => true,
        'canApprove'        => true,
        'canSubmit'         => true,
        'seeFee'            => true,
        'mode'              => 'PUSAT',
        'tokenHash'         => '16f051a1bb53eb07ba314e472103186abcbe945520af2028688be64eb4fea42a'
    ],
    '7afb5f456e453b47672a2a2fa7c241c5aa45b41b8b3c759a84ec36c944aa30bf' => [ // NSR-STAGE-MASTER-77 salted
        'sub'               => 'admin_master',
        'branch'            => 'PUSAT',
        'displayName'       => 'Super Admin Staging',
        'role'              => 'SUPER ADMIN',
        'roleLabel'         => 'SUPER ADMIN • KANTOR PUSAT',
        'title'             => 'Super Admin Pusat',
        'wilayah'           => 'PUSAT',
        'wilayahLabel'      => 'Kantor Pusat Jakarta',
        'wilayahCode'       => 'PST',
        'isSuperAdmin'      => true,
        'isCabang'          => false,
        'canAccessKwitansi' => true,
        'canApprove'        => true,
        'canSubmit'         => true,
        'seeFee'            => true,
        'mode'              => 'PUSAT',
        'tokenHash'         => '16f051a1bb53eb07ba314e472103186abcbe945520af2028688be64eb4fea42a'
    ],
    'fc6ce762316126e791fa636c7b962f45cbd5efdd76839374a3fa4f825767e9e7' => [ // NSR-STAGE-KEU-44
        'sub'               => 'keuangan_milda',
        'branch'            => 'PUSAT',
        'displayName'       => 'Milda H',
        'role'              => 'KEUANGAN',
        'roleLabel'         => 'Keuangan Pusat (Milda H)',
        'title'             => 'Divisi Keuangan Pusat',
        'wilayah'           => 'PUSAT',
        'wilayahLabel'      => 'Kantor Pusat Jakarta',
        'wilayahCode'       => 'PST',
        'isSuperAdmin'      => false,
        'isCabang'          => false,
        'canAccessKwitansi' => true,
        'canApprove'        => true,
        'canSubmit'         => true,
        'seeFee'            => true,
        'mode'              => 'PUSAT',
        'tokenHash'         => 'fc6ce762316126e791fa636c7b962f45cbd5efdd76839374a3fa4f825767e9e7'
    ],
    '1b6df23d3e909f0f12fe357e58912cafe05580cb7d2b5f7710762bd572d63f8f' => [ // NSR-STAGE-KEU-44 salted
        'sub'               => 'keuangan_milda',
        'branch'            => 'PUSAT',
        'displayName'       => 'Milda H',
        'role'              => 'KEUANGAN',
        'roleLabel'         => 'Keuangan Pusat (Milda H)',
        'title'             => 'Divisi Keuangan Pusat',
        'wilayah'           => 'PUSAT',
        'wilayahLabel'      => 'Kantor Pusat Jakarta',
        'wilayahCode'       => 'PST',
        'isSuperAdmin'      => false,
        'isCabang'          => false,
        'canAccessKwitansi' => true,
        'canApprove'        => true,
        'canSubmit'         => true,
        'seeFee'            => true,
        'mode'              => 'PUSAT',
        'tokenHash'         => 'fc6ce762316126e791fa636c7b962f45cbd5efdd76839374a3fa4f825767e9e7'
    ],
    '57344967696ffd47737ce0558f151d480c8ac15ee94ecfbe9b045d25d123e6a0' => [ // NSR-KEU-2026 salted
        'sub'               => 'keuangan_pst',
        'branch'            => 'PUSAT',
        'displayName'       => 'Milda H',
        'role'              => 'KEUANGAN',
        'roleLabel'         => 'Keuangan Pusat (Milda H)',
        'title'             => 'Divisi Keuangan & Kasir Pusat',
        'wilayah'           => 'PUSAT',
        'wilayahLabel'      => 'Kantor Pusat Jakarta',
        'wilayahCode'       => 'PST',
        'isSuperAdmin'      => false,
        'isCabang'          => false,
        'canAccessKwitansi' => true,
        'canApprove'        => true,
        'canSubmit'         => true,
        'seeFee'            => true,
        'mode'              => 'PUSAT',
        'tokenHash'         => '57344967696ffd47737ce0558f151d480c8ac15ee94ecfbe9b045d25d123e6a0'
    ],
    '107ee87beefd50d3ecf4c3ea6716c22cbff5330505ee747ce5d800f77c94f32d' => [ // NSR-KEU-2026 unsalted
        'sub'               => 'keuangan_pst',
        'branch'            => 'PUSAT',
        'displayName'       => 'Milda H',
        'role'              => 'KEUANGAN',
        'roleLabel'         => 'Keuangan Pusat (Milda H)',
        'title'             => 'Divisi Keuangan & Kasir Pusat',
        'wilayah'           => 'PUSAT',
        'wilayahLabel'      => 'Kantor Pusat Jakarta',
        'wilayahCode'       => 'PST',
        'isSuperAdmin'      => false,
        'isCabang'          => false,
        'canAccessKwitansi' => true,
        'canApprove'        => true,
        'canSubmit'         => true,
        'seeFee'            => true,
        'mode'              => 'PUSAT',
        'tokenHash'         => '57344967696ffd47737ce0558f151d480c8ac15ee94ecfbe9b045d25d123e6a0'
    ],
    '94a006da9c2e0ba0768fc37d6e17c96c718fe47c4119b7bb0b717d8a57b692ce' => [ // NSR-STAGE-PLB-55
        'sub'               => 'admin_plb_stage',
        'branch'            => 'Palembang',
        'displayName'       => 'Kantor Cabang Palembang',
        'role'              => 'ADMIN_CABANG',
        'roleLabel'         => 'Admin Cabang Palembang',
        'wilayah'           => 'Palembang',
        'wilayahCode'       => 'PLB',
        'isSuperAdmin'      => false,
        'isCabang'          => true,
        'canAccessKwitansi' => true,
        'canApprove'        => false,
        'canSubmit'         => true,
        'seeFee'            => true,
        'mode'              => 'CABANG',
        'tokenHash'         => '94a006da9c2e0ba0768fc37d6e17c96c718fe47c4119b7bb0b717d8a57b692ce'
    ],
    '291e2e008eccedbb76fa1e55534fb2bd7e96f56e4e47b2e615e7f88a734ac1ff' => [ // NSR-STAGE-MKS-33
        'sub'               => 'admin_mks_stage',
        'branch'            => 'Makassar',
        'displayName'       => 'Kantor Cabang Makassar',
        'role'              => 'ADMIN_CABANG',
        'roleLabel'         => 'Admin Cabang Makassar',
        'wilayah'           => 'Makassar',
        'wilayahCode'       => 'MKS',
        'isSuperAdmin'      => false,
        'isCabang'          => true,
        'canAccessKwitansi' => true,
        'canApprove'        => false,
        'canSubmit'         => true,
        'seeFee'            => true,
        'mode'              => 'CABANG',
        'tokenHash'         => '291e2e008eccedbb76fa1e55534fb2bd7e96f56e4e47b2e615e7f88a734ac1ff'
    ],
    'a3eafd84b50efa1b7992bf278ef1621fa9bea60eadcb67edff62a6b92387633b' => [ // NSR-STAGE-PDG-66
        'sub'               => 'admin_pdg_stage',
        'branch'            => 'Padang',
        'displayName'       => 'Kantor Cabang Padang',
        'role'              => 'ADMIN_CABANG',
        'roleLabel'         => 'Admin Cabang Padang',
        'wilayah'           => 'Padang',
        'wilayahCode'       => 'PDG',
        'isSuperAdmin'      => false,
        'isCabang'          => true,
        'canAccessKwitansi' => true,
        'canApprove'        => false,
        'canSubmit'         => true,
        'seeFee'            => true,
        'mode'              => 'CABANG',
        'tokenHash'         => 'a3eafd84b50efa1b7992bf278ef1621fa9bea60eadcb67edff62a6b92387633b'
    ],
    '316c8000130d7798e0dff3cfc7053d661616598a7121d679f75a8d4d3d43625b' => [ // NSR-STAGE-BDG-22
        'sub'               => 'admin_bdg_stage',
        'branch'            => 'Bandung',
        'displayName'       => 'Kantor Cabang Bandung',
        'role'              => 'ADMIN_CABANG',
        'roleLabel'         => 'Admin Cabang Bandung',
        'wilayah'           => 'Bandung',
        'wilayahCode'       => 'BDG',
        'isSuperAdmin'      => false,
        'isCabang'          => true,
        'canAccessKwitansi' => true,
        'canApprove'        => false,
        'canSubmit'         => true,
        'seeFee'            => true,
        'mode'              => 'CABANG',
        'tokenHash'         => '316c8000130d7798e0dff3cfc7053d661616598a7121d679f75a8d4d3d43625b'
    ],
`;

if (!php.includes('57344967696ffd47737ce0558f151d480c8ac15ee94ecfbe9b045d25d123e6a0')) {
  php = php.replace('$OFFICIAL_TOKEN_HASHES = [', '$OFFICIAL_TOKEN_HASHES = [\n' + stagingTokensPhp);
}

// 2. Add salted SHA-256 fallback in token resolution
const oldTokenLookup = `            $upperHash = hash('sha256', strtoupper($trimmed));
            if (isset($OFFICIAL_TOKEN_HASHES[$upperHash])) {
                $currentUser = $OFFICIAL_TOKEN_HASHES[$upperHash];
            }`;

const newTokenLookup = `            $upperHash = hash('sha256', strtoupper($trimmed));
            if (isset($OFFICIAL_TOKEN_HASHES[$upperHash])) {
                $currentUser = $OFFICIAL_TOKEN_HASHES[$upperHash];
            } else {
                $saltedHash = hash('sha256', 'KJPP_NSR_2026_CORE_AUTH::' . strtoupper($trimmed));
                if (isset($OFFICIAL_TOKEN_HASHES[$saltedHash])) {
                    $currentUser = $OFFICIAL_TOKEN_HASHES[$saltedHash];
                }
            }`;

php = php.replace(oldTokenLookup, newTokenLookup);

fs.writeFileSync('kwitansi-data-handler.php', php, 'utf8');
console.log('✓ kwitansi-data-handler.php successfully patched with staging and official tokens!');
