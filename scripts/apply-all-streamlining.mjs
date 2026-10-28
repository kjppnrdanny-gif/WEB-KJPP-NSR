import fs from 'node:fs';

let content = fs.readFileSync('index.html', 'utf8');

// =========================================================================
// 1. UPDATE LAYANAN (#layanan)
// =========================================================================
const layananStart = content.lastIndexOf('<section', content.indexOf('id="layanan"'));
const galeriStart = content.lastIndexOf('<section', content.indexOf('id="galeri"'));

const newLayananHtml = `<!-- ==================== BAGIAN 3: RUANG LINGKUP LAYANAN PENILAI PROPERTI (P) ==================== -->
  <section id="layanan" class="relative py-14 md:py-20 bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white border-b border-slate-800 overflow-hidden">
    <!-- DotField Canvas Component (Interactive Bulge & Glow Dot Grid) -->
    <div
      class="dot-field-container pointer-events-none absolute inset-0 w-full h-full z-[0]"
      style="-webkit-mask-image: radial-gradient(ellipse at center, white 35%, transparent 85%); mask-image: radial-gradient(ellipse at center, white 35%, transparent 85%);"
      aria-hidden="true"
    ></div>
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
      
      <!-- Section Header -->
      <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10 pb-4 border-b border-slate-800/80">
        <div class="max-w-2xl">
          <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 mb-3">
            <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
            Regulasi PMK &bull; Standar SPI &bull; Klasifikasi Penilai Properti (P)
          </span>
          <h2 class="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-sky-400 via-blue-200 to-amber-300 bg-clip-text text-transparent">
            Ruang Lingkup Layanan Penilai Properti
          </h2>
          <p class="mt-2 text-xs sm:text-sm text-slate-300 leading-relaxed">
            Layanan penilaian publik dan konsultasi independen berizin Kementerian Keuangan RI jo. No. 228/PMK.01/2019 dan Standar Penilaian Indonesia (SPI).
          </p>
        </div>

        <div class="shrink-0">
          <a href="layanan.html" class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-sky-400 hover:text-white border border-slate-700 font-bold text-xs transition shadow-md group">
            <span>Buka Katalog 9 Layanan Lengkap</span>
            <span class="group-hover:translate-x-1 transition-transform">&rarr;</span>
          </a>
        </div>
      </div>

      <!-- 3 KARTU LAYANAN UNGGULAN -->
      <div class="grid md:grid-cols-3 gap-6">
        
        <!-- KARTU 1: PENILAIAN PROPERTI KOMPREHENSIF -->
        <div class="bg-slate-900/90 p-6 sm:p-7 rounded-2xl border border-slate-700/80 shadow-xl hover:border-sky-500/50 hover:bg-slate-900 transition flex flex-col justify-between group">
          <div>
            <div class="flex items-center justify-between mb-3">
              <span class="text-[10px] font-bold text-emerald-400 uppercase tracking-wider bg-emerald-950/80 border border-emerald-800/60 px-2.5 py-1 rounded-lg">PMK Butir 2 &amp; 9 &bull; SPI 300</span>
              <span class="text-xs text-slate-400 font-mono">01</span>
            </div>
            <h3 class="text-lg font-bold text-white group-hover:text-amber-300 transition-colors">Penilaian Properti Komprehensif &amp; Industri</h3>
            <p class="text-xs text-slate-300 mt-2.5 leading-relaxed">
              Gedung perkantoran, hotel, mall, kawasan industri, instalasi pabrik, mesin industri, alat berat, armada transportasi komersial, serta perkebunan kelapa sawit &amp; karet (PSAK 240, 216, 236, 241).
            </p>
          </div>
          <div class="mt-6 pt-4 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Valuasi Agunan &amp; Lap. Keuangan</span>
            <a href="layanan.html" class="text-sky-400 hover:text-sky-300 font-bold flex items-center gap-1">Detail &rarr;</a>
          </div>
        </div>

        <!-- KARTU 2: PENGADAAN TANAH (SPI 204) -->
        <div class="bg-slate-900/90 p-6 sm:p-7 rounded-2xl border border-slate-700/80 shadow-xl hover:border-amber-400/50 hover:bg-slate-900 transition flex flex-col justify-between group">
          <div>
            <div class="flex items-center justify-between mb-3">
              <span class="text-[10px] font-bold text-amber-300 uppercase tracking-wider bg-amber-950/80 border border-amber-800/60 px-2.5 py-1 rounded-lg">Lisensi ATR/BPN &bull; SPI 204</span>
              <span class="text-xs text-slate-400 font-mono">02</span>
            </div>
            <h3 class="text-lg font-bold text-white group-hover:text-amber-300 transition-colors">Pengadaan Tanah Kepentingan Umum (SPI 204)</h3>
            <p class="text-xs text-slate-300 mt-2.5 leading-relaxed">
              Penilaian ganti kerugian fisik (tanah, bangunan, tanaman) dan non-fisik (solatium, alih profesi, masa tunggu) untuk jalan tol, transmisi listrik PLN, bendungan, dan infrastruktur strategis sesuai UU No. 2/2012 jo. PP No. 19/2021.
            </p>
          </div>
          <div class="mt-6 pt-4 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>7 Tahap Ganti Kerugian</span>
            <a href="layanan.html" class="text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1">Detail &rarr;</a>
          </div>
        </div>

        <!-- KARTU 3: STUDI KELAYAKAN USAHA & ADVISORY -->
        <div class="bg-slate-900/90 p-6 sm:p-7 rounded-2xl border border-slate-700/80 shadow-xl hover:border-sky-500/50 hover:bg-slate-900 transition flex flex-col justify-between group">
          <div>
            <div class="flex items-center justify-between mb-3">
              <span class="text-[10px] font-bold text-sky-300 uppercase tracking-wider bg-sky-950/80 border border-sky-800/60 px-2.5 py-1 rounded-lg">PMK Butir 6, 8, 10 &bull; Advisory</span>
              <span class="text-xs text-slate-400 font-mono">03</span>
            </div>
            <h3 class="text-lg font-bold text-white group-hover:text-amber-300 transition-colors">Studi Kelayakan Usaha &amp; Advisory Properti</h3>
            <p class="text-xs text-slate-300 mt-2.5 leading-relaxed">
              Kajian komprehensif Feasibility Study (FS), analisis Penggunaan Tertinggi &amp; Terbaik (Highest and Best Use / HBU), pengawasan pembiayaan proyek (Project Monitoring), serta optimalisasi portofolio aset komersial.
            </p>
          </div>
          <div class="mt-6 pt-4 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Analisis Pasar &amp; Finansial</span>
            <a href="layanan.html" class="text-sky-400 hover:text-sky-300 font-bold flex items-center gap-1">Detail &rarr;</a>
          </div>
        </div>

      </div>

      <!-- CTA KE KATALOG LAYANAN LENGKAP & RFP -->
      <div class="mt-10 p-5 rounded-2xl bg-slate-900/70 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
        <div>
          <h4 class="text-xs sm:text-sm font-bold text-white">
            Membutuhkan Ruang Lingkup Penilaian Lainnya?
          </h4>
          <p class="text-[11px] sm:text-xs text-slate-400 mt-0.5">
            Sembilan lingkup jasa lengkap (termasuk properti residensial sederhana, inventarisasi SIM Aset, dan sewa wajar BMN/TKD) tersedia di halaman katalog.
          </p>
        </div>
        <div class="flex flex-wrap items-center justify-center sm:justify-end gap-3 shrink-0">
          <a href="layanan.html" class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-300 hover:text-white border border-slate-700 font-bold text-xs transition shadow-sm">
            <span>Buka 9 Layanan &amp; Fitur Cari</span> &rarr;
          </a>
          <button type="button" onclick="bukaModal('modal-rfp')" class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-black text-xs shadow-md transition cursor-pointer">
            Minta Penawaran (RFP)
          </button>
        </div>
      </div>

    </div>
  </section>`;

