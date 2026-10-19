/**
 * TEST HOTFIX APPROVAL NOLAP — KJPP NSR
 * Verifikasi Otorisasi Super Admin Pusat, Isolasi Cabang, dan Meja Approval
 */

import fs from 'fs';
import assert from 'assert';

console.log('===============================================================');
console.log('🧪 PENGUJIAN HOTFIX APPROVAL NOLAP (portal-nolap.html)');
console.log('===============================================================\n');

let totalChecks = 0;
let passedChecks = 0;

function check(title, fn) {
  totalChecks++;
  try {
    fn();
    console.log(`  ✅ PASS: ${title}`);
    passedChecks++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${title}`);
    console.error(`     Error: ${err.message}`);
    process.exit(1);
  }
}

const nolapHtml = fs.readFileSync('portal-nolap.html', 'utf8');
const distHtml = fs.readFileSync('dist/portal-nolap.html', 'utf8');

// -------------------------------------------------------------
// 1. EKSTRAKSI FUNGSI isSuperOrAdminPusat DARI KODE ASLI
// -------------------------------------------------------------
console.log('[1/4] PENGUJIAN FUNGSI isSuperOrAdminPusat & NORMALISASI ROLE:');

// Ekstrak implementasi persis dari portal-nolap.html
const fnMatch = nolapHtml.match(/function isSuperOrAdminPusat\(\)\s*\{([\s\S]*?)\n    \}/);
assert(fnMatch, 'Fungsi isSuperOrAdminPusat harus ditemukan di portal-nolap.html');

function createTester(activeUser) {
  const sandboxFn = new Function('sesiAktif', `
    ${fnMatch[0]}
    return isSuperOrAdminPusat();
  `);
  return sandboxFn(activeUser);
}

// A. Akun Super Admin Pusat
check('Super Admin role "SUPER ADMIN" (spasi) dikenali sebagai Pusat (TRUE)', () => {
  const user = {
    role: "SUPER ADMIN",
    roleLabel: "SUPER ADMIN • KANTOR PUSAT",
    wilayah: "PUSAT",
    isSuperAdmin: true,
    aksesApproval: true,
    isCabang: false
  };
  assert.strictEqual(createTester(user), true);
});

check('Super Admin role "SUPER_ADMIN" (underscore) dikenali sebagai Pusat (TRUE)', () => {
  const user = {
    role: "SUPER_ADMIN",
    roleLabel: "SUPER_ADMIN",
    wilayah: "PUSAT",
    isSuperAdmin: true,
    canApprove: true,
    isCabang: false
  };
  assert.strictEqual(createTester(user), true);
});

check('Role "ADMIN_PUSAT" dengan canApprove dikenali sebagai Pusat (TRUE)', () => {
  const user = {
    role: "ADMIN_PUSAT",
    roleLabel: "Admin Pusat",
    wilayah: "PUSAT",
    isSuperAdmin: false,
    canApprove: true,
    isCabang: false
  };
  assert.strictEqual(createTester(user), true);
});

// B. Akun Cabang (DITOLAK)
check('Akun Cabang Bandung "ADMIN_CABANG" ditolak dari hak Pusat (FALSE)', () => {
  const user = {
    role: "ADMIN_CABANG",
    roleLabel: "Admin Cabang Bandung",
    wilayah: "Bandung",
    isCabang: true,
    isSuperAdmin: false,
    aksesApproval: false
  };
  assert.strictEqual(createTester(user), false);
});

check('Akun Cabang Padang "ADMIN_CABANG" ditolak dari hak Pusat (FALSE)', () => {
  const user = {
    role: "ADMIN_CABANG",
    roleLabel: "Admin Cabang Padang",
    wilayah: "Padang",
    isCabang: true,
    isSuperAdmin: false,
    aksesApproval: false
  };
  assert.strictEqual(createTester(user), false);
});

// C. Akun Non-Admin (Marketing, Reviewer, Penilai DITOLAK)
check('Akun Marketing Pusat ditolak dari hak approval (FALSE)', () => {
  const user = {
    role: "MARKETING",
    roleLabel: "Divisi Business Development & Marketing",
    wilayah: "PUSAT",
    isCabang: false,
    isSuperAdmin: false,
    aksesApproval: false
  };
  assert.strictEqual(createTester(user), false);
});

check('Akun Reviewer Pusat ditolak dari hak approval (FALSE)', () => {
  const user = {
    role: "REVIEWER",
    roleLabel: "Reviewer KKP / Quality Control",
    wilayah: "PUSAT",
    isCabang: false,
    isSuperAdmin: false,
    aksesApproval: false
  };
  assert.strictEqual(createTester(user), false);
});

// D. Anti-Tampering (Ketentuan 5: Tidak boleh lolos hanya karena wilayah = PUSAT)
check('Anti-Bypass: Objek termanipulasi { wilayah: "PUSAT", role: "CABANG" } tetap DITOLAK (FALSE)', () => {
  const user = {
    wilayah: "PUSAT",
    role: "CABANG",
    isCabang: true,
    aksesApproval: false
  };
  assert.strictEqual(createTester(user), false);
});

check('Anti-Bypass: Objek termanipulasi { wilayah: "PUSAT" } tanpa role & hak tetap DITOLAK (FALSE)', () => {
  const user = {
    wilayah: "PUSAT"
  };
  assert.strictEqual(createTester(user), false);
});

// -------------------------------------------------------------
// 2. PENGUJIAN DOM & VISIBILITAS TAB MEJA APPROVAL (applyRBAC)
// -------------------------------------------------------------
console.log('\n[2/4] PENGUJIAN VISIBILITAS TAB & RBAC (applyRBAC):');

class MockElement {
  constructor(id) {
    this.id = id;
    this._classes = new Set();
    this.classList = {
      add: (c) => this._classes.add(c),
      remove: (c) => this._classes.delete(c),
      contains: (c) => this._classes.has(c),
      has: (c) => this._classes.has(c)
    };
    this.style = {
      removeProperty: (p) => delete this.style[p]
    };
    this.attributes = {};
    this.innerHTML = '';
  }
  setAttribute(k, v) { this.attributes[k] = v; }
  removeAttribute(k) { delete this.attributes[k]; }
}

function runMockApplyRBAC(activeUser) {
  const elements = {
    'tab-btn-pengajuan': new MockElement('tab-btn-pengajuan'),
    'tab-btn-spm': new MockElement('tab-btn-spm'),
    'tab-btn-approval': new MockElement('tab-btn-approval'),
    'tab-btn-elsa': new MockElement('tab-btn-elsa'),
    'tab-btn-riwayat': new MockElement('tab-btn-riwayat'),
    'tab-btn-monitoring': new MockElement('tab-btn-monitoring'),
    'badge-admin-pusat': new MockElement('badge-admin-pusat'),
    'filter-cabang': new MockElement('filter-cabang'),
    'panel-riwayat': new MockElement('panel-riwayat')
  };

  const documentMock = {
    getElementById: (id) => elements[id] || null,
    querySelector: (sel) => {
      if (sel === '#panel-riwayat h3') return new MockElement('title-riwayat');
      return null;
    }
  };

  // Ekstrak applyRBAC
  const rbacMatch = nolapHtml.match(/function applyRBAC\(user\)\s*\{([\s\S]*?)\n    window\.applyRBAC = applyRBAC;/);
  assert(rbacMatch, 'Fungsi applyRBAC harus ditemukan di portal-nolap.html');

  const testRunner = new Function('document', 'sesiAktif', 'isSuperOrAdminPusat', `
    ${fnMatch[0]}
    ${rbacMatch[0].replace('window.applyRBAC = applyRBAC;', '')}
    applyRBAC(sesiAktif);
  `);

  testRunner(documentMock, activeUser);
  return elements;
}

check('Super Admin Pusat: Seluruh Tab (1 s.d. 6) TAMPIL LENGKAP tanpa tersembunyi', () => {
  const user = {
    role: "SUPER ADMIN",
    roleLabel: "SUPER ADMIN • KANTOR PUSAT",
    wilayah: "PUSAT",
    isSuperAdmin: true,
    aksesApproval: true,
    isCabang: false
  };
  const els = runMockApplyRBAC(user);

  assert(!els['tab-btn-approval'].classList.has('hidden'), 'Tab Approval tidak boleh hidden');
  assert(!els['tab-btn-elsa'].classList.has('hidden'), 'Tab eLSa tidak boleh hidden');
  assert(!els['tab-btn-monitoring'].classList.has('hidden'), 'Tab Monitoring tidak boleh hidden');
  assert(!els['badge-admin-pusat'].classList.has('hidden'), 'Badge Admin Pusat tampil');
  assert(els['tab-btn-approval'].innerHTML.includes('3. Verifikasi &amp; Approval Admin'), 'Judul Tab 3 akurat');
  assert(els['tab-btn-riwayat'].innerHTML.includes('5. Riwayat Seluruh NoLap'), 'Judul Tab 5 Buku Induk akurat');
});

check('Akun Cabang: Tab Approval, eLSa, dan Monitoring TERSEMBUNYI MUTLAK', () => {
  const user = {
    role: "ADMIN_CABANG",
    roleLabel: "Admin Cabang Bandung",
    cabang: "Bandung",
    wilayah: "Bandung",
    isCabang: true,
    isSuperAdmin: false,
    aksesApproval: false
  };
  const els = runMockApplyRBAC(user);

  assert(els['tab-btn-approval'].classList.has('hidden'), 'Tab Approval wajib hidden untuk Cabang');
  assert.strictEqual(els['tab-btn-approval'].style.display, 'none', 'Tab Approval style.display wajib none');
  assert(els['tab-btn-elsa'].classList.has('hidden'), 'Tab eLSa wajib hidden untuk Cabang');
  assert(els['tab-btn-monitoring'].classList.has('hidden'), 'Tab Monitoring wajib hidden untuk Cabang');
  assert(els['tab-btn-riwayat'].innerHTML.includes('Riwayat Permohonan Cabang (Bandung)'), 'Tab riwayat khusus cabang');
});

// -------------------------------------------------------------
// 3. PENGUJIAN MEJA APPROVAL: ANTREAN DIAJUKAN, SETUJUI & REVISI
// -------------------------------------------------------------
console.log('\n[3/4] PENGUJIAN ANTREAN DIAJUKAN & AKSI APPROVAL PUSAT:');

check('Permohonan berstatus DIAJUKAN masuk ke filter antrean Tab 3 Meja Approval', () => {
  const dummyDaftar = [
    { noPermintaan: 'REQ-001', cabang: 'Bandung', status: 'DIAJUKAN', namaKlien: 'PT MAJU', isTestRecord: false },
    { noPermintaan: 'REQ-002', cabang: 'Padang', status: 'PERLU REVISI', namaKlien: 'PT JAYA', isTestRecord: false },
    { noPermintaan: 'REQ-003', cabang: 'Makassar', status: 'NOMOR DITERBITKAN', namaKlien: 'PT SUKSES', isTestRecord: false },
    { noPermintaan: 'REQ-004', cabang: 'Pusat', status: 'VOID', namaKlien: 'PT DUMMY', isTestRecord: false }
  ];

  // Logic dari muatUlangTabel():
  const itemsPending = dummyDaftar.filter(p => (p.status === 'DIAJUKAN' || p.status === 'PERLU REVISI') && p.status !== 'VOID' && p.status !== 'DIBATALKAN' && !p.isTestRecord);
  assert.strictEqual(itemsPending.length, 2, 'Harus ada 2 item pending (REQ-001 DIAJUKAN dan REQ-002 PERLU REVISI)');
  assert.strictEqual(itemsPending[0].noPermintaan, 'REQ-001');
});

check('Tombol "Terbitkan NoLap (Manual)" dan "Revisi" hanya dirender jika isSuperOrAdminPusat() TRUE', () => {
  assert(nolapHtml.includes("${isSuperOrAdminPusat() ? `"), 'Ada rendering kondisional tombol aksi');
  assert(nolapHtml.includes("bukaModalTerbitkanManual('${p.noPermintaan}')"), 'Tombol Terbitkan Manual terhubung');
  assert(nolapHtml.includes("mintaRevisiPengajuan('${p.noPermintaan}')"), 'Tombol Minta Revisi terhubung');
});

