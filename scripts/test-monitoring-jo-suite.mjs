import fs from 'fs';
import path from 'path';
import vm from 'vm';

console.log('======================================================');
console.log('🧪 PENGUJIAN MENYELURUH TAHAP 2: MONITORING PENUGASAN & DEADLINE');
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
// [1/6] AUDIT ELEMEN UI FRONTEND: portal-penugasan-jo.html
// -----------------------------------------------------------------------------
console.log('[1/6] Audit Elemen UI Frontend: portal-penugasan-jo.html');
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

// Verifikasi 9 Kolom Header Tabel
assert(html.includes('No. Pengajuan / ID'), 'Header Tabel Kolom 1: No. Pengajuan / ID');
assert(html.includes('Kantor Wilayah'), 'Header Tabel Kolom 2: Kantor Wilayah');
assert(html.includes('Pemberi Tugas &amp; Debitur'), 'Header Tabel Kolom 3: Pemberi Tugas & Debitur');
assert(html.includes('Objek &amp; Nilai'), 'Header Tabel Kolom 4: Objek & Nilai');
assert(html.includes('PIC &amp; Tim Penilai'), 'Header Tabel Kolom 5: PIC & Tim Penilai');
assert(html.includes('Target Penyelesaian (SLA)'), 'Header Tabel Kolom 6: Target Penyelesaian (SLA)');
assert(html.includes('Nomor Resmi (SPK &amp; JO)'), 'Header Tabel Kolom 7: Nomor Resmi (SPK & JO)');
assert(html.includes('Aksi'), 'Header Tabel Kolom 9: Aksi');

// -----------------------------------------------------------------------------
// [2/6] EKSTRAKSI LOGIKA JS KE LINGKUNGAN PENGUJIAN VM
// -----------------------------------------------------------------------------
console.log('\n[2/6] Setup Lingkungan Eksekusi VM & Inisialisasi Logika JS');

