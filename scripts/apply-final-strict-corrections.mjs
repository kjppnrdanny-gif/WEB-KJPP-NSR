import fs from 'node:fs';
import path from 'node:path';

const ROOT_DIR = 'd:\\WEB KJPP NSR_Compro new ver\\kjpp-nsr-netlify-production';

// ============================================================
// 1. UPDATE index.html
// ============================================================
let indexHtml = fs.readFileSync(path.join(ROOT_DIR, 'index.html'), 'utf8');

// 1A. Spotlight address in index.html (remove dual Domisili / Operasional boxes)
const OLD_SPOTLIGHT_ADDR = `<div id="kantor-aktif-alamat" class="mt-0.5 text-slate-200 leading-relaxed text-xs sm:text-sm">
                    <div class="space-y-2 mt-1">
                      <div class="p-2.5 rounded-xl bg-slate-950/80 border border-amber-500/30">
                        <div class="flex items-center gap-1.5 text-amber-300 font-bold text-[11px] mb-0.5">
                          <span class="w-2 h-2 rounded-full bg-amber-400"></span> 1. DOMISILI HUKUM (JAKARTA SELATAN)
                        </div>
                        <p class="text-slate-200 text-xs leading-relaxed">Jl. Hankam No. 5 RT.006 RW.001, Ragunan, Pasar Minggu, Jakarta Selatan 12550</p>
                      </div>
                      <div class="p-2.5 rounded-xl bg-slate-950/80 border border-sky-500/30">
                        <div class="flex items-center gap-1.5 text-sky-300 font-bold text-[11px] mb-0.5">
                          <span class="w-2 h-2 rounded-full bg-sky-400"></span> 2. KANTOR OPERASIONAL (JAKARTA BARAT)
                        </div>
                        <p class="text-slate-200 text-xs leading-relaxed">Graha Arteri Mas Kav. 53, Jl. Panjang No. 68, Kedoya Selatan, Kebon Jeruk, Jakarta Barat 11530</p>
                      </div>
                    </div>
                  </div>`;

const NEW_SPOTLIGHT_ADDR = `<p id="kantor-aktif-alamat" class="mt-0.5 text-slate-200 leading-relaxed text-xs sm:text-sm">
                    Jl. Hankam No. 5 RT.006 RW.001, Kel. Ragunan, Kec. Pasar Minggu, Jakarta Selatan 12550
                  </p>`;

if (indexHtml.includes(OLD_SPOTLIGHT_ADDR)) {
  indexHtml = indexHtml.replace(OLD_SPOTLIGHT_ADDR, NEW_SPOTLIGHT_ADDR);
  console.log('✓ index.html: Spotlight address cleaned of Jakarta Barat');
} else {
  console.warn('Spotlight addr not found directly, checking regex...');
}

// 1B. Fallback bar in map container in index.html
const OLD_MAP_FALLBACK = `<div id="bar-fallback-gmaps" class="px-4 py-3 bg-slate-800/80 border-t border-slate-700/60 flex flex-col sm:flex-row items-start sm:items-center gap-3 justify-between">
            <div id="desc-fallback-gmaps" class="text-[11px] text-slate-400 leading-relaxed">
              Jakarta memiliki dua lokasi resmi. Pilih tujuan: <span class="text-sky-300 font-semibold">Operasional (Jakbar)</span> untuk kegiatan kantor, atau <span class="text-amber-300 font-semibold">Domisili (Jaksel)</span> untuk korespondensi legal.
            </div>
            <div id="wrap-btn-gmaps" class="flex flex-wrap items-center gap-2 shrink-0">
              <a href="https://maps.google.com/?q=Graha+Arteri+Mas+Kav+53+Kedoya+Jakarta+Barat" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-[11px] font-bold transition shadow-sm">
                <svg class="w-3 h-3 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>
                Operasional (Jakbar)
              </a>
              <a href="https://maps.google.com/?q=Jl+Hankam+No+5+Ragunan+Jakarta+Selatan" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-[11px] font-bold transition shadow-sm">
                <svg class="w-3 h-3 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>
                Domisili (Jaksel)
              </a>
            </div>
          </div>`;

const NEW_MAP_FALLBACK = `<div id="bar-fallback-gmaps" class="px-4 py-3 bg-slate-800/80 border-t border-slate-700/60 flex flex-col sm:flex-row items-start sm:items-center gap-3 justify-between">
            <div id="desc-fallback-gmaps" class="text-[11px] text-slate-400 leading-relaxed">
              Navigasi rute langsung ke lokasi Kantor Pusat Jakarta di aplikasi Google Maps.
            </div>
            <div id="wrap-btn-gmaps" class="flex flex-wrap items-center gap-2 shrink-0">
              <a id="btn-buka-gmaps" href="https://maps.google.com/?q=Jl.+Hankam+No.+5,+Ragunan,+Pasar+Minggu,+Jakarta+Selatan" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-sm">
                <svg class="w-3.5 h-3.5 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>
                Buka di Google Maps
              </a>
            </div>
          </div>`;

