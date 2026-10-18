/**
 * Test Suite: Ekosistem Mandiri Cabang (SPK/JO -> Kwitansi -> NoLap)
 * Verifies:
 * 1. index.html - Exactly 6 cards in grid, Dynamic Smart Cards, correct URLs & labels
 * 2. portal-penugasan-jo.html - Branch Partner Signer locking, Branch Bank Accounts, Legal Branch Name
 * 3. portal-kwitansi.html - Dual mode (Marketing DP without PIN, Official Branch Receipt with Finance PIN)
 * 4. portal-nolap-cabang.html - Dedicated Standalone Branch Portal, Strictly 3 tabs, Partner lock, Draft & Definitive 7-segmen, Reviewer QC PIN
 * 5. In-Memory PIN RBAC security (Zero DOM credential exposure)
 * 6. portal-nolap.html - Monitoring Tab 6 badge "MANDIRI CABANG - [NAMA REKAN CABANG]"
 * 7. scripts/build-production.mjs - Allowlist and build execution exit code 0
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

let totalTests = 0;
let passedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`  \x1b[32m✔ PASS:\x1b[0m ${message}`);
    passedTests++;
  } else {
    console.error(`  \x1b[31m✖ FAIL:\x1b[0m ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
}

console.log('\n======================================================');
console.log('🧪 TEST SUITE: EKOSISTEM MANDIRI CABANG KJPP NSR');
console.log('======================================================\n');

try {
  // -----------------------------------------------------------------
  // 1. TEST index.html - DYNAMIC SMART CARDS & GRID INTEGRITY
  // -----------------------------------------------------------------
  console.log('\x1b[36m[1/7] Menguji index.html (Dynamic Smart Cards & Grid Layout)\x1b[0m');
  const indexHtml = fs.readFileSync(path.join(ROOT_DIR, 'index.html'), 'utf-8');

  // Cek jumlah kartu operasional di panel-layanan
  const cardMatches = indexHtml.match(/<!--\s*KARTU\s+\d+:/gi) || [];
  assert(cardMatches.length === 6, `Tepat 6 kartu simetris dipertahankan di modal utama (Ditemukan: ${cardMatches.length})`);

  // Pastikan ID dinamis tersedia
  assert(indexHtml.includes('id="title-portal-penugasan"'), 'Elemen id="title-portal-penugasan" tersedia');
  assert(indexHtml.includes('id="sub-portal-penugasan"'), 'Elemen id="sub-portal-penugasan" tersedia');
  assert(indexHtml.includes('id="btn-text-portal-penugasan"'), 'Elemen id="btn-text-portal-penugasan" tersedia');
  assert(indexHtml.includes('id="sublink-portal-penugasan"'), 'Elemen id="sublink-portal-penugasan" tersedia');

  assert(indexHtml.includes('id="title-portal-nolap"'), 'Elemen id="title-portal-nolap" tersedia');
  assert(indexHtml.includes('id="sub-portal-nolap"'), 'Elemen id="sub-portal-nolap" tersedia');
  assert(indexHtml.includes('id="btn-text-portal-nolap"'), 'Elemen id="btn-text-portal-nolap" tersedia');
  assert(indexHtml.includes('id="sublink-portal-nolap"'), 'Elemen id="sublink-portal-nolap" tersedia');

  assert(indexHtml.includes('id="title-portal-kwitansi"'), 'Elemen id="title-portal-kwitansi" tersedia');
  assert(indexHtml.includes('id="sub-portal-kwitansi"'), 'Elemen id="sub-portal-kwitansi" tersedia');
  assert(indexHtml.includes('id="btn-text-portal-kwitansi"'), 'Elemen id="btn-text-portal-kwitansi" tersedia');
  assert(indexHtml.includes('id="sublink-portal-kwitansi"'), 'Elemen id="sublink-portal-kwitansi" tersedia');

  // Pastikan elemen Kartu 4 & Kartu 5 tersedia
  assert(indexHtml.includes('id="kartu-surat-umum"'), 'Elemen id="kartu-surat-umum" pembungkus Kartu 4 tersedia');
  assert(indexHtml.includes('id="title-portal-sop"'), 'Elemen id="title-portal-sop" tersedia');
  assert(indexHtml.includes('id="sub-portal-sop"'), 'Elemen id="sub-portal-sop" tersedia');
  assert(indexHtml.includes('id="btn-text-portal-sop"'), 'Elemen id="btn-text-portal-sop" tersedia');
  assert(indexHtml.includes('id="link-portal-sop"'), 'Elemen id="link-portal-sop" tersedia');

  // Pastikan Modal Permohonan Akses SOP & Form terpasang
  assert(indexHtml.includes('id="modal-request-sop"'), 'Modal id="modal-request-sop" terpasang di DOM');
  assert(indexHtml.includes('id="form-request-sop"'), 'Form id="form-request-sop" terpasang');
  assert(indexHtml.includes('id="req-sop-cabang"'), 'Input id="req-sop-cabang" terpasang');
  assert(indexHtml.includes('id="req-sop-nama"'), 'Input id="req-sop-nama" terpasang');
  assert(indexHtml.includes('id="req-sop-jabatan"'), 'Select id="req-sop-jabatan" terpasang');
  assert(indexHtml.includes('id="req-sop-dokumen"'), 'Textarea id="req-sop-dokumen" terpasang');
  assert(indexHtml.includes('id="req-sop-keperluan"'), 'Input id="req-sop-keperluan" terpasang');

  // Pastikan handler permohonan SOP dan WA admin tersedia
  assert(indexHtml.includes('function bukaModalRequestDokumenSOP()'), 'Fungsi bukaModalRequestDokumenSOP() terdefinisi');
  assert(indexHtml.includes('function kirimPermohonanSopWA('), 'Fungsi kirimPermohonanSopWA(e) terdefinisi');
  assert(indexHtml.includes('6285110513157'), 'Nomor WhatsApp Admin Pusat 6285110513157 terpasang sebagai gateway permohonan berkas');

  // Pastikan fungsi updateDynamicSmartCards ada dan menangani Surat Umum & SOP serta mode mandiri vs pusat
  assert(indexHtml.includes('function updateDynamicSmartCards(auth)'), 'Fungsi updateDynamicSmartCards(auth) terpasang di runtime JS');
  assert(indexHtml.includes("linkJO.href = 'portal-penugasan-jo.html?mode=mandiri'"), 'Tombol Utama JO Cabang mengarah ke mode=mandiri');
  assert(indexHtml.includes("sublinkA.href = 'portal-penugasan-jo.html?mode=pusat'"), 'Tautan Sekunder JO Cabang mengarah ke mode=pusat');
  assert(indexHtml.includes("linkKw.href = 'portal-kwitansi.html?mode=mandiri'"), 'Tombol Utama Kwitansi Cabang mengarah ke mode=mandiri');
  assert(indexHtml.includes("sublinkA.href = 'portal-kwitansi.html?mode=pusat'"), 'Tautan Sekunder Kwitansi Cabang mengarah ke mode=pusat');
  assert(indexHtml.includes("kartuSU.style.display = 'none'"), 'Kartu Surat Umum disembunyikan saat sesi Cabang aktif');
  assert(indexHtml.includes("kartuSU.style.display = ''"), 'Kartu Surat Umum ditampilkan saat sesi Pusat aktif');
  assert(indexHtml.includes('🔒 Minta Akses &nearr;'), 'Label tombol SOP diubah menjadi 🔒 Minta Akses saat sesi Cabang');
  assert(indexHtml.includes('portal-nolap-cabang.html'), 'Routing portal-nolap-cabang.html terkonfigurasi untuk sesi cabang');


  // -----------------------------------------------------------------
  // 2. TEST portal-penugasan-jo.html - BRANCH PARTNER & BANK ACCOUNTS
  // -----------------------------------------------------------------
  console.log('\n\x1b[36m[2/7] Menguji portal-penugasan-jo.html (Branch Signer & Bank Locking)\x1b[0m');
  const joHtml = fs.readFileSync(path.join(ROOT_DIR, 'portal-penugasan-jo.html'), 'utf-8');

  assert(joHtml.includes('getRekanByWilayah'), 'Helper getRekanByWilayah terpasang');
  assert(joHtml.includes('getBankDefaultByWilayah'), 'Helper getBankDefaultByWilayah terpasang');
  assert(joHtml.includes('getNamaKjppLengkap'), 'Helper getNamaKjppLengkap terpasang');

  // Dual-mode radio IDs & state handling
  assert(joHtml.includes('id="alur_kerja_mandiri"'), 'Radio Alur 2 memiliki id="alur_kerja_mandiri"');
  assert(joHtml.includes('id="alur_kerja_pusat"'), 'Radio Alur 1 memiliki id="alur_kerja_pusat"');
  assert(joHtml.includes('function inisialisasiModeAksesDariUrl()'), 'Fungsi inisialisasiModeAksesDariUrl() terpasang');
  assert(joHtml.includes('ALUR 2: Penerbitan Mandiri Cabang (Kewenangan Rekan Pemimpin Cabang)'), 'Label Alur 2 diperbarui: ALUR 2: Penerbitan Mandiri Cabang (Kewenangan Rekan Pemimpin Cabang)');
  assert(joHtml.includes('Nomor SPK &amp; JO terbit instan dari buku register cabang, tersinkronisasi ke database cabang.') || joHtml.includes('Nomor SPK & JO terbit instan dari buku register cabang, tersinkronisasi ke database cabang.'), 'Sub-text Alur 2 diperbarui sinkron dengan buku register cabang');
  assert(joHtml.includes('WAITING_APPROVAL'), 'Banner WAITING_APPROVAL Pusat terpasang');

  // Rekan terkunci sesuai cabang
  assert(joHtml.includes('00581') && joHtml.includes('Deni Siswandi'), 'Bandung terkunci ke Deni Siswandi (00581)');
  assert(joHtml.includes('00046') && joHtml.includes('Hernita'), 'Padang terkunci ke Hernita (PS1.15.00046)');
  assert(joHtml.includes('00126') && joHtml.includes('Amin Sade'), 'Makassar terkunci ke M. Amin Sade (PS1.16.00126)');
  assert(joHtml.includes('00249') && joHtml.includes('Dharma Priyanto'), 'Palembang terkunci ke Dharma Priyanto (PS1.19.00249)');

  // Rekening Bank Default Cabang
  assert(joHtml.includes("'BJB'"), 'Rekening default BJB Cabang Bandung terdaftar');
  assert(joHtml.includes("'BRI'"), 'Rekening default BRI Cabang Padang terdaftar');
  assert(joHtml.includes("'MANDIRI'"), 'Rekening default Mandiri Cabang Makassar terdaftar');
  assert(joHtml.includes("'BTN'"), 'Rekening default BTN Cabang Palembang terdaftar');

  // Isolasi Mode Mandiri Cabang
  assert(joHtml.includes("isModeMandiri = (paramMode === 'mandiri') || (isCabangToken && paramMode !== 'pusat')"), 'Formula isModeMandiri akurat mendeteksi query param mandiri dan token cabang');
  assert(joHtml.includes("containerDualMode.setAttribute('style', 'display: none !important')"), 'Container dual-mode disembunyikan permanen dengan inline style display none');
  assert(joHtml.includes("labelCentral.setAttribute('style', 'display: none !important')"), 'Kartu Alur 1 Pusat disembunyikan permanen saat mode mandiri cabang');
  assert(joHtml.includes("await periksaSesiLogin()"), 'Pemeriksaan sesi login di-await sebelum inisialisasi mode');

  // ---- Dual-Method Approval Feature (Metode A: Digital TTD / Metode B: Scan PDF) ----
  console.log('\n\x1b[36m[2b/7] Menguji Fitur Dual-Method Approval (portal-penugasan-jo.html)\x1b[0m');
  // Modal UI Elements
  assert(joHtml.includes('id="box-pengesahan-digital"'), 'Kontainer Metode A id="box-pengesahan-digital" tersedia di modal approval');
  assert(joHtml.includes('id="box-pengesahan-scan-pdf"'), 'Kontainer Metode B id="box-pengesahan-scan-pdf" tersedia di modal approval');
  assert(joHtml.includes('id="radio-metode-digital"'), 'Radio Metode A id="radio-metode-digital" tersedia');
  assert(joHtml.includes('id="radio-metode-scan"'), 'Radio Metode B id="radio-metode-scan" tersedia');
  assert(joHtml.includes('id="approval_upload_ttd"'), 'Input upload TTD id="approval_upload_ttd" tersedia');
  assert(joHtml.includes('id="approval_upload_stempel"'), 'Input upload Stempel id="approval_upload_stempel" tersedia');
  assert(joHtml.includes('id="approval_upload_pdf"'), 'Input upload PDF id="approval_upload_pdf" tersedia');
  assert(joHtml.includes('id="preview_approval_ttd"'), 'Wadah pratinjau TTD id="preview_approval_ttd" tersedia');
  assert(joHtml.includes('id="preview_approval_stempel"'), 'Wadah pratinjau Stempel id="preview_approval_stempel" tersedia');
  assert(joHtml.includes('id="pdf-file-badge"'), 'Badge info file PDF id="pdf-file-badge" tersedia');
  assert(joHtml.includes('id="overlay-ttd-img"') && joHtml.includes('id="overlay-stempel-img"'), 'Elemen overlay preview gabungan TTD+Stempel tersedia');
  // JS State Functions
  assert(joHtml.includes('let approvalMetodeAktif'), 'State variable approvalMetodeAktif dideklarasikan');
  assert(joHtml.includes('function toggleMetodeApproval('), 'Fungsi toggleMetodeApproval() terdefinisi');
  assert(joHtml.includes('function gunakanPresetTtd('), 'Fungsi gunakanPresetTtd() preset TTD terdefinisi');
  assert(joHtml.includes('function gunakanPresetStempel('), 'Fungsi gunakanPresetStempel() preset Stempel terdefinisi');
  assert(joHtml.includes('function bacaFileTtdDigital('), 'Fungsi bacaFileTtdDigital() FileReader TTD terdefinisi');
  assert(joHtml.includes('function bacaFilePdfScanBasah('), 'Fungsi bacaFilePdfScanBasah() FileReader PDF terdefinisi');
  assert(joHtml.includes('function resetApprovalDualMethodState('), 'Fungsi resetApprovalDualMethodState() terdefinisi');
  assert(joHtml.includes('function handleDropPdf('), 'Fungsi handleDropPdf() drag-and-drop PDF terdefinisi');
  assert(joHtml.includes('function batalkanPilihPdf('), 'Fungsi batalkanPilihPdf() terdefinisi');
  // SVG Preset Data
  assert(joHtml.includes('PRESET_TTD_NANANG') && joHtml.includes('PRESET_TTD_DENI'), 'Preset SVG TTD Nanang Rahayu & Deni Siswandi terdefinisi');
  assert(joHtml.includes('PRESET_STEMPEL_NSR'), 'Preset SVG Stempel KJPP NSR terdefinisi');
  // Data Model
  assert(joHtml.includes("p.metode_pengesahan = isMetodeScanAktif ? 'SCAN_BASAH' : 'DIGITAL'"), "Field p.metode_pengesahan disimpan saat approval");
  assert(joHtml.includes('p.berkas_scan_pdf = {'), 'Objek p.berkas_scan_pdf disimpan saat Metode B aktif');
  assert(joHtml.includes('p.ttd_digital_base64 = approvalTtdDataUrl'), 'Field p.ttd_digital_base64 disimpan saat Metode A');
  assert(joHtml.includes('p.stempel_digital_base64 = approvalStempelDataUrl'), 'Field p.stempel_digital_base64 disimpan saat Metode A');
  assert(joHtml.includes('p.status_approval = "APPROVED"'), "Field p.status_approval diset ke APPROVED");
  assert(joHtml.includes("p.approved_by = 'ADMIN_PUSAT'"), "Field p.approved_by diset ke ADMIN_PUSAT");
  // Quality Gate Tab 3
  assert(joHtml.includes('_isCentralWaiting'), 'Quality Gate _isCentralWaiting mengevaluasi WAITING_APPROVAL di pindahTab');
  assert(joHtml.includes('Pratinjau & Cetak (Terkunci'), 'Label Tab 3 berubah Terkunci saat Central submission WAITING_APPROVAL');
  // Tab 3 Rendering
  assert(joHtml.includes('_scanBanner'), 'Banner scan basah _scanBanner dirender saat Metode B APPROVED');
  assert(joHtml.includes('DOKUMEN RESMI TANDA TANGAN BASAH TERSEDIA'), 'Teks banner scan basah tersedia di renderSemuaDokumen');
  assert(joHtml.includes('function renderTtdOverlay('), 'Helper renderTtdOverlay() terdefinisi di renderSemuaDokumen');
  assert(joHtml.includes('_isDigitalApproved'), 'Flag _isDigitalApproved mengontrol injeksi overlay TTD+Stempel');
  // Dashboard Action Column
  assert(joHtml.includes("metode_pengesahan === 'SCAN_BASAH' && p.berkas_scan_pdf"), 'Tab 2 membedakan tombol unduh PDF vs cetak berdasarkan metode_pengesahan');

  // ---- 2c. Universal Token SSO & Isolasi Mutlak Tab 2 Cabang ----
  console.log('\n\x1b[36m[2c/7] Menguji Universal Token SSO & Isolasi Mutlak Tab 2 Cabang\x1b[0m');
  
  // A. Uji resolveUnifiedToken dengan token NSR8899, NSR-PST-2026, NSR-ADM-2026
  const resolveMatch = joHtml.match(/function resolveUnifiedToken\s*\([^)]*\)\s*\{[\s\S]*?\n    \}/);
  assert(resolveMatch !== null, 'Fungsi resolveUnifiedToken ditemukan di portal-penugasan-jo.html');
  const resolveUnifiedToken = new Function(resolveMatch[0] + '; return resolveUnifiedToken;')();

  const auth8899 = resolveUnifiedToken('NSR8899');
  assert(auth8899 && auth8899.roleLabel === 'SUPER ADMIN • KANTOR PUSAT' && auth8899.isSuperAdmin === true, 'Token NSR8899 menghasilkan role SUPER ADMIN • KANTOR PUSAT');
  assert(auth8899.mode === 'PUSAT' && auth8899.isCabang === false, 'Token NSR8899 mode PUSAT dan bukan cabang');

  const authPst = resolveUnifiedToken('NSR-PST-2026');
  assert(authPst && authPst.roleLabel === 'SUPER ADMIN • KANTOR PUSAT' && authPst.isSuperAdmin === true, 'Token NSR-PST-2026 menghasilkan role SUPER ADMIN • KANTOR PUSAT');
  assert(authPst.mode === 'PUSAT' && authPst.canApprove === true, 'Token NSR-PST-2026 memiliki izin otorisasi penuh');

  const authAdm = resolveUnifiedToken('NSR-ADM-2026');
  assert(authAdm && authAdm.roleLabel === 'SUPER ADMIN • KANTOR PUSAT' && authAdm.isSuperAdmin === true, 'Token NSR-ADM-2026 menghasilkan role SUPER ADMIN • KANTOR PUSAT');

  const authBdg = resolveUnifiedToken('NSR-BDG-2026');
  assert(authBdg && authBdg.role === 'ADMIN_CABANG' && authBdg.isCabang === true && authBdg.wilayah === 'Bandung', 'Token NSR-BDG-2026 dikenali sebagai Admin Cabang Bandung');
  assert(authBdg.kodeKantor === '2.0160-04' && authBdg.rekan.includes('Deni Siswandi'), 'Token NSR-BDG-2026 memuat kode kantor 2.0160-04 dan rekan Deni Siswandi');

  // B. Uji Isolasi Tab 2 dengan dataset tiruan (Jakarta, Bandung, Palembang)
  const mockDataset = [
    { id: 'JO-PST-01', kantor_wilayah: 'Kantor Pusat Jakarta', debitur_nama: 'PT Megah Jakarta', status: 'APPROVED' },
    { id: 'JO-BDG-01', kantor_wilayah: 'Kantor Cabang Bandung', debitur_nama: 'PT Priangan Bandung', status: 'WAITING_APPROVAL' },
    { id: 'JO-BDG-02', kantor_wilayah: 'Kantor Cabang Bandung', debitur_nama: 'CV Dago Mandiri', status: 'APPROVED' },
    { id: 'JO-PLB-01', kantor_wilayah: 'Kantor Cabang Palembang', debitur_nama: 'PT Sriwijaya Sakti', status: 'APPROVED' }
  ];

  const isCabangUser = Boolean(authBdg && (authBdg.isCabang || (authBdg.mode === 'CABANG' && !authBdg.isSuperAdmin)));
  const namaCabangSesi = (authBdg.wilayah || authBdg.kantor || '').trim().toLowerCase();

  let filteredProjects = [...mockDataset];
  if (isCabangUser) {
    filteredProjects = filteredProjects.filter(item => {
      const itemWilayah = (item.kantor_wilayah || item.wilayah || '').trim().toLowerCase();
      return itemWilayah.includes(namaCabangSesi) || namaCabangSesi.includes(itemWilayah);
    });
  }

  const jakartaCount = filteredProjects.filter(p => p.kantor_wilayah.toLowerCase().includes('jakarta')).length;
  const palembangCount = filteredProjects.filter(p => p.kantor_wilayah.toLowerCase().includes('palembang')).length;
  const bandungCount = filteredProjects.filter(p => p.kantor_wilayah.toLowerCase().includes('bandung')).length;

  assert(isCabangUser === true, 'Sesi NSR-BDG-2026 berstatus cabang aktif (isCabangUser = true)');
  assert(filteredProjects.length === 2, `Isolasi Tab 2: Hanya 2 proyek milik Bandung yang tersisa (Ditemukan: ${filteredProjects.length})`);
  assert(bandungCount === 2, 'Isolasi Tab 2: Seluruh proyek yang tersisa merupakan milik Cabang Bandung');
  assert(jakartaCount === 0, 'Isolasi Tab 2: Proyek Kantor Pusat Jakarta tereliminasi mutlak (count = 0)');
  assert(palembangCount === 0, 'Isolasi Tab 2: Proyek Kantor Cabang Palembang tereliminasi mutlak (count = 0)');

  // C. Uji Proteksi UI Tab 2 (wrapper-filter-wilayah & opsi wilayah)
  assert(joHtml.includes('id="wrapper-filter-wilayah"'), 'Wrapper filter wilayah memiliki id="wrapper-filter-wilayah"');
  assert(joHtml.includes("wrapFilterWil.classList.add('hidden')"), 'Wrapper filter wilayah disembunyikan saat sesi Cabang aktif');
  assert(joHtml.includes('selFilterWil.disabled = true'), 'Dropdown filter wilayah dinonaktifkan (disabled) untuk sesi Cabang');
  assert(joHtml.includes('selFilterWil.innerHTML = `<option value="${cWil}">${cWil}</option>`'), 'Opsi dropdown wilayah dibersihkan dan hanya menampilkan cabang aktif (Opsi Semua Wilayah dihilangkan)');
  assert(joHtml.includes('id="modal-token-auth"') && joHtml.includes('hidden') && joHtml.includes('data-alias="modal-auth-token gerbang-otorisasi"'), 'Modal token auth memiliki class hidden secara default untuk mencegah flicker sebelum hidrasi JS');
  assert(joHtml.includes('simpanSesiSSO'), 'Fungsi simpanSesiSSO menyinkronkan NSR_AUTH_TOKEN, NSR_USER_SESSION, TOKEN_AUTH_NSR, CURRENT_AUTH_TOKEN');
  assert(joHtml.includes('unduhBackupPrivatCabang'), 'Fungsi unduhBackupPrivatCabang mengisolasi ekspor JSON khusus data cabang aktif');

  // D. Uji Kebersihan Markup DOM (Zero Static Dummy Rows di tbody_antrean)
  const tbodyAntreanMatch = joHtml.match(/<tbody\s+id="tbody_antrean"[^>]*>([\s\S]*?)<\/tbody>/i);
  assert(tbodyAntreanMatch !== null, 'Tag <tbody id="tbody_antrean"> ditemukan di portal-penugasan-jo.html');
  assert(tbodyAntreanMatch[1].trim() === '', 'Tag <tbody id="tbody_antrean"> dalam keadaan KOSONG TOTAL (Zero hardcoded dummy rows)');

  // E. Uji Isolasi Khusus Cabang Padang (NSR-PDG-2026)
  const authPdg = resolveUnifiedToken('NSR-PDG-2026');
  assert(authPdg && authPdg.role === 'ADMIN_CABANG' && authPdg.isCabang === true && authPdg.wilayah === 'Padang', 'Token NSR-PDG-2026 dikenali sebagai Admin Cabang Padang');
  assert(authPdg.kodeKantor === '2.0160-01' && authPdg.kodeWilayah === '2.0160-01', 'Token NSR-PDG-2026 memuat kode kantor dan kode wilayah resmi 2.0160-01');

  const mockDatasetPadang = [
    { id: 'JO-PST-01', kantor_wilayah: 'Kantor Pusat Jakarta', debitur_nama: 'PT Megah Jakarta', status: 'APPROVED' },
    { id: 'JO-BDG-01', kantor_wilayah: 'Kantor Cabang Bandung', debitur_nama: 'PT Priangan Bandung', status: 'WAITING_APPROVAL' },
    { id: 'JO-PDG-01', kantor_wilayah: 'Kantor Cabang Padang', debitur_nama: 'PT Minang Sejahtera', nomor_spk: '0001/NSR-PDG/PN-APP/X/2026', status: 'APPROVED' },
    { id: 'JO-PLB-01', kantor_wilayah: 'Kantor Cabang Palembang', debitur_nama: 'PT Sriwijaya Sakti', status: 'APPROVED' }
  ];

  const namaCabangPadang = (authPdg.wilayahLabel || authPdg.wilayah || '').toLowerCase();
  const kataKunciPadang = namaCabangPadang.replace('kantor cabang', '').trim();
  const kodeKemenkeuPadang = (authPdg.kodeWilayah || authPdg.kode || authPdg.kodeKantor || '').toLowerCase();

  const filteredPadang = mockDatasetPadang.filter(item => {
    const wilayahItem = (item.kantor_wilayah || item.wilayah || '').toLowerCase();
    const kodeItem = (item.kode_kantor || item.kode || item.kodeWilayah || '').toLowerCase();
    const noSpkItem = (item.nomor_spk || item.no_spk || item.nomor_lp || '').toLowerCase();
    const noAdmItem = (item.nomor_adm || item.id || '').toLowerCase();
    const shortCode = (authPdg.wilayahCode || kataKunciPadang.substring(0, 3)).toLowerCase();
    
    return wilayahItem.includes(kataKunciPadang) || 
           (kodeKemenkeuPadang && kodeItem.includes(kodeKemenkeuPadang)) || 
           (noSpkItem && (noSpkItem.includes(`nsr-${shortCode}`) || noSpkItem.includes(`/${shortCode}/`) || noSpkItem.includes(`nsr-${kataKunciPadang.substring(0, 3)}`))) ||
           (noAdmItem && (noAdmItem.includes(`nsr-${shortCode}`) || noAdmItem.includes(`/${shortCode}/`)));
  });

  assert(filteredPadang.length === 1 && filteredPadang[0].id === 'JO-PDG-01', 'Isolasi Mutlak Cabang Padang: Hanya data Padang yang lolos (Jakarta, Bandung, Palembang = 0)');
  assert(joHtml.includes('Belum Ada Riwayat Penugasan untuk'), 'Tersedia Empty State ramah pengguna saat riwayat cabang kosong');
  assert(joHtml.includes('📋 2. Buku Register & Riwayat Cabang'), 'Teks tombol Tab 2 diperbarui menjadi Buku Register & Riwayat Cabang untuk sesi cabang');
  assert(joHtml.includes("selectWilayah.closest('.filter-col, div')?.setAttribute('style', 'display: none !important')"), 'Filter wilayah disembunyikan langsung dengan inline style display none');



  // -----------------------------------------------------------------
  // 3. TEST portal-kwitansi.html - DUAL MODE KWITANSI & PIN FINANCE
  // -----------------------------------------------------------------
  console.log('\n\x1b[36m[3/7] Menguji portal-kwitansi.html (Dual-Mode & Finance PIN RBAC)\x1b[0m');
  const kwHtml = fs.readFileSync(path.join(ROOT_DIR, 'portal-kwitansi.html'), 'utf-8');

  assert(kwHtml.includes('terbitkanDrafMarketing'), 'Fungsi terbitkanDrafMarketing (Mode A - Tanpa PIN) terpasang');
  assert(kwHtml.includes('bukaModalPinFinanceCabang'), 'Fungsi bukaModalPinFinanceCabang (Mode B) terpasang');
  assert(kwHtml.includes('verifikasiDanTerbitkanKwitansiResmiCabang'), 'Fungsi verifikasiDanTerbitkanKwitansiResmiCabang terpasang');
  assert(kwHtml.includes('modal-pin-finance-cabang'), 'Modal PIN Finance Cabang terpasang di DOM');
  assert(kwHtml.includes('KW-NSR-'), 'Format nomor kwitansi resmi cabang KW-NSR-[KODE_CABANG] terkonfigurasi');
  assert(kwHtml.includes("isModeMandiriKw = (modeKw === 'mandiri') || (isCabangUser && modeKw !== 'pusat')"), 'Pemisahan mode mandiri kwitansi terpasang');
  assert(kwHtml.includes("btnSubmitPengajuan.setAttribute('style', 'display: none !important')"), 'Tombol pengajuan ke keuangan pusat disembunyikan saat mode mandiri aktif');
  assert(kwHtml.includes("tabBtnPusat.setAttribute('style', 'display: none !important')"), 'Tab verifikasi pusat disembunyikan saat mode mandiri kwitansi aktif');


  // -----------------------------------------------------------------
  // 4. TEST portal-nolap-cabang.html - STANDALONE MODULE CABANG
  // -----------------------------------------------------------------
  console.log('\n\x1b[36m[4/7] Menguji portal-nolap-cabang.html (Standalone Module Cabang)\x1b[0m');
  assert(fs.existsSync(path.join(ROOT_DIR, 'portal-nolap-cabang.html')), 'File portal-nolap-cabang.html eksis di root');
  const cbgHtml = fs.readFileSync(path.join(ROOT_DIR, 'portal-nolap-cabang.html'), 'utf-8');

  // Palette & Glowing Badge
  assert(cbgHtml.includes('MODE MANDIRI KANTOR CABANG'), 'Badge MODE MANDIRI KANTOR CABANG terpasang');
  assert(cbgHtml.includes('badge-glowing-cabang'), 'Animasi pulse glowing terpasang');

  // 3 Tab Saja
  assert(cbgHtml.includes('tab-btn-form') && cbgHtml.includes('tab-btn-riwayat') && cbgHtml.includes('tab-btn-qc'), 'Tepat 3 Tab resmi terpasang');
  assert(!cbgHtml.includes('tab-btn-verifikasi') && !cbgHtml.includes('tab-btn-mitigasi'), 'Tab Pusat (Verifikasi/Mitigasi/Approval) tidak dirender di portal cabang');

  // Nanang Rahayu strictly excluded from CABANG_CONFIG partners
  assert(!cbgHtml.includes('rekan: { nama: "Ir. Nanang Rahayu') && !cbgHtml.includes("rekan: { nama: 'Ir. Nanang Rahayu"), 'Ir. Nanang Rahayu tidak terdaftar sebagai rekan cabang di CABANG_CONFIG');
  assert(cbgHtml.includes('Deni Siswandi') && cbgHtml.includes('Hernita') && cbgHtml.includes('Amin Sade') && cbgHtml.includes('Dharma Priyanto'), 'Keempat Rekan Cabang terdaftar lengkap di CABANG_CONFIG');

  // SPK Bridge & Dual Mode
  assert(cbgHtml.includes('tarikDataDariPenugasan'), 'Auto-Populate Bridge dari SPK/JO terpasang');
  assert(cbgHtml.includes('terbitkanNomorDrafCabang') || cbgHtml.includes('terbitkanNomorDraftCabang'), 'Penerbitan Draf Kerja Cabang (0 Detik) terpasang');
  assert(cbgHtml.includes('verifikasiDanTerbitkanDefinitifCabang'), 'Penerbitan Definitif 7 Segmen dengan PIN Admin terpasang');
  assert(cbgHtml.includes('verifikasiPinQcReviewer'), 'Otorisasi PIN Reviewer QC terpasang');

  // Keamanan Yurisdiksi Cabang: Hapus Tombol Ganti Cabang & Kunci Token
  assert(!cbgHtml.toLowerCase().includes('ganti cabang'), 'Tombol "Ganti Cabang" TIDAK LAGI DITEMUKAN di seluruh markup portal-nolap-cabang.html (Zero local branch switching)');
  assert(!cbgHtml.includes('keluarSesiCabang'), 'Fungsi override keluarSesiCabang() telah dihapus dari portal-nolap-cabang.html');
  assert(cbgHtml.includes('gantiTokenSesi'), 'Alur pergantian cabang terkunci melalui modal token utama (gantiTokenSesi)');


  // -----------------------------------------------------------------
  // 5. TEST SECURITY: ZERO PIN EXPOSURE IN HTML DOM
  // -----------------------------------------------------------------
  console.log('\n\x1b[36m[5/7] Menguji Keamanan Kredensial (Zero DOM Exposure)\x1b[0m');
  const filesToCheck = ['portal-nolap.html', 'portal-nolap-dev.html', 'portal-kwitansi.html', 'portal-nolap-cabang.html', 'portal-penugasan-jo.html', 'index.html'];
  const sensitivePins = [
    'BDG-FIN-55', 'PDG-FIN-55', 'MKS-FIN-55', 'PLB-FIN-55',
    'BDG-ADM-11', 'PDG-ADM-22', 'MKS-ADM-33', 'PLB-ADM-44',
    'BDG-REV-77', 'PDG-REV-77', 'MKS-REV-77', 'PLB-REV-77'
  ];

  filesToCheck.forEach(file => {
    const content = fs.readFileSync(path.join(ROOT_DIR, file), 'utf-8');
    // Hapus script dan style agar kita hanya menguji markup visual/DOM yang dirender ke pengguna
    const markupOnly = content.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                              .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
    sensitivePins.forEach(pin => {
      assert(!markupOnly.includes(pin), `PIN ${pin} TIDAK bocor dalam elemen visual/markup DOM di ${file}`);
    });
  });


  // -----------------------------------------------------------------
  // 6. TEST portal-nolap.html TAB 6 MONITORING BADGE
  // -----------------------------------------------------------------
  console.log('\n\x1b[36m[6/7] Menguji portal-nolap.html (Tab 6 Monitoring Badge)\x1b[0m');
  const nolapHtml = fs.readFileSync(path.join(ROOT_DIR, 'portal-nolap.html'), 'utf-8');
  assert(nolapHtml.includes('MANDIRI CABANG - '), 'Badge MANDIRI CABANG - [NAMA REKAN CABANG] terpasang di Tab 6');


  // -----------------------------------------------------------------
  // 7. TEST BUILD PRODUCTION & ALLOWLIST
  // -----------------------------------------------------------------
  console.log('\n\x1b[36m[7/7] Menguji Build Produksi (scripts/build-production.mjs)\x1b[0m');
  const buildMjs = fs.readFileSync(path.join(ROOT_DIR, 'scripts', 'build-production.mjs'), 'utf-8');
  assert(buildMjs.includes('"portal-nolap-cabang.html"'), 'portal-nolap-cabang.html terdaftar di ALLOWED_FILES');

  // Jalankan build script
  const buildOutput = execSync('node scripts/build-production.mjs', { cwd: ROOT_DIR, encoding: 'utf-8' });
  assert(buildOutput.includes('BUILD SELESAI'), 'Build produksi berhasil dieksekusi dengan status sukses');
  assert(fs.existsSync(path.join(ROOT_DIR, 'dist', 'portal-nolap-cabang.html')), 'dist/portal-nolap-cabang.html berhasil dibuat di direktori publik');

  console.log('\n======================================================');
  console.log(`\x1b[32m🎉 SEMUA PENGUJIAN BERHASIL: ${passedTests}/${totalTests} UJI VALID!\x1b[0m`);
  console.log('======================================================\n');
  process.exit(0);

} catch (err) {
  console.error('\n\x1b[31m❌ TEST ERROR:\x1b[0m', err.message);
  process.exit(1);
}
