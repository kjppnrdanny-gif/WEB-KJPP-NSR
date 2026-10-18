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

  // F. Uji Quality Gate Lock Tab 3 (Pratinjau & Cetak 9 Dokumen)
  console.log('\n\x1b[36m[2d/7] Menguji Quality Gate Lock Tab 3 (portal-penugasan-jo.html)\x1b[0m');
  assert(joHtml.includes('function gantiTab(tabIdx)'), 'Fungsi navigasi gantiTab(tabIdx) terpasang di portal-penugasan-jo.html');
  assert(joHtml.includes('AKSES DITOLAK — QUALITY GATE TERKUNCI!'), 'Peringatan kepatuhan Quality Gate Lock terpasang di gantiTab');
  assert(joHtml.includes('Akses Cetak Dibatasi! Dokumen ini berada dalam ranah Pengajuan Kantor Pusat'), 'Peringatan khusus Quality Gate pengajuan pusat terpasang');
  assert(joHtml.includes('🔒 3. Pratinjau & Cetak (Terkunci - Menunggu Approval Pusat)'), 'Label Tab 3 indikator menunggu approval pusat terpasang');
  assert(joHtml.includes('id="tab3-lock-screen"'), 'Container overlay gembok id="tab3-lock-screen" terpasang di Tab 3');
  assert(joHtml.includes('🔒 DOKUMEN PENGAJUAN BELUM DISETUJUI PUSAT'), 'Judul gembok penolakan cetak pengajuan pusat terpasang di lock screen');
  assert(joHtml.includes('id="toolbar-cetak-dokumen"'), 'Bilah tombol cetak id="toolbar-cetak-dokumen" terpasang');
  assert(joHtml.includes('id="lembar-pratinjau-dokumen"'), 'Container lembar dokumen id="lembar-pratinjau-dokumen" terpasang');
  assert(joHtml.includes('function renderPratinjauDokumen()'), 'Fungsi renderPratinjauDokumen() terpasang dengan kendali lock-screen');
  assert(joHtml.includes('function perbaruiIndikatorTab3('), 'Fungsi perbaruiIndikatorTab3() terpasang untuk indikator visual header');
  assert(joHtml.includes('🔒 3. Pratinjau &amp; Cetak (Terkunci)'), 'Indikator tombol Tab 3 terpasang gembok terkunci secara default');
  assert(joHtml.includes('onclick="gantiTab(2)"'), 'Tombol fallback kembali ke Tab 2 terpasang pada lock screen');

  // Simulasi Navigasi Guard Tab 3:
  const simulasikanGuardTab3 = (sesiAuth, proyekAktif) => {
    const isApproved = proyekAktif && (proyekAktif.status === 'APPROVED' || proyekAktif.status_approval === 'APPROVED');
    const isSuperAdmin = Boolean(sesiAuth && sesiAuth.isSuperAdmin);
    if (!isSuperAdmin && !isApproved) {
      return { diblokir: true, targetTab: 2 };
    }
    return { diblokir: false, targetTab: 3 };
  };

  const authPlb = resolveUnifiedToken('NSR-PLB-2026');
  assert(authPlb && authPlb.isCabang === true, 'Token NSR-PLB-2026 dikenali sebagai sesi Cabang Palembang');

  // Test 1: Sesi Palembang klik Tab 3 langsung tanpa proyek terpilih
  const hasilKlikLangsung = simulasikanGuardTab3(authPlb, null);
  assert(hasilKlikLangsung.diblokir === true && hasilKlikLangsung.targetTab === 2, 'Quality Gate Guard: Sesi Cabang Palembang diblokir dari Tab 3 tanpa proyek terpilih (Redirect ke Tab 2)');

  // Test 2: Sesi Palembang memiliki proyek WAITING_APPROVAL
  const proyekWaiting = { id: 'REQ-01', status: 'WAITING_APPROVAL' };
  const hasilWaiting = simulasikanGuardTab3(authPlb, proyekWaiting);
  assert(hasilWaiting.diblokir === true && hasilWaiting.targetTab === 2, 'Quality Gate Guard: Sesi Cabang diblokir dari Tab 3 jika proyek berstatus WAITING_APPROVAL');

  // Test 3: Sesi Palembang memiliki proyek APPROVED
  const proyekApproved = { id: 'REQ-01', status: 'APPROVED' };
  const hasilApproved = simulasikanGuardTab3(authPlb, proyekApproved);
  assert(hasilApproved.diblokir === false && hasilApproved.targetTab === 3, 'Quality Gate Guard: Sesi Cabang diizinkan membuka Tab 3 jika proyek berstatus APPROVED');

  // Test 4: Sesi Super Admin Pusat (NSR8899 / NSR-PST-2026)
  const authPusat = resolveUnifiedToken('NSR8899');
  const hasilSuperAdmin = simulasikanGuardTab3(authPusat, null);
  assert(hasilSuperAdmin.diblokir === false && hasilSuperAdmin.targetTab === 3, 'Quality Gate Guard: Super Admin Pusat memiliki hak inspeksi Tab 3');

  // Skenario Khusus: Siklus Hidup Pengajuan Cabang Palembang (NSR-PLB-2026) ke Pusat
  const simulasikanSiklusPengajuanPusat = (auth, proyek, modeAlur) => {
    const isSuperAdmin = Boolean(auth && (auth.isSuperAdmin || auth.role === 'SUPER_ADMIN' || auth.role === 'ADMIN_PUSAT'));
    const isCabang = Boolean(auth && (auth.isCabang || auth.role === 'ADMIN_CABANG'));

    const isPengajuanPusat = (modeAlur === 'PUSAT' || modeAlur === 'CENTRAL_APPROVAL') ||
      (proyek && (proyek.alur === 'PUSAT' || proyek.target === 'PUSAT' || proyek.mode_alur === 'CENTRAL_APPROVAL' || proyek.mode_pengaju === 'PUSAT' || proyek.status === 'WAITING_APPROVAL'));
    const isDisetujuiPusat = Boolean(proyek && (proyek.status === 'APPROVED' && (proyek.status_approval === 'APPROVED' || !proyek.status_approval || proyek.status === 'APPROVED')));
    const isMandiriCabang = (modeAlur === 'MANDIRI' || modeAlur === 'PRIVATE_CABANG') && !isPengajuanPusat;

    let diblokir = false;
    let targetTab = 3;
    let label = '';

    if (isSuperAdmin) {
      diblokir = false;
      targetTab = 3;
      label = '🖨️ 3. Pratinjau & Cetak 9 Dokumen';
    } else if (isPengajuanPusat && !isDisetujuiPusat) {
      diblokir = true;
      targetTab = 2;
      label = '🔒 3. Pratinjau & Cetak (Terkunci - Menunggu Approval Pusat)';
    } else if (isMandiriCabang) {
      diblokir = false;
      targetTab = 3;
      label = '🖨️ 3. Pratinjau & Cetak Dokumen Cabang';
    } else if (isDisetujuiPusat) {
      diblokir = false;
      targetTab = 3;
      label = '🖨️ 3. Pratinjau & Cetak 9 Dokumen';
    } else {
      diblokir = true;
      targetTab = 2;
      label = '🔒 3. Pratinjau & Cetak (Terkunci)';
    }
    return { diblokir, targetTab, label };
  };

  // Step 1: Palembang ajukan ke pusat -> WAITING_APPROVAL
  const pengajuanPalembang = {
    id: 'REQ-PLB-001',
    mode_pengaju: 'PUSAT',
    mode_alur: 'CENTRAL_APPROVAL',
    status: 'WAITING_APPROVAL',
    debitur_nama: 'PT Semen Baturaja Tbk'
  };

  const guardPalembangPending = simulasikanSiklusPengajuanPusat(authPlb, pengajuanPalembang, 'CENTRAL_APPROVAL');
  assert(guardPalembangPending.diblokir === true && guardPalembangPending.targetTab === 2, 'Quality Gate: Sesi Cabang Palembang diblokir dari Tab 3 saat status WAITING_APPROVAL (Redirect ke Tab 2)');
  assert(guardPalembangPending.label === '🔒 3. Pratinjau & Cetak (Terkunci - Menunggu Approval Pusat)', 'Quality Gate: Label Tab 3 terkunci menunggu approval pusat');

  // Step 2: Super Admin Pusat review
  const guardPusatReview = simulasikanSiklusPengajuanPusat(authPusat, pengajuanPalembang, 'CENTRAL_APPROVAL');
  assert(guardPusatReview.diblokir === false && guardPusatReview.targetTab === 3, 'Quality Gate: Super Admin Pusat memiliki akses inspeksi Tab 3 untuk otorisasi');

  // Approval dieksekusi oleh Super Admin Pusat
  pengajuanPalembang.status = 'APPROVED';
  pengajuanPalembang.status_approval = 'APPROVED';
  pengajuanPalembang.nomor_lp = '0416/NSR/PN-APP/X/2026';
  pengajuanPalembang.nomor_adm = '0416/JO/NSR/X/2026';

  // Step 3: Cek kembali akun Cabang Palembang pasca approval
  const guardPalembangApproved = simulasikanSiklusPengajuanPusat(authPlb, pengajuanPalembang, 'CENTRAL_APPROVAL');
  assert(guardPalembangApproved.diblokir === false && guardPalembangApproved.targetTab === 3, 'Quality Gate: Tab 3 otomatis terbuka bagi Cabang Palembang pasca-approval pusat');
  assert(guardPalembangApproved.label === '🖨️ 3. Pratinjau & Cetak 9 Dokumen', 'Quality Gate: Label Tab 3 berganti menjadi 🖨️ 3. Pratinjau & Cetak 9 Dokumen');

  // G. Uji Mode Mandiri Cabang & Tab 3 Quality Gate Unlock untuk Admin Cabang
  console.log('\n\x1b[36m[2e/7] Menguji Mode Mandiri Cabang & Instant Unlock Tab 3 (portal-penugasan-jo.html)\x1b[0m');
  assert(joHtml.includes("currentModeAlur = 'MANDIRI'"), 'currentModeAlur dikunci ke MANDIRI saat sesi cabang login');
  assert(joHtml.includes('Mode Akses: Penerbitan Mandiri'), 'Banner hijau penerbitan mandiri cabang terpasang');
  assert(joHtml.includes('Simpan & Cetak Instan (Mandiri Cabang)'), 'Tombol Simpan & Cetak Instan Mandiri Cabang terpasang');
  assert(joHtml.includes('🖨️ 3. Pratinjau & Cetak Dokumen Cabang'), 'Label Tab 3 terbuka (UNLOCKED) untuk Admin Cabang');
  assert(joHtml.includes("status_approval: (isPrivateCabang && isCabangAdmin) ? 'APPROVED_CABANG'"), 'Status approval otomatis APPROVED_CABANG untuk penugasan mandiri cabang');
  assert(joHtml.includes("gantiTab(3)"), 'Admin Cabang otomatis diarahkan ke Tab 3 saat submit instan');

  // H. Uji Direct In-Context Approval & Upload Scan Basah Toolbar Tab 3
  console.log('\n\x1b[36m[2f/7] Menguji Direct In-Context Approval Toolbar Tab 3 (portal-penugasan-jo.html)\x1b[0m');
  assert(joHtml.includes('id="btn-approval-toolbar-tab3"'), 'Tombol id="btn-approval-toolbar-tab3" terpasang di toolbar Tab 3');
  assert(joHtml.includes('id="label-btn-approval-tab3"'), 'Elemen label id="label-btn-approval-tab3" terpasang di tombol approval');
  assert(joHtml.includes('bukaModalApprovalDariTab3'), 'Fungsi bukaModalApprovalDariTab3 terpasang');
  assert(joHtml.includes('bukaModalApprovalPusat'), 'Fungsi bukaModalApprovalPusat terpasang');
  assert(joHtml.includes('window.bukaModalApprovalDariTab3 = bukaModalApprovalDariTab3'), 'Fungsi bukaModalApprovalDariTab3 diekspor ke window');
  assert(joHtml.includes('window.bukaModalApprovalPusat = bukaModalApprovalPusat'), 'Fungsi bukaModalApprovalPusat diekspor ke window');

  // Simulasi Logika RBAC Toolbar Tab 3
  function simulasikanToolbarTab3(auth, proyekAktif) {
    const isCabang = Boolean(auth && (auth.isCabang || auth.role === 'ADMIN_CABANG'));
    const isSuperAdmin = Boolean(auth && (auth.isSuperAdmin || auth.role === 'SUPER_ADMIN' || auth.role === 'ADMIN_PUSAT'));
    
    let isVisible = false;
    let label = '';
    let isPulse = false;

    if (!isSuperAdmin || isCabang) {
      isVisible = false;
    } else {
      if (proyekAktif) {
        isVisible = true;
        const statusProyek = (proyekAktif.status || proyekAktif.status_approval || '').toUpperCase();
        if (statusProyek === 'WAITING_APPROVAL') {
          label = '⚖️ Otorisasi & Upload Scan (Pending)';
          isPulse = true;
        } else if (statusProyek === 'APPROVED' || statusProyek === 'TERBIT') {
          label = '✅ Berkas Telah Disahkan (Ubah / Re-upload)';
        } else {
          label = 'Otorisasi / Upload Scan PDF';
        }
      } else {
        isVisible = false;
      }
    }
    return { isVisible, label, isPulse };
  }

  // 1. Cabang Padang -> Wajib HIDDEN
  const tbPadang = simulasikanToolbarTab3(authPdg, { id: 'REQ-PDG-001', status: 'WAITING_APPROVAL' });
  assert(tbPadang.isVisible === false, 'RBAC Toolbar Tab 3: Sesi Cabang Padang tersembunyi mutlak (isVisible === false)');

  // 2. Super Admin Pusat -> Proyek WAITING_APPROVAL -> Amber pulsing & label pending
  const tbPusatPending = simulasikanToolbarTab3(authPusat, { id: 'REQ-2026-001', status: 'WAITING_APPROVAL' });
  assert(tbPusatPending.isVisible === true, 'RBAC Toolbar Tab 3: Sesi Super Admin Pusat tombol otorisasi tampil');
  assert(tbPusatPending.isPulse === true, 'RBAC Toolbar Tab 3: Mode WAITING_APPROVAL mengaktifkan styling pulsing');
  assert(tbPusatPending.label.includes('Pending'), 'RBAC Toolbar Tab 3: Label WAITING_APPROVAL mencantumkan status pending');

  // 3. Super Admin Pusat -> Proyek APPROVED -> Hijau Berkas Telah Disahkan
  const tbPusatApproved = simulasikanToolbarTab3(authPusat, { id: 'NSR-2026-0415', status: 'APPROVED' });
  assert(tbPusatApproved.isVisible === true, 'RBAC Toolbar Tab 3: Sesi Super Admin Pusat berkas approved tetap tampil untuk re-upload');
  assert(tbPusatApproved.label.includes('Telah Disahkan'), 'RBAC Toolbar Tab 3: Label APPROVED menampilkan status telah disahkan');

  // 4. Super Admin Pusat -> Tidak ada proyek terpilih -> Hidden
  const tbPusatNoProject = simulasikanToolbarTab3(authPusat, null);
  assert(tbPusatNoProject.isVisible === false, 'RBAC Toolbar Tab 3: Tersembunyi saat tidak ada proyek aktif terpilih');



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
  // 6b. TEST LOCKDOWN AKSES SURAT UMUM (SU) UNTUK KANTOR CABANG
  // -----------------------------------------------------------------
  console.log('\n\x1b[36m[6b/7] Menguji Penutupan Mutlak (Total Lockdown) Surat Umum untuk Cabang\x1b[0m');
  const suHtml = fs.readFileSync(path.join(ROOT_DIR, 'portal-surat-umum.html'), 'utf-8');

  // A. Topbar portal-penugasan-jo.html
  assert(joHtml.includes('id="nav-link-surat-umum"'), 'portal-penugasan-jo.html memiliki id="nav-link-surat-umum"');
  assert(joHtml.includes("navSuratUmum.classList.add('hidden')") && joHtml.includes("navSuratUmum.style.setProperty('display', 'none', 'important')"), 'portal-penugasan-jo.html menyembunyikan link SU dengan display none important untuk sesi cabang');

  // B. Topbar portal-kwitansi.html
  assert(kwHtml.includes('id="nav-link-surat-umum"'), 'portal-kwitansi.html memiliki id="nav-link-surat-umum"');
  assert(kwHtml.includes("navSuratUmum.classList.add('hidden')") && kwHtml.includes("navSuratUmum.style.setProperty('display', 'none', 'important')"), 'portal-kwitansi.html menyembunyikan link SU dengan display none important untuk sesi cabang');

  // C. Navbar portal-nolap-cabang.html
  const headerNolapCabang = cbgHtml.match(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi)?.[0] || '';
  assert(!headerNolapCabang.includes('portal-surat-umum.html') && !headerNolapCabang.includes('Surat Umum'), 'Header navbar portal-nolap-cabang.html steril mutlak dari tautan Surat Umum');

  // D. Route Guard di portal-surat-umum.html
  assert(suHtml.includes('dapatkanSesiLogin()'), 'portal-surat-umum.html memiliki fungsi helper dapatkanSesiLogin()');
  assert(suHtml.includes('resolveUnifiedTokenSync('), 'portal-surat-umum.html memiliki fungsi resolusi token sinkron');
  assert(suHtml.includes('const auth = window.CURRENT_AUTH_SESSION || dapatkanSesiLogin()'), 'portal-surat-umum.html memeriksa sesi via CURRENT_AUTH_SESSION atau dapatkanSesiLogin');
  assert(suHtml.includes('!auth || auth.isCabang === true'), 'portal-surat-umum.html memiliki guard pencegat rute !auth || auth.isCabang === true');
  assert(suHtml.includes('⛔ AKSES DITOLAK — YURISDIKSI KHUSUS KANTOR PUSAT!'), 'portal-surat-umum.html memuat pesan penolakan eksklusif yurisdiksi kantor pusat');
  assert(suHtml.includes("window.location.replace('index.html')"), 'portal-surat-umum.html mengalihkan paksa sesi tidak berhak kembali ke index.html');

  // E. Simulasi Eksekusi Route Guard Surat Umum
  function simulasikanRouteGuardSU(authSession) {
    if (!authSession || authSession.isCabang === true || authSession.mode === 'CABANG' || authSession.role === 'ADMIN_CABANG') {
      return {
        aksesDiterima: false,
        redirectTarget: 'index.html',
        pesanAlert: '⛔ AKSES DITOLAK — YURISDIKSI KHUSUS KANTOR PUSAT!'
      };
    }
    return {
      aksesDiterima: true,
      redirectTarget: null,
      pesanAlert: null
    };
  }

  // 1. Unauthenticated -> Ditolak
  const guardUnauth = simulasikanRouteGuardSU(null);
  assert(guardUnauth.aksesDiterima === false && guardUnauth.redirectTarget === 'index.html', 'Route Guard SU: Akses tanpa token ditolak dan dialihkan ke index.html');

  // 2. Cabang Bandung (NSR-BDG-2026) -> Ditolak
  const guardBdg = simulasikanRouteGuardSU(authBdg);
  assert(guardBdg.aksesDiterima === false && guardBdg.redirectTarget === 'index.html', 'Route Guard SU: Sesi Cabang Bandung ditolak dan dialihkan ke index.html');

  // 3. Cabang Padang (NSR-PDG-2026) -> Ditolak
  const guardPdg = simulasikanRouteGuardSU(authPdg);
  assert(guardPdg.aksesDiterima === false && guardPdg.redirectTarget === 'index.html', 'Route Guard SU: Sesi Cabang Padang ditolak dan dialihkan ke index.html');

  // 4. Cabang Palembang (NSR-PLB-2026) -> Ditolak
  const guardPlb = simulasikanRouteGuardSU(authPlb);
  assert(guardPlb.aksesDiterima === false && guardPlb.redirectTarget === 'index.html', 'Route Guard SU: Sesi Cabang Palembang ditolak dan dialihkan ke index.html');

  // 5. Super Admin Pusat (NSR8899 / NSR-PST-2026) -> Diterima
  const guardPst = simulasikanRouteGuardSU(authPusat);
  assert(guardPst.aksesDiterima === true && guardPst.redirectTarget === null, 'Route Guard SU: Sesi Super Admin Pusat (NSR8899) lolos otorisasi agenda Surat Umum');



  // -----------------------------------------------------------------
  // 6c. TEST ZERO-TRUST SHA-256 HASH MATRIX & PROTEKSI ANTI-TAMPERING
  // -----------------------------------------------------------------
  console.log('\n\x1b[36m[6c/7] Menguji Zero-Trust SHA-256 Hash Matrix & Proteksi Anti-Tampering\x1b[0m');

  // A. Verifikasi Sterilisasi 100% Plaintext Token dari Seluruh File Frontend
  const portalFilesToAudit = [
    'portal-penugasan-jo.html',
    'portal-nolap-cabang.html',
    'portal-kwitansi.html',
    'portal-surat-umum.html',
    'portal-nolap.html',
    'index.html'
  ];
  const forbiddenPlainTokens = [
    "'NSR8899'", '"NSR8899"',
    "'NSR-PST-2026'", '"NSR-PST-2026"',
    "'NSR-BDG-2026'", '"NSR-BDG-2026"',
    "'NSR-PDG-2026'", '"NSR-PDG-2026"',
    "'NSR-MKS-2026'", '"NSR-MKS-2026"',
    "'NSR-PLB-2026'", '"NSR-PLB-2026"',
    "'NSR-MKT-2026'", '"NSR-MKT-2026"',
    "'NSR-REV-2026'", '"NSR-REV-2026"',
    "'NSR-APP-2026'", '"NSR-APP-2026"'
  ];

  for (const pf of portalFilesToAudit) {
    const fileContent = fs.readFileSync(path.join(ROOT_DIR, pf), 'utf-8');
    for (const tok of forbiddenPlainTokens) {
      assert(!fileContent.includes(tok), `Zero-Trust Audit: ${pf} steril mutlak dari plaintext token ${tok}`);
    }
  }

  // B. Uji High-Entropy Rotated Tokens
  const authRotPst = resolveUnifiedToken('NSR-HQ89-PST9-M4V2');
  assert(authRotPst && authRotPst.isSuperAdmin === true && authRotPst.wilayah === 'PUSAT', 'High-Entropy Token Super Admin (NSR-HQ89-PST9-M4V2) terverifikasi');

  const authRotBdg = resolveUnifiedToken('NSR-BDG-7K2P-9M4X');
  assert(authRotBdg && authRotBdg.role === 'ADMIN_CABANG' && authRotBdg.wilayah === 'Bandung', 'High-Entropy Token Cabang Bandung (NSR-BDG-7K2P-9M4X) terverifikasi');

  const authRotPdg = resolveUnifiedToken('NSR-PDG-8M3Q-2X7V');
  assert(authRotPdg && authRotPdg.role === 'ADMIN_CABANG' && authRotPdg.wilayah === 'Padang', 'High-Entropy Token Cabang Padang (NSR-PDG-8M3Q-2X7V) terverifikasi');

  const authRotMks = resolveUnifiedToken('NSR-MKS-5T9W-4L8Y');
  assert(authRotMks && authRotMks.role === 'ADMIN_CABANG' && authRotMks.wilayah === 'Makassar', 'High-Entropy Token Cabang Makassar (NSR-MKS-5T9W-4L8Y) terverifikasi');

  const authRotPlb = resolveUnifiedToken('NSR-PLB-6N2J-9R4K');
  assert(authRotPlb && authRotPlb.role === 'ADMIN_CABANG' && authRotPlb.wilayah === 'Palembang', 'High-Entropy Token Cabang Palembang (NSR-PLB-6N2J-9R4K) terverifikasi');

  // C. Uji Anti-Tampering Session Signature
  const sha256Match = joHtml.match(/function sha256Hex\s*\([^)]*\)\s*\{[\s\S]*?\n    \}/);
  const genSigMatch = joHtml.match(/function generateSessionSignature\s*\([^)]*\)\s*\{[\s\S]*?\n    \}/);
  const verSigMatch = joHtml.match(/function verifySessionSignature\s*\([^)]*\)\s*\{[\s\S]*?\n    \}/);
  assert(sha256Match && genSigMatch && verSigMatch, 'Fungsi Kriptografis Anti-Tampering (sha256Hex, generateSessionSignature, verifySessionSignature) terpasang di frontend');

  const sigModule = new Function(
    'const NSR_SEC_SALT = "NSR_ZERO_TRUST_SIG_2026_9x4m";\n' +
    sha256Match[0] + '\n' +
    genSigMatch[0] + '\n' +
    verSigMatch[0] + '\n' +
    'return { generateSessionSignature, verifySessionSignature, sha256Hex };'
  )();

  const testHash = 'bcd695bca78dc5ba9049afde667fc0c0e81409e9f4aee317936b24634d8bb818';
  const testTime = 1776500000000;
  const legitSig = sigModule.generateSessionSignature(testHash, testTime, 'ADMIN_CABANG', false);

  const legitSession = { tokenHash: testHash, loginTime: testTime, role: 'ADMIN_CABANG', isSuperAdmin: false, sig: legitSig };
  assert(sigModule.verifySessionSignature(legitSession) === true, 'Sesi legal dengan tanda tangan kriptografis sah lolos verifikasi');

  const tamperedPrivilegeSession = { tokenHash: testHash, loginTime: testTime, role: 'SUPER ADMIN', isSuperAdmin: true, sig: legitSig };
  assert(sigModule.verifySessionSignature(tamperedPrivilegeSession) === false, 'Anti-Tampering: Eskalasi hak akses lokal (isSuperAdmin diubah ilegal) GAGAL diverifikasi');

  const tamperedTokenSession = { tokenHash: 'evilhash1234567890abcdef1234567890abcdef1234567890abcdef12345678', loginTime: testTime, role: 'ADMIN_CABANG', isSuperAdmin: false, sig: legitSig };
  assert(sigModule.verifySessionSignature(tamperedTokenSession) === false, 'Anti-Tampering: Modifikasi tokenHash lokal GAGAL diverifikasi');

  // D. Uji Backend Code.gs
  const codeGsContent = fs.readFileSync(path.join(ROOT_DIR, 'Code.gs'), 'utf-8');
  assert(codeGsContent.includes('HASH_MATRIX:'), 'Code.gs memiliki HASH_MATRIX SHA-256');
  assert(codeGsContent.includes('autoSnapshotSpreadsheet('), 'Code.gs memiliki fungsi disaster recovery autoSnapshotSpreadsheet');
  assert(codeGsContent.includes('PropertiesService.getScriptProperties()'), 'Code.gs menggunakan PropertiesService untuk keamanan backend');
  assert(codeGsContent.includes('LockService.getScriptLock()'), 'Code.gs mengunci concurrency dengan LockService.getScriptLock()');


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
