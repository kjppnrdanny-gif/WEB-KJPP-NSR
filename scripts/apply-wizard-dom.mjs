import fs from 'fs';

let html = fs.readFileSync('portal-nolap.html', 'utf8');

console.log('Original length:', html.length);

// 1. TAMBAHKAN CSS UNTUK PANEL AUDIT SPM DI STYLE
const cssNeedle = `</style>`;
const cssReplacement = `    /* Isolasi Ketat Panel Audit SPM (F01-F07 & Tombol Persetujuan Resmi) */
    .spm-audit-only-panel {
      display: none !important;
    }
    body.is-spm-auditor .spm-audit-only-panel {
      display: block !important;
    }
  </style>`;

if (!html.includes('spm-audit-only-panel')) {
  html = html.replace(cssNeedle, cssReplacement);
  console.log('✔ CSS Isolasi Audit SPM ditambahkan.');
}

// 2. PASANG STEPPER HEADER & BUNGKUS LANGKAH 1
const formStartNeedle = `<form id="form-pengajuan-nolap" onsubmit="ajukanPermohonanNoLap(event)" class="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
          <input type="hidden" id="f-idempotency-key" value="">
          <!-- PILIHAN MODE PENGAJUAN: REGULER VS BOOKING NOLAP -->`;

const formStartReplacement = `<form id="form-pengajuan-nolap" onsubmit="ajukanPermohonanNoLap(event)" class="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
          <input type="hidden" id="f-idempotency-key" value="">

          <!-- ========================================================
               WIZARD STEPPER HEADER (LANGKAH 1 -> LANGKAH 2)
               ======================================================== -->
          <div class="p-3.5 sm:p-4 rounded-2xl bg-slate-950/90 border border-slate-800 shadow-xl">
            <div class="flex items-center justify-between max-w-xl mx-auto">
              <!-- Step 1 Indicator -->
              <div id="step-nav-1" onclick="navigasiKeStepWizard(1)" class="flex items-center gap-3 cursor-pointer group select-none">
                <div id="step-circle-1" class="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center font-black text-xs sm:text-sm bg-amber-400 text-slate-950 shadow-lg shadow-amber-400/20 transition-all">
                  1
                </div>
                <div class="text-left">
                  <div id="step-label-1" class="text-xs font-black text-amber-300 tracking-wide uppercase">Langkah 1</div>
                  <div class="text-[11px] text-slate-300 font-medium hidden sm:block">Identitas &amp; Dokumen NoLap</div>
                </div>
              </div>

              <!-- Step Divider Line -->
              <div class="flex-1 mx-3 sm:mx-4 h-1 bg-slate-800 rounded-full overflow-hidden">
                <div id="step-progress-line" class="h-full bg-gradient-to-r from-amber-400 to-teal-400 transition-all duration-300 w-0"></div>
              </div>

              <!-- Step 2 Indicator -->
              <div id="step-nav-2" onclick="navigasiKeStepWizard(2)" class="flex items-center gap-3 cursor-pointer group opacity-60 select-none">
                <div id="step-circle-2" class="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center font-bold text-xs sm:text-sm bg-slate-800 text-slate-400 border border-slate-700 transition-all">
                  2
                </div>
                <div class="text-left">
                  <div id="step-label-2" class="text-xs font-bold text-slate-400 tracking-wide uppercase">Langkah 2</div>
                  <div class="text-[11px] text-slate-500 font-medium hidden sm:block">Kertas Kerja Mitigasi SPM</div>
                </div>
              </div>
            </div>
          </div>

          <!-- ========================================================
               WIZARD STEP 1: DATA PENUGASAN, IDENTITAS, DAN 3 TAUTAN BERKAS
               ======================================================== -->
          <div id="wizard-step-1" class="space-y-6">
          <!-- PILIHAN MODE PENGAJUAN: REGULER VS BOOKING NOLAP -->`;

if (html.includes(formStartNeedle)) {
  html = html.replace(formStartNeedle, formStartReplacement);
  console.log('✔ Stepper Header & Pembuka Wizard Step 1 berhasil dipasang.');
} else {
  console.error('✘ Needle formStartNeedle tidak ditemukan!');
}