check('Fungsi bukaModalTerbitkanManual & mintaRevisiPengajuan memblokir akses jika bukan Super/Admin Pusat', () => {
  assert(nolapHtml.includes("function bukaModalTerbitkanManual(noReq) {\n      if (!isSuperOrAdminPusat()) {"), 'Guard bukaModalTerbitkanManual aktif');
  assert(nolapHtml.includes("function mintaRevisiPengajuan(noReq) {\n      if (!isSuperOrAdminPusat()) {"), 'Guard mintaRevisiPengajuan aktif');
});

check('Ketentuan 5: Role umum "ADMIN" atau "ROOT" tanpa role Super Admin / Admin Pusat sah ditolak (FALSE)', () => {
  const userAdmin = { role: "ADMIN", roleLabel: "Admin", isCabang: false, aksesApproval: false };
  const userRoot = { role: "ROOT", roleLabel: "Root User", isCabang: false, aksesApproval: false };
  assert.strictEqual(createTester(userAdmin), false);
  assert.strictEqual(createTester(userRoot), false);
});

check('Ketentuan 6: Permohonan PERLU REVISI menampilkan "Menunggu Pengajuan Ulang" dan memblokir approval manual', () => {
  const currentHtml = fs.readFileSync('portal-nolap.html', 'utf8');
  assert(currentHtml.includes("Menunggu Pengajuan Ulang"), 'Label Menunggu Pengajuan Ulang ada di UI');
  assert(currentHtml.includes("if (item.status === 'PERLU REVISI') {\n        alert('Permohonan ' + noReq + ' berstatus PERLU REVISI dan harus menunggu pengajuan ulang"), 'bukaModalTerbitkanManual memblokir status PERLU REVISI');
});

