import fs from 'fs';
import path from 'path';

const operasionalPath = path.resolve('operasional-data-handler.php');
let code = fs.readFileSync(operasionalPath, 'utf8');

// Determine line ending
const newline = code.includes('\r\n') ? '\r\n' : '\n';

// 1. New Token Dictionary
const tokenTable = `// -------------------------------------------------------------
// 1. DATA TOKENS RESMI UNTUK VALIDASI API / BEARER / HEADER
// -------------------------------------------------------------
$OFFICIAL_TOKEN_HASHES = [
    // =============================================================
    // TOKENS DEMO STAGING BARU (ISOLASI PREVIEW)
    // Catatan: Kredensial staging ditolak otomatis untuk approval di produksi
    // =============================================================
    '16f051a1bb53eb07ba314e472103186abcbe945520af2028688be64eb4fea42a' => [ // NSR-STAGE-MASTER-77
        'sub'               => 'admin_master',
        'branch'            => 'PUSAT',
        'displayName'       => 'Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)',
        'role'              => 'KEPALA_KEUANGAN',
        'roleLabel'         => 'Pemimpin Rekan & Super Admin Master (Staging)',
        'title'             => 'Super Admin Pusat',
        'wilayah'           => 'PUSAT',
        'wilayahLabel'      => 'Kantor Pusat Jakarta',
        'wilayahCode'       => '00',
        'isSuperAdmin'      => true,
        'isMaster'          => true,
        'isCabang'          => false,
        'canApprove'        => true,
        'permissions'       => ['APPROVE_KEPALA_KEUANGAN', 'SUBMIT_OPR', 'VIEW_OPR'],
        'canAccessKwitansi' => true,
        'seeFee'            => true,
        'mode'              => 'PUSAT',
        'isStaging'         => true,
        'tokenHash'         => '16f051a1bb53eb07ba314e472103186abcbe945520af2028688be64eb4fea42a'
    ],
    '1be766a50d815d7334e8e3fa45ad415d2a408f37a2dc3a9ef66bb0157eaad4d8' => [ // NSR-STAGE-PR-55
        'sub'               => 'partner_nanang',
        'branch'            => 'PUSAT',
        'displayName'       => 'Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)',
        'role'              => 'KEPALA_KEUANGAN',
        'roleLabel'         => 'Pemimpin Rekan (Penanggung Jawab - Staging)',
        'title'             => 'Pemimpin Rekan',
        'wilayah'           => 'PUSAT',
        'wilayahLabel'      => 'Kantor Pusat Jakarta',
        'wilayahCode'       => '00',
        'isSuperAdmin'      => true,
        'isMaster'          => true,
        'isCabang'          => false,
        'canApprove'        => true,
        'permissions'       => ['APPROVE_KEPALA_KEUANGAN', 'SUBMIT_OPR', 'VIEW_OPR'],
        'canAccessKwitansi' => true,
        'seeFee'            => true,
        'mode'              => 'PUSAT',
        'isStaging'         => true,
        'tokenHash'         => '1be766a50d815d7334e8e3fa45ad415d2a408f37a2dc3a9ef66bb0157eaad4d8'
    ],
    '15a002e04ebcc16e23dc324af0e0cd5d85fec1eb83cf72f51834e930215d3d10' => [ // NSR-STAGE-REK-22
        'sub'               => 'rekan_deni',
        'branch'            => 'PUSAT',
        'displayName'       => 'Deni Siswandi, S.T.',
        'role'              => 'MANAGER_TEKNIK',
        'roleLabel'         => 'Manager Teknik (Tingkat 1 - Staging)',
        'title'             => 'Manager Teknik',
        'wilayah'           => 'PUSAT',
        'wilayahLabel'      => 'Kantor Pusat Jakarta',
        'wilayahCode'       => '00',
        'isSuperAdmin'      => false,
        'isMaster'          => false,
        'isCabang'          => false,
        'canApprove'        => true,
        'permissions'       => ['APPROVE_TEKNIK', 'SUBMIT_OPR', 'VIEW_OPR'],
        'canAccessKwitansi' => true,
        'seeFee'            => true,
        'mode'              => 'PUSAT',
        'isStaging'         => true,
        'tokenHash'         => '15a002e04ebcc16e23dc324af0e0cd5d85fec1eb83cf72f51834e930215d3d10'
    ],
    'd2440f745fd849aac4d73dde24c27a7cefcd85ae9e09611dafaa952bf09000ea' => [ // NSR-STAGE-ADM-33
        'sub'               => 'admin_danny',
        'branch'            => 'PUSAT',
        'displayName'       => 'Danny Taufik Hidayat, S.H.',
        'role'              => 'MANAGER_ADMIN',
        'roleLabel'         => 'Manager Admin, Umum & Legal (Tingkat 1 - Staging)',
        'title'             => 'Manager Admin & Umum',
        'wilayah'           => 'PUSAT',
        'wilayahLabel'      => 'Kantor Pusat Jakarta',
        'wilayahCode'       => '00',
        'isSuperAdmin'      => false,
        'isMaster'          => false,
        'isCabang'          => false,
        'canApprove'        => true,
        'permissions'       => ['APPROVE_ADMIN', 'SUBMIT_OPR', 'VIEW_OPR'],
        'canAccessKwitansi' => true,
        'seeFee'            => true,
        'mode'              => 'PUSAT',
        'isStaging'         => true,
        'tokenHash'         => 'd2440f745fd849aac4d73dde24c27a7cefcd85ae9e09611dafaa952bf09000ea'
    ],
    'fc6ce762316126e791fa636c7b962f45cbd5efdd76839374a3fa4f825767e9e7' => [ // NSR-STAGE-KEU-44
        'sub'               => 'keuangan_milda',
        'branch'            => 'PUSAT',
        'displayName'       => 'Milda Hidayati Dewi, S.E.',
        'role'              => 'MANAGER_KEUANGAN',
        'roleLabel'         => 'Manager Keuangan (Verifikasi Anggaran - Tingkat 2 - Staging)',
        'title'             => 'Manager Keuangan',
        'wilayah'           => 'PUSAT',
        'wilayahLabel'      => 'Kantor Pusat Jakarta',
        'wilayahCode'       => '00',
        'isSuperAdmin'      => false,
        'isMaster'          => false,
        'isCabang'          => false,
        'canApprove'        => true,
        'permissions'       => ['APPROVE_KEUANGAN', 'SUBMIT_OPR', 'VIEW_OPR'],
        'canAccessKwitansi' => true,
        'seeFee'            => true,
        'mode'              => 'PUSAT',
        'isStaging'         => true,
        'tokenHash'         => 'fc6ce762316126e791fa636c7b962f45cbd5efdd76839374a3fa4f825767e9e7'
    ],
    'bd2866b4f8734fe13d5a7ae57e847de7bcb3a19d585ff928f70ea6cc0c81f07f' => [ // NSR-STAGE-SRV-11 (Holik Kelana - Staf Lapangan)
        'sub'               => 'surveyor_holik',
        'branch'            => 'PUSAT',
        'displayName'       => 'Holik Kelana',
        'role'              => 'SURVEYOR',
        'roleLabel'         => 'Surveyor Lapangan (Staff Staging)',
        'title'             => 'Surveyor Lapangan',
        'wilayah'           => 'PUSAT',
        'wilayahLabel'      => 'Kantor Pusat Jakarta',
        'wilayahCode'       => '00',
        'isSuperAdmin'      => false,
        'isMaster'          => false,
        'isCabang'          => false,
        'canApprove'        => false,
        'permissions'       => ['SUBMIT_OPR', 'VIEW_OPR'],
        'canAccessKwitansi' => false,
        'seeFee'            => false,
        'mode'              => 'PUSAT',
        'isStaging'         => true,
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
        'canApprove'        => false,
        'permissions'       => [],
        'canAccessKwitansi' => true,
        'seeFee'            => true,
        'mode'              => 'CABANG',
        'kodeKemenkeu'      => '2.19.0160-03',
        'isStaging'         => true,
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
        'canApprove'        => false,
        'permissions'       => [],
        'canAccessKwitansi' => true,
        'seeFee'            => true,
        'mode'              => 'CABANG',
        'kodeKemenkeu'      => '2.19.0160-02',
        'isStaging'         => true,
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
        'canApprove'        => false,
        'permissions'       => [],
        'canAccessKwitansi' => true,
        'seeFee'            => true,
        'mode'              => 'CABANG',
        'kodeKemenkeu'      => '2.19.0160-01',
        'isStaging'         => true,
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
        'canApprove'        => false,
        'permissions'       => [],
        'canAccessKwitansi' => true,
        'seeFee'            => true,
        'mode'              => 'CABANG',
        'kodeKemenkeu'      => '2.19.0160-04',
        'isStaging'         => true,
        'tokenHash'         => '316c8000130d7798e0dff3cfc7053d661616598a7121d679f75a8d4d3d43625b'
    ],

    // =============================================================
    // TOKENS PRODUKSI RESMI KJPP NANANG RAHAYU & REKAN (RBAC KETAT)
    // =============================================================

    // 1. DEDICATED TOKEN: MANAGER TEKNIK (Deni Siswandi, S.T. - NSR-DIVTEK-2026)
    'dd978492a43a62cdfaf0526c90957ae6443be71f7459a6dbcb4014ed3e4c24fb' => [ // NSR-DIVTEK-2026 (Raw SHA-256)
        'sub'               => 'manager_teknik',
        'branch'            => 'PUSAT',
        'displayName'       => 'Deni Siswandi, S.T.',
        'role'              => 'MANAGER_TEKNIK',
        'roleLabel'         => 'Manager Teknik (Tingkat 1)',
        'title'             => 'Manager Teknik',
        'wilayah'           => 'PUSAT',
        'wilayahLabel'      => 'Kantor Pusat Jakarta',
        'wilayahCode'       => '00',
        'isSuperAdmin'      => false,
        'isMaster'          => false,
        'isCabang'          => false,
        'canApprove'        => true,
        'permissions'       => ['APPROVE_TEKNIK', 'SUBMIT_OPR', 'VIEW_OPR'],
        'canAccessKwitansi' => true,
        'seeFee'            => true,
        'mode'              => 'PUSAT',
        'tokenHash'         => '160b252a97863b67d856e4af03045f8c7ae901392efc8aba34afbc6494c5fac9'
    ],
    '160b252a97863b67d856e4af03045f8c7ae901392efc8aba34afbc6494c5fac9' => [ // NSR-DIVTEK-2026 (Salted SHA-256)
        'sub'               => 'manager_teknik',
        'branch'            => 'PUSAT',
        'displayName'       => 'Deni Siswandi, S.T.',
        'role'              => 'MANAGER_TEKNIK',
        'roleLabel'         => 'Manager Teknik (Tingkat 1)',
        'title'             => 'Manager Teknik',
        'wilayah'           => 'PUSAT',
        'wilayahLabel'      => 'Kantor Pusat Jakarta',
        'wilayahCode'       => '00',
        'isSuperAdmin'      => false,
        'isMaster'          => false,
        'isCabang'          => false,
        'canApprove'        => true,
        'permissions'       => ['APPROVE_TEKNIK', 'SUBMIT_OPR', 'VIEW_OPR'],
        'canAccessKwitansi' => true,
        'seeFee'            => true,
        'mode'              => 'PUSAT',
        'tokenHash'         => '160b252a97863b67d856e4af03045f8c7ae901392efc8aba34afbc6494c5fac9'
    ],

    // 2. KEPALA KEUANGAN & PEMIMPIN REKAN (Ir. Nanang Rahayu, M.Ec.Dev. - [REDACTED_SUPER_ADMIN_TOKEN])
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
    ],
    '116f1fc38a65e1f069d617ef30be1bd2c693e9cb69950ea475a694af2594dd99' => [ // NSR-ADM-2026 (Raw SHA-256)
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
        'tokenHash'         => '4bdd71ba9f372106b9b52f9f0e8c1e6cfa4afb12857ff3f760b3df74dce0ca04'
    ],
    '4bdd71ba9f372106b9b52f9f0e8c1e6cfa4afb12857ff3f760b3df74dce0ca04' => [ // NSR-ADM-2026 (Salted SHA-256)
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
        'tokenHash'         => '4bdd71ba9f372106b9b52f9f0e8c1e6cfa4afb12857ff3f760b3df74dce0ca04'
    ],

    // 4. MANAGER KEUANGAN (Milda Hidayati Dewi, S.E. - NSR-KEU-2026)
    '107ee87beefd50d3ecf4c3ea6716c22cbff5330505ee747ce5d800f77c94f32d' => [ // NSR-KEU-2026 (Raw SHA-256)
        'sub'               => 'keuangan_milda',
        'branch'            => 'PUSAT',
        'displayName'       => 'Milda Hidayati Dewi, S.E.',
        'role'              => 'MANAGER_KEUANGAN',
        'roleLabel'         => 'Manager Keuangan (Tingkat 2)',
        'title'             => 'Manager Keuangan',
        'wilayah'           => 'PUSAT',
        'wilayahLabel'      => 'Kantor Pusat Jakarta',
        'wilayahCode'       => '00',
        'isSuperAdmin'      => false,
        'isMaster'          => false,
        'isCabang'          => false,
        'canApprove'        => true,
        'permissions'       => ['APPROVE_KEUANGAN', 'SUBMIT_OPR', 'VIEW_OPR'],
        'canAccessKwitansi' => true,
        'seeFee'            => true,
        'mode'              => 'PUSAT',
        'tokenHash'         => '57344967696ffd47737ce0558f151d480c8ac15ee94ecfbe9b045d25d123e6a0'
    ],
    '57344967696ffd47737ce0558f151d480c8ac15ee94ecfbe9b045d25d123e6a0' => [ // NSR-KEU-2026 (Salted SHA-256)
        'sub'               => 'keuangan_milda',
        'branch'            => 'PUSAT',
        'displayName'       => 'Milda Hidayati Dewi, S.E.',
        'role'              => 'MANAGER_KEUANGAN',
        'roleLabel'         => 'Manager Keuangan (Tingkat 2)',
        'title'             => 'Manager Keuangan',
        'wilayah'           => 'PUSAT',
        'wilayahLabel'      => 'Kantor Pusat Jakarta',
        'wilayahCode'       => '00',
        'isSuperAdmin'      => false,
        'isMaster'          => false,
        'isCabang'          => false,
        'canApprove'        => true,
        'permissions'       => ['APPROVE_KEUANGAN', 'SUBMIT_OPR', 'VIEW_OPR'],
        'canAccessKwitansi' => true,
        'seeFee'            => true,
        'mode'              => 'PUSAT',
        'tokenHash'         => '57344967696ffd47737ce0558f151d480c8ac15ee94ecfbe9b045d25d123e6a0'
    ],

    // 5. TOKENS STAF BIASA (DIBLOKIR TOTAL DARI SELURUH ENDPOINT APPROVAL/REJECT)
    // Penilai Properti (NSR-VAL-2026)
    '5801bb3891c492e6497bd5c0eb4d583606d07eed0058c05f8d4238c114b9f3e1' => [ // NSR-VAL-2026 (Raw SHA-256)
        'sub'               => 'penilai_pst',
        'branch'            => 'PUSAT',
        'displayName'       => 'Tim Penilai Properti',
        'role'              => 'PENILAI',
        'roleLabel'         => 'Penilai (Staff)',
        'title'             => 'Penilai Properti',
        'wilayah'           => 'PUSAT',
        'wilayahCode'       => '00',
        'isSuperAdmin'      => false,
        'isMaster'          => false,
        'isCabang'          => false,
        'canApprove'        => false,
        'permissions'       => ['SUBMIT_OPR', 'VIEW_OPR'],
        'canAccessKwitansi' => false,
        'seeFee'            => false,
        'mode'              => 'PUSAT',
        'tokenHash'         => 'd20c67b282eb9d0ad3ce9c651ce01b8d6f35466e11c80a20cbeef67656436c2e'
    ],
    'd20c67b282eb9d0ad3ce9c651ce01b8d6f35466e11c80a20cbeef67656436c2e' => [ // NSR-VAL-2026 (Salted SHA-256)
        'sub'               => 'penilai_pst',
        'branch'            => 'PUSAT',
        'displayName'       => 'Tim Penilai Properti',
        'role'              => 'PENILAI',
        'roleLabel'         => 'Penilai (Staff)',
        'title'             => 'Penilai Properti',
        'wilayah'           => 'PUSAT',
        'wilayahLabel'      => 'Kantor Pusat Jakarta',
        'wilayahCode'       => '00',
        'isSuperAdmin'      => false,
        'isMaster'          => false,
        'isCabang'          => false,
        'canApprove'        => false,
        'permissions'       => ['SUBMIT_OPR', 'VIEW_OPR'],
        'canAccessKwitansi' => false,
        'seeFee'            => false,
        'mode'              => 'PUSAT',
        'tokenHash'         => 'd20c67b282eb9d0ad3ce9c651ce01b8d6f35466e11c80a20cbeef67656436c2e'
    ],

    // Surveyor Lapangan (NSR-SRV-2026 - Holik Kelana)
    '422e642284f66071b52b6cd23e4856ee7e5acf6735f0bc5754173c270c487d4b' => [ // NSR-SRV-2026 (Raw SHA-256)
        'sub'               => 'surveyor_pst',
        'branch'            => 'PUSAT',
        'displayName'       => 'Holik Kelana',
        'role'              => 'SURVEYOR',
        'roleLabel'         => 'Surveyor Lapangan (Staff)',
        'title'             => 'Surveyor Lapangan',
        'wilayah'           => 'PUSAT',
        'wilayahCode'       => '00',
        'isSuperAdmin'      => false,
        'isMaster'          => false,
        'isCabang'          => false,
        'canApprove'        => false,
        'permissions'       => ['SUBMIT_OPR', 'VIEW_OPR'],
        'canAccessKwitansi' => false,
        'seeFee'            => false,
        'mode'              => 'PUSAT',
        'tokenHash'         => 'f0e728cbb8ea9ea8b8b53908922bffc081dc22e50855f9d4601a14ed513d7721'
    ],
    'f0e728cbb8ea9ea8b8b53908922bffc081dc22e50855f9d4601a14ed513d7721' => [ // NSR-SRV-2026 (Salted SHA-256)
        'sub'               => 'surveyor_pst',
        'branch'            => 'PUSAT',
        'displayName'       => 'Holik Kelana',
        'role'              => 'SURVEYOR',
        'roleLabel'         => 'Surveyor Lapangan (Staff)',
        'title'             => 'Surveyor Lapangan',
        'wilayah'           => 'PUSAT',
        'wilayahCode'       => '00',
        'isSuperAdmin'      => false,
        'isMaster'          => false,
        'isCabang'          => false,
        'canApprove'        => false,
        'permissions'       => ['SUBMIT_OPR', 'VIEW_OPR'],
        'canAccessKwitansi' => false,
        'seeFee'            => false,
        'mode'              => 'PUSAT',
        'tokenHash'         => 'f0e728cbb8ea9ea8b8b53908922bffc081dc22e50855f9d4601a14ed513d7721'
    ],

    // Marketing (NSR-MKT-2026)
    '336c1d03b83f9a89f3f1fc33cc42192345b435f6e72f8e72ad43aaaaae6310fe' => [ // NSR-MKT-2026 (Raw SHA-256)
        'sub'               => 'marketing_pst',
        'branch'            => 'PUSAT',
        'displayName'       => 'Divisi Marketing & Bisnis',
        'role'              => 'MARKETING',
        'roleLabel'         => 'Marketing (Staff)',
        'title'             => 'Marketing',
        'wilayah'           => 'PUSAT',
        'wilayahCode'       => '00',
        'isSuperAdmin'      => false,
        'isMaster'          => false,
        'isCabang'          => false,
        'canApprove'        => false,
        'permissions'       => ['SUBMIT_OPR', 'VIEW_OPR'],
        'canAccessKwitansi' => false,
        'seeFee'            => false,
        'mode'              => 'PUSAT',
        'tokenHash'         => '9977faeecaba8f98d6639482a0d7160d66a3886f5af70be176de7f9632562b59'
    ],
    '9977faeecaba8f98d6639482a0d7160d66a3886f5af70be176de7f9632562b59' => [ // NSR-MKT-2026 (Salted SHA-256)
        'sub'               => 'marketing_pst',
        'branch'            => 'PUSAT',
        'displayName'       => 'Divisi Marketing & Bisnis',
        'role'              => 'MARKETING',
        'roleLabel'         => 'Marketing (Staff)',
        'title'             => 'Marketing',
        'wilayah'           => 'PUSAT',
        'wilayahCode'       => '00',
        'isSuperAdmin'      => false,
        'isMaster'          => false,
        'isCabang'          => false,
        'canApprove'        => false,
        'permissions'       => ['SUBMIT_OPR', 'VIEW_OPR'],
        'canAccessKwitansi' => false,
        'seeFee'            => false,
        'mode'              => 'PUSAT',
        'tokenHash'         => '9977faeecaba8f98d6639482a0d7160d66a3886f5af70be176de7f9632562b59'
    ],

    // 6. AUDIT TOKEN LAMA (HAK APPROVAL TEKNIS DICABUT DARI TOKEN UMUM)
    // NSR-REK-2026 (Rekan Mitra Umum - Hak approval teknis dicabut, hanya submit & view)
    '77d4e819966f67807537cf7e995ab765b911fc6be3d5101bbc0da473e9dbe4f2' => [ // NSR-REK-2026 (Raw SHA-256)
        'sub'               => 'rekan_umum',
        'branch'            => 'PUSAT',
        'displayName'       => 'Rekan Penilai',
        'role'              => 'REKAN',
        'roleLabel'         => 'Rekan (Mitra Umum)',
        'title'             => 'Rekan Penilai',
        'wilayah'           => 'PUSAT',
        'wilayahLabel'      => 'Kantor Pusat Jakarta',
        'wilayahCode'       => '00',
        'isSuperAdmin'      => false,
        'isMaster'          => false,
        'isCabang'          => false,
        'canApprove'        => false,
        'permissions'       => ['SUBMIT_OPR', 'VIEW_OPR'],
        'canAccessKwitansi' => true,
        'seeFee'            => true,
        'mode'              => 'PUSAT',
        'tokenHash'         => 'f2a37212daa7c1a9716ca9e5957107a263e3bd11dedc1ae2f23814e5625590a2'
    ],
    'f2a37212daa7c1a9716ca9e5957107a263e3bd11dedc1ae2f23814e5625590a2' => [ // NSR-REK-2026 (Salted SHA-256)
        'sub'               => 'rekan_umum',
        'branch'            => 'PUSAT',
        'displayName'       => 'Rekan Penilai',
        'role'              => 'REKAN',
        'roleLabel'         => 'Rekan (Mitra Umum)',
        'title'             => 'Rekan Penilai',
        'wilayah'           => 'PUSAT',
        'wilayahLabel'      => 'Kantor Pusat Jakarta',
        'wilayahCode'       => '00',
        'isSuperAdmin'      => false,
        'isMaster'          => false,
        'isCabang'          => false,
        'canApprove'        => false,
        'permissions'       => ['SUBMIT_OPR', 'VIEW_OPR'],
        'canAccessKwitansi' => true,
        'seeFee'            => true,
        'mode'              => 'PUSAT',
        'tokenHash'         => 'f2a37212daa7c1a9716ca9e5957107a263e3bd11dedc1ae2f23814e5625590a2'
    ],

    // NSR-REV-2026 (Reviewer Mutu - Hak approval dicabut, wajib pakai NSR-DIVTEK-2026 untuk approval teknik)
    'da9ed250de0559c0e8cf6631bbd6e93375eec43c4d114d0f4f1ae17a4f5dd3a9' => [ // NSR-REV-2026 (Raw SHA-256)
        'sub'               => 'reviewer_pst',
        'branch'            => 'PUSAT',
        'displayName'       => 'Reviewer Kendali Mutu',
        'role'              => 'REVIEWER',
        'roleLabel'         => 'Reviewer Mutu Teknis',
        'title'             => 'Reviewer',
        'wilayah'           => 'PUSAT',
        'wilayahCode'       => '00',
        'isSuperAdmin'      => false,
        'isCabang'          => false,
        'canApprove'        => false,
        'permissions'       => ['SUBMIT_OPR', 'VIEW_OPR'],
        'mode'              => 'PUSAT',
        'tokenHash'         => 'cf86dd7ad31d605d308c86f51f623664dfe786bcd0933d67b7b024a768f704f9'
    ],
    'cf86dd7ad31d605d308c86f51f623664dfe786bcd0933d67b7b024a768f704f9' => [ // NSR-REV-2026 (Salted SHA-256)
        'sub'               => 'reviewer_pst',
        'branch'            => 'PUSAT',
        'displayName'       => 'Reviewer Kendali Mutu',
        'role'              => 'REVIEWER',
        'roleLabel'         => 'Reviewer Mutu Teknis',
        'title'             => 'Reviewer',
        'wilayah'           => 'PUSAT',
        'wilayahCode'       => '00',
        'isSuperAdmin'      => false,
        'isCabang'          => false,
        'canApprove'        => false,
        'permissions'       => ['SUBMIT_OPR', 'VIEW_OPR'],
        'mode'              => 'PUSAT',
        'tokenHash'         => 'cf86dd7ad31d605d308c86f51f623664dfe786bcd0933d67b7b024a768f704f9'
    ],

    // 7. TOKENS KANTOR CABANG (DILARANG MENGAKSES e-OPERASIONAL)
    // Admin Cabang Bandung ([REDACTED_CAB_BDG_TOKEN])
    'bcd695bca78dc5ba9049afde667fc0c0e81409e9f4aee317936b24634d8bb818' => [
        'sub'          => 'cabang_bdg',
        'branch'       => 'Bandung',
        'displayName'  => 'Kantor Cabang Bandung',
        'role'         => 'ADMIN_CABANG',
        'roleLabel'    => 'Admin Cabang Bandung',
        'wilayah'      => 'Bandung',
        'wilayahCode'  => '04',
        'isSuperAdmin' => false,
        'isCabang'     => true,
        'canApprove'   => false,
        'permissions'  => [],
        'mode'         => 'CABANG',
        'tokenHash'    => '974e90dc35652f926a4951c49ab969a70df89f90f82af08419a0d13bfe4e927d',
        'kodeKemenkeu' => '2.19.0160-04'
    ],
    '974e90dc35652f926a4951c49ab969a70df89f90f82af08419a0d13bfe4e927d' => [
        'sub'          => 'cabang_bdg',
        'branch'       => 'Bandung',
        'displayName'  => 'Kantor Cabang Bandung',
        'role'         => 'ADMIN_CABANG',
        'roleLabel'    => 'Admin Cabang Bandung',
        'wilayah'      => 'Bandung',
        'wilayahCode'  => '04',
        'isSuperAdmin' => false,
        'isCabang'     => true,
        'canApprove'   => false,
        'permissions'  => [],
        'mode'         => 'CABANG',
        'tokenHash'    => '974e90dc35652f926a4951c49ab969a70df89f90f82af08419a0d13bfe4e927d',
        'kodeKemenkeu' => '2.19.0160-04'
    ],
    // Admin Cabang Padang (NSR-PDG-2026)
    '45b948d3c75010dcf2b4963c1275e2f0c982df88658616b3d0edaae59e9cd62c' => [
        'sub'          => 'cabang_pdg',
        'branch'       => 'Padang',
        'displayName'  => 'Kantor Cabang Padang',
        'role'         => 'ADMIN_CABANG',
        'roleLabel'    => 'Admin Cabang Padang',
        'wilayah'      => 'Padang',
        'wilayahCode'  => '01',
        'isSuperAdmin' => false,
        'isCabang'     => true,
        'canApprove'   => false,
        'permissions'  => [],
        'mode'         => 'CABANG',
        'tokenHash'    => 'db6da2b4cde952d408263966d2106faebe6ff26c5df15656961d5c1e64ab0495',
        'kodeKemenkeu' => '2.19.0160-01'
    ],
    'db6da2b4cde952d408263966d2106faebe6ff26c5df15656961d5c1e64ab0495' => [
        'sub'          => 'cabang_pdg',
        'branch'       => 'Padang',
        'displayName'  => 'Kantor Cabang Padang',
        'role'         => 'ADMIN_CABANG',
        'roleLabel'    => 'Admin Cabang Padang',
        'wilayah'      => 'Padang',
        'wilayahCode'  => '01',
        'isSuperAdmin' => false,
        'isCabang'     => true,
        'canApprove'   => false,
        'permissions'  => [],
        'mode'         => 'CABANG',
        'tokenHash'    => 'db6da2b4cde952d408263966d2106faebe6ff26c5df15656961d5c1e64ab0495',
        'kodeKemenkeu' => '2.19.0160-01'
    ],
    // Admin Cabang Makassar (NSR-MKS-2026)
    '26b296fa1352b67bae6d91added689f695fe52d2500aa9d58f7cbf91826e613e' => [
        'sub'          => 'cabang_mks',
        'branch'       => 'Makassar',
        'displayName'  => 'Kantor Cabang Makassar',
        'role'         => 'ADMIN_CABANG',
        'roleLabel'    => 'Admin Cabang Makassar',
        'wilayah'      => 'Makassar',
        'wilayahCode'  => '02',
        'isSuperAdmin' => false,
        'isCabang'     => true,
        'canApprove'   => false,
        'permissions'  => [],
        'mode'         => 'CABANG',
        'tokenHash'    => 'f5aadfecaf3ab9a3440cf6e0886514d80a7ea78925e9e8eaa9e303f7f0474569',
        'kodeKemenkeu' => '2.19.0160-02'
    ],
    'f5aadfecaf3ab9a3440cf6e0886514d80a7ea78925e9e8eaa9e303f7f0474569' => [
        'sub'          => 'cabang_mks',
        'branch'       => 'Makassar',
        'displayName'  => 'Kantor Cabang Makassar',
        'role'         => 'ADMIN_CABANG',
        'roleLabel'    => 'Admin Cabang Makassar',
        'wilayah'      => 'Makassar',
        'wilayahCode'  => '02',
        'isSuperAdmin' => false,
        'isCabang'     => true,
        'canApprove'   => false,
        'permissions'  => [],
        'mode'         => 'CABANG',
        'tokenHash'    => 'f5aadfecaf3ab9a3440cf6e0886514d80a7ea78925e9e8eaa9e303f7f0474569',
        'kodeKemenkeu' => '2.19.0160-02'
    ],
    // Admin Cabang Palembang (NSR-PLB-2026)
    '1a3789dcc80802cfeeee3436a5297f946f88fd5e0e576de39849a3bffc0af31b' => [
        'sub'          => 'cabang_plb',
        'branch'       => 'Palembang',
        'displayName'  => 'Kantor Cabang Palembang',
        'role'         => 'ADMIN_CABANG',
        'roleLabel'    => 'Admin Cabang Palembang',
        'wilayah'      => 'Palembang',
        'wilayahCode'  => '03',
        'isSuperAdmin' => false,
        'isCabang'     => true,
        'canApprove'   => false,
        'permissions'  => [],
        'mode'         => 'CABANG',
        'tokenHash'    => 'e5298836aaaed72f1974a3191d5a23d59bb3990003ca7a288f9a41b2045d9827',
        'kodeKemenkeu' => '2.19.0160-03'
    ],
    'e5298836aaaed72f1974a3191d5a23d59bb3990003ca7a288f9a41b2045d9827' => [
        'sub'          => 'cabang_plb',
        'branch'       => 'Palembang',
        'displayName'  => 'Kantor Cabang Palembang',
        'role'         => 'ADMIN_CABANG',
        'roleLabel'    => 'Admin Cabang Palembang',
        'wilayah'      => 'Palembang',
        'wilayahCode'  => '03',
        'isSuperAdmin' => false,
        'isCabang'     => true,
        'canApprove'   => false,
        'permissions'  => [],
        'mode'         => 'CABANG',
        'tokenHash'    => 'e5298836aaaed72f1974a3191d5a23d59bb3990003ca7a288f9a41b2045d9827',
        'kodeKemenkeu' => '2.19.0160-03'
    ],
    // Keuangan Cabang (NSR-KAS-2026)
    'a01d6024094ea8618268233f1e73d79e400c76d36abb144b2d087896f2e3a6ca' => [
        'sub'          => 'kasir_cabang',
        'branch'       => 'CABANG',
        'displayName'  => 'Kasir & Keuangan Cabang',
        'role'         => 'KEUANGAN_CABANG',
        'roleLabel'    => 'Kasir Cabang',
        'wilayah'      => 'CABANG',
        'wilayahCode'  => '01',
        'isSuperAdmin' => false,
        'isCabang'     => true,
        'canApprove'   => false,
        'permissions'  => [],
        'mode'         => 'CABANG',
        'tokenHash'    => 'a9a08ee5cc8f8f8281a4f846624a35ed29a8af6ea20614089e8b64cfb01d32e9'
    ],
    'a9a08ee5cc8f8f8281a4f846624a35ed29a8af6ea20614089e8b64cfb01d32e9' => [
        'sub'          => 'kasir_cabang',
        'branch'       => 'CABANG',
        'displayName'  => 'Kasir & Keuangan Cabang',
        'role'         => 'KEUANGAN_CABANG',
        'roleLabel'    => 'Kasir Cabang',
        'wilayah'      => 'CABANG',
        'wilayahCode'  => '01',
        'isSuperAdmin' => false,
        'isCabang'     => true,
        'canApprove'   => false,
        'permissions'  => [],
        'mode'         => 'CABANG',
        'tokenHash'    => 'a9a08ee5cc8f8f8281a4f846624a35ed29a8af6ea20614089e8b64cfb01d32e9'
    ]
];`;

