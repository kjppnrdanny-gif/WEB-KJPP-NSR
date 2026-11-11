import fs from 'fs';

const FILE_PATH = 'D:/WEB KJPP NSR_Compro new ver/kjpp-nsr-netlify-production/index.html';
let html = fs.readFileSync(FILE_PATH, 'utf8');

console.log('Original index.html length:', html.length);

// -------------------------------------------------------------
// 1. REFACTOR SEKSI 1: ALUR PENUGASAN (5 TAHAP)
// -------------------------------------------------------------
const s1Start = html.indexOf('<div id="alur-penugasan-sop"');
const s1End = html.indexOf('<!-- PANEL 2: LAYANAN UNGGULAN');

if (s1Start === -1 || s1End === -1) {
  throw new Error('Seksi 1 (alur-penugasan-sop) tidak ditemukan!');
}

const newS1HTML = `<div id="alur-penugasan-sop" aria-label="Standard Operating Procedure Alur Penugasan Penilaian Resmi" class="nsr-section w-full mt-14 pt-10 border-t border-slate-800/80 relative z-10 scroll-mt-20">
      <div class="nsr-header-title text-center max-w-3xl mx-auto mb-10">
        <span class="nsr-tagline text-xs font-bold uppercase tracking-[0.2em] text-sky-400 block mb-2">Standar Mutu &amp; Kepatuhan Operasional</span>
        <h3 class="nsr-title text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-3">Alur Penugasan Penilaian Resmi</h3>
        <p class="nsr-desc text-xs sm:text-sm text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Pelaksanaan jasa penilaian mengacu pada tata kelola berjenjang sesuai Standar Penilaian Indonesia guna memastikan independensi dan akuntabilitas opini nilai.
        </p>
      </div>
      
      <div class="nsr-flow-track relative w-full">
        <!-- Animated gradient connector line on desktop -->
        <div class="nsr-flow-line hidden lg:block" aria-hidden="true"></div>

        <!-- 5-column responsive grid on desktop/tablet, vertical stepped on mobile -->
        <div class="nsr-flow-grid">
          <!-- Tahap 01 -->
          <div class="nsr-flow-card">
            <div class="nsr-flow-card-header">
              <span class="nsr-flow-num">TAHAP 01</span>
              <span class="nsr-flow-dot lg:hidden" aria-hidden="true"></span>
            </div>
            <h4 class="nsr-flow-title">Pra-Penugasan &amp; Skrining Etik</h4>
            <p class="nsr-flow-desc">Skrining integritas penugasan &amp; bebas benturan kepentingan KEPI.</p>
          </div>

          <!-- Tahap 02 -->
          <div class="nsr-flow-card">
            <div class="nsr-flow-card-header">
              <span class="nsr-flow-num">TAHAP 02</span>
              <span class="nsr-flow-dot lg:hidden" aria-hidden="true"></span>
            </div>
            <h4 class="nsr-flow-title">Lingkup Penugasan &amp; SPK</h4>
            <p class="nsr-flow-desc">Penetapan dasar nilai, cut-off date, asumsi, dan batasan telaah.</p>
          </div>

          <!-- Tahap 03 -->
          <div class="nsr-flow-card">
            <div class="nsr-flow-card-header">
              <span class="nsr-flow-num">TAHAP 03</span>
              <span class="nsr-flow-dot lg:hidden" aria-hidden="true"></span>
            </div>
            <h4 class="nsr-flow-title">Inspeksi Lapangan &amp; Verifikasi Pasar</h4>
            <p class="nsr-flow-desc">Pemeriksaan fisik objek, BAI, dan verifikasi data transaksi pembanding.</p>
          </div>

          <!-- Tahap 04 -->
          <div class="nsr-flow-card">
            <div class="nsr-flow-card-header">
              <span class="nsr-flow-num">TAHAP 04</span>
              <span class="nsr-flow-dot lg:hidden" aria-hidden="true"></span>
            </div>
            <h4 class="nsr-flow-title">Kaji Ulang Teknis &amp; SPM</h4>
            <p class="nsr-flow-desc">Penerapan pendekatan penilaian SPI &amp; peer-review bertingkat tim QC.</p>
          </div>

          <!-- Tahap 05: Aksentuasi Khusus Anti-Pemalsuan & QR eLSa -->
          <div class="nsr-flow-card nsr-flow-card-secure">
            <div class="nsr-flow-card-header flex items-center justify-between gap-1 mb-2">
              <span class="nsr-flow-num nsr-flow-num-secure">TAHAP 05</span>
              <span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8.5px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shrink-0">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Anti-Pemalsuan
              </span>
            </div>
            <h4 class="nsr-flow-title text-emerald-200">Opini Final &amp; QR eLSa Kemenkeu</h4>
            <p class="nsr-flow-desc text-slate-300">Penandatanganan Rekan Berizin &amp; pendaftaran barcode statutori eLSa-PK.</p>
            <div class="mt-auto pt-2.5 border-t border-emerald-500/25 flex items-center gap-1.5 text-[10px] font-bold text-emerald-300">
              <svg class="w-3.5 h-3.5 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
              <span>Verifikasi Statutori eLSa-PK</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

`;

