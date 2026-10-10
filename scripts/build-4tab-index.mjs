import fs from 'node:fs';

const content = fs.readFileSync('index.html', 'utf8');

const sMutuStart = content.lastIndexOf('<section', content.indexOf('id="sistem-mutu"'));
const layananStart = content.lastIndexOf('<section', content.indexOf('id="layanan"'));
const galeriStart = content.lastIndexOf('<section', content.indexOf('id="galeri"'));
const kontakStart = content.lastIndexOf('<section', content.indexOf('id="kontak"'));
const faqStart = content.lastIndexOf('<section', content.indexOf('id="faq"'));

function extractMaxW7(secText) {
  const m = secText.indexOf('<div class="max-w-7xl');
  const endSec = secText.lastIndexOf('</section>');
  return secText.substring(m, endSec).trim();
}

const mutuRaw = content.substring(sMutuStart, layananStart);
const layananRaw = content.substring(layananStart, galeriStart);
const galeriRaw = content.substring(galeriStart, kontakStart);
const kontakRaw = content.substring(kontakStart, faqStart);

const mutuInner = extractMaxW7(mutuRaw);
const layananInner = extractMaxW7(layananRaw);
const galeriInner = extractMaxW7(galeriRaw);
const kontakInner = extractMaxW7(kontakRaw);

