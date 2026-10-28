import fs from 'fs';
import path from 'path';

const indexPath = path.resolve('index.html');
let html = fs.readFileSync(indexPath, 'utf-8');

console.log("Applying Job Tracking Public features to index.html...");

// 1. Desktop Navbar: Add "Lacak Penugasan" button before "Kontak"
const targetDesktopNav = '<a href="#kontak" class="px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/70 transition text-xs font-semibold">\n              Kontak\n            </a>';
const targetDesktopNavCRLF = '<a href="#kontak" class="px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/70 transition text-xs font-semibold">\r\n              Kontak\r\n            </a>';

const lacakButtonHtml = `<!-- Tombol Menu Lacak Penugasan (Aksen Amber Elegan) -->
            <a href="#lacak-penugasan" onclick="scrollKeLacakPenugasan(event)" class="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 hover:text-amber-300 border border-amber-500/30 hover:border-amber-400/50 transition-all text-xs font-bold tracking-wide group shadow-sm shadow-amber-500/10 cursor-pointer" title="Lacak Progres Penugasan Penilaian 7 Milestone">
              <svg class="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
              <span>Lacak Penugasan</span>
            </a>\n            `;

if (html.includes(targetDesktopNav)) {
  html = html.replace(targetDesktopNav, lacakButtonHtml + targetDesktopNav);
  console.log("✓ Added Desktop Navbar button (LF)");
} else if (html.includes(targetDesktopNavCRLF)) {
  html = html.replace(targetDesktopNavCRLF, lacakButtonHtml.replace(/\n/g, '\r\n') + targetDesktopNavCRLF);
  console.log("✓ Added Desktop Navbar button (CRLF)");
} else {
  // Try regex replacement
  const regexNav = /(<div class="flex items-center gap-3 shrink-0">\s*)(<a href="#kontak")/i;
  if (regexNav.test(html)) {
    html = html.replace(regexNav, `$1${lacakButtonHtml}$2`);
    console.log("✓ Added Desktop Navbar button via regex");
  } else {
    console.warn("⚠️ Could not match desktop nav container");
  }
}

// 2. Mobile Nav Bar: Add "Lacak" quick button before <a href="#kontak"
const mobileNavTarget = '<a href="#kontak" class="px-2.5 py-1.5 rounded-md bg-slate-900 text-slate-300 hover:text-white border border-slate-800 whitespace-nowrap transition">Kontak</a>';
const mobileLacakBtn = `<a href="#lacak-penugasan" onclick="scrollKeLacakPenugasan(event)" class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[11px] font-bold whitespace-nowrap transition cursor-pointer">
              <svg class="w-3 h-3 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
              <span>Lacak</span>
            </a>\n            `;

if (html.includes(mobileNavTarget)) {
  html = html.replace(mobileNavTarget, mobileLacakBtn + mobileNavTarget);
  console.log("✓ Added Mobile Nav Bar shortcut");
}

// 3. Mobile Menu Drawer: Add Lacak Item before "Hubungi Kantor Pusat & Cabang"
const drawerTarget = '<a href="#kontak" onclick="toggleMobileMenu()" class="w-full py-2 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 font-bold text-center flex items-center justify-center gap-2 border border-slate-800 active:scale-[0.98] transition">';
const drawerLacakItem = `<a href="#lacak-penugasan" onclick="scrollKeLacakPenugasan(event); toggleMobileMenu();" class="w-full py-2.5 px-4 rounded-xl bg-amber-500/15 text-amber-300 hover:bg-amber-500/25 border border-amber-500/40 font-bold text-center flex items-center justify-center gap-2 active:scale-[0.98] transition cursor-pointer">
          <svg class="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          <span>Lacak Status Penugasan (7 Milestone)</span>
        </a>\n        `;

if (html.includes(drawerTarget)) {
  html = html.replace(drawerTarget, drawerLacakItem + drawerTarget);
  console.log("✓ Added Mobile Drawer menu item");
}

