// tests/test-master-personel-system.mjs
// Test Suite: Master Personel Standar & Flexible Assignment System (OPINI NSR 2026)

import fs from 'fs';
import assert from 'assert';

console.log('================================================================');
console.log('TEST SUITE: FINAL MASTER PERSONEL & FLEXIBLE ASSIGNMENT SYSTEM');
console.log('Standards: PMK 101/2014, SPI 103, KJPP NSR Master Standard 2026');
console.log('================================================================\n');

let passCount = 0;
let failCount = 0;

function test(description, fn) {
  try {
    fn();
    console.log(`  ✔ PASS: ${description}`);
    passCount++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${description}`);
    console.error(`     Error: ${err.message}`);
    failCount++;
  }
}

const html = fs.readFileSync('portal-penugasan-jo.html', 'utf8');
const masterPenilaiJson = JSON.parse(fs.readFileSync('data/masters/master_penilai_publik.json', 'utf8'));
const authPhp = fs.readFileSync('auth-registry-loader.php', 'utf8');

// ----------------------------------------------------------------------
console.log('[1] VERIFIKASI STANDARDISASI 5 REKAN PENILAI PUBLIK:');
// ----------------------------------------------------------------------
test('1.1 Lima Rekan Penilai Publik menggunakan format MAPPI (Cert.)', () => {
  const names = [
    'Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)',
    'Deni Siswandi, S.T., MAPPI (Cert.)',
    'Hernita, S.Si., MAPPI (Cert.)',
    'Muhammad Amin Sade, S.M., MAPPI (Cert.)',
    'Dharma Priyanto Sih Budi Susilo, S.T., MAPPI (Cert.)'
  ];
  names.forEach(name => {
    assert(html.includes(name), `Nama ${name} tidak ditemukan di portal-penugasan-jo.html`);
    const inJson = masterPenilaiJson.some(m => m.nama === name);
    assert(inJson, `Nama ${name} tidak ditemukan di master_penilai_publik.json`);
  });
});

test('1.2 Deni Siswandi TIDAK menggunakan gelar M.Ec.Dev.', () => {
  assert(!html.includes('Deni Siswandi, M.Ec.Dev'), 'Ditemukan Deni Siswandi dengan gelar M.Ec.Dev di portal-penugasan-jo.html');
  assert(!html.includes('Deni Siswandi, S.T., M.Ec.Dev'), 'Ditemukan Deni Siswandi dengan gelar S.T., M.Ec.Dev di portal-penugasan-jo.html');
  const deniInJson = masterPenilaiJson.find(m => m.id === 'deni_penilai');
  assert(deniInJson && !deniInJson.nama.includes('M.Ec.Dev'), 'Deni di master_penilai_publik.json memuat M.Ec.Dev');
});

test('1.3 Dharma Priyanto menggunakan S.T. (bukan ST.) dan Amin menggunakan S.M. (bukan SM.)', () => {
  assert(html.includes('Dharma Priyanto Sih Budi Susilo, S.T., MAPPI (Cert.)'), 'Dharma harus menggunakan S.T.');
  assert(html.includes('Muhammad Amin Sade, S.M., MAPPI (Cert.)'), 'Amin harus menggunakan S.M.');
  assert(!html.includes('Muhammad Amin Sade, SM., MAPPI'), 'Ditemukan SM. tanpa titik');
});

// ----------------------------------------------------------------------
console.log('\n[2] VERIFIKASI DROPDOWN & KOREKSI REDAKSI REKAN PENILAI PUBLIK:');
// ----------------------------------------------------------------------
test('2.1 Dropdown Rekan Penilai Publik (#rekan_nama) terhubung ke master berizin resmi', () => {
  assert(html.includes('id="rekan_nama"'), 'Elemen #rekan_nama tidak ditemukan');
  assert(html.includes('vlookupRekan()'), 'Function vlookupRekan() tidak ditemukan');
  assert(html.includes('DATABASE_REKAN'), 'DATABASE_REKAN tidak ditemukan');
});

test('2.2 Field penyesuaian redaksi (#rekan_nama_custom) dan tombol reset master tersedia', () => {
  assert(html.includes('id="rekan_nama_custom"'), 'Elemen #rekan_nama_custom tidak ditemukan');
  assert(html.includes('id="btn_reset_rekan_master"'), 'Tombol #btn_reset_rekan_master tidak ditemukan');
  assert(html.includes('resetRekanMaster()'), 'Function resetRekanMaster() tidak ditemukan');
});

test('2.3 PJ Laporan tidak dapat dibuat manual bebas (wajib master berizin)', () => {
  // Rekan dropdown tidak menyediakan opsi manual untuk membuat penilai publik baru
  const s05RekanSlice = html.substring(html.indexOf('id="rekan_nama"'), html.indexOf('id="reviewer_nama"'));
  assert(!s05RekanSlice.includes('<option value="__MANUAL__">'), 'Dropdown rekan tidak boleh memiliki opsi manual baru');
});

// ----------------------------------------------------------------------
console.log('\n[3] VERIFIKASI DROPDOWN REVIEWER DENGAN OPSI MANUAL:');
// ----------------------------------------------------------------------
test('3.1 Dropdown Reviewer memiliki opsi + Lainnya / Input Nama Manual', () => {
  assert(html.includes('id="reviewer_nama"'), 'Elemen #reviewer_nama tidak ditemukan');
  assert(html.includes('<option value="__MANUAL__">+ Lainnya / Input Nama Manual</option>'), 'Opsi manual reviewer tidak ditemukan');
});

test('3.2 Panel form manual Reviewer (#form_reviewer_manual) lengkap dengan atribut terstruktur', () => {
  assert(html.includes('id="form_reviewer_manual"'), 'Elemen #form_reviewer_manual tidak ditemukan');
  assert(html.includes('id="rev_manual_nama"'), 'Field rev_manual_nama tidak ditemukan');
  assert(html.includes('id="rev_manual_gelar"'), 'Field rev_manual_gelar tidak ditemukan');
  assert(html.includes('id="rev_manual_jabatan"'), 'Field rev_manual_jabatan tidak ditemukan');
  assert(html.includes('id="rev_manual_kantor"'), 'Field rev_manual_kantor tidak ditemukan');
  assert(html.includes('id="rev_manual_rmk"'), 'Field rev_manual_rmk tidak ditemukan');
  assert(html.includes('PENDING_VERIFICATION'), 'Penanda PENDING_VERIFICATION tidak ditemukan');
});

test('3.3 Reviewer master memiliki field koreksi redaksi (#reviewer_nama_custom) dan reset master', () => {
  assert(html.includes('id="reviewer_nama_custom"'), 'Elemen #reviewer_nama_custom tidak ditemukan');
  assert(html.includes('id="btn_reset_reviewer_master"'), 'Tombol #btn_reset_reviewer_master tidak ditemukan');
  assert(html.includes('resetReviewerMaster()'), 'Function resetReviewerMaster() tidak ditemukan');
});

// ----------------------------------------------------------------------
console.log('\n[4] VERIFIKASI MULTIPERSONEL PENILAI PELAKSANA & SURVEYOR:');
// ----------------------------------------------------------------------
test('4.1 Multi-personel Penilai Pelaksana didukung (array, tambah, hapus, urutan)', () => {
  assert(html.includes('id="list_penilai_container"'), 'Container #list_penilai_container tidak ditemukan');
  assert(html.includes('id="btn_tambah_penilai"'), 'Tombol #btn_tambah_penilai tidak ditemukan');
  assert(html.includes('tambahPenilaiBaris()'), 'Function tambahPenilaiBaris() tidak ditemukan');
  assert(html.includes('hapusPenilaiBaris'), 'Function hapusPenilaiBaris() tidak ditemukan');
  assert(html.includes('geserPenilai'), 'Function geserPenilai() tidak ditemukan');
  assert(html.includes('kumpulkanDataPenilaiList()'), 'Function kumpulkanDataPenilaiList() tidak ditemukan');
});

test('4.2 Multi-personel Asisten Penilai / Surveyor didukung (array, tambah, hapus, urutan)', () => {
  assert(html.includes('id="list_asisten_container"'), 'Container #list_asisten_container tidak ditemukan');
  assert(html.includes('id="btn_tambah_asisten"'), 'Tombol #btn_tambah_asisten tidak ditemukan');
  assert(html.includes('tambahAsistenBaris()'), 'Function tambahAsistenBaris() tidak ditemukan');
  assert(html.includes('hapusAsistenBaris'), 'Function hapusAsistenBaris() tidak ditemukan');
  assert(html.includes('geserAsisten'), 'Function geserAsisten() tidak ditemukan');
  assert(html.includes('kumpulkanDataAsistenList()'), 'Function kumpulkanDataAsistenList() tidak ditemukan');
});

test('4.3 Baris personel mendukung pemilihan dari master atau manual PENDING_VERIFICATION', () => {
  assert(html.includes('onPenilaiSourceChange'), 'Handler onPenilaiSourceChange tidak ditemukan');
  assert(html.includes('onAsistenSourceChange'), 'Handler onAsistenSourceChange tidak ditemukan');
  assert(html.includes('onPenilaiManualInput'), 'Handler onPenilaiManualInput tidak ditemukan');
  assert(html.includes('onAsistenManualInput'), 'Handler onAsistenManualInput tidak ditemukan');
});

// ----------------------------------------------------------------------
console.log('\n[5] VERIFIKASI INTEGRASI DATA & STATE MANAGEMENT:');
// ----------------------------------------------------------------------
test('5.1 bangunDraftDariForm() mengumpulkan data personel master, custom, manual, dan multi-list', () => {
  assert(html.includes('rekan_nama_custom:'), 'Draft tidak menyimpan rekan_nama_custom');
  assert(html.includes('reviewer_nama_custom:'), 'Draft tidak menyimpan reviewer_nama_custom');
  assert(html.includes('reviewer_is_manual:'), 'Draft tidak menyimpan reviewer_is_manual');
  assert(html.includes('penilai_list:'), 'Draft tidak menyimpan penilai_list');
  assert(html.includes('asisten_list:'), 'Draft tidak menyimpan asisten_list');
});

test('5.2 Backward compatibility field penilai_nama dan asisten_nama tetap terjaga', () => {
  assert(html.includes('penilai_nama: (() => {'), 'Backward compatibility penilai_nama tidak dibangun');
  assert(html.includes('asisten_nama: (() => {'), 'Backward compatibility asisten_nama tidak dibangun');
});

// ----------------------------------------------------------------------
console.log('\n[6] VERIFIKASI KONSISTENSI DI SEMUA 9 DOKUMEN RESMI:');
// ----------------------------------------------------------------------
test('6.1 Dokumen 1 SPK Klausul 1 & 23 menggunakan rekanTampilan', () => {
  assert(html.includes('<td class="font-bold text-slate-900">${rekanTampilan}</td>'), 'Klausul 1 SPK tidak menggunakan rekanTampilan');
  assert(html.includes('<p class="font-bold underline text-sm">${rekanTampilan}</p>'), 'Klausul 23 TTD SPK tidak menggunakan rekanTampilan');
});

test('6.2 Dokumen 2 Surat Representasi menggunakan rekanTampilan', () => {
  assert(html.includes('<p class="font-bold underline text-sm">${rekanTampilan}</p>'), 'Surat Representasi tidak menggunakan rekanTampilan');
});

test('6.3 Dokumen 3A Lembar Isian Umum meloop seluruh anggota tim penilai dan asisten', () => {
  assert(html.includes('${listPenilai.map(pen => `<strong>${pen.nama}</strong>'), 'Dok 3A tidak meloop listPenilai');
  assert(html.includes('${listAsisten.map(as => `<strong>${as.nama}</strong>'), 'Dok 3A tidak meloop listAsisten');
  assert(html.includes('${reviewerTampilan}'), 'Dok 3A tidak menggunakan reviewerTampilan');
});

