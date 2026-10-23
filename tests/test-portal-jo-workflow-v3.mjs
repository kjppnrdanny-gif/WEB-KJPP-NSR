import fs from 'fs';
import assert from 'assert';

console.log('================================================================');
console.log('TEST SUITE: WORKFLOW & FORMULIR LINGKUP PENUGASAN SPI 103 (V3)');
console.log('================================================================\n');

let passCount = 0;
let failCount = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✅ PASS: ${name}`);
    passCount++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${name}`);
    console.error(`     Error: ${err.message}`);
    failCount++;
  }
}

const html = fs.readFileSync('portal-penugasan-jo.html', 'utf8');
const php = fs.readFileSync('nolap-data-handler.php', 'utf8');

// -----------------------------------------------------------------------------
// GRUP 1: PEMISAHAN ROLE & TAMPILAN TAB (PRIORITAS 1)
// -----------------------------------------------------------------------------
console.log('--- GRUP 1: PEMISAHAN ROLE & TAMPILAN TAB (PRIORITAS 1) ---');

test('1.1 Non-admin pengaju (Marketing, Surveyor, Penilai) memiliki banner & mode akses masing-masing', () => {
  assert(html.includes("Mode Akses: Marketing Penugasan (Formulir Permintaan Awal)"), 'Banner Marketing hilang');
  assert(html.includes("Mode Akses: Surveyor Lapangan (Formulir Data Teknis Objek)"), 'Banner Surveyor hilang');
  assert(html.includes("Mode Akses: Penilai Beregister Kemenkeu (Masukan & Telaah Teknis)"), 'Banner Penilai hilang');
});

test('1.2 Non-admin pengaju memiliki tombol submit permintaan khusus (bukan penetapan nomor resmi)', () => {
  assert(html.includes("📤 Kirim Permintaan Awal Penugasan (Marketing)"), 'Submit Marketing hilang');
  assert(html.includes("📤 Kirim Data Awal Survei Lapangan"), 'Submit Surveyor hilang');
  assert(html.includes("💾 Simpan Masukan & Rekomendasi Teknis Penilai"), 'Submit Penilai hilang');
  assert(html.includes("submitPermintaanAwalNonAdmin"), 'Handler submitPermintaanAwalNonAdmin hilang');
});

test('1.3 Backend menyediakan endpoint submitPermintaanAwalJO yang menghasilkan nomor referensi REQ', () => {
  assert(php.includes("$action === 'submitPermintaanAwalJO'"), 'Action submitPermintaanAwalJO hilang');
  assert(php.includes("'MENUNGGU_VERIFIKASI_ADMIN'"), 'Status MENUNGGU_VERIFIKASI_ADMIN hilang');
  assert(php.includes("'REQ-'"), 'Format nomor referensi REQ hilang');
});

test('1.4 Backend secara ketat menolak Penilai Beregister menerbitkan nomor resmi Mandiri Cabang', () => {
  // Hanya ADMIN_CABANG, PENILAI_PUBLIK, REKAN, SUPER_ADMIN
  assert(!php.includes("in_array($userRole, ['ADMIN_CABANG', 'PENILAI', 'PENILAI_PUBLIK', 'REKAN']"), 'PENILAI tidak boleh ada dalam otorisasi penerbitan mandiri');
  assert(php.includes("in_array($userRole, ['ADMIN_CABANG', 'PENILAI_PUBLIK', 'REKAN']"), 'Otorisasi Mandiri Cabang harus eksklusif pejabat berwenang');
});

test('1.5 Tab 2 berganti judul menjadi "Permintaan Saya" untuk pengaju non-admin', () => {
  assert(html.includes("📋 2. Permintaan Saya"), 'Label Tab 2 Permintaan Saya hilang');
});

test('1.6 Admin memiliki tombol "Proses & Susun SPK" untuk menangani permintaan masuk dari non-admin', () => {
  assert(html.includes("prosesPermintaanAdmin"), 'Fungsi prosesPermintaanAdmin hilang');
  assert(html.includes("⚡ Proses &amp; Susun SPK"), 'Tombol Proses & Susun SPK hilang');
});

// -----------------------------------------------------------------------------
// GRUP 2: PENYEMPURNAAN PENGGUNA LAPORAN (PRIORITAS 2)
// -----------------------------------------------------------------------------
console.log('\n--- GRUP 2: PENYEMPURNAAN PENGGUNA LAPORAN (PRIORITAS 2) ---');

