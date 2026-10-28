import fs from 'node:fs';

let content = fs.readFileSync('index.html', 'utf8');

// =========================================================================
// 1. UPDATE LAYANAN: 3 KARTU UNGGULAN SAJA, TANPA SEARCH BOX DI BERANDA
// =========================================================================
const layananStart = content.lastIndexOf('<section', content.indexOf('id="layanan"'));
const galeriStart = content.lastIndexOf('<section', content.indexOf('id="galeri"'));

const newLayananHtml = `<section id="layanan" class="relative py-16 md:py-20 bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white border-b border-slate-800 overflow-hidden">
    <!-- DotField Canvas Component (Interactive Bulge & Glow Dot Grid) -->
    <div
      class="dot-field-container pointer-events-none absolute inset-0 w-full h-full z-[0]"
      style="-webkit-mask-image: radial-gradient(ellipse at center, white 35%, transparent 85%); mask-image: radial-gradient(ellipse at center, white 35%, transparent 85%);"
      aria-hidden="true"
    ></div>
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
      <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10 pb-4 border-b border-slate-800/80">
        <div class="max-w-2xl">
          <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 mb-3">
            <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
            Regulasi PMK &bull; Standar SPI &bull; Klasifikasi P
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
              Gedung perkantoran, pusat perbelanjaan, hotel, pabrik, kawasan industri, instalasi mesin industri, alat berat, armada transportasi komersial, serta perkebunan kelapa sawit &amp; karet (PSAK 240, 216, 236, 241).
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

// Replace Layanan section
content = content.substring(0, layananStart) + newLayananHtml + '\r\n\r\n  ' + content.substring(galeriStart);
fs.writeFileSync('index.html', content, 'utf8');
console.log('1. Layanan section successfully streamlined to 3 featured cards!');