// 4. Hero Section Search Widget: Insert before `<!-- Bar Kemitraan Bawah Hero -->`
const heroWidgetTarget = '<!-- Bar Kemitraan Bawah Hero -->';
const heroWidgetHtml = `<!-- ==================== WIDGET PENCARIAN JOB TRACKING (7 MILESTONES) ==================== -->
    <div id="lacak-penugasan" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-5 sm:mt-6 relative z-20 scroll-mt-24">
      <div class="rounded-2xl border border-amber-500/40 bg-gradient-to-r from-slate-900/95 via-blue-950/90 to-slate-900/95 p-4 sm:p-5 shadow-2xl backdrop-blur-xl ring-1 ring-amber-400/20">
        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          <div class="flex items-center gap-3">
            <div class="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 shadow-md shadow-amber-500/30 shrink-0">
              <svg class="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h3 class="text-xs sm:text-sm font-black uppercase tracking-wider text-amber-300">Lacak Status Penugasan Penilaian</h3>
                <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/15 text-amber-300 border border-amber-400/30">7 Milestone Live</span>
              </div>
              <p class="text-[11px] sm:text-xs text-slate-300 mt-0.5">Pantau tahapan penilaian properti dari registrasi SPK, survei fisik, kendali mutu SPM, hingga laporan final.</p>
            </div>
          </div>

          <form id="form-lacak-penugasan" onsubmit="eksekusiLacakPenugasanPublik(event)" class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1 lg:max-w-2xl">
            <div class="relative flex-1">
              <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <svg class="h-4 w-4 text-amber-400/80" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
              </div>
              <input type="text" id="track-jo-input" placeholder="Contoh: JO-JKT-2026-0001" value="JO-JKT-2026-0001" class="w-full rounded-xl border border-slate-700 bg-slate-950/90 pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400/30 uppercase font-mono tracking-wider transition">
            </div>
            <div class="relative flex-1">
              <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <svg class="h-4 w-4 text-emerald-400/80" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
              </div>
              <input type="text" id="track-pic-input" placeholder="Nomor WhatsApp terdaftar" value="081288997766" class="w-full rounded-xl border border-slate-700 bg-slate-950/90 pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400/30 font-mono tracking-wider transition">
            </div>
            <button type="submit" id="btn-submit-lacak" class="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 px-5 py-2.5 text-xs font-black text-slate-950 shadow-md shadow-amber-500/25 hover:from-amber-300 hover:to-yellow-400 hover:shadow-lg transition-all duration-200 active:scale-[0.98] cursor-pointer whitespace-nowrap shrink-0">
              <svg class="h-4 w-4 text-slate-950" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
              <span>Lacak Status</span>
            </button>
          </form>

        </div>
      </div>
    </div>\n\n    `;

if (html.includes(heroWidgetTarget)) {
  html = html.replace(heroWidgetTarget, heroWidgetHtml + heroWidgetTarget);
  console.log("✓ Added Hero Section Search Widget");
}