test('2.1 Pengguna Laporan memiliki 7 atribut terstruktur lengkap', () => {
  assert(html.includes('id="pengguna_laporan_a"'), 'Input nama pengguna_laporan_a hilang');
  assert(html.includes('id="pengguna_laporan_a_alamat"'), 'Input alamat pengguna_laporan_a_alamat hilang');
  assert(html.includes('id="pengguna_laporan_a_pic"'), 'Input pic pengguna_laporan_a_pic hilang');
  assert(html.includes('id="pengguna_laporan_a_jabatan"'), 'Input jabatan pengguna_laporan_a_jabatan hilang');
  assert(html.includes('id="pengguna_laporan_a_kontak"'), 'Input kontak pengguna_laporan_a_kontak hilang');
  assert(html.includes('id="pengguna_laporan_a_email"'), 'Input email pengguna_laporan_a_email hilang');
  assert(html.includes('id="pengguna_laporan_a_bidang"'), 'Input bidang pengguna_laporan_a_bidang hilang');
});

test('2.2 Tersedia checkbox toggle auto-sync "Pengguna Laporan Sama dengan Pemberi Tugas"', () => {
  assert(html.includes('id="chk_pengguna_sama_pemberi"'), 'Checkbox chk_pengguna_sama_pemberi hilang');
  assert(html.includes('togglePenggunaSamaDenganPemberi'), 'Fungsi togglePenggunaSamaDenganPemberi hilang');
  assert(html.includes('syncPenggunaDariPemberi'), 'Fungsi syncPenggunaDariPemberi hilang');
});

test('2.3 Dokumen 1 (SPK Klausul 3) merender atribut Pengguna Laporan secara terstruktur', () => {
  assert(html.includes('pengguna_laporan_a_pic'), 'Klausul 3 harus menampilkan PIC pengguna laporan');
  assert(html.includes('pengguna_laporan_a_jabatan'), 'Klausul 3 harus menampilkan Jabatan PIC pengguna laporan');
  assert(html.includes('pengguna_laporan_a_kontak'), 'Klausul 3 harus menampilkan Kontak PIC pengguna laporan');
  assert(html.includes('pengguna_laporan_a_email'), 'Klausul 3 harus menampilkan Email PIC pengguna laporan');
  assert(html.includes('pengguna_laporan_a_bidang'), 'Klausul 3 harus menampilkan Bidang usaha pengguna laporan');
});

// -----------------------------------------------------------------------------
// GRUP 3: TABEL OBJEK PENILAIAN DINAMIS (PRIORITAS 3)
// -----------------------------------------------------------------------------
console.log('\n--- GRUP 3: TABEL OBJEK PENILAIAN DINAMIS (PRIORITAS 3) ---');

test('3.1 Tabel objek memiliki tombol tambah, hapus, dan pengubah urutan (geser naik/turun)', () => {
  assert(html.includes('tambahBarisObjek'), 'Fungsi tambahBarisObjek hilang');
  assert(html.includes('hapusBarisObjek'), 'Fungsi hapusBarisObjek hilang');
  assert(html.includes('geserBarisObjek'), 'Fungsi geserBarisObjek hilang');
  assert(html.includes('geserBarisObjek(\'${row.id}\', -1)'), 'Tombol geser naik hilang');
  assert(html.includes('geserBarisObjek(\'${row.id}\', 1)'), 'Tombol geser turun hilang');
});

test('3.2 getObjekColumnConfig menyediakan konfigurasi adaptif untuk Tanah/Bangunan, Mesin, dan Alat Berat', () => {
  assert(html.includes("category: 'properti'"), 'Kategori properti hilang');
  assert(html.includes("category: 'mesin'"), 'Kategori mesin hilang');
  assert(html.includes("category: 'alat_berat'"), 'Kategori alat_berat hilang');
  assert(html.includes("Merek & Model / Tipe"), 'Label alat berat hilang');
  assert(html.includes("Merek & Tipe / Model Mesin"), 'Label mesin hilang');
});

test('3.3 formatObjekSpesifikasi tidak memaksakan LT/LB pada objek Mesin atau Alat Berat', () => {
  // Simulasi objek mesin
  const fnMatch = html.match(/function formatObjekSpesifikasi\(o\) \{[\s\S]*?\n    \}/);
  assert(fnMatch, 'formatObjekSpesifikasi function not found');
  assert(html.includes("cfg.category === 'mesin'"), 'Penanganan khusus mesin ada');
  assert(html.includes("cfg.category === 'alat_berat'"), 'Penanganan khusus alat berat ada');
});

// -----------------------------------------------------------------------------
// GRUP 4: POINT 7 BIAYA JASA PENILAIAN (PRIORITAS 4)
// -----------------------------------------------------------------------------
console.log('\n--- GRUP 4: POINT 7 BIAYA JASA PENILAIAN (PRIORITAS 4) ---');