// 3. TUTUP STEP 1 & BUKA STEP 2 DI SEKITAR SEKSI D
const midFormNeedle = `<input type="text" id="f-catatan-pemohon" placeholder="Catatan urgensi akad / kebutuhan penomoran..." class="w-full h-10 px-3 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-amber-400">
            </div>
          </div>

          <!-- ========================================================
               SEKSI D: INTEGRATED SMART GATEWAY — MITIGASI RISIKO & SPM (GERBANG 2 TERPADU)
               ======================================================== -->`;

const midFormReplacement = `<input type="text" id="f-catatan-pemohon" placeholder="Catatan urgensi akad / kebutuhan penomoran..." class="w-full h-10 px-3 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-amber-400">
            </div>
          </div>

          <!-- Navigasi Langkah 1 -->
          <div class="pt-4 flex flex-wrap items-center justify-between gap-4 border-t border-slate-800">
            <div class="text-[11px] text-slate-400 flex items-center gap-1.5">
              <span>📋 Pastikan seluruh data administratif dan tautan berkas telah lengkap sebelum lanjut.</span>
            </div>
            <div class="flex items-center gap-3">
              <button type="reset" onclick="setTimeout(() => { toggleKlasifikasiEntitas(); clearPenggunaLaporan(); onTujuanPenilaianChange(); perbaruiIdempotencyKey(); }, 20);" class="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition">
                Reset Isian
              </button>
              <button type="button" onclick="navigasiKeStepWizard(2)" id="btn-wizard-next-1" class="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 font-black text-xs uppercase tracking-wider transition shadow-lg shadow-amber-400/20 flex items-center gap-2 cursor-pointer">
                <span>Lanjut ke Pengisian Kertas Kerja Mitigasi</span>
                <span>&rarr;</span>
              </button>
            </div>
          </div>
        </div><!-- /#wizard-step-1 -->

        <!-- ========================================================
             WIZARD STEP 2: KERTAS KERJA MITIGASI FAKTUAL SPM (GERBANG 2)
             ======================================================== -->
        <div id="wizard-step-2" class="space-y-6 hidden">

          <!-- ========================================================
               SEKSI D: INTEGRATED SMART GATEWAY — MITIGASI RISIKO & SPM (GERBANG 2 TERPADU)
               ======================================================== -->`;

if (html.includes(midFormNeedle)) {
  html = html.replace(midFormNeedle, midFormReplacement);
  console.log('✔ Penutup Wizard Step 1 & Pembuka Step 2 berhasil dipasang.');
} else {
  console.error('✘ Needle midFormNeedle tidak ditemukan!');
}

// 4. TUTUP STEP 2 DENGAN TOMBOL AKSI AKHIR (SIMPAN DRAF TERPADU & AJUKAN VERIFIKASI KE KEPALA SPM)
const endFormNeedle = `<!-- Tombol Aksi Pengajuan -->
          <div class="pt-4 flex flex-wrap items-center justify-between gap-4 border-t border-slate-800">
            <div class="text-[11px] text-slate-400 flex items-center gap-1.5">
              <span>🔒 Data tersimpan otomatis di database sistem &amp; terkirim ke Admin Pusat.</span>
            </div>
            <div class="flex items-center gap-3">
              <button type="reset" onclick="setTimeout(() => { toggleKlasifikasiEntitas(); clearPenggunaLaporan(); onTujuanPenilaianChange(); perbaruiIdempotencyKey(); }, 20);" class="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition">
                Reset Isian
              </button>
              <button type="submit" id="btn-submit-pengajuan" disabled class="px-6 py-2.5 rounded-xl bg-slate-800 text-slate-500 font-black text-xs uppercase tracking-wider transition shadow-lg cursor-not-allowed">
                Lengkapi Formulir &amp; Mitigasi untuk Mengajukan
              </button>
            </div>
          </div>

        </form>`;

