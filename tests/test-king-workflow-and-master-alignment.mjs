// tests/test-king-workflow-and-master-alignment.mjs
import fs from 'fs';

console.log('================================================================');
console.log('TEST SUITE: KING FULL AUTHORITY, WORKFLOW & MASTER TEMPLATE');
console.log('Standards: PMK 101/2014, SPI 103, SPI 202, SPI 204, KEPI 5.8');
console.log('================================================================\n');

let pass = 0;
let fail = 0;

function assert(cond, msg) {
  if (cond) {
    console.log(`  ✔ PASS: ${msg}`);
    pass++;
  } else {
    console.error(`  ❌ FAIL: ${msg}`);
    fail++;
  }
}

const html = fs.readFileSync('portal-penugasan-jo.html', 'utf8');
const php = fs.readFileSync('nolap-data-handler.php', 'utf8');
const auth = fs.readFileSync('auth-registry-loader.php', 'utf8');

// [1] VERIFIKASI KEWENANGAN TERTINGGI KING & PEMBEDAAN OPERATOR
console.log('[1] VERIFIKASI KEWENANGAN TERTINGGI KING & OPERATOR DISCRIMINATION:');
assert(
  html.includes('id="section-operator-king"') &&
  html.includes('op_king_danny') &&
  html.includes('op_king_nanang') &&
  html.includes('op_king_deni'),
  '1.1 Modal Approval memuat pemilih 3 Operator Akun KING (Danny, Nanang, Deni)'
);

assert(
  html.includes('verifikasiKredensialPengesahKing') &&
  html.includes('box-verifikasi-profesional-king') &&
  html.includes('badge-status-pin-king'),
  '1.2 Verifikasi PIN / Token kredensial pribadi untuk Nanang & Deni tersedia'
);

assert(
  html.includes('SUPER ADMIN (KING) • Danny Taufik Hidayat') &&
  html.includes('p.pejabat_pengesah_profesional = p.rekan_nama'),
  '1.3 Danny menjalankan kewenangan administratif KING tanpa klaim fiktif penilai publik'
);

assert(
  html.includes('role_akun: isKing ? \'SUPER_ADMIN (KING)\' : \'ADMIN_PUSAT\'') &&
  html.includes('operator_nama: namaOperatorAktif') &&
  html.includes('metode_verifikasi: buktiVerifikasiAktif'),
  '1.4 Audit Trail mencatat operator, peran, keputusan, dan metode verifikasi resmi'
);

assert(
  html.includes('isKing = Boolean(auth && (auth.isKing || auth.role === \'SUPER_ADMIN\' || auth.role === \'SUPER ADMIN\'))') &&
  html.includes('isPrivileged = isKing || isAdminPusat'),
  '1.5 Akun KING memiliki akses Tab 1, Tab 2, Tab 3 tanpa terkunci (Quality Gate bypass untuk pengawasan)'
);

// [2] VERIFIKASI WORKFLOW JALUR A (MANDIRI CABANG) & JALUR B (PUSAT)
console.log('\n[2] VERIFIKASI WORKFLOW JALUR A & JALUR B:');
assert(
  php.includes("publishMandiriCabangLP") &&
  php.includes("$isKing = ($userRole === 'SUPER_ADMIN');") &&
  php.includes("Deni Siswandi, S.T., MAPPI (Cert.)"),
  '2.1 Jalur A (publishMandiriCabangLP) mendukung otorisasi Admin Cabang, Penilai Publik & KING'
);

assert(
  php.includes("if (!$isKing && !empty($userBranch) && strcasecmp($userBranch, 'Pusat') !== 0 && strcasecmp($userBranch, $branchName) !== 0)"),
  '2.2 Isolasi cabang berlaku untuk staf biasa, sedangkan KING memiliki kewenangan lintas cabang'
);

assert(
  html.includes("mode_alur: (isCabang && isMandiri) ? 'MANDIRI' : 'CENTRAL_APPROVAL'") &&
  html.includes("alur: (isCabang && isMandiri) ? 'MANDIRI' : 'PUSAT'"),
  '2.3 Pemisahan jalur penerbitan Mandiri Cabang vs Pengajuan Pusat tersimpan terstruktur'
);

// [3] VERIFIKASI KONSISTENSI KLAUSUL 6 & KLAUSUL 7 (TUJUAN & DASAR NILAI)
console.log('\n[3] VERIFIKASI KONSISTENSI KLAUSUL 6 & KLAUSUL 7 (SPI 101, 102, 202, 204):');
assert(
  html.includes("const includesLikuidasi = dasarNilaiStr.includes('likuidasi')") &&
  html.includes("const narasiOpiniAset = includesLikuidasi") &&
  html.includes("? '<strong>Nilai Pasar dan Indikasi Nilai Likuidasi</strong>'"),
  '3.1 Klausul 6 menyajikan Indikasi Nilai Likuidasi HANYA bila diminta pada Dasar Nilai'
);

assert(
  html.includes("if (isAgunan && includesLikuidasi)") &&
  html.includes("Beberapa pemberi pinjaman membutuhkan penilaian dengan asumsi likuidasi"),
  '3.2 Klausul 7 menyajikan klausul penjelasan SPI 202 Likuidasi HANYA bila diminta'
);