// Replace $OFFICIAL_TOKEN_HASHES array block
const regexTokenTable = /\/\/ 1\. DATA TOKENS RESMI UNTUK VALIDASI API[\s\S]*?\$OFFICIAL_TOKEN_HASHES\s*=\s*\[[\s\S]*?\n\];/;
if (!regexTokenTable.test(code)) {
    console.error('ERROR: Could not find regexTokenTable in operasional-data-handler.php');
    process.exit(1);
}
code = code.replace(regexTokenTable, tokenTable.replace(/\n/g, newline));
console.log('✓ Replaced $OFFICIAL_TOKEN_HASHES successfully.');

// 2. Add isStagingEnvironment() helper if not present
if (!code.includes('function isStagingEnvironment()')) {
    const helperTarget = 'function getOperasionalSecret($secretFile) {';
    const helperCode = `function isStagingEnvironment() {
    $host = strtolower($_SERVER['HTTP_HOST'] ?? '');
    if (in_array($host, ['localhost', '127.0.0.1'], true) || strpos($host, 'localhost:') === 0 || strpos($host, '127.0.0.1:') === 0) {
        return true;
    }
    if (preg_match('/\\.(lhr\\.life|trycloudflare\\.com|loca\\.lt|netlify\\.app)$/i', $host)) {
        return true;
    }
    return false;
}

` + helperTarget;
    code = code.replace(helperTarget, helperCode.replace(/\n/g, newline));
    console.log('✓ Added isStagingEnvironment() helper.');
}

