import fs from 'node:fs';

const orig = fs.readFileSync('index.html', 'utf8');

// 1. Extract Part A: Start up to start of <section id="profil"
const profilStart = orig.lastIndexOf('<section', orig.indexOf('id="profil"'));
const partA = orig.substring(0, profilStart);

// 2. Extract Section 1: Hero (#profil) & Rekanan (#rekanan)
// Hero ends where #rekanan starts, but let's check where #rekanan ends (before #visi-misi)
const visiMisiStart = orig.lastIndexOf('<section', orig.indexOf('id="visi-misi"'));
const partB = orig.substring(profilStart, visiMisiStart);

// 3. Extract Section 2: NSR Cloud (#sistem-mutu)
const sistemMutuStart = orig.lastIndexOf('<section', orig.indexOf('id="sistem-mutu"'));
const pengalamanStart = orig.lastIndexOf('<section', orig.indexOf('id="pengalaman"'));
const partC = orig.substring(sistemMutuStart, pengalamanStart);

// 4. Extract Section 3: Layanan Penilai Properti (#layanan)
const layananStart = orig.lastIndexOf('<section', orig.indexOf('id="layanan"'));
// layanan ends at sistem-mutu in the original file
const partD = orig.substring(layananStart, sistemMutuStart);

// 5. Extract Section 4: Galeri Lapangan (FlexCarousel 3D) (#galeri)
// Let's inspect galeri: we keep the header, FlexCarousel 3D container, and the footer box linking to portofolio-rekanan.html
const galeriStart = orig.lastIndexOf('<section', orig.indexOf('id="galeri"'));
const manajemenStart = orig.lastIndexOf('<section', orig.indexOf('id="manajemen"'));
const fullGaleri = orig.substring(galeriStart, manajemenStart);

// Streamline galeri: find end of flex carousel and connect to footer info box
const flexEndIdx = fullGaleri.indexOf('<!-- Interactive WebGL 3D FlexCarousel Component -->');
const flexContainerEnd = fullGaleri.indexOf('</div>\n      </div>', flexEndIdx) + '</div>\n      </div>'.length;
const footerBoxIdx = fullGaleri.indexOf('<!-- Footer Info Box & Direct Link ke Galeri Lengkap -->');
const sectionCloseIdx = fullGaleri.lastIndexOf('</section>');

const streamlinedGaleri = fullGaleri.substring(0, flexContainerEnd) + '\n\n' + fullGaleri.substring(footerBoxIdx, sectionCloseIdx + '</section>'.length);

// 6. Extract Section 5: Jaringan 5 Kantor Wilayah & Peta Interaktif (#kontak)
const kontakStart = orig.lastIndexOf('<section', orig.indexOf('id="kontak"'));
const footerStart = orig.indexOf('<footer');
const fullKontak = orig.substring(kontakStart, footerStart);

// In fullKontak, add a sleek banner linking to tim-cabang.html at the bottom before </section>
const kontakCloseIdx = fullKontak.lastIndexOf('</div>\n  </section>');
const bannerTimCabang = `
      <!-- Sleek Banner Navigasi ke Tim Manajemen & Struktur Organisasi -->
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
      </div>
`;
const streamlinedKontak = fullKontak.substring(0, kontakCloseIdx) + bannerTimCabang + '\n    </div>\n  </section>';

// 7. Extract Section 6: FAQ Ringkas (#faq)
const faqStart = orig.lastIndexOf('<section', orig.indexOf('id="faq"'));
const faqEnd = kontakStart;
const partFaq = orig.substring(faqStart, faqEnd);

// 8. Extract Part G: Footer and everything to end of file
const partG = orig.substring(footerStart);

console.log('Part lengths:');
console.log('Part A (Head + Nav):', partA.length);
console.log('Part B (Hero + Rekanan):', partB.length);
console.log('Part C (NSR Cloud):', partC.length);
console.log('Part D (Layanan):', partD.length);
console.log('Part E (Galeri 3D):', streamlinedGaleri.length);
console.log('Part F (Kontak 5 Kantor):', streamlinedKontak.length);
console.log('Part Faq (FAQ Ringkas):', partFaq.length);
console.log('Part G (Footer + Modals + Scripts):', partG.length);

const totalExpected = partA.length + partB.length + partC.length + partD.length + streamlinedGaleri.length + streamlinedKontak.length + partFaq.length + partG.length;
console.log('Total Expected chars:', totalExpected);
