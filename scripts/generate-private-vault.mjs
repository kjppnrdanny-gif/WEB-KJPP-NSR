import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const configDir = path.join(ROOT_DIR, 'data', 'config');

if (!fs.existsSync(configDir)) {
  fs.mkdirSync(configDir, { recursive: true });
}
fs.writeFileSync(path.join(configDir, '.htaccess'), 'Require all denied\nDeny from all\n', 'utf8');

function saltedHash(token) {
  return crypto.createHash('sha256').update('KJPP_NSR_2026_CORE_AUTH::' + token.toUpperCase().trim()).digest('hex');
}

function passHash(password) {
  return crypto.createHash('sha256').update('KJPP_NSR_2026_CORE_PASS::' + password).digest('hex');
}

const registry = {
  token_hashes: {},
  user_accounts: {
    'admin': {
      'passHash': passHash('NSR_Admin_Pusat_2026_Secured!'),
      'role': 'ADMIN_PUSAT',
      'branch': 'Pusat',
      'displayName': 'Admin Pusat Jakarta',
      'title': 'Admin Operasional Pusat'
    }
  },
  service_hashes: {
    [crypto.createHash('sha256').update('GAS_SYNC_SERVICE_KEY_2026').digest('hex')]: 'GAS_SYNC_SERVICE',
    [crypto.createHash('sha256').update('CRON_NSR_SECURE_KEY_2026').digest('hex')]: 'CRON_SERVICE'
  }
};