// 3. Update resolveCurrentUser to support salted hashes
const oldResolveAuth = `        $upperHash = hash('sha256', strtoupper($trimmed));
        if (isset($officialTokenHashes[$upperHash])) {
            return $officialTokenHashes[$upperHash];
        }`;

const newResolveAuth = `        $upperHash = hash('sha256', strtoupper($trimmed));
        if (isset($officialTokenHashes[$upperHash])) {
            return $officialTokenHashes[$upperHash];
        }
        $saltedUpperHash = hash('sha256', 'KJPP_NSR_2026_CORE_AUTH::' . strtoupper($trimmed));
        if (isset($officialTokenHashes[$saltedUpperHash])) {
            return $officialTokenHashes[$saltedUpperHash];
        }
        $saltedRawHash = hash('sha256', 'KJPP_NSR_2026_CORE_AUTH::' . $trimmed);
        if (isset($officialTokenHashes[$saltedRawHash])) {
            return $officialTokenHashes[$saltedRawHash];
        }`;

if (code.includes(oldResolveAuth.replace(/\n/g, newline))) {
    code = code.replace(oldResolveAuth.replace(/\n/g, newline), newResolveAuth.replace(/\n/g, newline));
    console.log('✓ Updated resolveCurrentUser() with salted hash support.');
} else {
    console.log('Notice: resolveCurrentUser already updated or pattern differs.');
}

