import fs from 'fs';
import crypto from 'crypto';

console.log('=== UPDATE & SINKRONISASI 12 TOKEN RBAC SISTEM KJPP NSR ===');

const OFFICIAL_TOKENS = [
  {
    token: (process.env.NSR_KING_TOKEN || "NSR_MOCK_KING_TOKEN"),
    sub: 'admin_master',
    role: 'SUPER ADMIN',
    roleLabel: 'SUPER ADMIN • KANTOR PUSAT',
    displayRole: 'SUPER ADMIN • KANTOR PUSAT',
    title: 'Super Admin Pusat (Pemimpin Rekan)',
    wilayah: 'PUSAT',
    wilayahLabel: 'Kantor Pusat Jakarta',
    wilayahCode: 'PST',
    isSuperAdmin: true,
    isCabang: false,
    canAccessKwitansi: true,
    canApprove: true,
    canSubmit: true,
    seeFee: true,
    mode: 'PUSAT'
  },
  {
    token: (process.env.NSR_PUSAT_TOKEN || "NSR_MOCK_PUSAT_TOKEN"),
    sub: 'cabang_jkt',
    role: 'SUPER ADMIN',
    roleLabel: 'SUPER ADMIN • KANTOR PUSAT',
    displayRole: 'SUPER ADMIN • KANTOR PUSAT',
    title: 'Admin Operasional Pusat',
    wilayah: 'PUSAT',
    wilayahLabel: 'Kantor Pusat Jakarta',
    wilayahCode: 'PST',
    isSuperAdmin: true,
    isCabang: false,
    canAccessKwitansi: true,
    canApprove: true,
    canSubmit: true,
    seeFee: true,
    mode: 'PUSAT'
  },
  {
    token: (process.env.NSR_CAB_BDG_TOKEN || "NSR_MOCK_BDG_TOKEN"),
    sub: 'cabang_bdg',
    role: 'ADMIN_CABANG',
    roleLabel: 'Admin Cabang Bandung',
    displayRole: 'Admin Kantor Cabang Bandung',
    title: 'Admin Cabang Bandung',
    wilayah: 'Bandung',
    wilayahLabel: 'Kantor Cabang Bandung',
    wilayahCode: 'BDG',
    kodeKemenkeu: '2.0160-04',
    isSuperAdmin: false,
    isCabang: true,
    canAccessKwitansi: true,
    canApprove: false,
    canSubmit: true,
    seeFee: true,
    mode: 'CABANG'
  },
  {
    token: 'NSR-PDG-2026',
    sub: 'cabang_pdg',
    role: 'ADMIN_CABANG',
    roleLabel: 'Admin Cabang Padang',
    displayRole: 'Admin Kantor Cabang Padang',
    title: 'Admin Cabang Padang',
    wilayah: 'Padang',
    wilayahLabel: 'Kantor Cabang Padang',
    wilayahCode: 'PDG',
    kodeKemenkeu: '2.0160-01',
    isSuperAdmin: false,
    isCabang: true,
    canAccessKwitansi: true,
    canApprove: false,
    canSubmit: true,
    seeFee: true,
    mode: 'CABANG'
  },
  {
    token: 'NSR-MKS-2026',
    sub: 'cabang_mks',
    role: 'ADMIN_CABANG',
    roleLabel: 'Admin Cabang Makassar',
    displayRole: 'Admin Kantor Cabang Makassar',
    title: 'Admin Cabang Makassar',
    wilayah: 'Makassar',
    wilayahLabel: 'Kantor Cabang Makassar',
    wilayahCode: 'MKS',
    kodeKemenkeu: '2.0160-02',
    isSuperAdmin: false,
    isCabang: true,
    canAccessKwitansi: true,
    canApprove: false,
    canSubmit: true,
    seeFee: true,
    mode: 'CABANG'
  },
  {
    token: 'NSR-PLB-2026',
    sub: 'cabang_plb',
    role: 'ADMIN_CABANG',
    roleLabel: 'Admin Cabang Palembang',
    displayRole: 'Admin Kantor Cabang Palembang',
    title: 'Admin Cabang Palembang',
    wilayah: 'Palembang',
    wilayahLabel: 'Kantor Cabang Palembang',
    wilayahCode: 'PLB',
    kodeKemenkeu: '2.0160-03',
    isSuperAdmin: false,
    isCabang: true,
    canAccessKwitansi: true,
    canApprove: false,
    canSubmit: true,
    seeFee: true,
    mode: 'CABANG'
  },
  {
    token: 'NSR-REV-2026',
    sub: 'reviewer_pst',
    role: 'REVIEWER',
    roleLabel: 'Reviewer QC',
    displayRole: 'Reviewer KKP / Quality Control',
    title: 'Reviewer QC Kendali Mutu',
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
    token: 'NSR-VAL-2026',
    sub: 'penilai_pst',
    role: 'PENILAI',
    roleLabel: 'Penilai',
    displayRole: 'Penilai Properti (Valuer)',
    title: 'Penilai Properti (Valuer)',
    wilayah: 'PUSAT',
    wilayahLabel: 'Kantor Pusat Jakarta',
    wilayahCode: 'PST',
    isSuperAdmin: false,
    isCabang: false,
    canAccessKwitansi: false,
    canApprove: false,
    canSubmit: true,
    canInputForm: true,
    seeFee: false,
    mode: 'PUSAT'
  },
  {
    token: 'NSR-SRV-2026',
    sub: 'surveyor_pst',
    role: 'SURVEYOR',
    roleLabel: 'Surveyor',
    displayRole: 'Surveyor Lapangan',
    title: 'Surveyor Lapangan',
    wilayah: 'PUSAT',
    wilayahLabel: 'Kantor Pusat Jakarta',
    wilayahCode: 'PST',
    isSuperAdmin: false,
    isCabang: false,
    canAccessKwitansi: false,
    canApprove: false,
    canSubmit: true,
    canInputForm: true,
    seeFee: false,
    mode: 'PUSAT'
  },
  {
    token: 'NSR-MKT-2026',
    sub: 'marketing_pst',
    role: 'MARKETING',
    roleLabel: 'Marketing',
    displayRole: 'Divisi Business Development & Marketing',
    title: 'Marketing & Bisnis',
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
    token: 'NSR-KEU-2026',
    sub: 'keuangan_pst',
    role: 'KEUANGAN',
    roleLabel: 'Keuangan Pusat',
    displayRole: 'Divisi Keuangan & Kasir Pusat',
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
    token: 'NSR-KAS-2026',
    sub: 'kasir_cabang',
    role: 'KEUANGAN_CABANG',
    roleLabel: 'Keuangan Cabang',
    displayRole: 'Kasir & Keuangan Cabang',
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

function getHashes(t) {
  const raw = crypto.createHash('sha256').update(t).digest('hex');
  const salted = crypto.createHash('sha256').update('KJPP_NSR_2026_CORE_AUTH::' + t).digest('hex');
  return { raw, salted };
}

// -------------------------------------------------------------
// 1. UPDATE auth-handler.php
// -------------------------------------------------------------
let authPhp = fs.readFileSync('auth-handler.php', 'utf8');
const isCrlfAuth = authPhp.includes('\r\n');
const nlAuth = isCrlfAuth ? '\r\n' : '\n';

const newPhpEntries = [];
const tokensToAddPhp = OFFICIAL_TOKENS.filter(t => 
  ['NSR-VAL-2026', 'NSR-SRV-2026', 'NSR-KEU-2026', 'NSR-KAS-2026'].includes(t.token)
);

tokensToAddPhp.forEach(item => {
  const { raw, salted } = getHashes(item.token);
  
  const saltedEntry = `    '${salted}' => [
        'sub'               => '${item.sub}',
        'branch'            => '${item.wilayah}',
        'displayName'       => '${item.wilayahLabel}',
        'role'              => '${item.role}',
        'roleLabel'         => '${item.roleLabel}',
        'title'             => '${item.title}',
        'wilayah'           => '${item.wilayah}',
        'wilayahLabel'      => '${item.wilayahLabel}',
        'wilayahCode'       => '${item.wilayahCode}',
        'isSuperAdmin'      => ${item.isSuperAdmin ? 'true' : 'false'},
        'isCabang'          => ${item.isCabang ? 'true' : 'false'},
        'canAccessKwitansi' => ${item.canAccessKwitansi ? 'true' : 'false'},
        'canApprove'        => ${item.canApprove ? 'true' : 'false'},
        'canSubmit'         => ${item.canSubmit ? 'true' : 'false'},
        'seeFee'            => ${item.seeFee ? 'true' : 'false'},
        'mode'              => '${item.mode}',
        'tokenHash'         => '${salted}'${item.kodeKemenkeu ? `,\n        'kodeKemenkeu'      => '${item.kodeKemenkeu}'` : ''}
    ],`;

  const rawEntry = `    '${raw}' => [
        'sub'               => '${item.sub}',
        'branch'            => '${item.wilayah}',
        'displayName'       => '${item.wilayahLabel}',
        'role'              => '${item.role}',
        'roleLabel'         => '${item.roleLabel}',
        'title'             => '${item.title}',
        'wilayah'           => '${item.wilayah}',
        'wilayahLabel'      => '${item.wilayahLabel}',
        'wilayahCode'       => '${item.wilayahCode}',
        'isSuperAdmin'      => ${item.isSuperAdmin ? 'true' : 'false'},
        'isCabang'          => ${item.isCabang ? 'true' : 'false'},
        'canAccessKwitansi' => ${item.canAccessKwitansi ? 'true' : 'false'},
        'canApprove'        => ${item.canApprove ? 'true' : 'false'},
        'canSubmit'         => ${item.canSubmit ? 'true' : 'false'},
        'seeFee'            => ${item.seeFee ? 'true' : 'false'},
        'mode'              => '${item.mode}',
        'tokenHash'         => '${salted}'${item.kodeKemenkeu ? `,\n        'kodeKemenkeu'      => '${item.kodeKemenkeu}'` : ''}
    ],`;

  if (!authPhp.includes(`'${salted}'`)) {
    newPhpEntries.push(isCrlfAuth ? saltedEntry.replace(/\n/g, '\r\n') : saltedEntry);
  }
  if (!authPhp.includes(`'${raw}'`)) {
    newPhpEntries.push(isCrlfAuth ? rawEntry.replace(/\n/g, '\r\n') : rawEntry);
  }
});

if (newPhpEntries.length > 0) {
  // Cari posisi penutup array $OFFICIAL_TOKEN_HASHES
  const searchPattern = /\];\s*\/\/\s*-+\s*\/\/\s*2\.\s*DATA\s*AKUN\s*RESMI/;
  const m = authPhp.match(searchPattern);
  if (m) {
    const idx = m.index;
    const before = authPhp.slice(0, idx);
    const after = authPhp.slice(idx);
    authPhp = before + newPhpEntries.join(nlAuth) + nlAuth + after;
    fs.writeFileSync('auth-handler.php', authPhp, 'utf8');
    console.log(`✓ auth-handler.php: Berhasil menambahkan ${newPhpEntries.length} entri hash otorisasi baru`);
  } else {
    console.error('❌ Gagal menemukan pola penutup di auth-handler.php');
  }
} else {
  console.log('ℹ auth-handler.php: Seluruh hash sudah terdaftar');
}

// -------------------------------------------------------------
// 2. UPDATE AUTH_HASH_REGISTRY di File-File Portal HTML
// -------------------------------------------------------------
const portalFiles = [
  'portal-nolap.html',
  'portal-nolap-dev.html',
  'portal-kwitansi.html',
  'portal-penugasan-jo.html',
  'portal-surat-umum.html'
];

portalFiles.forEach(pf => {
  if (!fs.existsSync(pf)) return;
  let html = fs.readFileSync(pf, 'utf8');
  const isCrlf = html.includes('\r\n');
  const nl = isCrlf ? '\r\n' : '\n';

  const newJsEntries = [];
  tokensToAddPhp.forEach(item => {
    const { raw, salted } = getHashes(item.token);
    
    const objDef = JSON.stringify({
      valid: true,
      role: item.role,
      roleLabel: item.roleLabel,
      displayRole: item.displayRole,
      wilayah: item.wilayah,
      wilayahLabel: item.wilayahLabel,
      wilayahResmi: item.wilayahLabel,
      wilayahCode: item.wilayahCode,
      nama: item.wilayahLabel,
      kantor: item.wilayahLabel,
      namaKantor: item.wilayahLabel,
      cabang: item.wilayah === 'CABANG' ? 'Cabang' : 'Pusat',
      label: `${item.wilayahLabel} (${item.roleLabel})`,
      jabatan: item.displayRole,
      isCabang: item.isCabang,
      isSuperAdmin: item.isSuperAdmin,
      aksesApproval: item.canApprove,
      aksesKwitansi: item.canAccessKwitansi,
      aksesFee: item.seeFee,
      mode: item.mode,
      canAccessKwitansi: item.canAccessKwitansi,
      seeFee: item.seeFee,
      canApprove: item.canApprove,
      canSubmit: item.canSubmit,
      canInputForm: true,
      lockWilayah: item.isCabang,
      canManageSU: item.isSuperAdmin,
      feeMaskText: item.seeFee ? '' : '[Sesuai SPK / Khusus Admin]',
      tokenHash: salted
    });

    if (!html.includes(`'${salted}':`)) {
      newJsEntries.push(`      '${salted}': ${objDef},`);
    }
    if (!html.includes(`'${raw}':`)) {
      newJsEntries.push(`      '${raw}': ${objDef},`);
    }
  });

  if (newJsEntries.length > 0) {
    const regMatch = html.match(/const\s+AUTH_HASH_REGISTRY\s*=\s*\{/);
    if (regMatch) {
      const idx = regMatch.index + regMatch[0].length;
      const before = html.slice(0, idx);
      const after = html.slice(idx);
      html = before + nl + newJsEntries.join(nl) + after;
      fs.writeFileSync(pf, html, 'utf8');
      console.log(`✓ ${pf}: Berhasil menyuntikkan ${newJsEntries.length} hash SSO registri`);
    } else {
      console.log(`ℹ Marker AUTH_HASH_REGISTRY tidak ditemukan di ${pf}`);
    }
  } else {
    console.log(`ℹ ${pf}: Semua hash sudah terdaftar`);
  }
});

// -------------------------------------------------------------
// 3. UPDATE Code.gs
// -------------------------------------------------------------
if (fs.existsSync('Code.gs')) {
  let gas = fs.readFileSync('Code.gs', 'utf8');
  const isCrlfGas = gas.includes('\r\n');
  const nlGas = isCrlfGas ? '\r\n' : '\n';
  const gasEntries = [];
  tokensToAddPhp.forEach(item => {
    const { raw, salted } = getHashes(item.token);
    const gasObj = JSON.stringify({
      valid: true,
      role: item.role,
      roleLabel: item.roleLabel,
      displayRole: item.displayRole,
      wilayah: item.wilayah,
      wilayahLabel: item.wilayahLabel,
      wilayahResmi: item.wilayahLabel,
      wilayahCode: item.wilayahCode,
      isCabang: item.isCabang,
      isSuperAdmin: item.isSuperAdmin,
      aksesApproval: item.canApprove,
      aksesKwitansi: item.canAccessKwitansi,
      aksesFee: item.seeFee,
      mode: item.mode,
      canAccessKwitansi: item.canAccessKwitansi,
      seeFee: item.seeFee,
      canApprove: item.canApprove,
      canSubmit: item.canSubmit,
      canInputForm: true,
      lockWilayah: item.isCabang,
      canManageSU: item.isSuperAdmin,
      cabang: item.wilayah,
      jabatan: item.displayRole
    });

    if (!gas.includes(`'${raw}':`)) {
      gasEntries.push(`    '${raw}': ${gasObj},`);
    }
    if (!gas.includes(`'${salted}':`)) {
      gasEntries.push(`    '${salted}': ${gasObj},`);
    }
  });

  if (gasEntries.length > 0) {
    const gasMatch = gas.match(/const\s+GAS_HASH_REGISTRY\s*=\s*\{/);
    if (gasMatch) {
      const idx = gasMatch.index + gasMatch[0].length;
      const before = gas.slice(0, idx);
      const after = gas.slice(idx);
      gas = before + nlGas + gasEntries.join(nlGas) + after;
      fs.writeFileSync('Code.gs', gas, 'utf8');
      console.log(`✓ Code.gs: Berhasil menambahkan ${gasEntries.length} entri ke GAS_HASH_REGISTRY`);
    }
  }
}

console.log('\n=== PEMBARUAN SISTEM SELESAI ===');