const roleDefs = [
  {
    token: 'NSR-KING-OPR-2026-X7M9',
    sub: 'super_admin_king',
    branch: 'PUSAT',
    displayName: 'SUPER ADMIN (KING)',
    nama: 'Super Admin Operasional (KING)',
    role: 'SUPER_ADMIN',
    roleLabel: 'SUPER ADMIN • KING (Otoritas Sistem Tertinggi)',
    title: 'Super Admin (KING)',
    wilayah: 'PUSAT',
    wilayahLabel: 'Kantor Pusat Jakarta',
    wilayahCode: 'PST',
    isSuperAdmin: true,
    isKing: true,
    isCabang: false,
    canAccessKwitansi: true,
    canApprove: true,
    canSubmit: true,
    seeFee: true,
    mode: 'PUSAT',
    permissions: ['spm.review', 'divtek.review', 'lp.issue', 'nolap.issue', 'system.emergency_override', 'opr.view', 'opr.submit', 'admin.all']
  },
  {
    token: '[REDACTED_KEPKEU_TOKEN]-V4K2',
    sub: 'kepala_keuangan',
    branch: 'PUSAT',
    displayName: 'Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)',
    role: 'KEPALA_KEUANGAN',
    roleLabel: 'Kepala Keuangan & Pemimpin Rekan (Tingkat 3)',
    title: 'Kepala Keuangan',
    wilayah: 'PUSAT',
    wilayahLabel: 'Kantor Pusat Jakarta',
    wilayahCode: 'PST',
    isSuperAdmin: true,
    isCabang: false,
    canAccessKwitansi: true,
    canApprove: true,
    canSubmit: true,
    seeFee: true,
    mode: 'PUSAT',
    permissions: ['APPROVE_KEPALA_KEUANGAN', 'SUBMIT_OPR', 'VIEW_OPR']
  },
  {
    token: '[REDACTED_DIVTEK_TOKEN]-L9P1',
    sub: 'manager_teknik',
    branch: 'PUSAT',
    displayName: 'Deni Siswandi, S.T.',
    role: 'KEPALA_DIVTEK',
    roleLabel: 'Kepala Divisi Teknik',
    title: 'Kepala Divisi Teknik',
    wilayah: 'PUSAT',
    wilayahLabel: 'Kantor Pusat Jakarta',
    wilayahCode: 'PST',
    isSuperAdmin: false,
    isCabang: false,
    canAccessKwitansi: true,
    canApprove: true,
    canSubmit: true,
    seeFee: true,
    mode: 'PUSAT',
    permissions: ['APPROVE_TEKNIK', 'SUBMIT_OPR', 'VIEW_OPR']
  },
  {
    token: '[REDACTED_SPM_TOKEN]-R8T5',
    sub: 'danny_spm',
    branch: 'PUSAT',
    displayName: 'Danny Taufik, S.H.',
    nama: 'Danny Taufik, S.H.',
    role: 'KEPALA_SPM',
    roleLabel: 'Kepala SPM (Sistem Pengendalian Mutu)',
    title: 'Kepala SPM',
    wilayah: 'PUSAT',
    wilayahLabel: 'Kantor Pusat Jakarta',
    wilayahCode: 'PST',
    isSuperAdmin: false,
    isCabang: false,
    canAccessKwitansi: false,
    canApprove: false,
    canSubmit: true,
    seeFee: false,
    mode: 'PUSAT',
    permissions: ['spm.review', 'opr.view']
  },
  {
    token: '[REDACTED_PENILAI_NANANG_TOKEN]-Q1W8',
    sub: 'nanang_penilai',
    branch: 'PUSAT',
    displayName: 'Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)',
    role: 'PENILAI_PUBLIK',
    roleLabel: 'Rekan Pemimpin / Penilai Publik Rekan',
    title: 'Penilai Publik Rekan',
    wilayah: 'PUSAT',
    wilayahLabel: 'Kantor Pusat Jakarta',
    wilayahCode: 'PST',
    isSuperAdmin: false,
    isCabang: false,
    canAccessKwitansi: true,
    canApprove: false,
    canSubmit: true,
    seeFee: true,
    mode: 'PUSAT',
    permissions: ['report.sign', 'opr.view']
  },
  {
    token: '[REDACTED_PENILAI_DENI_TOKEN]-Z3X7',
    sub: 'deni_penilai',
    branch: 'PUSAT',
    displayName: 'Deni Siswandi, S.T., MAPPI (Cert.)',
    role: 'PENILAI_PUBLIK',
    roleLabel: 'Rekan / Penilai Publik Penanggung Jawab',
    title: 'Penilai Publik Penanggung Jawab',
    wilayah: 'PUSAT',
    wilayahLabel: 'Kantor Pusat Jakarta',
    wilayahCode: 'PST',
    isSuperAdmin: false,
    isCabang: false,
    canAccessKwitansi: true,
    canApprove: false,
    canSubmit: true,
    seeFee: true,
    mode: 'PUSAT',
    permissions: ['report.sign', 'opr.view']
  },
  {
    token: 'NSR-REKAN-MITRA-2026-B4N6',
    sub: 'rekan_umum',
    branch: 'PUSAT',
    displayName: 'Rekan Penilai',
    role: 'REKAN',
    roleLabel: 'Rekan (Mitra Umum)',
    title: 'Rekan Penilai',
    wilayah: 'PUSAT',
    wilayahLabel: 'Kantor Pusat Jakarta',
    wilayahCode: 'PST',
    isSuperAdmin: false,
    isCabang: false,
    canAccessKwitansi: true,
    canApprove: false,
    canSubmit: true,
    seeFee: true,
    mode: 'PUSAT',
    permissions: ['SUBMIT_OPR', 'VIEW_OPR']
  },
  {
    token: 'NSR-ADM-PUSAT-2026-J9K2',
    sub: 'cabang_jkt',
    branch: 'PUSAT',
    displayName: 'Kantor Pusat Jakarta',
    role: 'ADMIN_PUSAT',
    roleLabel: 'ADMIN OPERASIONAL PUSAT',
    title: 'Admin Operasional Pusat',
    wilayah: 'PUSAT',
    wilayahLabel: 'Kantor Pusat Jakarta',
    wilayahCode: 'PST',
    isSuperAdmin: false,
    isKing: false,
    isCabang: false,
    canAccessKwitansi: true,
    canApprove: true,
    canSubmit: true,
    seeFee: true,
    mode: 'PUSAT',
    permissions: ['SUBMIT_OPR', 'VIEW_OPR', 'APPROVE_OPR', 'APPROVE_PUSAT', 'NOLAP_APPROVE']
  },
  {
    token: 'NSR-CAB-BDG-2026-M7N3',
    sub: 'cabang_bdg',
    branch: 'Bandung',
    displayName: 'Kantor Cabang Bandung',
    role: 'ADMIN_CABANG',
    roleLabel: 'Admin Cabang Bandung',
    title: 'Admin Cabang Bandung',
    wilayah: 'Bandung',
    wilayahLabel: 'Kantor Cabang Bandung',
    wilayahCode: 'BDG',
    isSuperAdmin: false,
    isCabang: true,
    canAccessKwitansi: true,
    canApprove: false,
    canSubmit: true,
    seeFee: true,
    mode: 'CABANG',
    kodeKemenkeu: '2.0160-04'
  },
  {
    token: '[REDACTED_CAB_PDG_TOKEN]-F5G1',
    sub: 'cabang_pdg',
    branch: 'Padang',
    displayName: 'Kantor Cabang Padang',
    role: 'ADMIN_CABANG',
    roleLabel: 'Admin Cabang Padang',
    title: 'Admin Cabang Padang',
    wilayah: 'Padang',
    wilayahLabel: 'Kantor Cabang Padang',
    wilayahCode: 'PDG',
    isSuperAdmin: false,
    isCabang: true,
    canAccessKwitansi: true,
    canApprove: false,
    canSubmit: true,
    seeFee: true,
    mode: 'CABANG',
    kodeKemenkeu: '2.0160-05'
  },
  {
    token: '[REDACTED_CAB_MKS_TOKEN]-H8J4',
    sub: 'cabang_mks',
    branch: 'Makassar',
    displayName: 'Kantor Cabang Makassar',
    role: 'ADMIN_CABANG',
    roleLabel: 'Admin Cabang Makassar',
    title: 'Admin Cabang Makassar',
    wilayah: 'Makassar',
    wilayahLabel: 'Kantor Cabang Makassar',
    wilayahCode: 'MKS',
    isSuperAdmin: false,
    isCabang: true,
    canAccessKwitansi: true,
    canApprove: false,
    canSubmit: true,
    seeFee: true,
    mode: 'CABANG',
    kodeKemenkeu: '2.0160-05'
  },
  {
    token: '[REDACTED_CAB_PLB_TOKEN]-Y2U9',
    sub: 'cabang_plb',
    branch: 'Palembang',
    displayName: 'Kantor Cabang Palembang',
    role: 'ADMIN_CABANG',
    roleLabel: 'Admin Cabang Palembang',
    title: 'Admin Cabang Palembang',
    wilayah: 'Palembang',
    wilayahLabel: 'Kantor Cabang Palembang',
    wilayahCode: 'PLB',
    isSuperAdmin: false,
    isCabang: true,
    canAccessKwitansi: true,
    canApprove: false,
    canSubmit: true,
    seeFee: true,
    mode: 'CABANG',
    kodeKemenkeu: '2.0160-05'
  },
  {
    token: 'NSR-MKT-PUSAT-2026-C3V7',
    sub: 'marketing_pst',
    branch: 'PUSAT',
    displayName: 'Kantor Pusat Jakarta',
    role: 'MARKETING',
    roleLabel: 'Marketing',
    title: 'Marketing',
    wilayah: 'PUSAT',
    wilayahLabel: 'Kantor Pusat Jakarta',
    wilayahCode: 'PST',
    isSuperAdmin: false,
    isCabang: false,
    canAccessKwitansi: false,
    canApprove: false,
    canSubmit: true,
    seeFee: false,
    mode: 'PUSAT'
  },
  {
    token: 'NSR-REV-PUSAT-2026-D6E2',
    sub: 'reviewer_pst',
    branch: 'PUSAT',
    displayName: 'Kantor Pusat Jakarta',
    role: 'REVIEWER',
    roleLabel: 'Reviewer QC',
    title: 'Reviewer QC',
    wilayah: 'PUSAT',
    wilayahLabel: 'Kantor Pusat Jakarta',
    wilayahCode: 'PST',
    isSuperAdmin: false,
    isCabang: false,
    canAccessKwitansi: false,
    canApprove: false,
    canSubmit: true,
    seeFee: false,
    mode: 'PUSAT'
  },
  {
    token: 'NSR-VAL-PUSAT-2026-W9X1',
    sub: 'penilai_pst',
    branch: 'PUSAT',
    displayName: 'Kantor Pusat Jakarta',
    role: 'PENILAI',
    roleLabel: 'Penilai',
    title: 'Penilai Properti (Valuer)',
    wilayah: 'PUSAT',
    wilayahLabel: 'Kantor Pusat Jakarta',
    wilayahCode: 'PST',
    isSuperAdmin: false,
    isCabang: false,
    canAccessKwitansi: false,
    canApprove: false,
    canSubmit: true,
    seeFee: false,
    mode: 'PUSAT'
  },
  {
    token: 'NSR-SRV-PUSAT-2026-T4Y8',
    sub: 'surveyor_pst',
    branch: 'PUSAT',
    displayName: 'Kantor Pusat Jakarta',
    role: 'SURVEYOR',
    roleLabel: 'Surveyor',
    title: 'Surveyor Lapangan',
    wilayah: 'PUSAT',
    wilayahLabel: 'Kantor Pusat Jakarta',
    wilayahCode: 'PST',
    isSuperAdmin: false,
    isCabang: false,
    canAccessKwitansi: false,
    canApprove: false,
    canSubmit: true,
    seeFee: false,
    mode: 'PUSAT'
  },
  {
    token: 'NSR-KEU-PUSAT-2026-P5L0',
    sub: 'keuangan_pst',
    branch: 'PUSAT',
    displayName: 'Kantor Pusat Jakarta',
    role: 'KEUANGAN',
    roleLabel: 'Keuangan Pusat',
    title: 'Keuangan & Kasir Pusat',
    wilayah: 'PUSAT',
    wilayahLabel: 'Kantor Pusat Jakarta',
    wilayahCode: 'PST',
    isSuperAdmin: false,
    isCabang: false,
    canAccessKwitansi: true,
    canApprove: false,
    canSubmit: true,
    seeFee: true,
    mode: 'PUSAT'
  },
  {
    token: 'NSR-KEU-CABANG-2026-K1J3',
    sub: 'kasir_cabang',
    branch: 'CABANG',
    displayName: 'Kantor Cabang Operasional',
    role: 'KEUANGAN_CABANG',
    roleLabel: 'Keuangan Cabang',
    title: 'Kasir & Keuangan Cabang',
    wilayah: 'CABANG',
    wilayahLabel: 'Kantor Cabang Operasional',
    wilayahCode: 'CAB',
    isSuperAdmin: false,
    isCabang: true,
    canAccessKwitansi: true,
    canApprove: false,
    canSubmit: true,
    seeFee: true,
    mode: 'CABANG'
  }
];