// 4. Update $isPusat roles to include MANAGER_TEKNIK, MANAGER_ADMIN, MANAGER_KEUANGAN, KEPALA_KEUANGAN
const oldPusatRoles = `in_array($userRole, ['SUPER ADMIN', 'SUPER_ADMIN', 'ADMIN_PUSAT', 'KEUANGAN', 'PEMIMPIN_REKAN', 'REKAN', 'REVIEWER', 'PENILAI', 'SURVEYOR', 'MARKETING'], true)`;
const newPusatRoles = `in_array($userRole, ['SUPER ADMIN', 'SUPER_ADMIN', 'ADMIN_PUSAT', 'KEUANGAN', 'PEMIMPIN_REKAN', 'REKAN', 'REVIEWER', 'PENILAI', 'SURVEYOR', 'MARKETING', 'MANAGER_TEKNIK', 'MANAGER_ADMIN', 'MANAGER_KEUANGAN', 'KEPALA_KEUANGAN'], true)`;

if (code.includes(oldPusatRoles.replace(/\n/g, newline))) {
    code = code.replace(oldPusatRoles.replace(/\n/g, newline), newPusatRoles.replace(/\n/g, newline));
    console.log('✓ Updated $isPusat roles array.');
}

// 5. Replace approveTier implementation
const approveTierRegex = /\/\/ F\. ACTION: approveTier \(Otorisasi Bertingkat Dinamis\)[\s\S]*?if \(\$action === 'approveTier'\) \{[\s\S]*?echo json_encode\(\$result\);\s*exit;\s*\}/;

