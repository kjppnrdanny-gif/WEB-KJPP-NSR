import fs from 'node:fs';
import path from 'node:path';

const ROOT_DIR = 'D:/WEB KJPP NSR_Compro new ver/kjpp-nsr-netlify-production';

const htmlFiles = [
  'index.html',
  'portofolio-rekanan.html',
  'layanan.html',
  'profil-legalitas.html',
  'tim-cabang.html',
  'wawasan-regulasi.html'
];

const engineFile = 'lib/opini-nsr-modal-engine.js';

const NEW_HEADER_HTML = `<!-- HEADER RESMI MODAL OPINI NSR -->
          <div class="space-y-2.5 mb-5 select-none">
            <!-- Baris Badge Identitas & Izin Usaha -->
            <div class="flex flex-wrap items-center gap-2">
              <!-- Kapsul Identitas Resmi Entitas & Izin KMK -->
              <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] sm:text-[11px] font-black uppercase tracking-wider bg-amber-400/10 text-amber-400 border border-amber-400/30 shadow-sm">
                <span class="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shrink-0"></span>
                <span class="leading-snug break-words">KJPP Nanang Rahayu Sigit Paryanto dan Rekan • Izin KMK No. 2.19.0160</span>
              </div>

              <!-- Kapsul Akses Operasional -->
              <div class="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-bold text-slate-300 bg-slate-800/80 border border-slate-700/80">
                Akses Terpadu 5 Kantor
              </div>
            </div>

            <!-- Baris Judul & Akronim Resmi -->
            <div>
              <h3 class="text-xl sm:text-2xl md:text-3xl font-black text-amber-400 flex flex-wrap items-baseline gap-1.5 sm:gap-2">
                <span>OPINI NSR</span>
                <span class="text-xs sm:text-sm md:text-base font-semibold text-slate-300">
                  (Otorisasi Penilaian, Informasi, &amp; Navigasi Internal KJPP NSR)
                </span>
              </h3>
              <p class="text-[11px] sm:text-xs md:text-sm text-amber-400/90 font-medium mt-0.5">
                OPINI NSR • Dari Data Lapangan Menjadi Opini yang Andal
              </p>
            </div>
          </div>`;

// 1. Process 6 HTML files
htmlFiles.forEach(file => {
  const filePath = path.join(ROOT_DIR, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Match the header section inside min-w-0 pr-3 sm:pr-4 up to banner-warning-portal
  // Old pattern:
  // <div class="min-w-0 pr-3 sm:pr-4">
  //   <div class="flex items-center gap-2 flex-wrap mb-1 sm:mb-1.5">...</div>
  //   <div class="flex items-baseline gap-2 flex-wrap">...</div>
  //   <p class="text-[11px] sm:text-xs text-amber-400/90 font-medium tracking-tight mt-1">...</p>
  //   <div id="banner-warning-portal"
  
  const regex = /<div class="min-w-0 pr-3 sm:pr-4[^"]*">([\s\S]*?)(<div id="banner-warning-portal")/i;
  const match = content.match(regex);

  if (!match) {
    console.error(`FAIL: Could not find header pattern in ${file}`);
    return;
  }

  const replacement = `<div class="min-w-0 pr-3 sm:pr-4 flex-1">\n          ${NEW_HEADER_HTML}\n\n          $2`;
  content = content.replace(regex, replacement);

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`SUCCESS: Updated ${file}`);
});

// 2. Update lib/opini-nsr-modal-engine.js
const enginePath = path.join(ROOT_DIR, engineFile);
let engineContent = fs.readFileSync(enginePath, 'utf8');

// Update top comment if not already updated
if (!engineContent.includes('OPINI_NSR_MODAL_HEADER_HTML')) {
  const topAnchor = `(function() {`;
  const ssotDefinition = `(function() {
    // ==========================================================
    // OPINI NSR — SSOT MODAL HEADER TEMPLATE & RESILIENCE ENGINE
    // KJPP Nanang Rahayu Sigit Paryanto dan Rekan • Izin KMK No. 2.19.0160
    // ==========================================================
    const OPINI_NSR_MODAL_HEADER_HTML = \`<!-- HEADER RESMI MODAL OPINI NSR -->
<div class="space-y-2.5 mb-5 select-none">
  <!-- Baris Badge Identitas & Izin Usaha -->
  <div class="flex flex-wrap items-center gap-2">
    <!-- Kapsul Identitas Resmi Entitas & Izin KMK -->
    <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] sm:text-[11px] font-black uppercase tracking-wider bg-amber-400/10 text-amber-400 border border-amber-400/30 shadow-sm">
      <span class="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shrink-0"></span>
      <span class="leading-snug break-words">KJPP Nanang Rahayu Sigit Paryanto dan Rekan • Izin KMK No. 2.19.0160</span>
    </div>

    <!-- Kapsul Akses Operasional -->
    <div class="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-bold text-slate-300 bg-slate-800/80 border border-slate-700/80">
      Akses Terpadu 5 Kantor
    </div>
  </div>

  <!-- Baris Judul & Akronim Resmi -->
  <div>
    <h3 class="text-xl sm:text-2xl md:text-3xl font-black text-amber-400 flex flex-wrap items-baseline gap-1.5 sm:gap-2">
      <span>OPINI NSR</span>
      <span class="text-xs sm:text-sm md:text-base font-semibold text-slate-300">
        (Otorisasi Penilaian, Informasi, & Navigasi Internal KJPP NSR)
      </span>
    </h3>
    <p class="text-[11px] sm:text-xs md:text-sm text-amber-400/90 font-medium mt-0.5">
      OPINI NSR • Dari Data Lapangan Menjadi Opini yang Andal
    </p>
  </div>
</div>\`;
    window.OPINI_NSR_MODAL_HEADER_HTML = OPINI_NSR_MODAL_HEADER_HTML;
`;
  engineContent = engineContent.replace(topAnchor, ssotDefinition);
  fs.writeFileSync(enginePath, engineContent, 'utf8');
  console.log(`SUCCESS: Updated ${engineFile} with SSOT Header Template`);
} else {
  console.log(`ALREADY UPDATED: ${engineFile}`);
}

console.log('All files processed.');