for (const def of roleDefs) {
  const hash = saltedHash(def.token);
  const copy = { ...def };
  delete copy.token;
  copy.tokenHash = hash;
  registry.token_hashes[hash] = copy;
}

function toPhp(val, indent = 0) {
  const sp = ' '.repeat(indent);
  if (val === null) return 'null';
  if (typeof val === 'boolean') return val ? 'true' : 'false';
  if (typeof val === 'number') return val.toString();
  if (typeof val === 'string') return "'" + val.replace(/'/g, "\\'") + "'";
  if (Array.isArray(val)) {
    if (val.length === 0) return '[]';
    const items = val.map(v => sp + '    ' + toPhp(v, indent + 4)).join(',\n');
    return '[\n' + items + '\n' + sp + ']';
  }
  if (typeof val === 'object') {
    const keys = Object.keys(val);
    if (keys.length === 0) return '[]';
    const items = keys.map(k => sp + '    ' + toPhp(k) + ' => ' + toPhp(val[k], indent + 4)).join(',\n');
    return '[\n' + items + '\n' + sp + ']';
  }
  return 'null';
}

const phpContent = '<?php\n' +
  '/**\n' +
  ' * KJPP NSR — Private Server Configuration & Secret Vault\n' +
  ' * STRICT CONFIDENTIALITY: DILARANG KERAS DI-COMMIT KE GIT ATAU DIPUBLIKASIKAN\n' +
  ' */\n\n' +
  "defined('PHP_VERSION') or exit('Akses langsung ditolak.');\n\n" +
  'return ' + toPhp(registry, 0) + ';\n';

fs.writeFileSync(path.join(configDir, 'credentials.secrets.php'), phpContent, 'utf8');
console.log('✅ Successfully generated data/config/credentials.secrets.php');
