import fs from 'fs';
import path from 'path';
import vm from 'vm';

console.log('======================================================');
console.log('🧪 PENGUJIAN MENYELURUH TAHAP 2 (HARDENED): MONITORING JO & DEADLINE');
console.log('======================================================\n');

let totalTests = 0;
let passedTests = 0;

function assert(condition, desc) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✔ PASS: ${desc}`);
  } else {
    console.error(`  ❌ FAIL: ${desc}`);
    throw new Error(`Assertion failed: ${desc}`);
  }
}

// -----------------------------------------------------------------------------
// [1/7] AUDIT ELEMEN UI FRONTEND: portal-penugasan-jo.html
// -----------------------------------------------------------------------------
console.log('[1/7] Audit Elemen UI Frontend: portal-penugasan-jo.html');
const html = fs.readFileSync(path.join(process.cwd(), 'portal-penugasan-jo.html'), 'utf-8');

assert(html.includes('id="container-monitoring-cards"'), 'Container 4 kartu monitoring tersedia (#container-monitoring-cards)');
assert(html.includes('id="card-metric-aktif"'), 'Kartu Metric 1: Penugasan Aktif (#card-metric-aktif)');
assert(html.includes('id="metric-val-aktif"'), 'Angka Metric 1 (#metric-val-aktif)');
assert(html.includes('id="pill-filter-aktif"'), 'Pill Status Filter Aktif (#pill-filter-aktif)');

assert(html.includes('id="card-metric-near"'), 'Kartu Metric 2: Mendekati Tenggat (#card-metric-near)');
assert(html.includes('id="metric-val-near"'), 'Angka Metric 2 (#metric-val-near)');
assert(html.includes('id="pill-filter-near"'), 'Pill Status Filter Near (#pill-filter-near)');

assert(html.includes('id="card-metric-overdue"'), 'Kartu Metric 3: Melewati Tenggat (#card-metric-overdue)');
assert(html.includes('id="metric-val-overdue"'), 'Angka Metric 3 (#metric-val-overdue)');
assert(html.includes('id="pill-filter-overdue"'), 'Pill Status Filter Overdue (#pill-filter-overdue)');

assert(html.includes('id="card-metric-selesai"'), 'Kartu Metric 4: Penugasan Selesai (#card-metric-selesai)');
assert(html.includes('id="metric-val-selesai"'), 'Angka Metric 4 (#metric-val-selesai)');
assert(html.includes('id="pill-filter-selesai"'), 'Pill Status Filter Selesai (#pill-filter-selesai)');

assert(html.includes('id="filter_status"'), 'Dropdown Filter Status & Tenggat (#filter_status)');
assert(html.includes('id="wrapper-filter-wilayah"'), 'Wrapper Filter Wilayah untuk RBAC (#wrapper-filter-wilayah)');
assert(html.includes('id="filter_wilayah"'), 'Dropdown Filter Wilayah (#filter_wilayah)');
assert(html.includes('id="filter_pic"'), 'Dropdown Filter PIC & Tim Penilai (#filter_pic)');
assert(html.includes('id="filter_periode"'), 'Dropdown Filter Periode Waktu (#filter_periode)');
assert(html.includes('id="cari_proyek"'), 'Input Pencarian Cepat (#cari_proyek)');
assert(html.includes('id="btn-reset-filter"'), 'Tombol Reset Filter (#btn-reset-filter)');

// Verifikasi Header Tabel
assert(html.includes('No. Pengajuan / ID'), 'Header Tabel Kolom 1: No. Pengajuan / ID');
assert(html.includes('Kantor Wilayah'), 'Header Tabel Kolom 2: Kantor Wilayah');
assert(html.includes('Pemberi Tugas &amp; Debitur'), 'Header Tabel Kolom 3: Pemberi Tugas & Debitur');
assert(html.includes('Objek &amp; Nilai'), 'Header Tabel Kolom 4: Objek & Nilai');
assert(html.includes('PIC &amp; Tim Penilai'), 'Header Tabel Kolom 5: PIC & Tim Penilai');
assert(html.includes('Target Penyelesaian (SLA)'), 'Header Tabel Kolom 6: Target Penyelesaian (SLA)');
assert(html.includes('Nomor Resmi (SPK &amp; JO)'), 'Header Tabel Kolom 7: Nomor Resmi (SPK & JO)');
assert(html.includes('Aksi'), 'Header Tabel Kolom 9: Aksi');

// -----------------------------------------------------------------------------
// [2/7] EKSTRAKSI LOGIKA JS KE LINGKUNGAN PENGUJIAN VM
// -----------------------------------------------------------------------------
console.log('\n[2/7] Setup Lingkungan Eksekusi VM & Inisialisasi Logika JS');

const domStore = {};
function createMockElement(id, tag = 'div') {
  return {
    id,
    tagName: tag.toUpperCase(),
    value: id.startsWith('filter_') ? 'ALL' : '',
    textContent: '',
    innerHTML: '',
    classList: {
      classes: new Set(),
      add(...c) { c.forEach(x => this.classes.add(x)); },
      remove(...c) { c.forEach(x => this.classes.delete(x)); },
      contains(c) { return this.classes.has(c); }
    },
    dataset: {}
  };
}

const mockDocument = {
  getElementById(id) {
    if (!domStore[id]) domStore[id] = createMockElement(id);
    return domStore[id];
  },
  querySelector(sel) {
    return createMockElement(sel);
  },
  addEventListener() {}
};

const mockLocalStorage = {
  store: {},
  getItem(k) { return this.store[k] || null; },
  setItem(k, v) { this.store[k] = String(v); },
  removeItem(k) { delete this.store[k]; }
};

const mockSessionStorage = {
  store: {
    'NSR_USER_SESSION': JSON.stringify({ valid: true, role: 'SUPER_ADMIN', isSuperAdmin: true, mode: 'PUSAT' })
  },
  getItem(k) { return this.store[k] || null; },
  setItem(k, v) { this.store[k] = String(v); },
  removeItem(k) { delete this.store[k]; }
};

const mockLocation = {
  hostname: 'localhost',
  href: 'http://localhost/portal-penugasan-jo.html',
  search: ''
};

const sandbox = {
  console,
  document: mockDocument,
  localStorage: mockLocalStorage,
  sessionStorage: mockSessionStorage,
  location: mockLocation,
  URLSearchParams,
  window: {
    location: mockLocation,
    localStorage: mockLocalStorage,
    sessionStorage: mockSessionStorage,
    URLSearchParams,
    CURRENT_AUTH_SESSION: { valid: true, role: 'SUPER_ADMIN', isSuperAdmin: true, mode: 'PUSAT' }
  },
  Intl,
  Date,
  Math,
  confirm: () => true,
  alert: () => {},
  serverCounter: { LAST_NO_ADM_JO: 415 },
  DAFTAR_REKENING_NSR: {
    MANDIRI: { teksCetak: 'Bank Mandiri KC Jakarta 123-00-998877-1' }
  },
  userSession: { role: 'SUPER_ADMIN', isSuperAdmin: true },
  ambilDataPrivatCabang: () => []
};

vm.createContext(sandbox);

const scriptMatch = html.match(/<script\b[^>]*>([\s\S]*?)<\/script>/gi);
assert(scriptMatch && scriptMatch.length > 0, 'Script tag ditemukan dalam HTML');

scriptMatch.forEach(tag => {
  const code = tag.replace(/<script\b[^>]*>|<\/script>/gi, '');
  try {
    vm.runInContext(code, sandbox);
  } catch (e) {
    // Abaikan error DOM runtime normal
  }
});

assert(typeof sandbox.getTodayDateWIB === 'function', 'Fungsi getTodayDateWIB() aktif');
assert(typeof sandbox.isProjectSelesai === 'function', 'Fungsi isProjectSelesai() aktif');
assert(typeof sandbox.getProjectTargetDate === 'function', 'Fungsi getProjectTargetDate() aktif');
assert(typeof sandbox.hitungSelisihHariTenggat === 'function', 'Fungsi hitungSelisihHariTenggat() aktif');
assert(typeof sandbox.evaluasiDeadlinePenugasan === 'function', 'Fungsi evaluasiDeadlinePenugasan() aktif');
assert(typeof sandbox.filterDariKartu === 'function', 'Fungsi filterDariKartu() aktif');
assert(typeof sandbox.isSeedOrDemo === 'function', 'Fungsi pemisahan data dummy isSeedOrDemo() aktif');

// -----------------------------------------------------------------------------
// [3/7] HARDENING POIN 1: TOMBOL SELESAI / BUKA DINONAKTIFKAN (READ-ONLY)
// -----------------------------------------------------------------------------
console.log('\n[3/7] Hardening Poin 1: Verifikasi Mode Read-Only (Tanpa Tombol Toggle Status Tanpa Audit Log)');
assert(typeof sandbox.toggleStatusSelesai === 'undefined', 'Fungsi toggleStatusSelesai dinonaktifkan sementara dari window/scope');

// Verifikasi fungsi renderDashboardTabel tidak memunculkan tombol toggle status
const sampleJob = {
  id: 'NSR-HARDEN-001',
  status: 'APPROVED',
  kantor_wilayah: 'Kantor Pusat Jakarta',
  pemberi_tugas: 'Bank Mandiri',
  nama_debitur: 'PT Sukses Mandiri',
  target_selesai: '2026-11-01',
  pic_utama: 'Tedi Setiadi'
};
vm.runInContext(`projectDatabase = [${JSON.stringify(sampleJob)}];`, sandbox);
sandbox.renderDashboardTabel();

const tableHtml = sandbox.document.getElementById('tbody_antrean').innerHTML;
assert(!tableHtml.includes('toggleStatusSelesai'), 'Tabel HTML TIDAK memuat tombol aksi toggle status (toggleStatusSelesai)');
assert(!tableHtml.includes('Selesai</span>') || !tableHtml.includes('button'), 'Aksi tabel murni baca-saja (tidak ada tombol ubah status)');
assert(tableHtml.includes('bukaPratinjauProyek'), 'Aksi pratinjau baca-saja bukaPratinjauProyek tetap tersedia');

// -----------------------------------------------------------------------------
// [4/7] HARDENING POIN 3: ISOLASI DATA SEED / DEMO
// -----------------------------------------------------------------------------
console.log('\n[4/7] Hardening Poin 3: Isolasi Data SEED / Demo dari Statistik Riil');

const demoProject1 = { id: 'NSR-DEMO-001', nama_debitur: '[CONTOH] PT Sejahtera', status: 'APPROVED' };
const demoProject2 = { id: 'NSR-REAL-002', nama_debitur: 'PT Real Sejahtera', _isSeed: true, status: 'APPROVED' };
const demoProject3 = { id: 'NSR-REAL-003', nama_debitur: 'DEBITUR DUMMY', status: 'APPROVED' };
const realProject = { id: 'NSR-REAL-999', nama_debitur: 'PT Astra International Tbk', status: 'APPROVED' };

assert(sandbox.isSeedOrDemo(demoProject1) === true, 'demoProject1 terdeteksi sebagai data demo/seed');
assert(sandbox.isSeedOrDemo(demoProject2) === true, 'demoProject2 terdeteksi sebagai data demo/seed (_isSeed flag)');
assert(sandbox.isSeedOrDemo(demoProject3) === true, 'demoProject3 terdeteksi sebagai data demo/seed (keyword DUMMY)');
assert(sandbox.isSeedOrDemo(realProject) === false, 'realProject terdeteksi sebagai data riil operasional');

// Uji bahwa data demo tidak masuk ke metrik dashboard jika mode normal
const seedTestArray = [
  demoProject1,
  demoProject2,
  demoProject3,
  { id: 'REAL-1', status: 'APPROVED', target_selesai: '2026-11-20', kantor_wilayah: 'Kantor Pusat Jakarta' },
  { id: 'REAL-2', status: 'SELESAI', target_selesai: '2026-10-15', kantor_wilayah: 'Kantor Pusat Jakarta' }
];
vm.runInContext(`projectDatabase = ${JSON.stringify(seedTestArray)};`, sandbox);

sandbox.renderDashboardTabel();
const countAktifBersih = Number(sandbox.document.getElementById('metric-val-aktif').textContent);
const countSelesaiBersih = Number(sandbox.document.getElementById('metric-val-selesai').textContent);
assert(countAktifBersih === 1, `Metrik Aktif hanya menghitung 1 penugasan riil (REAL-1) bukan data demo (aktual: ${countAktifBersih})`);
assert(countSelesaiBersih === 1, `Metrik Selesai hanya menghitung 1 penugasan riil (REAL-2) (aktual: ${countSelesaiBersih})`);

// -----------------------------------------------------------------------------
// [5/7] VERIFIKASI ZONA WAKTU ASIA/JAKARTA (WIB) & ATURAN DEADLINE RESMI
// -----------------------------------------------------------------------------
console.log('\n[5/7] Verifikasi Zona Waktu Asia/Jakarta (WIB) & Aturan Deadline');

const todayWIB = sandbox.getTodayDateWIB();
assert(/^\d{4}-\d{2}-\d{2}$/.test(todayWIB), `Format tanggal WIB valid YYYY-MM-DD: ${todayWIB}`);

const baseDate = '2026-10-22';

// 1. Tanpa Target Tanggal -> Wajib "Belum ditentukan" dan BUKAN Overdue
const jobTanpaTarget = { id: 'NSR-NO-DEADLINE', status: 'WAITING_APPROVAL', target_selesai: null };
const evNoTarget = sandbox.evaluasiDeadlinePenugasan(jobTanpaTarget, baseDate);
assert(evNoTarget.kategori === 'BELUM_DITENTUKAN', 'Status evaluasi tanpa target = BELUM_DITENTUKAN');
assert(evNoTarget.label === 'Belum ditentukan', 'Label evaluasi = "Belum ditentukan"');
assert(evNoTarget.diff === null, 'Selisih hari = null');

// 2. Pekerjaan Selesai dengan Target Lewat -> Wajib SELESAI dan BUKAN Overdue
const jobSelesai = { id: 'NSR-SELESAI', status: 'SELESAI', target_selesai: '2026-10-10' };
const evSelesai = sandbox.evaluasiDeadlinePenugasan(jobSelesai, baseDate);
assert(evSelesai.kategori === 'SELESAI', 'Pekerjaan selesai status = SELESAI (bukan Overdue)');
assert(evSelesai.label === 'Selesai', 'Label evaluasi selesai = "Selesai"');

// 3. Mendekati Tenggat H-3 s.d H-0
const jobH3 = { id: 'TEST-H3', status: 'APPROVED', target_selesai: '2026-10-25' }; // +3 hari
const evH3 = sandbox.evaluasiDeadlinePenugasan(jobH3, baseDate);
assert(evH3.kategori === 'DEADLINE_NEAR', 'Target H-3 masuk kategori DEADLINE_NEAR');

const jobH1 = { id: 'TEST-H1', status: 'APPROVED', target_selesai: '2026-10-23' }; // +1 hari
const evH1 = sandbox.evaluasiDeadlinePenugasan(jobH1, baseDate);
assert(evH1.kategori === 'DEADLINE_NEAR', 'Target H-1 masuk kategori DEADLINE_NEAR');
assert(evH1.label.includes('Besok'), 'Label H-1 memuat keterangan "Besok"');

const jobH0 = { id: 'TEST-H0', status: 'APPROVED', target_selesai: '2026-10-22' }; // Hari ini
const evH0 = sandbox.evaluasiDeadlinePenugasan(jobH0, baseDate);
assert(evH0.kategori === 'DEADLINE_NEAR', 'Target hari ini masuk kategori DEADLINE_NEAR');
assert(evH0.label.includes('Hari Ini'), 'Label hari ini memuat keterangan "Hari Ini"');

// 4. Melewati Tenggat (Overdue)
const jobOverdue = { id: 'TEST-OVERDUE', status: 'APPROVED', target_selesai: '2026-10-18' }; // -4 hari
const evOverdue = sandbox.evaluasiDeadlinePenugasan(jobOverdue, baseDate);
assert(evOverdue.kategori === 'OVERDUE', 'Target lewat masuk kategori OVERDUE');
assert(evOverdue.diff === -4, 'Diff bernilai negatif (-4 hari)');
assert(evOverdue.label.includes('Overdue') && evOverdue.label.includes('4'), 'Label memuat jumlah hari overdue');

// -----------------------------------------------------------------------------
// [6/7] HARDENING POIN 3: SINKRONISASI ANGKA KARTU VS JUMLAH BARIS TABEL
// -----------------------------------------------------------------------------
console.log('\n[6/7] Hardening Poin 3: Sinkronisasi Presisi Kartu Statistik vs Baris Tabel');

const datasetRiil = [
  { id: 'J1', status: 'APPROVED', target_selesai: '2026-11-13', kantor_wilayah: 'Kantor Pusat Jakarta', pic_utama: 'Tedi Setiadi' }, // Aktif, Aman
  { id: 'J2', status: 'APPROVED', target_selesai: '2026-10-24', kantor_wilayah: 'Kantor Cabang Bandung', pic_utama: 'Ardi Nurmayadi' }, // Aktif, Near (H-2)
  { id: 'J3', status: 'APPROVED', target_selesai: '2026-10-18', kantor_wilayah: 'Kantor Cabang Padang', pic_utama: 'Tedi Setiadi' }, // Aktif, Overdue
  { id: 'J4', status: 'SELESAI', target_selesai: '2026-10-15', kantor_wilayah: 'Kantor Pusat Jakarta', pic_utama: 'Tedi Setiadi' }, // Selesai
  { id: 'J5', status: 'WAITING_APPROVAL', target_selesai: '', kantor_wilayah: 'Kantor Cabang Bandung', pic_utama: 'Ardi Nurmayadi' } // Aktif, Belum Ditentukan
];

vm.runInContext(`projectDatabase = ${JSON.stringify(datasetRiil)};`, sandbox);
sandbox.userSession = { valid: true, role: 'SUPER_ADMIN', isSuperAdmin: true, mode: 'PUSAT' };
sandbox.CURRENT_AUTH_SESSION = sandbox.userSession;
sandbox.window.CURRENT_AUTH_SESSION = sandbox.userSession;

// Reset filter
sandbox.document.getElementById('filter_wilayah').value = 'ALL';
sandbox.document.getElementById('filter_pic').value = 'ALL';
sandbox.document.getElementById('filter_periode').value = 'ALL';
sandbox.document.getElementById('cari_proyek').value = '';
sandbox.document.getElementById('filter_status').value = 'ALL';
sandbox.filterDariKartu(null);

// Hitung baris tabel saat filter OVERDUE dipilih via kartu
sandbox.filterDariKartu('OVERDUE');
const kartuOverdueVal = Number(sandbox.document.getElementById('metric-val-overdue').textContent);
// Parse jumlah baris <tr> dari tbody_antrean
const rowsOverdue = (sandbox.document.getElementById('tbody_antrean').innerHTML.match(/<tr\b/g) || []).length;
assert(kartuOverdueVal === 1, `Kartu Overdue bernilai 1 (aktual: ${kartuOverdueVal})`);
assert(rowsOverdue === kartuOverdueVal, `Jumlah baris tabel (${rowsOverdue}) SAMA PERSIS dengan angka kartu Overdue (${kartuOverdueVal})`);

// Hitung baris tabel saat filter DEADLINE_NEAR dipilih via kartu
sandbox.filterDariKartu('DEADLINE_NEAR');
const kartuNearVal = Number(sandbox.document.getElementById('metric-val-near').textContent);
const rowsNear = (sandbox.document.getElementById('tbody_antrean').innerHTML.match(/<tr\b/g) || []).length;
assert(kartuNearVal === 1, `Kartu Near bernilai 1 (aktual: ${kartuNearVal})`);
assert(rowsNear === kartuNearVal, `Jumlah baris tabel (${rowsNear}) SAMA PERSIS dengan angka kartu Near (${kartuNearVal})`);

// Hitung baris tabel saat filter SELESAI dipilih via kartu
sandbox.filterDariKartu('SELESAI');
const kartuSelesaiVal = Number(sandbox.document.getElementById('metric-val-selesai').textContent);
const rowsSelesai = (sandbox.document.getElementById('tbody_antrean').innerHTML.match(/<tr\b/g) || []).length;
assert(kartuSelesaiVal === 1, `Kartu Selesai bernilai 1 (aktual: ${kartuSelesaiVal})`);
assert(rowsSelesai === kartuSelesaiVal, `Jumlah baris tabel (${rowsSelesai}) SAMA PERSIS dengan angka kartu Selesai (${kartuSelesaiVal})`);

// -----------------------------------------------------------------------------
// [7/7] UJI ISOLASI RBAC CABANG VS PUSAT
// -----------------------------------------------------------------------------
console.log('\n[7/7] Uji Isolasi Hak Akses (RBAC) Cabang vs Pimpinan Pusat');

const cabangPadangSession = {
  valid: true,
  isCabang: true,
  mode: 'CABANG',
  wilayahLabel: 'Kantor Cabang Padang',
  wilayahCode: 'PDG',
  role: 'ADMIN_CABANG'
};
sandbox.userSession = cabangPadangSession;
sandbox.CURRENT_AUTH_SESSION = cabangPadangSession;
sandbox.window.CURRENT_AUTH_SESSION = cabangPadangSession;

sandbox.filterDariKartu(null);
sandbox.renderDashboardTabel();

const padangAktif = Number(sandbox.document.getElementById('metric-val-aktif').textContent);
const padangOverdue = Number(sandbox.document.getElementById('metric-val-overdue').textContent);
const padangSelesai = Number(sandbox.document.getElementById('metric-val-selesai').textContent);

assert(padangAktif === 1, `Staf Padang hanya melihat 1 penugasan aktif cabangnya -> aktual: ${padangAktif}`);
assert(padangOverdue === 1, `Staf Padang melihat 1 penugasan overdue cabangnya -> aktual: ${padangOverdue}`);
assert(padangSelesai === 0, `Staf Padang tidak melihat penugasan selesai cabang lain -> aktual: ${padangSelesai}`);

const wrapWilCabang = sandbox.document.getElementById('wrapper-filter-wilayah');
assert(wrapWilCabang.classList.contains('hidden'), 'Wrapper filter wilayah disembunyikan untuk kantor cabang (Data Isolation)');

console.log('\n======================================================');
console.log(`HASIL AKHIR HARDENED SUITE: ${passedTests} / ${totalTests} PENGUJIAN LULUS SEMPURNA! (100%)`);
console.log('======================================================');