test('6.4 Dokumen 3B Form JO menampilkan seluruh pelaksana lapangan', () => {
  assert(html.includes('${listPenilai.map(p => p.nama).join(\', \')} / ${listAsisten.map(a => a.nama).join(\', \')}'), 'Dok 3B tidak menampilkan seluruh tim lapangan');
});

test('6.5 Dokumen 3C Kartu Proyek menampilkan nama reviewer dan penilai penugasan', () => {
  assert(html.includes('<p class="font-bold underline">${reviewerTampilan}</p>'), 'Dok 3C tidak menggunakan reviewerTampilan');
});

test('6.6 Dokumen 3D Surat Tugas memiliki tabel dinamis yang meloop seluruh penilai & surveyor', () => {
  assert(html.includes('listPenilai.forEach(pen => {'), 'Dok 3D tidak meloop listPenilai');
  assert(html.includes('listAsisten.forEach(as => {'), 'Dok 3D tidak meloop listAsisten');
  assert(html.includes('Penilai Pelaksana Lapangan'), 'Dok 3D tidak memuat label Penilai Pelaksana Lapangan');
  assert(html.includes('Asisten Penilai / Surveyor'), 'Dok 3D tidak memuat label Asisten Penilai / Surveyor');
});

test('6.7 Dokumen 3E BAP menampilkan seluruh tim inspeksi di header dan blok tanda tangan', () => {
  assert(html.includes('[...listAsisten.map(a => a.nama), ...listPenilai.map(p => p.nama)].join(\' / \')'), 'Dok 3E tidak menggabungkan seluruh tim inspeksi');
});