const new4TabSection = `<!-- ==================== AREA 4 TAB INTERAKTIF EKOSISTEM UTAMA (BYPASS RINGKAS PREMIUM) ==================== -->
  <section id="ekosistem-utama" aria-label="Eksplorasi Ekosistem KJPP NSR" class="relative py-8 md:py-14 bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white border-y border-slate-800 overflow-hidden scroll-mt-20">
    <!-- DotField Canvas Component (Interactive Bulge & Glow Dot Grid) -->
    <div
      class="dot-field-container pointer-events-none absolute inset-0 w-full h-full z-[0]"
      style="-webkit-mask-image: radial-gradient(ellipse at center, white 35%, transparent 85%); mask-image: radial-gradient(ellipse at center, white 35%, transparent 85%);"
      aria-hidden="true"
    ></div>
    <!-- Subtle background accent glows -->
    <div class="absolute -top-32 -right-32 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
    <div class="absolute -bottom-32 -left-32 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

    <!-- TAB NAVIGATION CONTROLLER (Sticky/Prominent Header Bar) -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 mb-6 sm:mb-8">
      <div class="text-center max-w-3xl mx-auto mb-4 sm:mb-6">
        <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-900/40 border border-blue-700/50 text-sky-300 text-[11px] font-bold uppercase tracking-wider mb-2">
          EKSPLORASI EKOSISTEM UTAMA &bull; 4 TAB INTERAKTIF
        </span>
        <h2 class="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight">
          Tata Kelola Mutu, Layanan, Portofolio &amp; Kantor Cabang
        </h2>
        <p class="text-xs sm:text-sm text-slate-300 mt-1.5 max-w-xl mx-auto">
          Pilih tab di bawah untuk melihat rincian di tempat yang sama tanpa perlu scroll panjang:
        </p>
      </div>

      <!-- Tab Buttons: Horizontally scrollable on mobile, Centered on desktop -->
      <div class="flex items-center justify-start md:justify-center gap-2 sm:gap-3 overflow-x-auto pb-2 sm:pb-1 no-scrollbar px-1" role="tablist" aria-label="Eksplorasi 4 Tab KJPP NSR" style="scroll-snap-type: x mandatory;">
        <!-- Tab 1: NSR Cloud (DEFAULT) -->
        <button 
          type="button" 
          id="tab-btn-mutu" 
          role="tab" 
          aria-selected="true" 
          aria-controls="tab-panel-mutu" 
          onclick="pilihTabUtama('mutu')" 
          class="tab-btn-utama shrink-0 px-4 py-2.5 sm:px-5 sm:py-3 rounded-2xl text-xs sm:text-sm font-bold transition flex items-center gap-2 border bg-sky-600 text-white border-sky-400 shadow-lg shadow-sky-950/70"
          style="scroll-snap-align: start;">
          <svg class="w-4 h-4 text-sky-200 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/></svg>
          <span>NSR Cloud &amp; Mutu</span>
          <span class="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-sky-400/20 text-sky-200 uppercase tracking-wider">Default</span>
        </button>

        <!-- Tab 2: Layanan Unggulan -->
        <button 
          type="button" 
          id="tab-btn-layanan" 
          role="tab" 
          aria-selected="false" 
          aria-controls="tab-panel-layanan" 
          onclick="pilihTabUtama('layanan')" 
          class="tab-btn-utama shrink-0 px-4 py-2.5 sm:px-5 sm:py-3 rounded-2xl text-xs sm:text-sm font-semibold transition flex items-center gap-2 border bg-slate-900/90 text-slate-300 border-slate-800 hover:bg-slate-800 hover:text-white"
          style="scroll-snap-align: start;">
          <svg class="w-4 h-4 text-amber-400 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/></svg>
          <span>Layanan Unggulan</span>
        </button>

        <!-- Tab 3: Galeri FlexCarousel 3D -->
        <button 
          type="button" 
          id="tab-btn-galeri" 
          role="tab" 
          aria-selected="false" 
          aria-controls="tab-panel-galeri" 
          onclick="pilihTabUtama('galeri')" 
          class="tab-btn-utama shrink-0 px-4 py-2.5 sm:px-5 sm:py-3 rounded-2xl text-xs sm:text-sm font-semibold transition flex items-center gap-2 border bg-slate-900/90 text-slate-300 border-slate-800 hover:bg-slate-800 hover:text-white"
          style="scroll-snap-align: start;">
          <svg class="w-4 h-4 text-emerald-400 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
          <span>Galeri FlexCarousel 3D</span>
        </button>

        <!-- Tab 4: 5 Kantor Wilayah & Peta -->
        <button 
          type="button" 
          id="tab-btn-kantor" 
          role="tab" 
          aria-selected="false" 
          aria-controls="tab-panel-kantor" 
          onclick="pilihTabUtama('kantor')" 
          class="tab-btn-utama shrink-0 px-4 py-2.5 sm:px-5 sm:py-3 rounded-2xl text-xs sm:text-sm font-semibold transition flex items-center gap-2 border bg-slate-900/90 text-slate-300 border-slate-800 hover:bg-slate-800 hover:text-white"
          style="scroll-snap-align: start;">
          <svg class="w-4 h-4 text-rose-400 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>
          <span>5 Kantor &amp; Peta</span>
        </button>
      </div>
    </div>

    <!-- TAB PANELS (Only 1 active at a time in the exact same spot) -->
    
    <!-- PANEL 1: NSR CLOUD & SISTEM MUTU (Default Visible) -->
    <div id="tab-panel-mutu" role="tabpanel" aria-labelledby="tab-btn-mutu" class="tab-panel-item transition-all duration-300">
      <div id="sistem-mutu" class="relative">
        ${mutuInner}
      </div>
    </div>

    <!-- PANEL 2: LAYANAN UNGGULAN (Hidden by default) -->
    <div id="tab-panel-layanan" role="tabpanel" aria-labelledby="tab-btn-layanan" class="tab-panel-item hidden transition-all duration-300">
      <div id="layanan" class="relative">
        ${layananInner}
      </div>
    </div>

    <!-- PANEL 3: GALERI FLEXCAROUSEL 3D (Hidden by default) -->
    <div id="tab-panel-galeri" role="tabpanel" aria-labelledby="tab-btn-galeri" class="tab-panel-item hidden transition-all duration-300">
      <div id="galeri" class="relative">
        ${galeriInner}
      </div>
    </div>

    <!-- PANEL 4: 5 KANTOR WILAYAH & PETA (Hidden by default) -->
    <div id="tab-panel-kantor" role="tabpanel" aria-labelledby="tab-btn-kantor" class="tab-panel-item hidden transition-all duration-300">
      <div id="kontak" class="relative">
        ${kontakInner}
      </div>
    </div>

  </section>

  `;

let newContent = content.substring(0, sMutuStart) + new4TabSection + content.substring(faqStart);

// Add Tab Switching Controller Script
const scriptMarker = '</script>\r\n</body>';
const altScriptMarker = '</script>\n</body>';
const targetMarker = newContent.includes(scriptMarker) ? scriptMarker : altScriptMarker;