html = html.substring(0, s1Start) + newS1HTML + html.substring(s1End);
console.log('✓ Seksi 1 berhasil diperbarui.');

// -------------------------------------------------------------
// 2. REFACTOR CSS BLOCK DI ATAS SEKSI 2
// -------------------------------------------------------------
const s2Start = html.indexOf('<!-- ==================== 2. KAJIAN TEKNIS SPI');
const styleStart = html.lastIndexOf('<style>', s2Start);
const styleEnd = html.indexOf('</style>', styleStart) + '</style>'.length;

if (styleStart === -1 || styleEnd === -1) {
  throw new Error('Blok <style> sebelum Seksi 2 tidak ditemukan!');
}

const newStyleBlock = `<style>
  /* ================= GLOBAL CORPORATE STYLING (DEEP MIDNIGHT NAVY THEME) ================= */
  .nsr-midnight-bg {
    background: radial-gradient(ellipse at 50% 10%, #172554 0%, #0b1329 45%, #030712 100%);
  }
  .nsr-section { padding: 48px 20px; max-width: 1140px; margin: 0 auto; font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif; position: relative; z-index: 10; box-sizing: border-box; }
  .nsr-header-title {
    width: 100%;
    max-width: 850px;
    margin: 0 auto 32px auto;
    text-align: center;
  }
  .nsr-tagline {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 2px;
    color: #38bdf8;
    font-weight: 700;
    margin-bottom: 6px;
    display: block;
  }
  .nsr-title {
    font-size: 24px;
    color: #f8fafc;
    font-weight: 800;
    margin: 0 0 8px 0;
    display: block;
    line-height: 1.3;
  }
  @media (min-width: 640px) {
    .nsr-title { font-size: 28px; }
  }
  .nsr-desc {
    font-size: 13.5px;
    color: #94a3b8;
    margin: 0 auto;
    max-width: 720px;
    line-height: 1.6;
    display: block;
  }

  /* ================= 1. ALUR PENUGASAN (5 TAHAP LINEAR TRACK) ================= */
  .nsr-flow-track { position: relative; width: 100%; }
  .nsr-flow-line {
    position: absolute; top: 38px; left: 8%; right: 8%; height: 2px;
    background: linear-gradient(90deg, #38bdf8, #06b6d4, #10b981);
    background-size: 200% 100%;
    animation: nsrPulseLine 4s ease infinite;
    z-index: 0; pointer-events: none;
  }
  @keyframes nsrPulseLine {
    0% { background-position: 0% 50%; opacity: 0.4; }
    50% { background-position: 100% 50%; opacity: 0.9; }
    100% { background-position: 0% 50%; opacity: 0.4; }
  }
  .nsr-flow-grid {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 14px;
    width: 100%;
    position: relative;
    z-index: 1;
  }
  .nsr-flow-card {
    background: rgba(11, 21, 44, 0.8);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(56, 189, 248, 0.18);
    border-radius: 12px;
    padding: 18px 16px;
    min-height: 180px;
    box-shadow: 0 8px 24px -8px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05);
    transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    text-align: left;
    box-sizing: border-box;
  }
  .nsr-flow-card:hover {
    transform: translateY(-4px);
    border-color: #38bdf8;
    box-shadow: 0 12px 30px -8px rgba(14, 165, 233, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.1);
  }
  .nsr-flow-card.nsr-flow-card-secure {
    background: linear-gradient(145deg, rgba(6, 78, 59, 0.45) 0%, rgba(11, 21, 44, 0.88) 55%, rgba(15, 23, 42, 0.95) 100%);
    border: 1.5px solid rgba(16, 185, 129, 0.5);
    box-shadow: 0 8px 24px -8px rgba(16, 185, 129, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.08);
  }
  .nsr-flow-card.nsr-flow-card-secure:hover {
    transform: translateY(-4px);
    border-color: #34d399;
    box-shadow: 0 14px 32px -8px rgba(16, 185, 129, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.15);
  }
  .nsr-flow-card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;
  }
  .nsr-flow-num {
    font-size: 10.5px;
    font-weight: 800;
    color: #38bdf8;
    background: rgba(56, 189, 248, 0.12);
    border: 1px solid rgba(56, 189, 248, 0.28);
    display: inline-block;
    padding: 2.5px 7px;
    border-radius: 4px;
    letter-spacing: 0.5px;
  }
  .nsr-flow-num-secure {
    color: #34d399;
    background: rgba(16, 185, 129, 0.15);
    border-color: rgba(16, 185, 129, 0.35);
  }
  .nsr-flow-title {
    font-size: 13.5px;
    font-weight: 700;
    color: #f8fafc;
    margin: 0 0 6px 0;
    line-height: 1.35;
  }
  .nsr-flow-desc {
    font-size: 11.5px;
    color: #94a3b8;
    margin: 0;
    line-height: 1.45;
  }

  /* ================= 2. KAJIAN TEKNIS SPI (CLEAN RESEARCH CARDS) ================= */
  .nsr-spi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; width: 100%; box-sizing: border-box; }
  .nsr-spi-card {
    background: rgba(11, 21, 44, 0.8);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(56, 189, 248, 0.18);
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 8px 24px -8px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.04);
    transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
    display: flex;
    flex-direction: column;
    cursor: pointer;
    text-align: left;
    box-sizing: border-box;
  }
  .nsr-spi-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 14px 32px -8px rgba(14, 165, 233, 0.3);
    border-color: rgba(56, 189, 248, 0.45);
  }
  .nsr-spi-body { padding: 22px 20px; flex-grow: 1; display: flex; flex-direction: column; }
  .nsr-spi-badge {
    font-size: 10px;
    font-weight: 800;
    color: #2dd4bf;
    background: rgba(45, 212, 191, 0.12);
    border: 1px solid rgba(45, 212, 191, 0.25);
    padding: 3px 8px;
    border-radius: 4px;
    width: fit-content;
    margin-bottom: 12px;
    letter-spacing: 0.5px;
    text-transform: uppercase;
  }
  .nsr-spi-title {
    font-size: 15px;
    font-weight: 700;
    color: #f8fafc;
    margin: 0 0 8px 0;
    line-height: 1.4;
    transition: color 0.2s ease;
  }
  .nsr-spi-card:hover .nsr-spi-title { color: #38bdf8; }
  .nsr-spi-summary {
    font-size: 12.5px;
    color: #94a3b8;
    line-height: 1.55;
    margin: 0;
    flex-grow: 1;
  }
  .nsr-spi-foot {
    padding: 12px 20px;
    background: rgba(7, 13, 27, 0.85);
    border-top: 1px solid rgba(56, 189, 248, 0.15);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  /* ================= 3. REGULASI RESMI TRUST STRIP ================= */
  .card-regulasi {
    transition: transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease;
    box-sizing: border-box;
  }
  .card-regulasi:hover {
    transform: translateY(-4px);
    border-color: rgba(56, 189, 248, 0.5);
    box-shadow: 0 12px 28px -8px rgba(14, 165, 233, 0.25);
  }

  /* ================= RESPONSIVE BEHAVIOR ================= */
  @media (max-width: 1024px) {
    .nsr-flow-line { display: none !important; }
    .nsr-flow-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .nsr-spi-grid { grid-template-columns: 1fr; }
  }

  @media (max-width: 640px) {
    .nsr-flow-grid {
      display: flex;
      flex-direction: column;
      gap: 12px;
      position: relative;
      padding-left: 18px;
    }
    .nsr-flow-grid::before {
      content: '';
      position: absolute;
      left: 6px;
      top: 12px;
      bottom: 12px;
      width: 2px;
      background: linear-gradient(180deg, #38bdf8 0%, #06b6d4 50%, #10b981 100%);
      opacity: 0.5;
    }
    .nsr-flow-card {
      min-height: auto;
      padding: 14px 16px;
      position: relative;
    }
    .nsr-flow-dot {
      width: 8px;
      height: 8px;
      border-radius: 9999px;
      background-color: #38bdf8;
      box-shadow: 0 0 8px rgba(56, 189, 248, 0.8);
      display: inline-block;
    }
  }
</style>`;