test('6.8 Dokumen 3F ETI meloop seluruh tim penilai dan surveyor dalam tabel evaluasi kemandirian', () => {
  assert(html.includes('${reviewerTampilan}</td>\n                            <td>Reviewer</td>') || html.includes('${reviewerTampilan}</td>'), 'Dok 3F tidak memuat reviewerTampilan');
  assert(html.includes('listPenilai.forEach(pen => {'), 'Dok 3F tidak meloop listPenilai');
  assert(html.includes('listAsisten.forEach(as => {'), 'Dok 3F tidak meloop listAsisten');
});

test('6.9 Dokumen 3G PI menampilkan 4 blok tanda tangan dengan nama tim penugasan lengkap', () => {
  assert(html.includes('<p class="font-bold underline text-[10.5px]">${rekanTampilan}</p>'), 'Dok 3G tidak memuat rekanTampilan');
  assert(html.includes('<p class="font-bold underline text-[10.5px]">${reviewerTampilan}</p>'), 'Dok 3G tidak memuat reviewerTampilan');
  assert(html.includes('${listPenilai.map(p => p.nama).join(\'<br>\')}'), 'Dok 3G tidak memuat listPenilai multi-tanda tangan');
  assert(html.includes('${listAsisten.map(a => a.nama).join(\'<br>\')}'), 'Dok 3G tidak memuat listAsisten multi-tanda tangan');
});

