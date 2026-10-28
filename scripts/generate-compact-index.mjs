import fs from 'node:fs';

const orig = fs.readFileSync('index.html', 'utf8');

// 1. Part A: Header & Navigation (from start to <section id="profil")
const profilStart = orig.lastIndexOf('<section', orig.indexOf('id="profil"'));
let partA = orig.substring(0, profilStart);

// Update nav/mobile links in Part A to point cleanly to subpages/sections
// Visi Misi -> profil-legalitas.html#visi-misi
partA = partA.replace(/href="#visi-misi"/g, 'href="profil-legalitas.html#visi-misi"');
partA = partA.replace(/href="#kepercayaan"/g, 'href="profil-legalitas.html#legalitas"');

// Pengalaman / Portofolio in dropdown -> portofolio-rekanan.html
partA = partA.replace(/href="#pengalaman"/g, 'href="portofolio-rekanan.html"');

// Wawasan & Regulasi in dropdown
partA = partA.replace(/href="#wawasan"/g, 'href="wawasan-regulasi.html"');
partA = partA.replace(/href="#regulasi"/g, 'href="wawasan-regulasi.html#regulasi"');

// Tim Ahli & Cabang dropdown:
// Main button "Tim Ahli & Cabang" -> tim-cabang.html
partA = partA.replace(/<a href="#manajemen" class="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800\/70/g, '<a href="tim-cabang.html" class="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/70');
partA = partA.replace(/<a href="#manajemen" onclick="pilihTabManajemen\('semua'\)" class="text-\[11px\] text-sky-400/g, '<a href="tim-cabang.html" class="text-[11px] text-sky-400');
partA = partA.replace(/<a href="#manajemen" onclick="pilihTabManajemen\('semua'\)" class="nav-sub-item flex items-start gap-2.5">/g, '<a href="tim-cabang.html" class="nav-sub-item flex items-start gap-2.5">');

// Branch office links in dropdown -> #kontak with onclick="pilihKantorPeta('...')"
partA = partA.replace(/href="#manajemen" onclick="pilihTabManajemen\('pusat'\)"/g, 'href="#kontak" onclick="pilihKantorPeta(\'pusat\')"');
partA = partA.replace(/href="#manajemen" onclick="pilihTabManajemen\('bandung'\)"/g, 'href="#kontak" onclick="pilihKantorPeta(\'bandung\')"');
partA = partA.replace(/href="#manajemen" onclick="pilihTabManajemen\('padang'\)"/g, 'href="#kontak" onclick="pilihKantorPeta(\'padang\')"');
partA = partA.replace(/href="#manajemen" onclick="pilihTabManajemen\('makassar'\)"/g, 'href="#kontak" onclick="pilihKantorPeta(\'makassar\')"');
partA = partA.replace(/href="#manajemen" onclick="pilihTabManajemen\('palembang'\)"/g, 'href="#kontak" onclick="pilihKantorPeta(\'palembang\')"');

// Mobile menu branch links
partA = partA.replace(/href="#manajemen" onclick="toggleMobileMenu\(\); pilihTabManajemen\('semua'\);"/g, 'href="tim-cabang.html" onclick="toggleMobileMenu();"');
partA = partA.replace(/href="#manajemen" onclick="toggleMobileMenu\(\); pilihTabManajemen\('pusat'\);"/g, 'href="#kontak" onclick="toggleMobileMenu(); pilihKantorPeta(\'pusat\');"');
partA = partA.replace(/href="#manajemen" onclick="toggleMobileMenu\(\); pilihTabManajemen\('bandung'\);"/g, 'href="#kontak" onclick="toggleMobileMenu(); pilihKantorPeta(\'bandung\');"');
partA = partA.replace(/href="#manajemen" onclick="toggleMobileMenu\(\); pilihTabManajemen\('padang'\);"/g, 'href="#kontak" onclick="toggleMobileMenu(); pilihKantorPeta(\'padang\');"');
partA = partA.replace(/href="#manajemen" onclick="toggleMobileMenu\(\); pilihTabManajemen\('makassar'\);"/g, 'href="#kontak" onclick="toggleMobileMenu(); pilihKantorPeta(\'makassar\');"');
partA = partA.replace(/href="#manajemen" onclick="toggleMobileMenu\(\); pilihTabManajemen\('palembang'\);"/g, 'href="#kontak" onclick="toggleMobileMenu(); pilihKantorPeta(\'palembang\');"');


// 2. Section 1: Hero (#profil) & Rekanan (#rekanan)
const visiMisiStart = orig.lastIndexOf('<section', orig.indexOf('id="visi-misi"'));
const section1 = orig.substring(profilStart, visiMisiStart);

// 3. Section 2: NSR Cloud (#sistem-mutu) (Positioned directly after Hero & Partners!)
const sistemMutuStart = orig.lastIndexOf('<section', orig.indexOf('id="sistem-mutu"'));
const pengalamanStart = orig.lastIndexOf('<section', orig.indexOf('id="pengalaman"'));
const section2 = orig.substring(sistemMutuStart, pengalamanStart);

// 4. Section 3: Ruang Lingkup Layanan Penilai Properti (P) (#layanan)
const layananStart = orig.lastIndexOf('<section', orig.indexOf('id="layanan"'));
const section3 = orig.substring(layananStart, sistemMutuStart);

// 5. Section 4: Dokumentasi & Rekam Jejak Lapangan (FlexCarousel 3D) (#galeri)
const galeriStart = orig.lastIndexOf('<section', orig.indexOf('id="galeri"'));
const manajemenStart = orig.lastIndexOf('<section', orig.indexOf('id="manajemen"'));
const fullGaleri = orig.substring(galeriStart, manajemenStart);

const flexEndComment = '<!-- Interactive WebGL 3D FlexCarousel Component -->';
const flexEndIdx = fullGaleri.indexOf(flexEndComment);
const flexClosingDiv = fullGaleri.indexOf('</div>\r\n      </div>', flexEndIdx) !== -1 
  ? fullGaleri.indexOf('</div>\r\n      </div>', flexEndIdx) + '</div>\r\n      </div>'.length
  : fullGaleri.indexOf('</div>\n      </div>', flexEndIdx) + '</div>\n      </div>'.length;

const footerBoxComment = '<!-- Footer Info Box & Direct Link ke Galeri Lengkap -->';
const footerBoxIdx = fullGaleri.indexOf(footerBoxComment);
const sectionEndIdx = fullGaleri.lastIndexOf('</section>') + '</section>'.length;

const section4 = fullGaleri.substring(0, flexClosingDiv) + '\r\n\r\n      ' + fullGaleri.substring(footerBoxIdx, sectionEndIdx);

// 6. Section 5: Jaringan 5 Kantor Wilayah & Peta Interaktif (#kontak)
const kontakStart = orig.lastIndexOf('<section', orig.indexOf('id="kontak"'));
const footerStart = orig.indexOf('<footer');
const fullKontak = orig.substring(kontakStart, footerStart);

const kontakSectionEnd = fullKontak.lastIndexOf('</section>');
const lastInnerDiv = fullKontak.lastIndexOf('</div>', kontakSectionEnd - 1);

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

const section5 = fullKontak.substring(0, lastInnerDiv) + bannerTimCabang + fullKontak.substring(lastInnerDiv, kontakSectionEnd + '</section>'.length);

// 7. Section 6: FAQ Ringkas (#faq)
const faqStart = orig.lastIndexOf('<section', orig.indexOf('id="faq"'));
const fullFaq = orig.substring(faqStart, kontakStart);
const faqSectionEnd = fullFaq.lastIndexOf('</section>') + '</section>'.length;
const section6 = fullFaq.substring(0, faqSectionEnd);

// 8. Part G: Footer, Modals, Scripts
let partG = orig.substring(footerStart);

// Update footer links to point to subpages
partG = partG.replace(/href="#visi-misi"/g, 'href="profil-legalitas.html#visi-misi"');
partG = partG.replace(/href="#keunggulan"/g, 'href="profil-legalitas.html"');
partG = partG.replace(/href="#pengalaman"/g, 'href="portofolio-rekanan.html"');
partG = partG.replace(/href="#tim"/g, 'href="tim-cabang.html"');
partG = partG.replace(/href="#regulasi"/g, 'href="wawasan-regulasi.html"');

// Assemble complete new index.html
const newIndexHtml = [
  partA.trimEnd(),
  '\r\n\r\n  <!-- ==================== BAGIAN 1: HERO & KREDIBILITAS NASIONAL ==================== -->\r\n  ',
  section1.trim(),
  '\r\n\r\n  <!-- ==================== BAGIAN 2: NSR CLOUD — TATA KELOLA MUTU & KOORDINASI 4 CABANG ==================== -->\r\n  ',
  section2.trim(),
  '\r\n\r\n  <!-- ==================== BAGIAN 3: RUANG LINGKUP LAYANAN PENILAI PROPERTI (P) ==================== -->\r\n  ',
  section3.trim(),
  '\r\n\r\n  <!-- ==================== BAGIAN 4: DOKUMENTASI & REKAM JEJAK LAPANGAN (FLEX CAROUSEL 3D) ==================== -->\r\n  ',
  section4.trim(),
  '\r\n\r\n  <!-- ==================== BAGIAN 5: JARINGAN 5 KANTOR WILAYAH & PETA INTERAKTIF ==================== -->\r\n  ',
  section5.trim(),
  '\r\n\r\n  <!-- ==================== BAGIAN 6: TANYA JAWAB (FAQ RINGKAS) & KONSULTASI RFP ==================== -->\r\n  ',
  section6.trim(),
  '\r\n\r\n  <!-- ==================== FOOTER RESMI, MODAL & SCRIPTS ==================== -->\r\n  ',
  partG.trim()
].join('');

fs.writeFileSync('index.html', newIndexHtml, 'utf8');

console.log('Successfully written new compact index.html!');
console.log('Previous length:', orig.length, 'lines:', orig.split('\n').length);
console.log('New length:', newIndexHtml.length, 'lines:', newIndexHtml.split('\n').length);