html = html.substring(0, styleStart) + newStyleBlock + html.substring(styleEnd);
console.log('✓ Blok <style> berhasil diperbarui.');

// -------------------------------------------------------------
// 3. REFACTOR SEKSI 2 & SEKSI 3 (LITBANG & DASAR HUKUM TRUST STRIP)
// -------------------------------------------------------------
const s23Start = html.indexOf('<!-- ==================== 2. KAJIAN TEKNIS SPI');
const s23End = html.indexOf('<!-- ==================== FOOTER RESMI, MODAL & SCRIPTS ==================== -->');

if (s23Start === -1 || s23End === -1) {
  throw new Error('Seksi 2 & 3 tidak ditemukan!');
}

const newS23HTML = `<!-- ==================== 2. KAJIAN TEKNIS SPI (CLEAN RESEARCH & INSIGHT GRID) ==================== -->
<section id="litbang-metodologi" aria-label="Litbang KJPP NSR: Kajian Teknis & Warta Metodologi SPI" class="py-14 sm:py-16 text-white relative border-b border-slate-800/80 scroll-mt-20 nsr-midnight-bg">
  <div class="nsr-section" style="background-color: rgba(11, 21, 44, 0.45); border-radius: 16px; border: 1px solid rgba(56, 189, 248, 0.16); padding: 36px 20px;">
    <div class="nsr-header-title text-center max-w-3xl mx-auto mb-10">
      <span class="nsr-tagline text-xs font-bold uppercase tracking-[0.2em] text-sky-400 block mb-2">Wawasan &amp; Kompetensi Teknis</span>
      <h3 class="nsr-title text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-3">Kajian Teknis &amp; Warta Metodologi SPI</h3>
      <p class="nsr-desc text-xs sm:text-sm text-slate-400 max-w-2xl mx-auto leading-relaxed">
        Tinjauan metodologis implementasi Standar Penilaian Indonesia, regulasi pertanahan, dan valuasi agunan oleh tim profesional KJPP NSR.
      </p>
    </div>
    
    <!-- Grid 3 Kartu Berita/Wawasan Unggulan -->
    <div class="nsr-spi-grid">
      <!-- Kartu 1: SPI 204 -->
      <div class="nsr-spi-card group" onclick="window.bukaModalLitbangNSR('spi-204')" role="button" tabindex="0" onkeydown="if(event.key==='Enter'||event.key===' ')window.bukaModalLitbangNSR('spi-204')">
        <div class="nsr-spi-body">
          <span class="nsr-spi-badge">SPI 204 &bull; PENGADAAN TANAH PSN</span>
          <h4 class="nsr-spi-title">SPI 204 &mdash; Standar Penilaian Pengadaan Tanah PSN &amp; Kompensasi Non-Fisik</h4>
          <p class="nsr-spi-summary">Analisis komprehensif formula ganti kerugian fisik serta kalkulasi kerugian non-fisik (solatium, masa tunggu, dan premium) proyek infrastruktur strategis nasional.</p>
        </div>
        <div class="nsr-spi-foot">
          <span class="text-xs font-semibold text-sky-400 group-hover:text-sky-300 transition">Baca Telaah Teknis</span>
          <span class="arrow text-sky-400 group-hover:translate-x-1 transition-transform">&rarr;</span>
        </div>
      </div>

      <!-- Kartu 2: OJK Agunan -->
      <div class="nsr-spi-card group" onclick="window.bukaModalLitbangNSR('pojk-agunan')" role="button" tabindex="0" onkeydown="if(event.key==='Enter'||event.key===' ')window.bukaModalLitbangNSR('pojk-agunan')">
        <div class="nsr-spi-body">
          <span class="nsr-spi-badge">REGULASI OJK &bull; AGUNAN BANK</span>
          <h4 class="nsr-spi-title">Valuasi Agunan Perbankan Komersial berbasis Regulasi OJK Terkini</h4>
          <p class="nsr-spi-summary">Metodologi penentuan Nilai Pasar &amp; Indikasi Nilai Likuidasi berdasarkan POJK 35/2020 dan POJK 40/2019 guna mitigasi risiko kredit dan perlindungan rasio LTV perbankan.</p>
        </div>
        <div class="nsr-spi-foot">
          <span class="text-xs font-semibold text-sky-400 group-hover:text-sky-300 transition">Baca Telaah Teknis</span>
          <span class="arrow text-sky-400 group-hover:translate-x-1 transition-transform">&rarr;</span>
        </div>
      </div>

      <!-- Kartu 3: Kompensasi ROW ESDM -->
      <div class="nsr-spi-card group" onclick="window.bukaModalLitbangNSR('row-esdm')" role="button" tabindex="0" onkeydown="if(event.key==='Enter'||event.key===' ')window.bukaModalLitbangNSR('row-esdm')">
        <div class="nsr-spi-body">
          <span class="nsr-spi-badge">ROW TRANSMISI &bull; ESDM</span>
          <h4 class="nsr-spi-title">Metodologi Kompensasi ROW Jalur Transmisi Ketenagalistrikan (ESDM)</h4>
          <p class="nsr-spi-summary">Tata cara perhitungan kompensasi tanah, bangunan, dan tanaman di bawah ruang bebas jalur SUTT/SUTET PLN berpedoman pada Peraturan Menteri ESDM No. 13/2021.</p>
        </div>
        <div class="nsr-spi-foot">
          <span class="text-xs font-semibold text-sky-400 group-hover:text-sky-300 transition">Baca Telaah Teknis</span>
          <span class="arrow text-sky-400 group-hover:translate-x-1 transition-transform">&rarr;</span>
        </div>
      </div>
    </div>

    <!-- Tombol CTA Unggulan -->
    <div class="mt-8 sm:mt-10 text-center">
      <a href="wawasan-regulasi.html" class="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 hover:text-white border border-sky-400/30 hover:border-sky-400/60 font-bold text-xs sm:text-sm tracking-wide transition shadow-lg group">
        <span>Lihat Seluruh Kajian Teknis &amp; Metodologi SPI</span>
        <span class="group-hover:translate-x-1 transition-transform">&rarr;</span>
      </a>
    </div>
  </div>
</section>

<!-- ==================== 3. REGULASI RESMI & DASAR HUKUM (STATUTORY TRUST STRIP) ==================== -->
<section id="dasar-hukum" data-alias="regulasi" class="py-14 sm:py-16 text-white border-b border-slate-800/80 scroll-mt-20 nsr-midnight-bg">
  <div class="nsr-section">
    <div class="nsr-header-title text-center max-w-3xl mx-auto mb-10">
      <span class="nsr-tagline text-xs font-bold uppercase tracking-[0.2em] text-sky-400 block mb-2">Landasan Hukum &amp; Kepatuhan Statutori</span>
      <h3 class="nsr-title text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-3">Regulasi Resmi &amp; Dasar Hukum Penilai Publik</h3>
      <p class="nsr-desc text-xs sm:text-sm text-slate-400 max-w-2xl mx-auto leading-relaxed">
        Badan usaha penilai publik berizin resmi dengan legitimasi hukum penuh di bawah pembinaan dan regulasi statutori kementerian serta otoritas negara.
      </p>
    </div>

    <!-- 4-Card Credential Bar / Trust Strip -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
      <!-- Badge 1: Kemenkeu RI -->
      <div class="card-regulasi p-5 rounded-xl bg-slate-900/80 backdrop-blur border border-sky-400/20 hover:border-sky-400/50 transition-all duration-300 hover:-translate-y-1 shadow-lg flex flex-col justify-between group">
        <div>
          <div class="flex items-center justify-between mb-3">
            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-amber-400/10 text-amber-300 border border-amber-400/25">
              <span>🏛️</span>
              <span>Kemenkeu RI</span>
            </span>
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          </div>
          <h4 class="text-sm font-bold text-white group-hover:text-sky-300 transition mb-1.5 leading-snug">
            Kemenkeu RI &mdash; Izin Usaha KJPP No. 2.19.0160
          </h4>
          <p class="text-xs text-slate-400 leading-relaxed mb-3">
            KMK No. 248/KM.1/2019 jo. PMK No. 101/PMK.01/2014 &amp; No. 228/PMK.01/2019 (Pembinaan &amp; Pengawasan P2PK).
          </p>
        </div>
        <div class="pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-sky-400 font-semibold">
          <span>Izin Resmi Kemenkeu</span>
          <span class="group-hover:translate-x-1 transition-transform">&rarr;</span>
        </div>
      </div>

      <!-- Badge 2: Otoritas Jasa Keuangan (OJK) -->
      <div class="card-regulasi p-5 rounded-xl bg-slate-900/80 backdrop-blur border border-sky-400/20 hover:border-sky-400/50 transition-all duration-300 hover:-translate-y-1 shadow-lg flex flex-col justify-between group">
        <div>
          <div class="flex items-center justify-between mb-3">
            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-sky-400/10 text-sky-300 border border-sky-400/25">
              <span>📊</span>
              <span>Otoritas Jasa Keuangan</span>
            </span>
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          </div>
          <h4 class="text-sm font-bold text-white group-hover:text-sky-300 transition mb-1.5 leading-snug">
            Otoritas Jasa Keuangan (OJK) &mdash; STTD Penilai Publik
          </h4>
          <p class="text-xs text-slate-400 leading-relaxed mb-3">
            STTD Sektor PMDK &amp; Non-PMDK, POJK No. 35/POJK.04/2020 &amp; POJK No. 40/2019 (Pasar Modal, IKNB, Perbankan).
          </p>
        </div>
        <div class="pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-sky-400 font-semibold">
          <span>Registrasi OJK Aktif</span>
          <span class="group-hover:translate-x-1 transition-transform">&rarr;</span>
        </div>
      </div>

      <!-- Badge 3: Kementerian ATR / BPN -->
      <div class="card-regulasi p-5 rounded-xl bg-slate-900/80 backdrop-blur border border-sky-400/20 hover:border-sky-400/50 transition-all duration-300 hover:-translate-y-1 shadow-lg flex flex-col justify-between group">
        <div>
          <div class="flex items-center justify-between mb-3">
            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-teal-400/10 text-teal-300 border border-teal-400/25">
              <span>📐</span>
              <span>Kementerian ATR / BPN</span>
            </span>
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          </div>
          <h4 class="text-sm font-bold text-white group-hover:text-sky-300 transition mb-1.5 leading-snug">
            Kementerian ATR/BPN &mdash; Lisensi Penilai Pertanahan
          </h4>
          <p class="text-xs text-slate-400 leading-relaxed mb-3">
            Pengadaan Tanah Kepentingan Umum UU No. 2/2012 jo. UU No. 6/2023 &amp; Permen ATR/BPN No. 19/2021.
          </p>
        </div>
        <div class="pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-sky-400 font-semibold">
          <span>Lisensi Pengadaan Tanah</span>
          <span class="group-hover:translate-x-1 transition-transform">&rarr;</span>
        </div>
      </div>

      <!-- Badge 4: MAPPI & Kepatuhan SPI/KEPI -->
      <div class="card-regulasi p-5 rounded-xl bg-slate-900/80 backdrop-blur border border-sky-400/20 hover:border-sky-400/50 transition-all duration-300 hover:-translate-y-1 shadow-lg flex flex-col justify-between group">
        <div>
          <div class="flex items-center justify-between mb-3">
            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-indigo-400/10 text-indigo-300 border border-indigo-400/25">
              <span>📜</span>
              <span>Asosiasi MAPPI</span>
            </span>
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          </div>
          <h4 class="text-sm font-bold text-white group-hover:text-sky-300 transition mb-1.5 leading-snug">
            Asosiasi MAPPI &amp; Kepatuhan SPI/KEPI
          </h4>
          <p class="text-xs text-slate-400 leading-relaxed mb-3">
            Keanggotaan Penuh &amp; Standar Profesi (MAPPI Cert.) serta Kepatuhan KPSPI MAPPI (Standar Penilaian Indonesia &amp; KEPI VII).
          </p>
        </div>
        <div class="pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-sky-400 font-semibold">
          <span>Standar Profesi MAPPI</span>
          <span class="group-hover:translate-x-1 transition-transform">&rarr;</span>
        </div>
      </div>
    </div>

    <!-- Tautan Teks ke Detail Regulasi Lengkap -->
    <div class="mt-8 text-center">
      <a href="wawasan-regulasi.html" class="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-sky-400 hover:text-sky-300 transition group">
        <span>Tinjau Detail Regulasi &amp; Izin Statutori</span>
        <span class="group-hover:translate-x-1 transition-transform">&rarr;</span>
      </a>
    </div>
  </div>
</section>

<script>
  // Backward compatibility stub for legacy switchRegTab calls
  function switchRegTab(evt, tabId) {
    if (evt && evt.preventDefault) evt.preventDefault();
  }
  window.switchRegTab = switchRegTab;
</script>

`;