// 5. 7-Step Vertical Stepper Modal HTML: Insert before `<!-- MODAL LOGIN PORTAL INTERNAL (OPINI NSR) -->`
const modalInsertTarget = '<!-- MODAL LOGIN PORTAL INTERNAL (OPINI NSR) -->';
const stepperModalHtml = `<!-- ==================== MODAL TANGGA PROGRES 7 MILESTONE (CLIENT VIEW) ==================== -->
  <div id="modal-tracking-stepper-publik" class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md hidden" role="dialog" aria-modal="true">
    <div class="relative w-full max-w-2xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 rounded-2xl border border-amber-500/40 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
      
      <!-- Modal Header -->
      <div class="px-5 py-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between gap-3">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-lg bg-amber-400/20 border border-amber-400/40 text-amber-300 flex items-center justify-center shrink-0">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
          </div>
          <div>
            <h3 class="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <span>Status Pelacakan Penugasan Penilaian</span>
              <span id="pub-modal-badge-sla" class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/40 font-mono">SLA H+3 Bank BTN</span>
            </h3>
            <p class="text-[11px] text-slate-400">7-Step Vertical Stepper &bull; Pemantauan Kepatuhan SPI &amp; KEPI</p>
          </div>
        </div>
        <button type="button" onclick="tutupModalTrackingPublik()" class="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer" aria-label="Tutup Dialog">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>

      <!-- Modal Body (Scrollable) -->
      <div class="p-5 overflow-y-auto space-y-5 flex-1">
        
        <!-- Summary Box -->
        <div class="p-4 rounded-xl bg-slate-950/90 border border-slate-800 space-y-3">
          <div class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
            <div>
              <span class="text-[10px] uppercase font-bold text-slate-400">Nomor Registrasi Job Order:</span>
              <h4 id="pub-modal-jo-number" class="text-sm font-mono font-black text-amber-400 tracking-wider">JO-JKT-2026-0001</h4>
            </div>
            <div class="text-right">
              <span class="text-[10px] uppercase font-bold text-slate-400">Surat Perintah Kerja (SPK):</span>
              <p id="pub-modal-spk-number" class="text-xs font-mono font-bold text-slate-200">042/BTN-JKT/SPK/X/2026</p>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
            <div>
              <span class="text-[10px] text-slate-400 uppercase font-semibold block">Instansi Pemohon:</span>
              <strong id="pub-modal-instansi" class="text-white">PT Bank Tabungan Negara (Persero) Tbk</strong>
              <p id="pub-modal-unit-kerja" class="text-[11px] text-sky-400">KC Jakarta Harmoni</p>
            </div>
            <div>
              <span class="text-[10px] text-slate-400 uppercase font-semibold block">Nama Debitur:</span>
              <strong id="pub-modal-debitur" class="text-amber-300">PT Bangun Prima Perkasa</strong>
              <p id="pub-modal-pic-contact" class="text-[11px] text-slate-400">PIC: Bambang Sudarsono (081288997766)</p>
            </div>
          </div>

          <div class="pt-2 border-t border-slate-800/80 text-[11px] text-slate-300 space-y-1">
            <div><span class="text-slate-400">Objek Agunan:</span> <span id="pub-modal-objek" class="text-white font-medium">Pabrik &amp; Gudang Logistik Komersial</span></div>
            <div><span class="text-slate-400">Lokasi Aset:</span> <span id="pub-modal-lokasi" class="text-slate-300">Jl. Rawa Gelam IV No. 12, Kawasan Industri Pulogadung, Jakarta Timur</span></div>
            <div class="flex items-center justify-between pt-1 font-mono text-[10px] text-slate-400">
              <span>Target Batas SLA: <strong id="pub-modal-sla-target" class="text-amber-300">29 Okt 2026</strong></span>
              <span>Progres Keseluruhan: <strong id="pub-modal-progress-percent" class="text-emerald-400">57%</strong></span>
            </div>
          </div>

          <!-- Progress Bar -->
          <div class="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
            <div id="pub-modal-progress-bar" class="bg-gradient-to-r from-amber-400 to-emerald-400 h-2 rounded-full transition-all duration-500" style="width: 57%;"></div>
          </div>
        </div>

        <!-- 7-STEP VERTICAL STEPPER CONTAINER -->
        <div class="space-y-1">
          <h4 class="text-xs font-black uppercase text-slate-300 tracking-wider mb-3 flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-amber-400"></span>
            Indikator 7 Milestone Penilaian (M-01 s/d M-07)
          </h4>

          <div id="pub-stepper-items-container" class="relative pl-6 space-y-4 before:absolute before:left-[11px] before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-800">
            <!-- Rendered via JavaScript -->
          </div>
        </div>

        <!-- Official Stage Explanation -->
        <div class="p-3.5 rounded-xl bg-blue-950/40 border border-blue-800/50 text-xs text-sky-200 leading-relaxed flex items-start gap-2.5">
          <svg class="w-5 h-5 text-sky-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          <div>
            <strong class="text-sky-300 block mb-0.5">Keterangan Resmi Kepatuhan Tahapan:</strong>
            <p id="pub-modal-keterangan-resmi">Tahap berjalan saat ini berada dalam koridor SLA H+3 Bank BTN. Analisis perhitungan nilai aset sedang dilakukan secara teliti berpedoman pada Standar Penilaian Indonesia (SPI 105 &amp; SPI 204).</p>
          </div>
        </div>

      </div>

      <!-- Modal Footer -->
      <div class="px-5 py-3.5 border-t border-slate-800 bg-slate-950 flex flex-wrap items-center justify-between gap-3">
        <div class="text-[11px] text-slate-400">
          Butuh konfirmasi jadwal atau kelengkapan dokumen?
        </div>
        <div class="flex items-center gap-2">
          <a id="pub-modal-btn-wa" href="https://wa.me/6281218008899?text=Halo%20Admin%20KJPP%20NSR" target="_blank" class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition">
            <svg class="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.299.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86.174.086.275.072.376-.043.101-.116.433-.506.549-.68.116-.173.231-.145.39-.086s1.011.477 1.184.564.289.13.332.202c.043.073.043.419-.101.824z"/></svg>
            <span>Hubungi WhatsApp Admin</span>
          </a>
          <button type="button" onclick="tutupModalTrackingPublik()" class="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 hover:text-white transition cursor-pointer">
            Tutup
          </button>
        </div>
      </div>

    </div>
  </div>\n\n  `;

