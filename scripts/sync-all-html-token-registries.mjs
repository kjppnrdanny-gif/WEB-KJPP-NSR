import fs from 'fs';
import crypto from 'crypto';

console.log('=== SINKRONISASI LENGKAP AUTH_HASH_REGISTRY DI SEMUA HALAMAN WEB ===');

const TOKENS_TO_INJECT = [
  {
    token: 'NSR-SRV-2026',
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
    seeFee: false,
    mode: 'PUSAT'
  },
  {
    token: 'NSR-KEU-2026',
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

const targetFiles = [
  'index.html',
  'portal-nolap-cabang.html',
  'portal-nolap-dev.html'
];

targetFiles.forEach(pf => {
  if (!fs.existsSync(pf)) return;
  let html = fs.readFileSync(pf, 'utf8');
  const isCrlf = html.includes('\r\n');
  const nl = isCrlf ? '\r\n' : '\n';

  const newJsEntries = [];
  TOKENS_TO_INJECT.forEach(item => {
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

console.log('=== SINKRONISASI SELESAI ===');