html = html.substring(0, s23Start) + newS23HTML + html.substring(s23End);
console.log('✓ Seksi 2 & Seksi 3 berhasil diperbarui.');

// -------------------------------------------------------------
// 4. TAMBAHKAN ENTRY 'row-esdm' KE DATA_LITBANG_NSR
// -------------------------------------------------------------
const litbangMarker = "'spi-204': {";
if (html.includes(litbangMarker) && !html.includes("'row-esdm': {")) {
  const rowEsdmData = `        'row-esdm': {
          badge: 'ROW TRANSMISI • ESDM',
          badgeClass: 'bg-teal-500/20 text-teal-300 border border-teal-500/30',
          edisi: 'Edisi Khusus • Litbang NSR No. KT/2026/04',
          penulis: 'Divisi Penilaian Utilitas & Jalur Transmisi Listrik KJPP NSR',
          judul: 'Metodologi Kompensasi ROW Jalur Transmisi Ketenagalistrikan (ESDM)',
          hukum: [
            'UU No. 30/2009 tentang Ketenagalistrikan jo. UU No. 6/2023.',
            'Peraturan Menteri ESDM No. 13/2021 tentang Ruang Bebas dan Jarak Bebas Minimum pada SUTT, SUTET, dan SUTTAS.',
            'Peraturan Menteri ESDM No. 27/2018 tentang Kompensasi atas Tanah, Bangunan, dan/atau Tanaman yang Berada di Bawah Ruang Bebas.',
            'Standar Penilaian Indonesia (SPI 106 jo. SPI 204).'
          ],
          metodologi: [
            'Penetapan formula persentase kompensasi ruang bebas: 15% untuk tanah, 15% untuk bangunan, dan 100% untuk tanaman produktif yang ditebang karena melampaui batas jarak bebas minimum.',
            'Survei kadastral koordinat tower span dan deliniasi bidang lintasan konduktor SUTT 150 kV / SUTET 500 kV.',
            'Penyusunan daftar nominatif kompensasi ROW terpadu bersama tim PLN UIP dan pemerintah daerah.'
          ],
          mitigasi: [
            'Memastikan kepatuhan tata kelola anggaran kompensasi PLN terhadap audit BPK dan BPKP.',
            'Mencegah sengketa hukum klaim masyarakat terdampak dan menjamin keandalan suplai transmisi listrik nasional.'
          ]
        },
`;
  html = html.replace(litbangMarker, rowEsdmData + '        ' + litbangMarker);
  console.log('✓ Entry row-esdm berhasil ditambahkan ke DATA_LITBANG_NSR.');
}

fs.writeFileSync(FILE_PATH, html, 'utf8');
console.log('✓ File index.html berhasil ditulis. Ukuran baru:', html.length);
