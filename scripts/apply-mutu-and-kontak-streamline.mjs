import fs from 'node:fs';

let content = fs.readFileSync('index.html', 'utf8');

// =========================================================================
// 2. UPDATE NSR CLOUD (#sistem-mutu)
// =========================================================================
const sIdx = content.indexOf('id="sistem-mutu"');
const sStart = content.lastIndexOf('<section', sIdx);
const lStart = content.lastIndexOf('<section', content.indexOf('id="layanan"'));
const fullSistemMutu = content.substring(sStart, lStart);

// Find end of visual system flow
const visualEndMarker = '</div><!-- end 4 cabang stack -->';
const visualEndIdx = fullSistemMutu.indexOf(visualEndMarker);
if (visualEndIdx === -1) {
  console.error('visualEndMarker not found!');
  process.exit(1);
}

// Find closing tag of visual system flow container (usually 2 closing divs after visualEndMarker)
const visualFlowContainerEnd = fullSistemMutu.indexOf('</div>\n              </div>', visualEndIdx) !== -1
  ? fullSistemMutu.indexOf('</div>\n              </div>', visualEndIdx) + '</div>\n              </div>'.length
  : fullSistemMutu.indexOf('</div>\r\n              </div>', visualEndIdx) + '</div>\r\n              </div>'.length;

console.log('Found visualFlowContainerEnd at offset:', visualFlowContainerEnd);

// Extract the 4 service cards
const cardsStart = fullSistemMutu.indexOf('<!-- service cards / LOCKED PREVIEW: no direct public access -->');
const cardsEnd = fullSistemMutu.indexOf('<!-- Bottom CTA & Security Notice -->');
const fourCardsHtml = fullSistemMutu.substring(cardsStart, cardsEnd);

// Extract the QA process strip
const qaStart = fullSistemMutu.indexOf('<!-- QA process strip -->');
const qaEnd = fullSistemMutu.indexOf('<!-- Toggle SOP & 4 Pilar Pengendalian Mutu -->');
const qaStripHtml = fullSistemMutu.substring(qaStart, qaEnd);

// Extract the 4 pilar container
const pilarContainerStart = fullSistemMutu.indexOf('<div id="mutu-extra-container"');
const pilarInnerStart = fullSistemMutu.indexOf('>', pilarContainerStart) + 1;
const pilarEnd = fullSistemMutu.lastIndexOf('</div>\n    </div>\n  </section>') !== -1
  ? fullSistemMutu.lastIndexOf('</div>\n    </div>\n  </section>')
  : fullSistemMutu.lastIndexOf('</div>\r\n    </div>\r\n  </section>');
const pilarInnerHtml = fullSistemMutu.substring(pilarInnerStart, pilarEnd);

// Construct new compact bottom bar for the terminal box
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

// Construct new collapsible mutu-extra-container containing cards, QA steps, and 4 Pilar SPM
const newMutuExtraHtml = `
      <!-- Panel Collapsible: Rincian Layanan Operasional, 4 Tahapan QA & 4 Pilar SPM -->
      <div id="mutu-extra-container" class="hidden transition-all duration-300 mt-8 pt-8 border-t border-slate-800 relative z-10">
        <div class="mb-6">
          <span class="px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-sky-500/10 text-sky-300 border border-sky-500/20">
            Internal Operations Directory
          </span>
          <h4 class="text-lg sm:text-xl font-bold text-white mt-1.5">Layanan Operasional Kantor &amp; Alur Kendali Mutu</h4>
          <p class="text-xs text-slate-400 mt-0.5">Akses terbatas tim penilai lapangan dan jajaran pimpinan cabang KJPP NSR.</p>
        </div>

        ${fourCardsHtml.trim()}

        <div class="mt-8 pt-6 border-t border-slate-800/80">
          <h5 class="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">Alur Kerja 4 Tahap Quality Assurance</h5>
          ${qaStripHtml.replace('<!-- QA process strip -->', '').replace(/class="mt-10 lg:mt-14/g, 'class="').trim()}
        </div>

        <div class="mt-8 pt-6 border-t border-slate-800/80">
          ${pilarInnerHtml.trim()}
        </div>
      </div>
    </div>
  </section>`;

const newSistemMutuHtml = fullSistemMutu.substring(0, visualFlowContainerEnd) + compactTerminalFooter + newMutuExtraHtml;

content = content.substring(0, sStart) + newSistemMutuHtml + '\r\n\r\n  ' + content.substring(lStart);
console.log('2. NSR Cloud section successfully updated with focused diagram and collapsible details!');

// =========================================================================
// 3. UPDATE 5 KANTOR (#kontak): HAPUS 4 KARTU CABANG REDUNDAN DI BAWAH PETA
// =========================================================================
const kIdx = content.indexOf('id="kontak"');
const kStart = content.lastIndexOf('<section', kIdx);
const faqStart = content.lastIndexOf('<section', content.indexOf('id="faq"'));
const fullKontak = content.substring(kStart, faqStart);

// In fullKontak, find where 4 Branch Offices Executive Cards Grid starts
const grid4BranchMarker = '<!-- 4 Branch Offices Executive Cards Grid -->';
const grid4Start = fullKontak.indexOf(grid4BranchMarker);
const bannerTimMarker = '<!-- Sleek Banner Navigasi ke Tim Manajemen & Struktur Organisasi -->';
const bannerTimStart = fullKontak.indexOf(bannerTimMarker);

if (grid4Start !== -1 && bannerTimStart !== -1) {
  const newKontakHtml = fullKontak.substring(0, grid4Start) + fullKontak.substring(bannerTimStart);
  content = content.substring(0, kStart) + newKontakHtml + content.substring(faqStart);
  console.log('3. Kontak section successfully updated by removing redundant 4 branch cards!');
} else {
  console.error('Markers in kontak not found! grid4Start:', grid4Start, 'bannerTimStart:', bannerTimStart);
}

fs.writeFileSync('index.html', content, 'utf8');
console.log('Successfully written streamlined index.html!');