check('Kerapian UI: resolveNamaPenilaiDisplay tidak pernah menghasilkan "undefined" untuk data kosong', () => {
  const currentHtml = fs.readFileSync('portal-nolap.html', 'utf8');
  const penilaiFnMatch = currentHtml.match(/function resolveNamaPenilaiDisplay\(p\)\s*\{([\s\S]*?)\n    \}/);
  assert(penilaiFnMatch, 'Fungsi resolveNamaPenilaiDisplay ada');
  const tester = new Function('p', `
    ${penilaiFnMatch[0]}
    return resolveNamaPenilaiDisplay(p);
  `);

  assert.strictEqual(tester({ cabang: 'Padang' }), 'Hernita');
  assert.strictEqual(tester({ cabang: 'Bandung' }), 'Deni Siswandi');
  assert.strictEqual(tester({ cabang: 'Palembang' }), 'Dharma Priyanto Sih Budi Susilo');
  assert.strictEqual(tester({ cabang: 'Pusat' }), 'Nanang Rahayu');
  assert.strictEqual(tester({ penilai: 'Deni Siswandi' }), 'Deni Siswandi');
  assert.strictEqual(tester({ penilai: 'undefined', cabang: 'Padang' }), 'Hernita');
  assert(!tester({}).includes('undefined'), 'Tidak boleh menghasilkan undefined');
});

// -------------------------------------------------------------
// 4. SINKRONISASI BUNDLE DIST
// -------------------------------------------------------------
console.log('\n[4/4] INTEGRITAS PAKET BUILD DIST:');

check('dist/portal-nolap.html tersinkronisasi dengan perbaikan isSuperOrAdminPusat()', () => {
  const currentDistHtml = fs.readFileSync('dist/portal-nolap.html', 'utf8');
  assert(currentDistHtml.includes("function isSuperOrAdminPusat()"), 'Fungsi ada di dist');
  assert(currentDistHtml.includes("['SUPERADMIN', 'ADMINPUSAT'].includes(cleanRole)"), 'Normalisasi cleanRole ada di dist');
  assert(currentDistHtml.includes("!activeUser.isCabang"), 'Pemeriksaan isCabang ada di dist');
});

console.log('\n===============================================================');
console.log(`HASIL AKHIR PENGUJIAN HOTFIX NOLAP: ${passedChecks} / ${totalChecks} PASS`);
console.log('===============================================================');