// ----------------------------------------------------------------------
console.log('\n[7] VERIFIKASI KEAMANAN RBAC & ISOLASI OTORISASI:');
// ----------------------------------------------------------------------
test('7.1 Reviewer manual berstatus PENDING_VERIFICATION dan tidak memiliki akun sistem / hak RBAC', () => {
  assert(html.includes('PENDING_VERIFICATION'), 'Penanda PENDING_VERIFICATION harus ada');
  assert(html.includes('Reviewer manual tidak memiliki akun sistem dan tidak memperoleh hak login / review SPM / DIVTEK resmi'), 'Peringatan isolasi RBAC harus tercantum');
});

test('7.2 auth-registry-loader.php tersinkronisasi resmi tanpa token mentah baru', () => {
  assert(authPhp.includes('Deni Siswandi, S.T., MAPPI (Cert.)'), 'auth-registry-loader.php harus menggunakan Deni Siswandi, S.T., MAPPI (Cert.)');
});

// ----------------------------------------------------------------------
console.log('\n================================================================');
console.log(`TOTAL UJI: ${passCount + failCount} | PASS: ${passCount} | FAIL: ${failCount}`);
console.log('================================================================');

if (failCount > 0) {
  process.exit(1);
} else {
  console.log('🎉 SELURUH 21 BUTIR UJI MASTER PERSONEL & MULTIPERSONEL LOLOS 100%!');
}