content = content.substring(0, layananStart) + newLayananHtml + '\r\n\r\n  ' + content.substring(galeriStart);
console.log('1. Layanan section updated!');

// =========================================================================
// 2. UPDATE NSR CLOUD (#sistem-mutu)
// =========================================================================
const sStart = content.lastIndexOf('<section', content.indexOf('id="sistem-mutu"'));
const lUpdatedStart = content.lastIndexOf('<section', content.indexOf('id="layanan"'));
const sContent = content.substring(sStart, lUpdatedStart);

const visualMarker = '</div><!-- end 4 cabang stack -->';
const vIdx = sContent.indexOf(visualMarker);
const closeIdx1 = sContent.indexOf('</div>', vIdx + visualMarker.length);
const closeIdx2 = sContent.indexOf('</div>', closeIdx1 + 6) + 6;

const topAndDiagram = sContent.substring(0, closeIdx2);

const cardsStart = sContent.indexOf('<!-- service cards / LOCKED PREVIEW: no direct public access -->');
const cardsEnd = sContent.indexOf('<!-- Bottom CTA & Security Notice -->');
const fourCardsHtml = sContent.substring(cardsStart, cardsEnd).trim();

const qaStart = sContent.indexOf('<!-- QA process strip -->');
const qaEnd = sContent.indexOf('<!-- Toggle SOP & 4 Pilar Pengendalian Mutu -->');
const qaStripHtml = sContent.substring(qaStart, qaEnd).trim();

