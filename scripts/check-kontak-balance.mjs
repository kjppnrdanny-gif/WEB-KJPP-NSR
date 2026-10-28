import fs from 'node:fs';

const orig = fs.readFileSync('index.html', 'utf8');

const kontakStart = orig.lastIndexOf('<section', orig.indexOf('id="kontak"'));
const footerStart = orig.indexOf('<footer');
const fullKontak = orig.substring(kontakStart, footerStart);

const sectionEndIdx = fullKontak.lastIndexOf('</section>');
// Find the last </div> before </section>
const lastInnerDiv = fullKontak.lastIndexOf('</div>', sectionEndIdx - 1);

const bannerTimCabang = `\r\n      <!-- Sleek Banner Navigasi ke Tim Manajemen & Struktur Organisasi -->
      <div class="mt-8 p-5 rounded-2xl bg-slate-900/70 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
        <div>
          <h4 class="text-xs sm:text-sm font-bold text-white">
            Dewan Pimpinan Rekan &amp; Struktur Organisasi KJPP NSR
          </h4>
          <p class="text-[11px] sm:text-xs text-slate-400 mt-0.5">
            Pelajari profil 5 Penilai Publik berizin Kemenkeu RI, susunan dewan rekan, dan bagan organisasi lengkap.
          </p>
        </div>
        <a href="tim-cabang.html" class="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-300 hover:text-white border border-slate-700 font-bold text-xs shadow-md transition group">
          <span>Lihat Profil Tim &amp; Struktur Organisasi</span>
          <span class="group-hover:translate-x-1 transition-transform">&rarr;</span>
        </a>
      </div>\r\n    `;

const streamlinedKontak = fullKontak.substring(0, lastInnerDiv) + bannerTimCabang + fullKontak.substring(lastInnerDiv, sectionEndIdx + '</section>'.length);

console.log('Original kontak length:', fullKontak.length);
console.log('Streamlined kontak length:', streamlinedKontak.length);
console.log('Streamlined kontak ends with </section>?', streamlinedKontak.trim().endsWith('</section>'));

const openDivs = (streamlinedKontak.match(/<div\b/g) || []).length;
const closeDivs = (streamlinedKontak.match(/<\/div>/g) || []).length;
console.log(`Divs in streamlinedKontak: open=${openDivs}, close=${closeDivs}`);