// Mock browser globals
const domStore = {};
function createMockElement(id, tag = 'div') {
  return {
    id,
    tagName: tag.toUpperCase(),
    value: 'ALL',
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
  }
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

// Ekstrak blok script dari HTML
const scriptMatch = html.match(/<script\b[^>]*>([\s\S]*?)<\/script>/gi);
assert(scriptMatch && scriptMatch.length > 0, 'Script tag ditemukan dalam HTML');

// Jalankan script utama di sandbox
scriptMatch.forEach(tag => {
  const code = tag.replace(/<script\b[^>]*>|<\/script>/gi, '');
  try {
    vm.runInContext(code, sandbox);
  } catch (e) {
    console.log('Script execution error:', e.message, 'at stack:', e.stack.split('\n')[1]);
  }
});

assert(typeof sandbox.getTodayDateWIB === 'function', 'Fungsi getTodayDateWIB() aktif');
assert(typeof sandbox.isProjectSelesai === 'function', 'Fungsi isProjectSelesai() aktif');
assert(typeof sandbox.getProjectTargetDate === 'function', 'Fungsi getProjectTargetDate() aktif');
assert(typeof sandbox.hitungSelisihHariTenggat === 'function', 'Fungsi hitungSelisihHariTenggat() aktif');
assert(typeof sandbox.evaluasiDeadlinePenugasan === 'function', 'Fungsi evaluasiDeadlinePenugasan() aktif');
assert(typeof sandbox.filterDariKartu === 'function', 'Fungsi filterDariKartu() aktif');
assert(typeof sandbox.toggleStatusSelesai === 'function', 'Fungsi toggleStatusSelesai() aktif');

// -----------------------------------------------------------------------------
// [3/6] VERIFIKASI ZONA WAKTU INDONESIA (ASIA/JAKARTA) & SELISIH HARI
// -----------------------------------------------------------------------------
console.log('\n[3/6] Verifikasi Zona Waktu Asia/Jakarta (WIB) & Hitung Selisih Hari');

const todayWIB = sandbox.getTodayDateWIB();
assert(/^\d{4}-\d{2}-\d{2}$/.test(todayWIB), `Format tanggal WIB valid YYYY-MM-DD: ${todayWIB}`);

// Uji kalkulasi selisih hari
assert(sandbox.hitungSelisihHariTenggat('2026-10-25', '2026-10-25') === 0, 'Hari yang sama = 0 hari');
assert(sandbox.hitungSelisihHariTenggat('2026-10-26', '2026-10-25') === 1, 'Besok = +1 hari');
assert(sandbox.hitungSelisihHariTenggat('2026-10-28', '2026-10-25') === 3, 'H-3 = +3 hari');
assert(sandbox.hitungSelisihHariTenggat('2026-10-24', '2026-10-25') === -1, 'Kemarin = -1 hari (Overdue)');
assert(sandbox.hitungSelisihHariTenggat('2026-11-01', '2026-10-25') === 7, 'Lintas bulan = +7 hari');
assert(sandbox.hitungSelisihHariTenggat('', '2026-10-25') === null, 'Target kosong = null');

// -----------------------------------------------------------------------------
// [4/6] UJI ATURAN DATA B: DEADLINE, SELESAI, DAN BELUM DITENTUKAN
// -----------------------------------------------------------------------------
console.log('\n[4/6] Uji Aturan Data B (Deadline, Selesai, dan Belum Ditentukan)');

const baseDate = '2026-10-22';

// Kasus 1: Tanpa Target Tanggal -> Wajib "Belum ditentukan" dan BUKAN Overdue
const jobTanpaTarget = {
  id: 'NSR-TEST-NO-DEADLINE',
  status: 'WAITING_APPROVAL',
  target_selesai: null,
  masa_berlaku_lp: ''
};
const evNoTarget = sandbox.evaluasiDeadlinePenugasan(jobTanpaTarget, baseDate);
assert(evNoTarget.kategori === 'BELUM_DITENTUKAN', 'Status evaluasi tanpa target = BELUM_DITENTUKAN');
assert(evNoTarget.label === 'Belum ditentukan', 'Label evaluasi = "Belum ditentukan"');
assert(evNoTarget.diff === null, 'Selisih hari = null');

// Kasus 2: Pekerjaan Sudah Selesai dengan Target Kadaluarsa -> Wajib SELESAI dan BUKAN Overdue
const jobSelesai = {
  id: 'NSR-TEST-SELESAI',
  status: 'SELESAI',
  target_selesai: '2026-10-10' // Lewat 12 hari yang lalu
};
const evSelesai = sandbox.evaluasiDeadlinePenugasan(jobSelesai, baseDate);
assert(evSelesai.kategori === 'SELESAI', 'Pekerjaan selesai status = SELESAI (bukan Overdue)');
assert(evSelesai.label === 'Selesai', 'Label evaluasi selesai = "Selesai"');
assert(evSelesai.diff === null, 'Diff = null');

// Kasus 3: Mendekati Tenggat H-3 s.d H-0
const jobH3 = { id: 'TEST-H3', status: 'APPROVED', target_selesai: '2026-10-25' }; // +3 hari
const evH3 = sandbox.evaluasiDeadlinePenugasan(jobH3, baseDate);
assert(evH3.kategori === 'DEADLINE_NEAR', 'Target H-3 masuk kategori DEADLINE_NEAR');
assert(evH3.label === 'H-3', 'Label H-3 sesuai');

const jobH1 = { id: 'TEST-H1', status: 'APPROVED', target_selesai: '2026-10-23' }; // +1 hari
const evH1 = sandbox.evaluasiDeadlinePenugasan(jobH1, baseDate);
assert(evH1.kategori === 'DEADLINE_NEAR', 'Target H-1 masuk kategori DEADLINE_NEAR');
assert(evH1.label.includes('Besok'), 'Label H-1 memuat keterangan "Besok"');

const jobH0 = { id: 'TEST-H0', status: 'APPROVED', target_selesai: '2026-10-22' }; // Hari ini
const evH0 = sandbox.evaluasiDeadlinePenugasan(jobH0, baseDate);
assert(evH0.kategori === 'DEADLINE_NEAR', 'Target hari ini masuk kategori DEADLINE_NEAR');
assert(evH0.label.includes('Hari Ini'), 'Label hari ini memuat keterangan "Hari Ini"');

// Kasus 4: Melewati Tenggat (Overdue)
const jobOverdue = { id: 'TEST-OVERDUE', status: 'APPROVED', target_selesai: '2026-10-18' }; // -4 hari
const evOverdue = sandbox.evaluasiDeadlinePenugasan(jobOverdue, baseDate);
assert(evOverdue.kategori === 'OVERDUE', 'Target lewat masuk kategori OVERDUE');
assert(evOverdue.diff === -4, 'Diff bernilai negatif (-4 hari)');
assert(evOverdue.label.includes('Overdue') && evOverdue.label.includes('4'), 'Label memuat jumlah hari overdue');

// Kasus 5: Aman (> 3 hari)
const jobAman = { id: 'TEST-AMAN', status: 'APPROVED', target_selesai: '2026-11-10' }; // +19 hari
const evAman = sandbox.evaluasiDeadlinePenugasan(jobAman, baseDate);
assert(evAman.kategori === 'AMAN', 'Target > 3 hari masuk kategori AMAN');

// -----------------------------------------------------------------------------
// [5/6] UJI 4 KARTU METRIK & INTERAKTIVITAS KLIK-TO-FILTER
// -----------------------------------------------------------------------------
console.log('\n[5/6] Uji 4 Kartu Metrik & Interaktivitas Klik-to-Filter');

// Set dataset proyek simulasi
const testProjects = [
  { id: 'P1', status: 'APPROVED', target_selesai: '2026-11-13', kantor_wilayah: 'Kantor Pusat Jakarta', penilai_nama: 'Tedi Setiadi' }, // Aktif, Aman
  { id: 'P2', status: 'APPROVED', target_selesai: '2026-10-24', kantor_wilayah: 'Kantor Cabang Bandung', penilai_nama: 'Ardi Nurmayadi' }, // Aktif, Near (H-2)
  { id: 'P3', status: 'APPROVED', target_selesai: '2026-10-18', kantor_wilayah: 'Kantor Cabang Padang', penilai_nama: 'Tedi Setiadi' }, // Aktif, Overdue
  { id: 'P4', status: 'SELESAI', target_selesai: '2026-10-15', kantor_wilayah: 'Kantor Pusat Jakarta', penilai_nama: 'Tedi Setiadi' }, // Selesai (Bukan Overdue)
  { id: 'P5', status: 'WAITING_APPROVAL', target_selesai: '', kantor_wilayah: 'Kantor Cabang Bandung', penilai_nama: 'Ardi Nurmayadi' } // Aktif, Belum Ditentukan
];

vm.runInContext(`projectDatabase = ${JSON.stringify(testProjects)};`, sandbox);

sandbox.userSession = { valid: true, role: 'SUPER_ADMIN', isSuperAdmin: true, mode: 'PUSAT' };
sandbox.CURRENT_AUTH_SESSION = sandbox.userSession;
sandbox.window.CURRENT_AUTH_SESSION = sandbox.userSession;
vm.runInContext(`userSession = window.CURRENT_AUTH_SESSION;`, sandbox);

// Panggil render
sandbox.renderDashboardTabel();

// Cek nilai metrik
const mAktif = Number(sandbox.document.getElementById('metric-val-aktif').textContent);
const mNear = Number(sandbox.document.getElementById('metric-val-near').textContent);
const mOverdue = Number(sandbox.document.getElementById('metric-val-overdue').textContent);
const mSelesai = Number(sandbox.document.getElementById('metric-val-selesai').textContent);

assert(mAktif === 4, `Total Penugasan Aktif terhitung 4 (P1, P2, P3, P5) -> aktual: ${mAktif}`);
assert(mNear === 1, `Total Mendekati Tenggat terhitung 1 (P2) -> aktual: ${mNear}`);
assert(mOverdue === 1, `Total Overdue terhitung 1 (P3) -> aktual: ${mOverdue}`);
assert(mSelesai === 1, `Total Selesai terhitung 1 (P4) -> aktual: ${mSelesai}`);

// Uji Klik-to-Filter Card Overdue
sandbox.filterDariKartu('OVERDUE');
const currentFilterVal = vm.runInContext('activeMonitoringFilter', sandbox);
assert(currentFilterVal === 'OVERDUE', 'activeMonitoringFilter berubah menjadi OVERDUE');
assert(sandbox.document.getElementById('filter_status').value === 'OVERDUE', 'Dropdown filter_status sinkron ke OVERDUE');

// Uji Klik Ulang untuk membatalkan filter
sandbox.filterDariKartu('OVERDUE');
const resetFilterVal = vm.runInContext('activeMonitoringFilter', sandbox);
assert(resetFilterVal === null, 'Klik ulang membatalkan filter (null)');
assert(sandbox.document.getElementById('filter_status').value === 'ALL', 'Dropdown filter_status kembali ke ALL');

// Uji Reset Filter
sandbox.document.getElementById('filter_status').value = 'DEADLINE_NEAR';
sandbox.document.getElementById('cari_proyek').value = 'BCA';
sandbox.resetSemuaFilterMonitoring();
assert(sandbox.document.getElementById('filter_status').value === 'ALL', 'Reset mengembalikan filter_status ke ALL');
assert(sandbox.document.getElementById('cari_proyek').value === '', 'Reset mengosongkan cari_proyek');

// -----------------------------------------------------------------------------
// [6/6] UJI ISOLASI RBAC CABANG VS PUSAT
// -----------------------------------------------------------------------------
console.log('\n[6/6] Uji Isolasi Hak Akses (RBAC) Cabang vs Pimpinan Pusat');

// Login Cabang Padang
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

sandbox.renderDashboardTabel();

// User cabang Padang hanya boleh menghitung data Padang (P3 saja)
const padangAktif = Number(sandbox.document.getElementById('metric-val-aktif').textContent);
const padangOverdue = Number(sandbox.document.getElementById('metric-val-overdue').textContent);
const padangSelesai = Number(sandbox.document.getElementById('metric-val-selesai').textContent);

assert(padangAktif === 1, `Staf Padang hanya melihat 1 penugasan aktif cabangnya -> aktual: ${padangAktif}`);
assert(padangOverdue === 1, `Staf Padang melihat 1 penugasan overdue cabangnya -> aktual: ${padangOverdue}`);
assert(padangSelesai === 0, `Staf Padang tidak melihat penugasan selesai cabang lain -> aktual: ${padangSelesai}`);

// Wrapper filter wilayah wajib disembunyikan untuk staf cabang
const wrapWilCabang = sandbox.document.getElementById('wrapper-filter-wilayah');
assert(wrapWilCabang.classList.contains('hidden'), 'Wrapper filter wilayah disembunyikan untuk kantor cabang (Data Isolation)');

// Kembalikan ke Sesi Pimpinan Pusat
const pusatSession = {
  valid: true,
  isCabang: false,
  mode: 'PUSAT',
  role: 'SUPER_ADMIN',
  isSuperAdmin: true
};
sandbox.userSession = pusatSession;
sandbox.CURRENT_AUTH_SESSION = pusatSession;
sandbox.window.CURRENT_AUTH_SESSION = pusatSession;
sandbox.renderDashboardTabel();
const wrapWilPusat = sandbox.document.getElementById('wrapper-filter-wilayah');
assert(!wrapWilPusat.classList.contains('hidden'), 'Wrapper filter wilayah ditampilkan untuk Admin Pusat');

console.log('\n======================================================');
console.log(`HASIL AKHIR: ${passedTests} / ${totalTests} PENGUJIAN LULUS DENGAN SEMPURNA! (100%)`);
console.log('======================================================');