const pilarStart = sContent.indexOf('<div id="mutu-extra-container"');
const pilarInnerStart = sContent.indexOf('>', pilarStart) + 1;
const lastSectionClose = sContent.lastIndexOf('</section>');
const pilarInnerEnd = sContent.lastIndexOf('</div>', lastSectionClose - 1);
const pilarInnerEnd2 = sContent.lastIndexOf('</div>', pilarInnerEnd - 1);
const pilarInnerHtml = sContent.substring(pilarInnerStart, pilarInnerEnd2).trim();

const compactTerminalFooter = `

              <!-- Compact Control Bar & Actions -->
              <div class="mt-4 pt-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div class="flex items-center gap-2 text-[11px] text-slate-300 font-medium">
                  <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>Satu Pintu Registrasi NoLap &bull; Koordinasi Mutu 5 Wilayah</span>
                </div>
                <div class="flex flex-wrap items-center gap-2.5">
                  <button type="button" onclick="toggleExtraMutu()" id="btn-toggle-extra-mutu" class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-sky-300 hover:text-white border border-slate-700 text-xs font-bold transition shadow-sm cursor-pointer">
                    <span id="txt-toggle-extra-mutu">Rincian SOP Operasional &amp; 4 Tahap QA</span>
                    <span id="icon-toggle-extra-mutu">&darr;</span>
                  </button>
                  <button type="button" onclick="bukaModalPortal()" class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-black text-xs transition shadow-md cursor-pointer">
                    <svg class="w-3.5 h-3.5 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    <span>Masuk Portal Internal</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>`;

const newCollapsiblePanel = `

      <!-- Panel Collapsible: Rincian Layanan Operasional, 4 Tahapan QA & 4 Pilar SPM -->
      <div id="mutu-extra-container" class="hidden transition-all duration-300 mt-8 pt-8 border-t border-slate-800 relative z-10">
        <div class="mb-6">
          <span class="px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-sky-500/10 text-sky-300 border border-sky-500/20">
            Internal Operations Directory
          </span>
          <h4 class="text-lg sm:text-xl font-bold text-white mt-1.5">Layanan Operasional Kantor &amp; Alur Kendali Mutu</h4>
          <p class="text-xs text-slate-400 mt-0.5">Akses terbatas tim penilai lapangan dan jajaran pimpinan cabang KJPP NSR.</p>
        </div>

        ${fourCardsHtml}

        <div class="mt-8 pt-6 border-t border-slate-800/80">
          <h5 class="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">Alur Kerja 4 Tahap Quality Assurance</h5>
          ${qaStripHtml.replace('<!-- QA process strip -->', '').replace(/class="mt-10 lg:mt-14/g, 'class="')}
        </div>

        <div class="mt-8 pt-6 border-t border-slate-800/80">
          ${pilarInnerHtml}
        </div>
      </div>
    </div>
  </section>`;

const fullNewMutu = topAndDiagram + compactTerminalFooter + newCollapsiblePanel;
content = content.substring(0, sStart) + fullNewMutu + '\r\n\r\n  ' + content.substring(lUpdatedStart);
console.log('2. NSR Cloud section updated!');

// =========================================================================
// 3. UPDATE 5 KANTOR (#kontak)
// =========================================================================
const kStart = content.lastIndexOf('<section', content.indexOf('id="kontak"'));
const faqStart = content.lastIndexOf('<section', content.indexOf('id="faq"'));
const fullKontak = content.substring(kStart, faqStart);

const grid4Marker = '<!-- 4 Branch Offices Executive Cards Grid -->';
const bannerMarker = '<!-- Sleek Banner Navigasi ke Tim Manajemen & Struktur Organisasi -->';

const gIdx = fullKontak.indexOf(grid4Marker);
const bIdx = fullKontak.indexOf(bannerMarker);

if (gIdx !== -1 && bIdx !== -1) {
  const newKontak = fullKontak.substring(0, gIdx) + fullKontak.substring(bIdx);
  content = content.substring(0, kStart) + newKontak + content.substring(faqStart);
  console.log('3. Kontak section updated (redundant 4 cards removed)!');
} else {
  console.error('Error finding markers in kontak!');
  process.exit(1);
}

fs.writeFileSync('index.html', content, 'utf8');
console.log('All 3 sections successfully updated in index.html!');