const newApproveTier = `// F. ACTION: approveTier (Otorisasi Bertingkat Dinamis & RBAC Ketat)
if ($action === 'approveTier') {
    $rawInput = file_get_contents('php://input');
    $payload = json_decode($rawInput, true);
    if (!is_array($payload)) {
        $payload = $_POST;
    }

    $id = trim($payload['id'] ?? '');
    $tier = (int)($payload['tier'] ?? 0);

    if (!$id || $tier < 1 || $tier > 5) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Parameter id dan tier (1..5) wajib diisi.']);
        exit;
    }

    $result = mutateDatabaseOperasional($dataFile, $lockFile, function(&$records) use ($id, $tier, $currentUser, $userRole, $SERVER_SECRET) {
        $now = date('Y-m-d H:i:s');
        $targetIndex = -1;

        foreach ($records as $idx => $r) {
            if (($r['id'] ?? '') === $id || ($r['noRegistrasi'] ?? '') === $id) {
                $targetIndex = $idx;
                break;
            }
        }

        if ($targetIndex < 0) {
            return ['success' => false, 'http_code' => 404, 'error' => 'Dokumen pengajuan tidak ditemukan.'];
        }

        $doc = $records[$targetIndex];

        // Status dokumen harus SUBMITTED atau IN_REVIEW
        $status = $doc['status'] ?? 'DRAFT';
        if ($status === 'DRAFT') {
            return ['success' => false, 'http_code' => 400, 'error' => 'Dokumen masih berstatus DRAFT dan belum disubmit oleh pemohon.'];
        }
        if ($status === 'REJECTED') {
            return ['success' => false, 'http_code' => 400, 'error' => 'Dokumen berstatus REJECTED. Pemohon harus mengajukan revisi sebelum otorisasi dapat dilanjutkan.'];
        }
        if ($status === 'APPROVED') {
            return ['success' => false, 'http_code' => 400, 'error' => 'Dokumen sudah disetujui sepenuhnya (Semua Tingkat Selesai).'];
        }

        if (!isset($doc['approvals'][$tier])) {
            return ['success' => false, 'http_code' => 400, 'error' => "Tahap otorisasi Tier {$tier} tidak terdapat pada alur dokumen ini."];
        }

        // Periksa apakah Tier ini sudah disetujui sebelumnya
        if (!empty($doc['approvals'][$tier]['approved'])) {
            return ['success' => false, 'http_code' => 400, 'error' => "Tier {$tier} sudah disetujui sebelumnya."];
        }

        // 1. ISOLASI KREDENSIAL STAGING: Tolak token staging di environment produksi
        if (!empty($currentUser['isStaging']) && !isStagingEnvironment()) {
            return [
                'success'   => false,
                'http_code' => 403,
                'error'     => 'Akses Ditolak (403 Forbidden): Kredensial staging/demo tidak diizinkan untuk melakukan otorisasi pada sistem produksi.'
            ];
        }

        // 2. BLOKIR SELURUH TOKEN STAF (FAIL-CLOSED)
        $userCanApprove = !empty($currentUser['canApprove']);
        $userPermissions = $currentUser['permissions'] ?? [];
        if (!$userCanApprove || empty($userPermissions)) {
            return [
                'success'   => false,
                'http_code' => 403,
                'error'     => "Akses Ditolak (403 Forbidden): Akun Anda ({$userRole}) adalah akun staf dan tidak memiliki wewenang approval dokumen operasional."
            ];
        }

        // 3. PEMETAAN HAK AKSES PER-TIER SECARA KETAT (STRICT SEPARATION OF DUTIES)
        // Tidak ada peran superadmin otomatis yang melewati otorisasi per-tier!
        $step = $doc['approvals'][$tier] ?? [];
        $roleKey = $step['roleKey'] ?? '';
        $labelTarget = $step['label'] ?? "Tier {$tier}";
        $isLegacy5Tier = (($doc['workflowSystem'] ?? '') === '5_TIER') || (count($doc['approvals'] ?? []) === 5 && !isset($step['tingkat']));

        $requiredPerm = null;
        $authorizedRoleTitle = '';
        if ($roleKey === 'TEKNIK') {
            $requiredPerm = 'APPROVE_TEKNIK';
            $authorizedRoleTitle = 'Manager Teknik (Deni Siswandi, S.T.)';
        } elseif ($roleKey === 'ADMIN_UMUM') {
            $requiredPerm = 'APPROVE_ADMIN';
            $authorizedRoleTitle = 'Manager Admin & Umum (Danny Taufik Hidayat, S.H.)';
        } elseif ($roleKey === 'KEUANGAN') {
            $requiredPerm = 'APPROVE_KEUANGAN';
            $authorizedRoleTitle = 'Manager Keuangan (Milda Hidayati Dewi, S.E.)';
        } elseif ($roleKey === 'KEPALA_KEUANGAN') {
            $requiredPerm = 'APPROVE_KEPALA_KEUANGAN';
            $authorizedRoleTitle = 'Kepala Keuangan (Ir. Nanang Rahayu, M.Ec.Dev.)';
        } elseif ($isLegacy5Tier) {
            if ($tier === 2) {
                $requiredPerm = 'APPROVE_TEKNIK';
                $authorizedRoleTitle = 'Manager Teknik (Deni Siswandi, S.T.)';
            } elseif ($tier === 3) {
                $requiredPerm = 'APPROVE_ADMIN';
                $authorizedRoleTitle = 'Manager Admin & Umum (Danny Taufik Hidayat, S.H.)';
            } elseif ($tier === 4) {
                $requiredPerm = 'APPROVE_KEUANGAN';
                $authorizedRoleTitle = 'Manager Keuangan (Milda Hidayati Dewi, S.E.)';
            } elseif ($tier === 5) {
                $requiredPerm = 'APPROVE_KEPALA_KEUANGAN';
                $authorizedRoleTitle = 'Kepala Keuangan (Ir. Nanang Rahayu, M.Ec.Dev.)';
            }
        }

        if (!$requiredPerm || !in_array($requiredPerm, $userPermissions, true)) {
            return [
                'success'   => false,
                'http_code' => 403,
                'error'     => "Akses Ditolak (403 Forbidden): Akun Anda ({$userRole}) tidak memiliki izin {$requiredPerm} untuk mengesahkan {$labelTarget}. Wewenang ini khusus untuk {$authorizedRoleTitle}."
            ];
        }

        // 4. PENEGAKAN URUTAN PERSATUAN (SEQUENTIAL ENFORCEMENT)
        // Tahapan approval yang belum memenuhi syarat harus ditolak.
        $alurDoc = strtoupper(trim($doc['alur'] ?? ''));
        $targetTingkat = $step['tingkat'] ?? $tier;

        if ($isLegacy5Tier) {
            // Urutan linear ketat legacy 1 -> 2 -> 3 -> 4 -> 5
            if ($tier > 1) {
                $prevTier = $tier - 1;
                $prevApproval = $doc['approvals'][$prevTier] ?? null;
                if (!$prevApproval || empty($prevApproval['approved'])) {
                    return [
                        'success'   => false,
                        'http_code' => 400,
                        'error'     => "Persetujuan harus berurutan. Tahap {$prevTier} (" . ($prevApproval['label'] ?? '') . ") belum disetujui."
                    ];
                }
            }
        } elseif ($alurDoc === 'LINTAS_DIVISI' || $alurDoc === 'LINTAS') {
            // JALUR LINTAS DIVISI:
            // Tingkat 1 membutuhkan KEDUA approval (Tier 1: Manager Teknik & Tier 2: Manager Admin) sebelum lanjut ke Keuangan (Tier 3)!
            if ($targetTingkat === 2 || $tier === 3) {
                $tier1Approved = !empty($doc['approvals'][1]['approved']);
                $tier2Approved = !empty($doc['approvals'][2]['approved']);
                if (!$tier1Approved || !$tier2Approved) {
                    $belum = [];
                    if (!$tier1Approved) $belum[] = $doc['approvals'][1]['label'] ?? 'Manager Teknik';
                    if (!$tier2Approved) $belum[] = $doc['approvals'][2]['label'] ?? 'Manager Admin & Umum';
                    return [
                        'success'   => false,
                        'http_code' => 400,
                        'error'     => "Persetujuan Lintas Divisi memerlukan persetujuan lengkap Tingkat 1 sebelum lanjut ke Keuangan. Tahap yang belum disetujui: " . implode(' & ', $belum) . "."
                    ];
                }
            } elseif ($targetTingkat === 3 || $tier === 4) {
                $keuApproved = !empty($doc['approvals'][3]['approved']);
                if (!$keuApproved) {
                    return [
                        'success'   => false,
                        'http_code' => 400,
                        'error'     => "Persetujuan akhir Kepala Keuangan (Tingkat 3) hanya dapat dilakukan setelah Verifikasi Manager Keuangan (Tingkat 2) disetujui."
                    ];
                }
            }
        } else {
            // JALUR TEKNIS ATAU ADMIN_UMUM (Workflow 3-Tingkat Standar):
            // Tingkat 2 (Keuangan) WAJIB menunggu Tingkat 1 (Manager Divisi) selesai
            if ($targetTingkat === 2 || $tier === 2) {
                $prevApproval = $doc['approvals'][1] ?? null;
                if (!$prevApproval || empty($prevApproval['approved'])) {
                    return [
                        'success'   => false,
                        'http_code' => 400,
                        'error'     => "Persetujuan harus berurutan. Tahap 1 (" . ($prevApproval['label'] ?? 'Manager Divisi') . ") belum disetujui."
                    ];
                }
            } elseif ($targetTingkat === 3 || $tier === 3) {
                // Tingkat 3 (Kepala Keuangan) WAJIB menunggu Tingkat 2 (Manager Keuangan) selesai
                $prevApproval = $doc['approvals'][2] ?? null;
                if (!$prevApproval || empty($prevApproval['approved'])) {
                    return [
                        'success'   => false,
                        'http_code' => 400,
                        'error'     => "Persetujuan harus berurutan. Tahap 2 (" . ($prevApproval['label'] ?? 'Manager Keuangan') . ") belum disetujui."
                    ];
                }
            }
        }

        // 5. TENTUKAN NAMA & JABATAN PEJABAT RESMI
        $pejabatNama = !empty($currentUser['displayName']) ? $currentUser['displayName'] : ($step['pejabat'] ?? 'Pejabat Berwenang');
        $pejabatJabatan = $step['jabatan'] ?? 'Pejabat';

        // 6. HITUNG CRYPTOGRAPHIC HMAC TOKEN
        $contentDigest = generateContentDigest($doc);
        $hmac = generateTierHmac(
            $doc['id'],
            $tier,
            $doc['versi'] ?? 1,
            $contentDigest,
            $pejabatNama,
            $pejabatJabatan,
            $now,
            $SERVER_SECRET
        );

        $qrUrl = generateQrVerificationUrl($doc['noRegistrasi'] ?: $doc['id'], $tier, $hmac);

        // 7. REKAM PERSETUJUAN
        $doc['approvals'][$tier]['approved'] = true;
        $doc['approvals'][$tier]['approvedAt'] = $now;
        $doc['approvals'][$tier]['approvedBy'] = $pejabatNama;
        $doc['approvals'][$tier]['pejabat'] = $pejabatNama;
        $doc['approvals'][$tier]['hmacHash'] = $hmac;
        $doc['approvals'][$tier]['qrUrl'] = $qrUrl;

        // Update status dokumen (Jika semua tier selesai -> APPROVED)
        $allDone = true;
        foreach ($doc['approvals'] as $a) {
            if (empty($a['approved'])) {
                $allDone = false;
                break;
            }
        }
        if ($allDone) {
            $doc['status'] = 'APPROVED';
        } else {
            $doc['status'] = 'IN_REVIEW';
        }
        $doc['updatedAt'] = $now;

        $doc['auditTrail'][] = [
            'action'     => 'APPROVE_TIER_' . $tier,
            'timestamp'  => $now,
            'user'       => $pejabatNama,
            'role'       => $userRole,
            'keterangan' => "Tier {$tier} (" . ($doc['approvals'][$tier]['label'] ?? '') . ") disetujui secara sah oleh {$pejabatNama}."
        ];

        $records[$targetIndex] = $doc;

        return [
            'success' => true,
            'records' => $records,
            'data'    => $doc,
            'message' => "Persetujuan Tier {$tier} (" . ($doc['approvals'][$tier]['label'] ?? '') . ") berhasil disahkan oleh {$pejabatNama}."
        ];
    });

    if (empty($result['success'])) {
        http_response_code($result['http_code'] ?? 500);
        echo json_encode($result);
        exit;
    }

    echo json_encode($result);
    exit;
}`;

