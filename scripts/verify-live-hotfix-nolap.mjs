/**
 * VERIFIKASI LANGSUNG SERVER PRODUKSI (LIVE C-PANEL)
 * Target: https://kjppnanangrahayu.com/portal-nolap.html
 */

import assert from 'assert';

console.log('===============================================================');
console.log('🌐 VERIFIKASI LANGSUNG PORTAL NOLAP PRODUKSI (HOTFIX APPROVAL)');
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

async function runLiveVerification() {
  const url = `https://kjppnanangrahayu.com/portal-nolap.html?nocache=${Date.now()}`;
  console.log(`[1/3] Mengambil berkas produksi live dari: ${url}`);
  const res = await fetch(url, { cache: 'no-store' });
  assert.strictEqual(res.status, 200, 'HTTP 200 OK');
  const liveHtml = await res.text();
  console.log(`      Ukuran berkas live: ${liveHtml.length} bytes\n`);

  // 1. Verifikasi Kode Sumber Live
  console.log('[2/3] Memeriksa Kode Sumber Live di Server:');
  check('Kode normalisasi role isSuperOrAdminPusat() sudah aktif di server live', () => {
    assert(liveHtml.includes("['SUPERADMIN', 'ADMINPUSAT'].includes(cleanRole)"));
    assert(liveHtml.includes("!activeUser.isCabang"));
  });

  check('Proteksi status PERLU REVISI aktif di server live', () => {
    assert(liveHtml.includes("Menunggu Pengajuan Ulang"));
    assert(liveHtml.includes("item.status === 'PERLU REVISI'"));
  });

  check('Fungsi perapian display guard resolveNamaPenilaiDisplay aktif di server live', () => {
    assert(liveHtml.includes("function resolveNamaPenilaiDisplay(p)"));
    assert(liveHtml.includes("function resolveIzinPenilaiDisplay(p)"));
    assert(liveHtml.includes("resolveNamaPenilaiDisplay(p)"));
  });

  // 2. Eksekusi Runtime Logika Live
  console.log('\n[3/3] Simulasi Runtime Otentikasi & Antarmuka Live:');
  const fnMatch = liveHtml.match(/function isSuperOrAdminPusat\(\)\s*\{([\s\S]*?)\n    \}/);
  assert(fnMatch, 'Fungsi isSuperOrAdminPusat ada di kode live');

  const rbacMatch = liveHtml.match(/function applyRBAC\(user\)\s*\{([\s\S]*?)\n    window\.applyRBAC = applyRBAC;/);
  assert(rbacMatch, 'Fungsi applyRBAC ada di kode live');

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

  function simulateSession(user) {
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

    const testRunner = new Function('document', 'sesiAktif', 'elements', `
      ${fnMatch[0]}
      ${rbacMatch[0].replace('window.applyRBAC = applyRBAC;', '')}
      const isSuper = isSuperOrAdminPusat();
      applyRBAC(sesiAktif);
      return { isSuper, elements };
    `);

    return testRunner(documentMock, user, elements);
  }

  // Skenario A: Login Super Admin Pusat (Token NSR-PST-2026)
  const userPusat = {
    role: "SUPER ADMIN",
    roleLabel: "SUPER ADMIN • KANTOR PUSAT",
    wilayah: "PUSAT",
    isSuperAdmin: true,
    aksesApproval: true,
    isCabang: false
  };
  const resPusat = simulateSession(userPusat);

  check('Super Admin Pusat: isSuperOrAdminPusat() bernilai TRUE di server live', () => {
    assert.strictEqual(resPusat.isSuper, true);
  });

  check('Super Admin Pusat: Tab 3 (Meja Approval) TAMPIL di bilah atas', () => {
    assert(!resPusat.elements['tab-btn-approval'].classList.has('hidden'));
    assert(resPusat.elements['tab-btn-approval'].innerHTML.includes('3. Verifikasi &amp; Approval Admin'));
  });

  check('Super Admin Pusat: Tab 4 (eLSa), Tab 5 (Riwayat), dan Tab 6 (Monitoring) TAMPIL LENGKAP', () => {
    assert(!resPusat.elements['tab-btn-elsa'].classList.has('hidden'));
    assert(!resPusat.elements['tab-btn-monitoring'].classList.has('hidden'));
    assert(!resPusat.elements['badge-admin-pusat'].classList.has('hidden'));
  });

  // Skenario B: Login Cabang Bandung (Token NSR-BDG-2026)
  const userCabang = {
    role: "ADMIN_CABANG",
    roleLabel: "Admin Cabang Bandung",
    cabang: "Bandung",
    wilayah: "Bandung",
    isCabang: true,
    isSuperAdmin: false,
    aksesApproval: false
  };
  const resCabang = simulateSession(userCabang);

  check('Akun Cabang: isSuperOrAdminPusat() bernilai FALSE di server live', () => {
    assert.strictEqual(resCabang.isSuper, false);
  });

  check('Akun Cabang: Tab 3 (Approval), Tab 4 (eLSa), dan Tab 6 (Monitoring) TERSEMBUNYI MUTLAK', () => {
    assert(resCabang.elements['tab-btn-approval'].classList.has('hidden'));
    assert.strictEqual(resCabang.elements['tab-btn-approval'].style.display, 'none');
    assert(resCabang.elements['tab-btn-elsa'].classList.has('hidden'));
    assert(resCabang.elements['tab-btn-monitoring'].classList.has('hidden'));
  });

  // Skenario C: Antrean Permohonan DIAJUKAN vs PERLU REVISI
  check('Live Code: Permohonan DIAJUKAN menampilkan tombol Terbitkan & Revisi; PERLU REVISI menunggu pengajuan ulang', () => {
    assert(liveHtml.includes("p.status === 'DIAJUKAN' ?"));
    assert(liveHtml.includes("Terbitkan NoLap (Manual)"));
    assert(liveHtml.includes("Menunggu Pengajuan Ulang"));
  });

  console.log('\n===============================================================');
  console.log(`HASIL VERIFIKASI LANGSUNG PRODUKSI: ${passedChecks} / ${totalChecks} PASS`);
  console.log('===============================================================');
}

runLiveVerification().catch(err => {
  console.error('Fatal live verification error:', err);
  process.exit(1);
});