const tabScript = `
    // =========================================================================
    // KONTROLER 4 TAB INTERAKTIF EKOSISTEM UTAMA KJPP NSR
    // =========================================================================
    function pilihTabUtama(kunci, scrollKeTab = false) {
      const tabList = [
        { key: 'mutu', panelId: 'tab-panel-mutu', btnId: 'tab-btn-mutu' },
        { key: 'layanan', panelId: 'tab-panel-layanan', btnId: 'tab-btn-layanan' },
        { key: 'galeri', panelId: 'tab-panel-galeri', btnId: 'tab-btn-galeri' },
        { key: 'kantor', panelId: 'tab-panel-kantor', btnId: 'tab-btn-kantor' }
      ];

      if (kunci === 'sistem-mutu' || kunci === 'cloud') kunci = 'mutu';
      if (kunci === 'kontak') kunci = 'kantor';

      tabList.forEach(t => {
        const panel = document.getElementById(t.panelId);
        const btn = document.getElementById(t.btnId);
        if (!panel) return;
        if (t.key === kunci) {
          panel.classList.remove('hidden');
          if (btn) {
            btn.className = 'tab-btn-utama shrink-0 px-4 py-2.5 sm:px-5 sm:py-3 rounded-2xl text-xs sm:text-sm font-bold transition flex items-center gap-2 border bg-sky-600 text-white border-sky-400 shadow-lg shadow-sky-950/70';
            btn.setAttribute('aria-selected', 'true');
          }
        } else {
          panel.classList.add('hidden');
          if (btn) {
            btn.className = 'tab-btn-utama shrink-0 px-4 py-2.5 sm:px-5 sm:py-3 rounded-2xl text-xs sm:text-sm font-semibold transition flex items-center gap-2 border bg-slate-900/90 text-slate-300 border-slate-800 hover:bg-slate-800 hover:text-white';
            btn.setAttribute('aria-selected', 'false');
          }
        }
      });

      // Special handling for Galeri FlexCarousel 3D WebGL
      if (kunci === 'galeri') {
        setTimeout(() => {
          if (typeof window.runCarouselInit === 'function') {
            window.runCarouselInit();
          }
          window.dispatchEvent(new Event('resize'));
        }, 60);
      }

      // Special handling for Kantor (Google Maps iframe)
      if (kunci === 'kantor') {
        setTimeout(() => {
          const elIframe = document.getElementById('map-iframe-kantor');
          if (elIframe && (!elIframe.src || elIframe.src.includes('about:blank'))) {
            elIframe.src = elIframe.getAttribute('data-src') || 'https://www.google.com/maps?q=-6.3056,106.8208&hl=id&z=17&output=embed';
          }
        }, 60);
      }

      if (scrollKeTab) {
        const section = document.getElementById('ekosistem-utama');
        if (section) {
          const y = section.getBoundingClientRect().top + window.scrollY - 70;
          window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
        }
      }
    }

    // Auto-listen hash navigation (#layanan, #galeri, #kontak, #sistem-mutu)
    window.addEventListener('hashchange', () => {
      const h = window.location.hash.replace('#', '');
      if (h === 'sistem-mutu' || h === 'mutu') pilihTabUtama('mutu', true);
      else if (h === 'layanan') pilihTabUtama('layanan', true);
      else if (h === 'galeri') pilihTabUtama('galeri', true);
      else if (h === 'kontak' || h === 'kantor') pilihTabUtama('kantor', true);
    });

    if (window.location.hash) {
      const h = window.location.hash.replace('#', '');
      if (h === 'sistem-mutu' || h === 'mutu') pilihTabUtama('mutu', false);
      else if (h === 'layanan') pilihTabUtama('layanan', false);
      else if (h === 'galeri') pilihTabUtama('galeri', false);
      else if (h === 'kontak' || h === 'kantor') pilihTabUtama('kantor', false);
    }
  </script>
</body>`;

newContent = newContent.replace(targetMarker, tabScript);

fs.writeFileSync('index.html', newContent, 'utf8');
console.log('Successfully written unified 4-tab index.html!');