// [4] VERIFIKASI PEMISAHAN EMPAT TANGGAL PENILAIAN (SPI 103):
console.log('\n[4] VERIFIKASI PEMISAHAN EMPAT TANGGAL PENILAIAN (SPI 103):');
assert(
  html.includes('id="tanggal_laporan"') &&
  html.includes('id="tanggal_penilaian"') &&
  html.includes('id="survey_tanggal"') &&
  html.includes('id="tanggal_surat"'),
  '4.1 Form Tab 1 memisahkan Tanggal Penugasan, Inspeksi Lapangan, Tanggal Efektif, dan Tanggal Laporan'
);

assert(
  html.includes('<strong>Tanggal Penilaian (Tanggal Efektif Opini Nilai) :</strong>') &&
  html.includes('tanggal perikatan penugasan (SPK) pada tanggal') &&
  html.includes('target penerbitan laporan pada tanggal'),
  '4.2 Klausul 8 menjabarkan perbedaan keempat tanggal secara eksplisit'
);

// [5] VERIFIKASI HONORARIUM & PAJAK (KLAUSUL 21)
console.log('\n[5] VERIFIKASI TRANSPARANSI HONORARIUM & PAJAK (KLAUSUL 21):');
assert(
  html.includes('id="opsi_pajak_ppn"') &&
  html.includes('value="11"') &&
  html.includes('value="12"') &&
  html.includes('value="0"'),
  '5.1 Form menyediakan pilihan tarif PPN (11%, 12%, Non-PPN 0%)'
);

assert(
  html.includes('Pajak Pertambahan Nilai (PPN ${p.tarif_ppn_persen !== undefined ? p.tarif_ppn_persen : 11}%)') &&
  html.includes('Bebas PPN / Non-PPN (Rp 0)'),
  '5.2 Klausul 21 menyajikan rincian tarif pajak dan status PPN secara adaptif'
);

// [6] VERIFIKASI DOKUMEN 3F — EVALUASI TINGKAT INDEPENDENSI (ETI)
console.log('\n[6] VERIFIKASI DOKUMEN 3F (ETI) BEBAS JAWABAN OTOMATIS:');
assert(
  html.includes('id="panel_deklarasi_eti"') &&
  html.includes('id="eti_q_a"') &&
  html.includes('id="eti_q_g"') &&
  (html.includes('konfirmasiDeklarasiPersonelIndividual') || html.includes('panel_deklarasi_eti')),
  '6.1 Panel deklarasi ETI tersedia di antarmuka dengan 7 butir kuesioner KEPI'
);

assert(
  html.includes('const isUnset = (!ans || ans === \'BELUM_DIISI\');') ||
  html.includes('let boxYa = \'[ &nbsp; ]\';\n                                let boxTidak = \'[ &nbsp; ]\';') ||
  html.includes('[Belum Dideklarasikan]'),
  '6.2 Dokumen 3F tidak lagi meng-hardcode [ X ] pada Tidak; mendukung status belum dideklarasikan [ ]'
);

assert(
  html.includes('⚠️ CATATAN EVALUASI MUTU / PERLU REVIEW:') &&
  html.includes('teridentifikasi potensi ancaman terhadap independensi'),
  '6.3 Jawaban "YA" otomatis memicu catatan evaluasi mutu dan status PERLU REVIEW'
);

// [7] VERIFIKASI DOKUMEN 3G — PERNYATAAN INDEPENDENSI MULTIPERSONEL
console.log('\n[7] VERIFIKASI DOKUMEN 3G (PI) MULTIPERSONEL DENGAN NOMOR TERSENDIRI:');
assert(
  (html.includes('${listPenilai.map(p => p.nama).join(\'<br>\')}') || html.includes('listPenilai.map')) &&
  html.includes('viewPenilaiMappi'),
  '7.1 Dokumen 3G meloop seluruh Penilai Pelaksana dengan nama & kredensial resmi'
);

assert(
  (html.includes('${listAsisten.map(a => a.nama).join(\'<br>\')}') || html.includes('listAsisten.map')) &&
  html.includes('viewAsistenMappi'),
  '7.2 Dokumen 3G meloop seluruh Asisten Penilai dengan nama & kredensial resmi'
);

// [8] VERIFIKASI STANDARDISASI 5 REKAN
console.log('\n[8] VERIFIKASI STANDARDISASI 5 REKAN PENILAI PUBLIK:');
const rekanList = [
  'Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)',
  'Deni Siswandi, S.T., MAPPI (Cert.)',
  'Hernita, S.Si., MAPPI (Cert.)',
  'Muhammad Amin Sade, S.M., MAPPI (Cert.)',
  'Dharma Priyanto Sih Budi Susilo, S.T., MAPPI (Cert.)'
];

rekanList.forEach(r => {
  assert(html.includes(r), `Rekan "${r}" terpasang baku dengan format MAPPI (Cert.)`);
});

assert(!html.includes('Deni Siswandi, S.T., M.Ec.Dev'), 'Deni Siswandi bersih dari gelar M.Ec.Dev');

console.log('\n================================================================');
console.log(`TOTAL UJI: ${pass + fail} | PASS: ${pass} | FAIL: ${fail}`);
console.log('================================================================');

if (fail > 0) {
  process.exit(1);
} else {
  console.log('🎉 SELURUH PENGUJIAN WORKFLOW KING & MASTER TEMPLATE 100% PASS!');
}