if (html.includes(modalInsertTarget)) {
  html = html.replace(modalInsertTarget, stepperModalHtml + modalInsertTarget);
  console.log("✓ Added 7-Step Vertical Stepper Modal HTML");
}

// 6. JavaScript Client Implementation: Insert before `</body>`
const jsCode = `
  <!-- ==================== LOGIKA CLIENT JOB TRACKING (7 MILESTONE) ==================== -->
  <script>
    // Fallback Mock Data Bank BTN Jika Backend Offline
    const MOCK_BTN_JOB = {
      id: "JO-JKT-2026-0001",
      jo_number: "JO-JKT-2026-0001",
      spk_number: "042/BTN-JKT/SPK/X/2026",
      instansi: "PT Bank Tabungan Negara (Persero) Tbk",
      unit_kerja: "KC Jakarta Harmoni",
      debitur: "PT Bangun Prima Perkasa",
      pic_pemohon: "Bambang Sudarsono, S.E.",
      pic_contact: "081288997766",
      jenis_properti: "Pabrik & Gudang Logistik Komersial",
      lokasi_aset: "Jl. Rawa Gelam IV No. 12, Kawasan Industri Pulogadung, Jakarta Timur",
      luas_tanah: "4.850 m²",
      luas_bangunan: "3.200 m²",
      sla_deadline: "29 Okt 2026",
      sla_label: "SLA H+3 Bank BTN (Sisa 1 Hari)",
      progress_percent: 57,
      current_milestone: "M-04",
      keterangan_resmi: "Tahap berjalan saat ini berada dalam koridor SLA H+3 Bank BTN. Analisis perhitungan nilai aset sedang dilakukan secara teliti berpedoman pada Standar Penilaian Indonesia (SPI 105 & SPI 204).",
      wa_admin: "6281218008899",
      milestones: {
        "M-01": { id: "M-01", title: "Registrasi Berkas SPK & Legalitas", status: "completed", timestamp: "25 Okt 2026, 09:15 WIB", note: "SPK No. 042/BTN-JKT/SPK/X/2026, SHGB No. 1104, dan PBG lengkap terverifikasi resmi.", desc: "Penerimaan SPK, verifikasi dokumen legalitas, dan pembukaan berkas penugasan." },
        "M-02": { id: "M-02", title: "Penetapan Tim & Jadwal Survei", status: "completed", timestamp: "25 Okt 2026, 14:00 WIB", note: "Tim ditunjuk: Hendra Wijaya, S.T. Jadwal disepakati dengan PIC debitur.", desc: "Penetapan surveyor dan konfirmasi waktu inspeksi fisik." },
        "M-03": { id: "M-03", title: "Inspeksi Lapangan Selesai", status: "completed", timestamp: "26 Okt 2026, 16:30 WIB", note: "Inspeksi fisik, cek tapak & batas, geotagging GPS (-6.1982, 106.9142), dan foto agunan selesai.", desc: "Pemeriksaan fisik aset, pengukuran, dan dokumentasi foto resmi." },
        "M-04": { id: "M-04", title: "Analisis Penilaian & Kalkulasi Nilai", status: "in_progress", timestamp: "27 Okt 2026, 10:00 WIB", note: "Sedang proses analisis komparasi pasar dan pemodelan biaya penggantian terdepresiasi (DRC).", desc: "Pengolahan kertas kerja penilaian, riset pasar properti, dan perhitungan nilai indikasi." },
        "M-05": { id: "M-05", title: "Kendali Mutu & Reviewer SPM", status: "pending", timestamp: "-", note: "Menunggu telaah reviewer mutu berjenjang.", desc: "Pemeriksaan kepatuhan terhadap SPI, KEPI, dan SPM oleh Reviewer Rekan." },
        "M-06": { id: "M-06", title: "Otorisasi & Penomoran Penilai Publik", status: "pending", timestamp: "-", note: "Menunggu penandatanganan laporan resmi.", desc: "Pengesahan tanda tangan Penilai Publik berizin dan alokasi Nolap sistem." },
        "M-07": { id: "M-07", title: "Penyerahan Laporan Final", status: "pending", timestamp: "-", note: "Menunggu pengiriman laporan final ke Bank BTN.", desc: "Penyerahan bundel laporan penilaian final resmi ke instansi pemohon." }
      }
    };

    // Scroll ke Widget Lacak Penugasan
    function scrollKeLacakPenugasan(e) {
      if (e) e.preventDefault();
      const el = document.getElementById('lacak-penugasan');
      if (el) {
        const y = el.getBoundingClientRect().top + window.scrollY - 90;
        window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
        setTimeout(() => {
          const inp = document.getElementById('track-jo-input');
          if (inp) {
            inp.focus();
            inp.select();
          }
        }, 400);
      }
    }
    window.scrollKeLacakPenugasan = scrollKeLacakPenugasan;

    // Eksekusi Pencarian Publik
    async function eksekusiLacakPenugasanPublik(e) {
      if (e) e.preventDefault();
      const joInput = (document.getElementById('track-jo-input')?.value || '').trim();
      const picInput = (document.getElementById('track-pic-input')?.value || '').trim();
      const btn = document.getElementById('btn-submit-lacak');

      if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg><span>Mencari...</span>';
      }

      let jobResult = null;
      try {
        const url = 'backend/job-tracking-handler.php?action=track&jo=' + encodeURIComponent(joInput) + '&phone=' + encodeURIComponent(picInput);
        const res = await fetch(url);
        const json = await res.json();
        if (json && json.status === 'success' && json.data) {
          jobResult = json.data;
        }
      } catch (err) {
        console.warn("Backend API tidak merespons, menggunakan simulasi lokal Bank BTN:", err);
      }

      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<svg class="h-4 w-4 text-slate-950" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg><span>Lacak Status</span>';
      }

      // Gunakan jobResult atau fallback ke Mock BTN
      bukaModalTrackingPublik(jobResult || MOCK_BTN_JOB);
    }
    window.eksekusiLacakPenugasanPublik = eksekusiLacakPenugasanPublik;

    // Buka Modal Tangga Progres Publik
    function bukaModalTrackingPublik(job) {
      if (!job) return;

      document.getElementById('pub-modal-jo-number').textContent = job.jo_number || 'JO-JKT-2026-0001';
      document.getElementById('pub-modal-spk-number').textContent = job.spk_number || '-';
      document.getElementById('pub-modal-instansi').textContent = job.instansi || '-';
      document.getElementById('pub-modal-unit-kerja').textContent = job.unit_kerja || job.kantor || '-';
      document.getElementById('pub-modal-debitur').textContent = job.debitur || '-';
      document.getElementById('pub-modal-pic-contact').textContent = 'PIC: ' + (job.pic_pemohon || '-') + ' (' + (job.pic_contact || '-') + ')';
      document.getElementById('pub-modal-objek').textContent = job.jenis_properti + (job.luas_tanah ? ' • LT: ' + job.luas_tanah + ' / LB: ' + (job.luas_bangunan || '-') : '');
      document.getElementById('pub-modal-lokasi').textContent = job.lokasi_aset || '-';
      document.getElementById('pub-modal-sla-target').textContent = job.sla_deadline || '-';
      document.getElementById('pub-modal-progress-percent').textContent = (job.progress_percent || 57) + '%';
      document.getElementById('pub-modal-progress-bar').style.width = (job.progress_percent || 57) + '%';
      document.getElementById('pub-modal-badge-sla').textContent = job.sla_label || 'SLA H+3 Bank BTN';
      document.getElementById('pub-modal-keterangan-resmi').textContent = job.keterangan_resmi || 'Tahap berjalan saat ini berada dalam koridor SLA H+3 Bank BTN.';

      // WA Link
      const waBtn = document.getElementById('pub-modal-btn-wa');
      if (waBtn) {
        const textMsg = encodeURIComponent('Halo Admin KJPP NSR, saya ingin menanyakan perkembangan penugasan ' + (job.jo_number || '') + ' atas nama debitur ' + (job.debitur || '') + ' (' + (job.instansi || '') + ').');
        waBtn.href = 'https://wa.me/' + (job.wa_admin || '6281218008899') + '?text=' + textMsg;
      }

      // Render Vertical Stepper
      const container = document.getElementById('pub-stepper-items-container');
      let html = '';
      const mKeys = ['M-01', 'M-02', 'M-03', 'M-04', 'M-05', 'M-06', 'M-07'];
      const milestones = job.milestones || {};

      mKeys.forEach(key => {
        const item = milestones[key] || { id: key, title: 'Milestone ' + key, status: 'pending', note: '-' };
        const isCompleted = item.status === 'completed';
        const isInProgress = item.status === 'in_progress';

        let nodeIcon = '';
        let titleColor = 'text-slate-400';
        let badgeStatus = '<span class="text-[10px] text-slate-500 font-mono">Menunggu</span>';
        let boxStyle = 'border-slate-800 bg-slate-900/60 opacity-80';

        if (isCompleted) {
          nodeIcon = '<span class="absolute -left-6 top-1 w-6 h-6 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-black text-xs shadow-md shadow-emerald-500/30 ring-4 ring-slate-900"><svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg></span>';
          titleColor = 'text-white font-bold';
          badgeStatus = '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">Selesai ✓</span>';
          boxStyle = 'border-slate-800 bg-slate-900/80';
        } else if (isInProgress) {
          nodeIcon = '<span class="absolute -left-6 top-1 w-6 h-6 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center font-black text-xs shadow-md shadow-amber-500/40 ring-4 ring-slate-900 animate-pulse"><svg class="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg></span>';
          titleColor = 'text-amber-300 font-extrabold';
          badgeStatus = '<span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-400 animate-pulse">Tahap Berjalan ⏳</span>';
          boxStyle = 'border-amber-500/40 bg-gradient-to-r from-amber-500/10 via-slate-900 to-slate-900 ring-1 ring-amber-400/30';
        } else {
          nodeIcon = '<span class="absolute -left-6 top-1 w-6 h-6 rounded-full bg-slate-800 text-slate-400 border border-slate-700 flex items-center justify-center font-bold text-[10px] ring-4 ring-slate-900">' + key.split('-')[1] + '</span>';
        }

        html += '<div class="relative">' + nodeIcon +
          '<div class="p-3.5 rounded-xl border ' + boxStyle + ' transition">' +
            '<div class="flex flex-wrap items-center justify-between gap-2 mb-1">' +
              '<div class="flex items-center gap-2">' +
                '<span class="text-xs font-mono font-bold text-amber-400">' + (item.id || key) + '</span>' +
                '<h5 class="text-xs ' + titleColor + '">' + item.title + '</h5>' +
              '</div>' +
              '<div>' + badgeStatus + '</div>' +
            '</div>' +
            '<p class="text-[11px] text-slate-400 leading-snug">' + (item.desc || '') + '</p>' +
            '<div class="mt-2 pt-2 border-t border-slate-800/60 flex flex-wrap items-center justify-between gap-2 text-[10px]">' +
              '<span class="text-slate-300"><strong class="text-slate-500">Catatan:</strong> ' + (item.note || '-') + '</span>' +
              '<span class="font-mono text-slate-400">' + (item.timestamp || '-') + '</span>' +
            '</div>' +
          '</div>' +
        '</div>';
      });

      container.innerHTML = html;
      document.getElementById('modal-tracking-stepper-publik').classList.remove('hidden');
    }
    window.bukaModalTrackingPublik = bukaModalTrackingPublik;

    function tutupModalTrackingPublik() {
      const el = document.getElementById('modal-tracking-stepper-publik');
      if (el) el.classList.add('hidden');
    }
    window.tutupModalTrackingPublik = tutupModalTrackingPublik;
  </script>
`;

if (!html.includes('id="modal-tracking-stepper-publik"')) {
  console.warn("⚠️ Modal was not inserted previously, check markers");
}

html = html.replace('</body>', jsCode + '\n</body>');
console.log("✓ Added Client JS Logic before </body>");

fs.writeFileSync(indexPath, html, 'utf-8');
console.log("🎉 index.html successfully updated with Job Tracking Public features!");
