import fs from 'node:fs';

const file = 'd:\\WEB KJPP NSR_Compro new ver\\kjpp-nsr-netlify-production\\index.html';
let html = fs.readFileSync(file, 'utf8');

// 1. Update static fallback HTML in map container
const OLD_FALLBACK = `          <!-- Fallback: Buka di Google Maps -->
          <div class="px-4 py-3 bg-slate-800/80 border-t border-slate-700/60 flex flex-col sm:flex-row items-start sm:items-center gap-3 justify-between">
            <p class="text-[11px] text-slate-400 leading-relaxed">Jika peta tidak muncul, buka langsung di Google Maps. Untuk Jakarta: ada dua lokasi — domisili di <span class="text-amber-300 font-semibold">Jakarta Selatan</span> (Ragunan) dan operasional di <span class="text-sky-300 font-semibold">Jakarta Barat</span> (Kedoya).</p>
            <a id="btn-buka-gmaps" href="https://maps.google.com/?q=KJPP+Nanang+Rahayu+Sigit+Paryanto+dan+Rekan" target="_blank" rel="noopener noreferrer" class="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-sm">
              <svg class="w-3.5 h-3.5 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>
              Buka di Google Maps
            </a>
          </div>`;

const NEW_FALLBACK = `          <!-- Fallback: Buka di Google Maps & Pilihan Lokasi Jakarta -->
          <div id="bar-fallback-gmaps" class="px-4 py-3 bg-slate-800/80 border-t border-slate-700/60 flex flex-col sm:flex-row items-start sm:items-center gap-3 justify-between">
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

if (html.includes(OLD_FALLBACK)) {
  html = html.replace(OLD_FALLBACK, NEW_FALLBACK);
  console.log('✓ Fallback bar replaced');
} else {
  console.warn('Fallback bar not found for direct replacement, searching...');
}

// 2. Update DATA_KANTOR_NSR mapUrls & Jakarta alamat format
const OLD_DATA_PUSAT = `      pusat: {
        badge: 'Kantor Pusat & Korespondensi',
        wilayah: 'DKI Jakarta & Nasional',
        nama: 'Kantor Pusat Jakarta Selatan',
        alamat: 'Jl. Hankam No. 5 RT.006 RW.001, Ragunan, Jakarta Selatan 12550 (Domisili) & Graha Arteri Mas Kav. 53 Kedoya, Jakarta Barat 11530 (Operasional)',
        telp: 'Telp: +62 21 7884 9996, 7884 8837 | WA Admin: 0851-1051-3157',
        picHtml: '<p class="text-white font-semibold">Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.) <button type="button" onclick="bukaModal(\\'modal-cv-nanang\\')" class="text-xs text-amber-300 hover:underline ml-1 font-normal">(Lihat CV Rekan)</button></p><p class="text-slate-300 text-xs mt-0.5">Pimpinan Rekan | Izin Penilai Publik: PB-1.09.00021</p>',
        emailHtml: '<a href="mailto:nanang_kjpp@yahoo.co.id" class="font-semibold text-sky-400 hover:text-sky-300 hover:underline">nanang_kjpp@yahoo.co.id</a> <span class="text-slate-500">/</span> <a href="mailto:kjppnrr.bd@gmail.com" class="text-slate-300 hover:text-sky-300 hover:underline">kjppnrr.bd@gmail.com</a>',
        mapUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3965.9206413855!2d106.8099!3d-6.3112!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e69ed4e4f6b5a3f%3A0x1a2b3c4d5e6f7a8b!2sGraha%20Arteri%20Mas%20Kav.%2053%20Kedoya%20Jakarta%20Barat!5e0!3m2!1sid!2sid!4v1699000000000!5m2!1sid!2sid',
        directMapUrl: 'https://maps.google.com/?q=Graha+Arteri+Mas+Kav+53+Kedoya+Jakarta+Barat',
        directMapUrl2: 'https://maps.google.com/?q=Jl+Hankam+No+5+Ragunan+Jakarta+Selatan',
        wa: ''
      },`;

const NEW_DATA_PUSAT = `      pusat: {
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

if (html.includes(OLD_DATA_PUSAT)) {
  html = html.replace(OLD_DATA_PUSAT, NEW_DATA_PUSAT);
  console.log('✓ DATA_KANTOR_NSR.pusat updated');
} else {
  console.warn('OLD_DATA_PUSAT not found directly');
}

// 3. Bandung & Palembang mapUrl to www.google.com
html = html.replace(
  `mapUrl: 'https://maps.google.com/maps?q=-6.8597817207843175,107.56042889556781&output=embed&hl=id&z=17',`,
  `mapUrl: 'https://www.google.com/maps?q=-6.8597817207843175,107.56042889556781&hl=id&z=17&output=embed',`
);
html = html.replace(
  `mapUrl: 'https://maps.google.com/maps?q=-2.929043950869521,104.69598062620024&output=embed&hl=id&z=17',`,
  `mapUrl: 'https://www.google.com/maps?q=-2.929043950869521,104.69598062620024&hl=id&z=17&output=embed',`
);

// 4. Update pilihKantorPeta to dynamic update wrap-btn-gmaps & desc-fallback-gmaps
const OLD_PILIH = `      // Update fallback "Buka di Google Maps" button
      const elBtnGmaps = document.getElementById('btn-buka-gmaps');
      if (elBtnGmaps && data.directMapUrl) {
        elBtnGmaps.href = data.directMapUrl;
      }`;

const NEW_PILIH = `      // Update fallback Google Maps button(s)
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

if (html.includes(OLD_PILIH)) {
  html = html.replace(OLD_PILIH, NEW_PILIH);
  console.log('✓ pilihKantorPeta updated');
} else {
  console.warn('OLD_PILIH not found directly');
}

// 5. Initial static HTML for Jakarta address card
const OLD_INITIAL_ALAMAT = `<p id="kantor-aktif-alamat" class="mt-0.5 text-slate-200 leading-relaxed text-xs sm:text-sm">
                    Jl. Hankam No. 5 RT.006 RW.001, Kel. Ragunan, Kec. Pasar Minggu, Jakarta Selatan 12550 (Domisili Hukum)<br><span class="text-amber-300 font-semibold">Kantor Operasional:</span> Graha Arteri Mas Kav. 53, Jl. Panjang No. 68, Kedoya Selatan, Kebon Jeruk, Jakarta Barat 11530
                  </p>`;

const NEW_INITIAL_ALAMAT = `<div id="kantor-aktif-alamat" class="mt-0.5 text-slate-200 leading-relaxed text-xs sm:text-sm">
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

if (html.includes(OLD_INITIAL_ALAMAT)) {
  html = html.replace(OLD_INITIAL_ALAMAT, NEW_INITIAL_ALAMAT);
  console.log('✓ Initial static alamat updated');
} else {
  console.warn('OLD_INITIAL_ALAMAT not found');
}

fs.writeFileSync(file, html, 'utf8');
console.log('Done patching index.html!');