if (indexHtml.includes(OLD_MAP_FALLBACK)) {
  indexHtml = indexHtml.replace(OLD_MAP_FALLBACK, NEW_MAP_FALLBACK);
  console.log('✓ index.html: Fallback bar updated to single official button');
} else {
  console.warn('Map fallback not found directly');
}

// 1C. DATA_KANTOR_NSR.pusat in index.html
const OLD_DATA_PUSAT = `      pusat: {
        badge: 'Kantor Pusat & Korespondensi',
        wilayah: 'DKI Jakarta & Nasional',
        nama: 'Kantor Pusat Jakarta (Domisili & Operasional)',
        alamat: '<div class="space-y-2 mt-1"><div class="p-2.5 rounded-xl bg-slate-950/80 border border-amber-500/30"><div class="flex items-center gap-1.5 text-amber-300 font-bold text-[11px] mb-0.5"><span class="w-2 h-2 rounded-full bg-amber-400"></span> 1. DOMISILI HUKUM (JAKARTA SELATAN)</div><p class="text-slate-200 text-xs leading-relaxed">Jl. Hankam No. 5 RT.006 RW.001, Ragunan, Pasar Minggu, Jakarta Selatan 12550</p></div><div class="p-2.5 rounded-xl bg-slate-950/80 border border-sky-500/30"><div class="flex items-center gap-1.5 text-sky-300 font-bold text-[11px] mb-0.5"><span class="w-2 h-2 rounded-full bg-sky-400"></span> 2. KANTOR OPERASIONAL (JAKARTA BARAT)</div><p class="text-slate-200 text-xs leading-relaxed">Graha Arteri Mas Kav. 53, Jl. Panjang No. 68, Kedoya Selatan, Kebon Jeruk, Jakarta Barat 11530</p></div></div>',
        telp: 'Telp: +62 21 7884 9996, 7884 8837 | WA Admin: 0851-1051-3157',
        picHtml: '<p class="text-white font-semibold">Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.) <button type="button" onclick="bukaModal(\\'modal-cv-nanang\\')" class="text-xs text-amber-300 hover:underline ml-1 font-normal">(Lihat CV Rekan)</button></p><p class="text-slate-300 text-xs mt-0.5">Pimpinan Rekan | Izin Penilai Publik: PB-1.09.00021</p>',
        emailHtml: '<a href="mailto:nanang_kjpp@yahoo.co.id" class="font-semibold text-sky-400 hover:text-sky-300 hover:underline">nanang_kjpp@yahoo.co.id</a> <span class="text-slate-500">/</span> <a href="mailto:kjppnrr.bd@gmail.com" class="text-slate-300 hover:text-sky-300 hover:underline">kjppnrr.bd@gmail.com</a>',
        mapUrl: 'https://www.google.com/maps?q=-6.18528,106.76456&hl=id&z=17&output=embed',
        directMapUrl: 'https://maps.google.com/?q=Graha+Arteri+Mas+Kav+53+Kedoya+Jakarta+Barat',
        directMapUrl2: 'https://maps.google.com/?q=Jl+Hankam+No+5+Ragunan+Jakarta+Selatan',
        wa: ''
      },`;

const NEW_DATA_PUSAT = `      pusat: {
        badge: 'Kantor Pusat & Korespondensi',
        wilayah: 'DKI Jakarta & Nasional',
        nama: 'Kantor Pusat Jakarta',
        alamat: 'Jl. Hankam No. 5 RT.006 RW.001, Ragunan, Pasar Minggu, Jakarta Selatan 12550',
        telp: 'Telp: +62 21 7884 9996, 7884 8837 | WA Admin: 0851-1051-3157',
        picHtml: '<p class="text-white font-semibold">Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.) <button type="button" onclick="bukaModal(\\'modal-cv-nanang\\')" class="text-xs text-amber-300 hover:underline ml-1 font-normal">(Lihat CV Rekan)</button></p><p class="text-slate-300 text-xs mt-0.5">Pimpinan Rekan | Izin Penilai Publik: PB-1.09.00021</p>',
        emailHtml: '<a href="mailto:nanang_kjpp@yahoo.co.id" class="font-semibold text-sky-400 hover:text-sky-300 hover:underline">nanang_kjpp@yahoo.co.id</a> <span class="text-slate-500">/</span> <a href="mailto:kjppnrr.bd@gmail.com" class="text-slate-300 hover:text-sky-300 hover:underline">kjppnrr.bd@gmail.com</a>',
        mapUrl: 'https://www.google.com/maps?q=-6.3056,106.8208&hl=id&z=17&output=embed',
        directMapUrl: 'https://maps.google.com/?q=Jl.+Hankam+No.+5,+Ragunan,+Pasar+Minggu,+Jakarta+Selatan',
        wa: ''
      },`;