if (!approveTierRegex.test(code)) {
    console.error('ERROR: Could not find approveTierRegex in operasional-data-handler.php');
    process.exit(1);
}
code = code.replace(approveTierRegex, newApproveTier.replace(/\n/g, newline));
console.log('✓ Replaced approveTier handler successfully.');

// 6. Replace rejectWithNote implementation
const rejectRegex = /\/\/ G\. ACTION: rejectWithNote \(Penolakan dengan Alasan Minimal 10 Karakter\)[\s\S]*?if \(\$action === 'rejectWithNote'\) \{[\s\S]*?echo json_encode\(\$result\);\s*exit;\s*\}/;

const newReject = `// G. ACTION: rejectWithNote (Penolakan dengan Alasan Minimal 10 Karakter & RBAC Ketat)
if ($action === 'rejectWithNote') {
    $rawInput = file_get_contents('php://input');
    $payload = json_decode($rawInput, true);
    if (!is_array($payload)) {
        $payload = $_POST;
    }

    $id = trim($payload['id'] ?? '');
    $alasan = trim($payload['alasan'] ?? '');
    $tier = (int)($payload['tier'] ?? 0);

    if (!$id) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Parameter id dokumen wajib diisi.']);
        exit;
    }

    if (strlen($alasan) < 10) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'error'   => 'Alasan penolakan wajib diisi secara jelas dengan minimal 10 karakter.'
        ]);
        exit;
    }

    $result = mutateDatabaseOperasional($dataFile, $lockFile, function(&$records) use ($id, $alasan, $tier, $currentUser, $userRole) {
        $now = date('Y-m-d H:i:s');
        $targetIndex = -1;

        foreach ($records as $idx => $r) {
            if (($r['id'] ?? '') === $id || ($r['noRegistrasi'] ?? '') === $id) {
                $targetIndex = $idx;
                break;
            }
        }

        if ($targetIndex < 0) {
            return ['success' => false, 'http_code' => 404, 'error' => 'Dokumen pengajuan tidak ditemukan.'];
        }

        // 1. ISOLASI KREDENSIAL STAGING: Tolak token staging di environment produksi
        if (!empty($currentUser['isStaging']) && !isStagingEnvironment()) {
            return [
                'success'   => false,
                'http_code' => 403,
                'error'     => 'Akses Ditolak (403 Forbidden): Kredensial staging/demo tidak diizinkan untuk menolak dokumen pada sistem produksi.'
            ];
        }

        // 2. BLOKIR SELURUH TOKEN STAF (FAIL-CLOSED)
        $userCanApprove = !empty($currentUser['canApprove']);
        $userPermissions = $currentUser['permissions'] ?? [];
        if (!$userCanApprove || empty($userPermissions)) {
            return [
                'success'   => false,
                'http_code' => 403,
                'error'     => "Akses Ditolak (403 Forbidden): Akun Anda ({$userRole}) adalah akun staf dan tidak memiliki hak wewenang otorisasi penolakan dokumen operasional."
            ];
        }

        $doc = $records[$targetIndex];

        // 3. VALIDASI WEWENANG PENOLAKAN SESUAI TIER
        if ($tier > 0 && isset($doc['approvals'][$tier])) {
            $step = $doc['approvals'][$tier];
            $roleKey = $step['roleKey'] ?? '';
            $requiredPerm = null;
            if ($roleKey === 'TEKNIK') $requiredPerm = 'APPROVE_TEKNIK';
            elseif ($roleKey === 'ADMIN_UMUM') $requiredPerm = 'APPROVE_ADMIN';
            elseif ($roleKey === 'KEUANGAN') $requiredPerm = 'APPROVE_KEUANGAN';
            elseif ($roleKey === 'KEPALA_KEUANGAN') $requiredPerm = 'APPROVE_KEPALA_KEUANGAN';

            if ($requiredPerm && !in_array($requiredPerm, $userPermissions, true)) {
                return [
                    'success'   => false,
                    'http_code' => 403,
                    'error'     => "Akses Ditolak (403 Forbidden): Anda tidak memiliki izin {$requiredPerm} untuk menolak pengajuan pada tahap ini."
                ];
            }
        } else {
            $hasAnyApproval = false;
            foreach (['APPROVE_TEKNIK', 'APPROVE_ADMIN', 'APPROVE_KEUANGAN', 'APPROVE_KEPALA_KEUANGAN'] as $p) {
                if (in_array($p, $userPermissions, true)) {
                    $hasAnyApproval = true;
                    break;
                }
            }
            if (!$hasAnyApproval) {
                return [
                    'success'   => false,
                    'http_code' => 403,
                    'error'     => "Akses Ditolak (403 Forbidden): Anda tidak memiliki hak otorisasi penolakan dokumen operasional."
                ];
            }
        }

        $penolakNama = $currentUser['displayName'] ?? 'Pejabat Berwenang';

        // Status dokumen diubah menjadi REJECTED
        $doc['status'] = 'REJECTED';
        $doc['updatedAt'] = $now;
        $doc['penolakan'] = [
            'alasan'      => $alasan,
            'ditolakOleh' => $penolakNama,
            'tglDitolak'  => $now,
            'tierDitolak' => $tier ?: 0
        ];

        $doc['auditTrail'][] = [
            'action'     => 'REJECT_DOCUMENT',
            'timestamp'  => $now,
            'user'       => $penolakNama,
            'role'       => $userRole,
            'keterangan' => "Pengajuan ditolak pada Tier " . ($tier ?: 'Review') . " oleh {$penolakNama}. Alasan: " . $alasan
        ];

        $records[$targetIndex] = $doc;

        return [
            'success' => true,
            'records' => $records,
            'data'    => $doc,
            'message' => 'Pengajuan berhasil ditolak dan catatan telah disampaikan.'
        ];
    });

    if (empty($result['success'])) {
        http_response_code($result['http_code'] ?? 500);
        echo json_encode($result);
        exit;
    }

    echo json_encode($result);
    exit;
}`;

if (!rejectRegex.test(code)) {
    console.error('ERROR: Could not find rejectRegex in operasional-data-handler.php');
    process.exit(1);
}
code = code.replace(rejectRegex, newReject.replace(/\n/g, newline));
console.log('✓ Replaced rejectWithNote handler successfully.');

// Write updated code back
fs.writeFileSync(operasionalPath, code, 'utf8');
console.log('✓ operasional-data-handler.php updated successfully.');