const endFormReplacement = `<!-- Tombol Aksi Akhir Langkah 2 -->
          <div class="pt-4 flex flex-wrap items-center justify-between gap-4 border-t border-slate-800">
            <button type="button" onclick="navigasiKeStepWizard(1)" class="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer border border-slate-700">
              <span>&larr;</span>
              <span>Kembali ke Langkah 1</span>
            </button>
            <div class="flex flex-wrap items-center gap-3">
              <button type="button" onclick="ajukanPermohonanNoLap(event, true)" id="btn-simpan-draf" class="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 hover:text-teal-200 border border-teal-500/40 text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-md">
                <span>💾</span>
                <span>Simpan Draf Terpadu</span>
              </button>
              <button type="submit" id="btn-submit-pengajuan" disabled class="px-6 py-2.5 rounded-xl bg-slate-800 text-slate-500 font-black text-xs uppercase tracking-wider transition shadow-lg cursor-not-allowed flex items-center gap-2">
                <span>🚀</span>
                <span>Ajukan Verifikasi ke Kepala SPM &rarr;</span>
              </button>
            </div>
          </div>
        </div><!-- /#wizard-step-2 -->

        </form>`;

if (html.includes(endFormNeedle)) {
  html = html.replace(endFormNeedle, endFormReplacement);
  console.log('✔ Penutup Wizard Step 2 dengan Tombol Aksi Akhir berhasil dipasang.');
} else {
  console.error('✘ Needle endFormNeedle tidak ditemukan!');
}

// 5. ISOLASI MUTLAK PANEL AUDIT SPM (F01-F07 & APPROVAL)
const needleFUmum = `<!-- ========================================================
               BAGIAN F — VERIFIKASI SPM DAN APPROVAL (F01 - F07)
               ======================================================== -->
          <div class="border border-slate-800 rounded-xl bg-slate-950/50 overflow-hidden">`;

const replaceFUmum = `<!-- ========================================================
               BAGIAN F — VERIFIKASI SPM DAN APPROVAL (F01 - F07) [KHUSUS KEPALA SPM]
               ======================================================== -->
          <div id="spm-audit-panel-umum" class="spm-audit-only-panel border border-slate-800 rounded-xl bg-slate-950/50 overflow-hidden">`;

if (html.includes(needleFUmum)) {
  html = html.replace(needleFUmum, replaceFUmum);
  console.log('✔ Panel Audit SPM Umum (F01-F07) diberi class spm-audit-only-panel.');
} else {
  console.error('✘ needleFUmum tidak ditemukan!');
}

const needleGTanah = `<!-- ========================================================
               BAGIAN G: VERIFIKASI SPM DAN PERSETUJUAN INTERNAL (Q62 - Q70)
               ======================================================== -->
          <div class="border border-slate-800 rounded-xl bg-slate-950/50 overflow-hidden">`;

const replaceGTanah = `<!-- ========================================================
               BAGIAN G: VERIFIKASI SPM DAN PERSETUJUAN INTERNAL (Q62 - Q70) [KHUSUS KEPALA SPM]
               ======================================================== -->
          <div id="spm-audit-panel-tanah" class="spm-audit-only-panel border border-slate-800 rounded-xl bg-slate-950/50 overflow-hidden">`;

if (html.includes(needleGTanah)) {
  html = html.replace(needleGTanah, replaceGTanah);
  console.log('✔ Panel Audit SPM Tanah (Q62-Q70) diberi class spm-audit-only-panel.');
} else {
  console.error('✘ needleGTanah tidak ditemukan!');
}

const needle8Ruislagh = `<!-- ========================================================
               BAGIAN 8 — VERIFIKASI SPM & APPROVAL BERJENJANG
               ======================================================== -->
          <div class="border border-slate-800 rounded-xl bg-slate-950/50 overflow-hidden">`;

const replace8Ruislagh = `<!-- ========================================================
               BAGIAN 8 — VERIFIKASI SPM & APPROVAL BERJENJANG [KHUSUS KEPALA SPM]
               ======================================================== -->
          <div id="spm-audit-panel-ruislagh" class="spm-audit-only-panel border border-slate-800 rounded-xl bg-slate-950/50 overflow-hidden">`;

if (html.includes(needle8Ruislagh)) {
  html = html.replace(needle8Ruislagh, replace8Ruislagh);
  console.log('✔ Panel Audit SPM Ruislagh (Bagian 8) diberi class spm-audit-only-panel.');
} else {
  console.error('✘ needle8Ruislagh tidak ditemukan!');
}

fs.writeFileSync('portal-nolap.html', html, 'utf8');
console.log('✔ File portal-nolap.html berhasil di-update dengan Wizard & SPM UI Isolation.');