if (indexHtml.includes(OLD_DATA_PUSAT)) {
  indexHtml = indexHtml.replace(OLD_DATA_PUSAT, NEW_DATA_PUSAT);
  console.log('✓ index.html: DATA_KANTOR_NSR.pusat updated');
} else {
  console.warn('OLD_DATA_PUSAT not found directly');
}

// 1D. pilihKantorPeta in index.html (clean single button for all offices)
const OLD_PILIH_WRAP = `      // Update fallback Google Maps button(s)
      const elWrapBtn = document.getElementById('wrap-btn-gmaps');
      const elDescGmaps = document.getElementById('desc-fallback-gmaps');
      if (elWrapBtn) {
        if (kunci === 'pusat') {
          if (elDescGmaps) {
            elDescGmaps.innerHTML = 'Jakarta memiliki dua lokasi resmi. Pilih tujuan: <span class="text-sky-300 font-semibold">Operasional (Jakbar)</span> untuk kegiatan kantor, atau <span class="text-amber-300 font-semibold">Domisili (Jaksel)</span> untuk korespondensi legal.';
          }
          elWrapBtn.innerHTML = '<a href="' + data.directMapUrl + '" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-[11px] font-bold transition shadow-sm"><svg class="w-3 h-3 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>Operasional (Jakbar)</a><a href="' + data.directMapUrl2 + '" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-[11px] font-bold transition shadow-sm"><svg class="w-3 h-3 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>Domisili (Jaksel)</a>';
        } else {
          if (elDescGmaps) {
            elDescGmaps.innerHTML = 'Navigasi rute langsung ke lokasi kantor cabang ' + data.nama + ' di aplikasi Google Maps.';
          }
          elWrapBtn.innerHTML = '<a href="' + data.directMapUrl + '" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-sm"><svg class="w-3.5 h-3.5 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>Buka di Google Maps</a>';
        }
      }`;

const NEW_PILIH_WRAP = `      // Update fallback Google Maps button
      const elWrapBtn = document.getElementById('wrap-btn-gmaps');
      const elDescGmaps = document.getElementById('desc-fallback-gmaps');
      if (elWrapBtn && data.directMapUrl) {
        if (elDescGmaps) {
          elDescGmaps.innerHTML = 'Navigasi rute langsung ke lokasi ' + data.nama + ' di aplikasi Google Maps.';
        }
        elWrapBtn.innerHTML = '<a href="' + data.directMapUrl + '" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-sm"><svg class="w-3.5 h-3.5 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>Buka di Google Maps</a>';
      }`;

if (indexHtml.includes(OLD_PILIH_WRAP)) {
  indexHtml = indexHtml.replace(OLD_PILIH_WRAP, NEW_PILIH_WRAP);
  console.log('✓ index.html: pilihKantorPeta updated to unified single button');
} else {
  console.warn('OLD_PILIH_WRAP not found directly');
}

fs.writeFileSync(path.join(ROOT_DIR, 'index.html'), indexHtml, 'utf8');

// ============================================================
// 2. UPDATE tim-cabang.html
// ============================================================
let timHtml = fs.readFileSync(path.join(ROOT_DIR, 'tim-cabang.html'), 'utf8');

// Remove Kantor Operasional Graha Arteri Mas in tim-cabang.html
timHtml = timHtml.replace(
  `<p class="text-slate-300"><strong>Alamat Domisili Hukum:</strong> Jl. Hankam No. 5 RT.006 RW.001, Kel. Ragunan, Kec. Pasar Minggu, Jakarta Selatan, DKI Jakarta 12550.</p>\n                <p class="text-slate-300"><strong>Kantor Operasional:</strong> Graha Arteri Mas Kav. 53, Jl. Panjang No. 68, Kedoya Selatan, Kebon Jeruk, Jakarta Barat, DKI Jakarta 11530.</p>`,
  `<p class="text-slate-300"><strong>Alamat Resmi Kantor Pusat:</strong> Jl. Hankam No. 5 RT.006 RW.001, Kel. Ragunan, Kec. Pasar Minggu, Jakarta Selatan, DKI Jakarta 12550.</p>`
);

// Footer in tim-cabang.html
timHtml = timHtml.replace(
  `<strong>Kantor Pusat:</strong> Jl. Hankam No. 5 Ragunan, Jaksel (Domisili) &amp; Graha Arteri Mas Kav. 53 Kedoya, Jakbar (Operasional).<br>`,
  `<strong>Kantor Pusat:</strong> Jl. Hankam No. 5 RT.006 RW.001, Ragunan, Pasar Minggu, Jakarta Selatan 12550.<br>`
);