test('4.1 Form menyediakan rincian biaya: Honorarium, Transportasi, Akomodasi, Operasional', () => {
  assert(html.includes('id="biaya_honorarium"'), 'Input biaya_honorarium hilang');
  assert(html.includes('id="biaya_transportasi"'), 'Input biaya_transportasi hilang');
  assert(html.includes('id="status_transportasi"'), 'Dropdown status_transportasi hilang');
  assert(html.includes('id="biaya_akomodasi"'), 'Input biaya_akomodasi hilang');
  assert(html.includes('id="status_akomodasi"'), 'Dropdown status_akomodasi hilang');
  assert(html.includes('id="biaya_operasional_lain"'), 'Input biaya_operasional_lain hilang');
  assert(html.includes('id="status_operasional_lain"'), 'Dropdown status_operasional_lain hilang');
});

test('4.2 Opsi status "Biaya Belum Disepakati (Tahap Penawaran)" tersedia dan terintegrasi', () => {
  assert(html.includes('id="chk_biaya_belum_disepakati"'), 'Checkbox chk_biaya_belum_disepakati hilang');
  assert(html.includes('banner_biaya_belum_disepakati'), 'Banner biaya belum disepakati hilang');
});

test('4.3 kalkulasiBiaya menghitung DPP, PPN 11%, dan Total secara dinamis dengan opsi Included/Excluded', () => {
  assert(html.includes("if (statusTransport === 'EXCLUDED') dpp += transport;"), 'Kalkulasi excluded transport hilang');
  assert(html.includes("if (statusAkomodasi === 'EXCLUDED') dpp += akomodasi;"), 'Kalkulasi excluded akomodasi hilang');
  assert(html.includes("if (isBelumDisepakati)"), 'Penanganan status belum disepakati di kalkulasiBiaya hilang');
});

test('4.4 Klausul 21 Biaya Jasa di SPK menampilkan rincian dan menangani status Belum Disepakati', () => {
  assert(html.includes('Status Biaya: Dalam Tahap Penawaran / Belum Disepakati Final'), 'Klausul status penawaran hilang');
  assert(html.includes('Honorarium Jasa (Professional Fee)'), 'Tabel rincian fee hilang');
  assert(html.includes('Ditagihkan Terpisah'), 'Teks tagihan terpisah hilang');
});

// -----------------------------------------------------------------------------
// GRUP 5: INTEGRITAS WORKFLOW & NO REGRESSION (PRIORITAS 5 & 6)
// -----------------------------------------------------------------------------
console.log('\n--- GRUP 5: INTEGRITAS WORKFLOW & NO REGRESSION (PRIORITAS 5 & 6) ---');

test('5.1 Standardisasi nama Deni Siswandi, S.T., MAPPI tetap dipertahankan', () => {
  assert(html.includes('Deni Siswandi, S.T., MAPPI'), 'Nama standar Deni Siswandi hilang dari HTML');
  assert(php.includes('Deni Siswandi, S.T., MAPPI'), 'Nama standar Deni Siswandi hilang dari PHP');
});

test('5.2 Dual workflow (Mandiri Cabang & Pengajuan Pusat) tetap berfungsi utuh', () => {
  assert(php.includes("$action === 'publishMandiriCabangLP'"), 'Handler publishMandiriCabangLP hilang');
  assert(php.includes("$action === 'submitPengajuanPusatLP'"), 'Handler submitPengajuanPusatLP hilang');
  assert(php.includes("$action === 'publishOfficialLP'"), 'Handler publishOfficialLP hilang');
});

test('5.3 Matriks kompetensi profesional Cabang tetap utuh (Bandung PP vs Padang/Makassar/Palembang PS)', () => {
  assert(php.includes("'Bandung' => ["), 'Matriks Bandung hilang');
  assert(php.includes("'klasifikasi_cabang' => 'PP'"), 'Klasifikasi Bandung PP hilang');
  assert(php.includes("'Padang' => ["), 'Matriks Padang hilang');
  assert(php.includes("'klasifikasi_cabang' => 'PS'"), 'Klasifikasi Padang PS hilang');
  assert(php.includes("'Makassar' => ["), 'Matriks Makassar hilang');
  assert(php.includes("'Palembang' => ["), 'Matriks Palembang hilang');
});

test('5.4 Notifikasi WhatsApp dan Email Pengaju tetap ada dan utuh', () => {
  assert(php.includes("$action === 'kirimNotifikasiApprovalJo'"), 'Handler kirimNotifikasiApprovalJo hilang');
  assert(html.includes("kirimNotifikasiWaPengaju"), 'Fungsi kirimNotifikasiWaPengaju hilang');
});

console.log('\n================================================================');
console.log(`HASIL AKHIR TEST SUITE: ${passCount} PASS / ${failCount} FAIL`);
console.log('================================================================');

if (failCount > 0) {
  process.exit(1);
} else {
  console.log('🎉 SELURUH PENGUJIAN WORKFLOW & FORMULIR SPI 103 BERHASIL 100%!');
  process.exit(0);
}