fs.writeFileSync(path.join(ROOT_DIR, 'tim-cabang.html'), timHtml, 'utf8');
console.log('✓ tim-cabang.html updated');

// ============================================================
// 3. UPDATE layanan.html
// ============================================================
let layHtml = fs.readFileSync(path.join(ROOT_DIR, 'layanan.html'), 'utf8');
layHtml = layHtml.replace(
  `<strong>Kantor Pusat:</strong> Jl. Hankam No. 5 Ragunan, Jaksel (Domisili) &amp; Graha Arteri Mas Kav. 53 Kedoya, Jakbar (Operasional).<br>`,
  `<strong>Kantor Pusat:</strong> Jl. Hankam No. 5 RT.006 RW.001, Ragunan, Pasar Minggu, Jakarta Selatan 12550.<br>`
);
fs.writeFileSync(path.join(ROOT_DIR, 'layanan.html'), layHtml, 'utf8');
console.log('✓ layanan.html updated');

// ============================================================
// 4. UPDATE profil-legalitas.html
// ============================================================
let profHtml = fs.readFileSync(path.join(ROOT_DIR, 'profil-legalitas.html'), 'utf8');
profHtml = profHtml.replace(
  `<strong>Kantor Pusat:</strong> Jl. Hankam No. 5 Ragunan, Jaksel (Domisili) &amp; Graha Arteri Mas Kav. 53 Kedoya, Jakbar (Operasional).<br>`,
  `<strong>Kantor Pusat:</strong> Jl. Hankam No. 5 RT.006 RW.001, Ragunan, Pasar Minggu, Jakarta Selatan 12550.<br>`
);

// Also clean Bank-Grade & terenkripsi claim in profil-legalitas.html
profHtml = profHtml.replace(
  `<h4 class="text-xs font-bold text-white">Kerahasiaan &amp; Keamanan Data Klien (Bank-Grade)</h4>\n                  <p class="text-[11px] text-slate-400 mt-0.5">Informasi debitur, dokumen sertifikat, dan rahasia bisnis terlindungi sistem cloud terenkripsi dengan protokol kerahasiaan ketat.</p>`,
  `<h4 class="text-xs font-bold text-white">Kepatuhan Etika &amp; Kerahasiaan Dokumen Klien</h4>\n                  <p class="text-[11px] text-slate-400 mt-0.5">Informasi debitur, dokumen sertifikat, dan rahasia bisnis klien dijaga dengan komitmen kerahasiaan penuh sesuai Kode Etik Penilai Indonesia (KEPI) dan SPI 102.</p>`
);

fs.writeFileSync(path.join(ROOT_DIR, 'profil-legalitas.html'), profHtml, 'utf8');
console.log('✓ profil-legalitas.html updated');

// ============================================================
// 5. UPDATE portofolio-rekanan.html
// ============================================================
let portHtml = fs.readFileSync(path.join(ROOT_DIR, 'portofolio-rekanan.html'), 'utf8');
portHtml = portHtml.replace(
  `<strong>Kantor Pusat:</strong> Jl. Hankam No. 5 Ragunan, Jaksel (Domisili) &amp; Graha Arteri Mas Kav. 53 Kedoya, Jakbar (Operasional).<br>`,
  `<strong>Kantor Pusat:</strong> Jl. Hankam No. 5 RT.006 RW.001, Ragunan, Pasar Minggu, Jakarta Selatan 12550.<br>`
);
fs.writeFileSync(path.join(ROOT_DIR, 'portofolio-rekanan.html'), portHtml, 'utf8');
console.log('✓ portofolio-rekanan.html updated');

// ============================================================
// 6. UPDATE wawasan-regulasi.html
// ============================================================
let wawHtml = fs.readFileSync(path.join(ROOT_DIR, 'wawasan-regulasi.html'), 'utf8');
wawHtml = wawHtml.replace(
  `<strong>Kantor Pusat:</strong> Jl. Hankam No. 5 Ragunan, Jaksel (Domisili) &amp; Graha Arteri Mas Kav. 53 Kedoya, Jakbar (Operasional).<br>`,
  `<strong>Kantor Pusat:</strong> Jl. Hankam No. 5 RT.006 RW.001, Ragunan, Pasar Minggu, Jakarta Selatan 12550.<br>`
);
fs.writeFileSync(path.join(ROOT_DIR, 'wawasan-regulasi.html'), wawHtml, 'utf8');
console.log('✓ wawasan-regulasi.html updated');

console.log('\nAll pages updated successfully!');
