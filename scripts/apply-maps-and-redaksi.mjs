import fs from 'fs';

const JAKARTA_MAP_EMBED = 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3965.7483758362544!2d106.82472507573177!3d-6.296766493692348!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e69f21f57989d67%3A0xc48ad150cf716fa5!2sJl.%20Hankam%20No.5%2C%20RT.6%2FRW.1%2C%20Ragunan%2C%20Kec.%20Ps.%20Minggu%2C%20Kota%20Jakarta%20Selatan%2C%20Daerah%20Khusus%20Ibukota%20Jakarta%2012550!5e0!3m2!1sid!2sid!4v1710000000000!5m2!1sid!2sid';
const JAKARTA_MAP_DIRECT = 'https://maps.google.com/?q=Jl.+Hankam+No.+5+Ragunan+Pasar+Minggu+Jakarta+Selatan';

// ==========================================
// 1. UPDATE INDEX.HTML
// ==========================================
let indexHtml = fs.readFileSync('index.html', 'utf8');

// Replace static iframe src & data-src in index.html
indexHtml = indexHtml.replace(
  /id="map-iframe-kantor"\s+src="[^"]*"\s+data-src="[^"]*"/,
  `id="map-iframe-kantor"\n              src="${JAKARTA_MAP_EMBED}"\n              data-src="${JAKARTA_MAP_EMBED}"`
);

// Replace fallback gmaps button and fallback link in index.html
indexHtml = indexHtml.replace(
  /id="btn-fallback-navigasi"\s+href="[^"]*"/,
  `id="btn-fallback-navigasi" href="${JAKARTA_MAP_DIRECT}"`
);
indexHtml = indexHtml.replace(
  /id="btn-buka-gmaps"\s+href="[^"]*"/,
  `id="btn-buka-gmaps" href="${JAKARTA_MAP_DIRECT}"`
);

// Replace static spotlight texts for Jakarta to match Image 2
indexHtml = indexHtml.replace(
  /<p id="kantor-aktif-alamat" class="mt-0.5 text-slate-200 leading-relaxed text-xs sm:text-sm">[\s\S]*?<\/p>/,
  `<p id="kantor-aktif-alamat" class="mt-0.5 text-slate-200 leading-relaxed text-xs sm:text-sm">\n                    Jl. Hankam No. 5 RT 006 RW 001, Kelurahan Ragunan, Kecamatan Pasar Minggu, Jakarta Selatan, DKI Jakarta 12550\n                  </p>`
);

indexHtml = indexHtml.replace(
  /<p id="map-fallback-alamat" class="text-\[11px\] text-slate-300 max-w-sm mt-1 leading-relaxed">[\s\S]*?<\/p>/,
  `<p id="map-fallback-alamat" class="text-[11px] text-slate-300 max-w-sm mt-1 leading-relaxed">Jl. Hankam No. 5 RT 006 RW 001, Kelurahan Ragunan, Kecamatan Pasar Minggu, Jakarta Selatan, DKI Jakarta 12550</p>`
);

indexHtml = indexHtml.replace(
  /<p id="kantor-aktif-telp" class="mt-0.5 text-slate-200 text-xs sm:text-sm">[\s\S]*?<\/p>/,
  `<p id="kantor-aktif-telp" class="mt-0.5 text-slate-200 text-xs sm:text-sm">\n                    Telp. (021)78849996, 78848837 | Fax. (021)78849997 | WA Admin: 0851-1051-3157\n                  </p>`
);

indexHtml = indexHtml.replace(
  /<div id="kantor-aktif-pic" class="mt-0.5 text-xs sm:text-sm">[\s\S]*?<\/div>/,
  `<div id="kantor-aktif-pic" class="mt-0.5 text-xs sm:text-sm">\n                    <p class="text-white font-semibold">Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.) <button type="button" onclick="bukaModal('modal-cv-nanang')" class="text-xs text-amber-300 hover:underline ml-1 font-normal cursor-pointer">(Lihat CV Rekan)</button></p><p class="text-slate-300 text-xs mt-0.5">Pimpinan Rekan | Izin PB-1.09.00021 &bull; Kompetensi: Penilai Publik (P)</p>\n                  </div>`
);

// Update DATA_KANTOR_NSR in index.html with exact redaksi and restored Jakarta map
const new_DATA_KANTOR_NSR = `const DATA_KANTOR_NSR = {
      pusat: {
        badge: 'Kantor Pusat & Korespondensi',
        wilayah: 'Jakarta Selatan &bull; DKI Jakarta',
        nama: 'Kantor Pusat Jakarta',
        alamat: 'Jl. Hankam No. 5 RT 006 RW 001, Kelurahan Ragunan, Kecamatan Pasar Minggu, Jakarta Selatan, DKI Jakarta 12550',
        telp: 'Telp. (021)78849996, 78848837 | Fax. (021)78849997 | WA Admin: 0851-1051-3157',
        picHtml: '<p class="text-white font-semibold">Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.) <button type="button" onclick="bukaModal(\\'modal-cv-nanang\\')" class="text-xs text-amber-300 hover:underline ml-1 font-normal cursor-pointer">(Lihat CV Rekan)</button></p><p class="text-slate-300 text-xs mt-0.5">Pimpinan Rekan | Izin PB-1.09.00021 &bull; Kompetensi: Penilai Publik (P)</p>',
        emailHtml: '<a href="mailto:nanang_kjpp@yahoo.co.id" class="font-semibold text-sky-400 hover:text-sky-300 hover:underline">nanang_kjpp@yahoo.co.id</a> <span class="text-slate-500">/</span> <a href="mailto:kjppnrr.bd@gmail.com" class="text-slate-300 hover:text-sky-300 hover:underline">kjppnrr.bd@gmail.com</a>',
        mapUrl: '${JAKARTA_MAP_EMBED}',
        directMapUrl: '${JAKARTA_MAP_DIRECT}',
        wa: '6285110513157'
      },
      bandung: {
        badge: 'Kantor Cabang Resmi',
        wilayah: 'Bandung &bull; Jawa Barat',
        nama: 'Kantor Cabang Bandung',
        alamat: 'Perumahan Pancanaka Royal Garden II, Jalan Pangrango II No. 1A RT.001 RW.012, Kel. Citeureup, Kec. Cimahi Utara, Kota Cimahi, Jawa Barat 40512.',
        telp: 'Telp/Fax: (022) 6622088 | WA Admin: 0851-1051-3157',
        picHtml: '<p class="text-white font-semibold">Deni Siswandi, S.T., MAPPI (Cert.) <button type="button" onclick="bukaModal(\\'modal-cv-deni\\')" class="text-xs text-amber-300 hover:underline ml-1 font-normal cursor-pointer">(Lihat CV Rekan)</button></p><p class="text-slate-300 text-xs mt-0.5">Pimpinan Cabang | Izin Cabang: No. 326/KM.1/2020 &bull; Kompetensi: Penilai Publik (P)</p><p class="text-slate-400 text-xs mt-0.5">PIC Operasional: Heru Kurnia (081320193535)</p>',
        emailHtml: '<a href="mailto:nsr.bdg1@gmail.com" class="font-semibold text-sky-400 hover:text-sky-300 hover:underline">nsr.bdg1@gmail.com</a>',
        mapUrl: 'https://www.google.com/maps?q=-6.8597817,107.5604289&hl=id&z=17&output=embed',
        directMapUrl: 'https://maps.google.com/?q=-6.8597817,107.5604289',
        wa: '6285110513157'
      },
      padang: {
        badge: 'Kantor Cabang Resmi',
        wilayah: 'Padang &bull; Sumatera Barat',
        nama: 'Kantor Cabang Padang',
        alamat: 'Jl. Parak Gadang VIII No. 19, Kel. Simpang Baru, Kec. Padang Timur, Kota Padang, Sumatera Barat',
        telp: 'Telp. (0751) 891 460 | Fax. (0751) 891 460 | WA Admin: 0851-1051-3157',
        picHtml: '<p class="text-white font-semibold">Hernita, S.Si., MAPPI (Cert.) <button type="button" onclick="bukaModal(\\'modal-cv-hernita\\')" class="text-xs text-amber-300 hover:underline ml-1 font-normal cursor-pointer">(Lihat CV Rekan)</button></p><p class="text-slate-300 text-xs mt-0.5">Pimpinan Cabang | Izin Cabang: No. 363/KM.1/2019 (Izin PS-1.15.00046) &bull; Kompetensi: Penilai Publik Properti Sederhana (PS)</p><p class="text-slate-400 text-xs mt-0.5">PIC Operasional: Rahmad Andika (082381365221)</p>',
        emailHtml: '<a href="mailto:padangkjppnsr@gmail.com" class="font-semibold text-sky-400 hover:text-sky-300 hover:underline">padangkjppnsr@gmail.com</a>',
        mapUrl: 'https://www.google.com/maps?q=-0.94932,100.376055&hl=id&z=17&output=embed',
        directMapUrl: 'https://maps.google.com/?q=-0.94932,100.376055',
        wa: '6285110513157'
      },
      makassar: {
        badge: 'Kantor Cabang Resmi',
        wilayah: 'Makassar &bull; Sulawesi Selatan',
        nama: 'Kantor Cabang Makassar',
        alamat: 'Jalan Danau Mahalona No.102 RT.000 RW.007, Kel.Tanjung Merdeka, Kec. Tamalate, Kota Makassar, Sulawesi Selatan',
        telp: 'Telp. (0411) 839860 | Fax. (0411) 839860 | WA Admin: 0851-1051-3157',
        picHtml: '<p class="text-white font-semibold">Muhammad Amin Sade, S.M., MAPPI (Cert.) <button type="button" onclick="bukaModal(\\'modal-cv-amin\\')" class="text-xs text-amber-300 hover:underline ml-1 font-normal cursor-pointer">(Lihat CV Rekan)</button></p><p class="text-slate-300 text-xs mt-0.5">Pimpinan Cabang | Izin Cabang: No. 364/KM.1/2019 (Izin PS-1.16.00126) &bull; STTD OJK: KEP-1278/KS.13/2026 &bull; Kompetensi: Penilai Publik Properti Sederhana (PS)</p><p class="text-slate-400 text-xs mt-0.5">PIC Operasional: Wawan Kurniawan (085240622201)</p>',
        emailHtml: '<a href="mailto:kjpp.wawan@gmail.com" class="font-semibold text-sky-400 hover:text-sky-300 hover:underline">kjpp.wawan@gmail.com</a>',
        mapUrl: 'https://www.google.com/maps?q=-5.1872,119.4042&hl=id&z=17&output=embed',
        directMapUrl: 'https://maps.google.com/?q=Jl.+Danau+Mahalona+No.+102,+Tanjung+Merdeka,+Tamalate,+Makassar',
        wa: '6285110513157'
      },
      palembang: {
        badge: 'Kantor Cabang Resmi',
        wilayah: 'Palembang &bull; Sumatera Selatan',
        nama: 'Kantor Cabang Palembang',
        alamat: 'Komplek Griya Hero Abadi Maskarebet, Jl. Rosela 1 Blok BA 04, Kel. Talang Kelapa, Kec. Alang-alang Lebar, Kota Palembang, Sumatera Selatan',
        telp: 'Telp: Kantor Pusat (021) 7884 9996 / WA Admin: 0851-1051-3157',
        picHtml: '<p class="text-white font-semibold">Dharma Priyanto Sih Budi Susilo, S.T., MAPPI (Cert.) <button type="button" onclick="bukaModal(\\'modal-cv-dharma\\')" class="text-xs text-amber-300 hover:underline ml-1 font-normal cursor-pointer">(Lihat CV Rekan)</button></p><p class="text-slate-300 text-xs mt-0.5">Pimpinan Cabang | Izin Cabang: No. 230/KM.1/2022 (Izin PS-1.19.00249) &bull; Lisensi ATR/BPN: PP2.0031.23 &bull; STTD OJK: KEP-523/KS.13/2026 &bull; Kompetensi: Penilai Publik Properti Sederhana (PS)</p><p class="text-slate-400 text-xs mt-0.5">PIC Operasional: Rafdinal Ardhi (081368087781)</p>',
        emailHtml: '<a href="mailto:kjppnsrpalembang@gmail.com" class="font-semibold text-sky-400 hover:text-sky-300 hover:underline">kjppnsrpalembang@gmail.com</a>',
        mapUrl: 'https://www.google.com/maps?q=-2.929044,104.695981&hl=id&z=17&output=embed',
        directMapUrl: 'https://maps.google.com/?q=-2.929044,104.695981',
        wa: '6285110513157'
      }
    };`;

indexHtml = indexHtml.replace(/const DATA_KANTOR_NSR = \{[\s\S]*?\n    \};/, new_DATA_KANTOR_NSR);

// Update setupMapLazyLoad fallback in index.html
indexHtml = indexHtml.replace(
  /https:\/\/www\.google\.com\/maps\?q=-6\.3056,106\.8208&hl=id&z=17&output=embed/g,
  JAKARTA_MAP_EMBED
);

fs.writeFileSync('index.html', indexHtml, 'utf8');
console.log('✓ index.html updated');

// ==========================================
// 2. UPDATE TIM-CABANG.HTML
// ==========================================
let timHtml = fs.readFileSync('tim-cabang.html', 'utf8');

// Update 5 Panels in tim-cabang.html to match Image 2
const newPanels = `<div id="panel-kantor-pusat" class="panel-kantor">
              <div class="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
                <div>
                  <span class="text-[10px] font-bold uppercase tracking-wider text-amber-400">Head Office</span>
                  <h3 class="text-xl font-black text-white">Kantor Pusat Jakarta</h3>
                </div>
                <span class="px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-bold">Kantor Pusat</span>
              </div>
              <div class="space-y-3 text-xs">
                <p class="text-slate-300"><strong>Kompetensi:</strong> Penilai Publik (P)</p>
                <p class="text-slate-300"><strong>Alamat Lengkap:</strong> Jl. Hankam No. 5 RT 006 RW 001, Kelurahan Ragunan, Kecamatan Pasar Minggu, Jakarta Selatan, DKI Jakarta 12550.</p>
                <p class="text-slate-300"><strong>Telepon &amp; Fax:</strong> Telp. (021)78849996, 78848837 | Fax. (021)78849997</p>
                <p class="text-slate-300"><strong>Email Resmi:</strong> nanang_kjpp@yahoo.co.id / kjppnrr.bd@gmail.com</p>
                <p class="text-slate-300"><strong>Pimpinan Rekan:</strong> Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.) (Izin PB-1.09.00021)</p>
                <p class="text-slate-300"><strong>Wilayah Penugasan:</strong> Seluruh Indonesia, Jabodetabek, Banten, dan Proyek Strategis Nasional.</p>
              </div>
            </div>

            <div id="panel-kantor-bandung" class="panel-kantor hidden">
              <div class="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
                <div>
                  <span class="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Branch Office</span>
                  <h3 class="text-xl font-black text-white">Kantor Cabang Bandung</h3>
                </div>
                <span class="px-2.5 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700 text-[11px] font-bold">Jawa Barat</span>
              </div>
              <div class="space-y-3 text-xs">
                <p class="text-slate-300"><strong>Kompetensi:</strong> Penilai Publik (P)</p>
                <p class="text-slate-300"><strong>Alamat Lengkap:</strong> Perumahan Pancanaka Royal Garden II, Jalan Pangrango II No. 1A RT.001 RW.012, Kel. Citeureup, Kec. Cimahi Utara, Kota Cimahi, Jawa Barat 40512.</p>
                <p class="text-slate-300"><strong>PIC Operasional:</strong> Heru Kurnia (081320193535)</p>
                <p class="text-slate-300"><strong>Telepon / Fax:</strong> (022) 6622088</p>
                <p class="text-slate-300"><strong>Email Resmi:</strong> nsr.bdg1@gmail.com</p>
                <p class="text-slate-300"><strong>Pimpinan Cabang:</strong> Deni Siswandi, S.T., MAPPI (Cert.) (Izin Cabang No. 326/KM.1/2020)</p>
                <p class="text-slate-300"><strong>Wilayah Penugasan:</strong> Seluruh Indonesia, Kota Bandung, Cimahi, Kab. Bandung, Bekasi, Karawang, Purwakarta, Cirebon, Sukabumi.</p>
              </div>
            </div>

            <div id="panel-kantor-padang" class="panel-kantor hidden">
              <div class="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
                <div>
                  <span class="text-[10px] font-bold uppercase tracking-wider text-sky-400">Branch Office</span>
                  <h3 class="text-xl font-black text-white">Kantor Cabang Padang</h3>
                </div>
                <span class="px-2.5 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700 text-[11px] font-bold">Sumatera Barat</span>
              </div>
              <div class="space-y-3 text-xs">
                <p class="text-slate-300"><strong>Kompetensi:</strong> Penilai Publik Properti Sederhana (PS)</p>
                <p class="text-slate-300"><strong>Alamat Lengkap:</strong> Jl. Parak Gadang VIII No. 19, Kel. Simpang Baru, Kec. Padang Timur, Kota Padang, Sumatera Barat.</p>
                <p class="text-slate-300"><strong>Telepon &amp; Fax:</strong> Telp. (0751) 891 460 | Fax. (0751) 891 460</p>
                <p class="text-slate-300"><strong>PIC Operasional:</strong> Rahmad Andika (082381365221)</p>
                <p class="text-slate-300"><strong>Email Resmi:</strong> padangkjppnsr@gmail.com</p>
                <p class="text-slate-300"><strong>Pimpinan Cabang:</strong> Hernita, S.Si., MAPPI (Cert.) (Izin No. 363/KM.1/2019 / Izin PS-1.15.00046)</p>
                <p class="text-slate-300"><strong>Wilayah Penugasan:</strong> Seluruh Indonesia, Sumatera Barat, Riau, Kepri, Jambi, Sumatera Utara, dan ruas Tol Trans Sumatera.</p>
              </div>
            </div>

            <div id="panel-kantor-makassar" class="panel-kantor hidden">
              <div class="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
                <div>
                  <span class="text-[10px] font-bold uppercase tracking-wider text-indigo-400">Branch Office</span>
                  <h3 class="text-xl font-black text-white">Kantor Cabang Makassar</h3>
                </div>
                <span class="px-2.5 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700 text-[11px] font-bold">Sulawesi Selatan</span>
              </div>
              <div class="space-y-3 text-xs">
                <p class="text-slate-300"><strong>Kompetensi:</strong> Penilai Publik Properti Sederhana (PS)</p>
                <p class="text-slate-300"><strong>Alamat Lengkap:</strong> Jalan Danau Mahalona No.102 RT.000 RW.007, Kel.Tanjung Merdeka, Kec. Tamalate, Kota Makassar, Sulawesi Selatan.</p>
                <p class="text-slate-300"><strong>Telepon &amp; Fax:</strong> Telp. (0411) 839860 | Fax. (0411) 839860</p>
                <p class="text-slate-300"><strong>PIC Operasional:</strong> Wawan Kurniawan (085240622201)</p>
                <p class="text-slate-300"><strong>Email Resmi:</strong> kjpp.wawan@gmail.com</p>
                <p class="text-slate-300"><strong>Pimpinan Cabang:</strong> Muhammad Amin Sade, S.M., MAPPI (Cert.) (Izin No. 364/KM.1/2019 / Izin PS-1.16.00126)</p>
                <p class="text-slate-300"><strong>Wilayah Penugasan:</strong> Seluruh Indonesia, Sulawesi Selatan, Sulawesi Tengah, Sulawesi Tenggara, Sulawesi Utara, Maluku, dan Papua.</p>
              </div>
            </div>

            <div id="panel-kantor-palembang" class="panel-kantor hidden">
              <div class="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
                <div>
                  <span class="text-[10px] font-bold uppercase tracking-wider text-amber-400">Branch Office</span>
                  <h3 class="text-xl font-black text-white">Kantor Cabang Palembang</h3>
                </div>
                <span class="px-2.5 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700 text-[11px] font-bold">Sumatera Selatan</span>
              </div>
              <div class="space-y-3 text-xs">
                <p class="text-slate-300"><strong>Kompetensi:</strong> Penilai Publik Properti Sederhana (PS)</p>
                <p class="text-slate-300"><strong>Alamat Lengkap:</strong> Komplek Griya Hero Abadi Maskarebet, Jl. Rosela 1 Blok BA 04, Kel. Talang Kelapa, Kec. Alang-alang Lebar, Kota Palembang, Sumatera Selatan.</p>
                <p class="text-slate-300"><strong>PIC Operasional:</strong> Rafdinal Ardhi (081368087781)</p>
                <p class="text-slate-300"><strong>Telepon / Kontak:</strong> Kantor Pusat (021) 7884 9996 / WA Admin: 0851-1051-3157</p>
                <p class="text-slate-300"><strong>Email Resmi:</strong> kjppnsrpalembang@gmail.com</p>
                <p class="text-slate-300"><strong>Pimpinan Cabang:</strong> Dharma Priyanto Sih Budi Susilo, S.T., MAPPI (Cert.) (Izin No. 230/KM.1/2022 / Izin PS-1.19.00249)</p>
                <p class="text-slate-300"><strong>Wilayah Penugasan:</strong> Seluruh Indonesia, Sumatera Selatan, Lampung, Bengkulu, Kep. Bangka Belitung.</p>
              </div>
            </div>`;

timHtml = timHtml.replace(/<div id="panel-kantor-pusat"[\s\S]*?<\/div>\s*<\/div>\s*<div class="mt-6 pt-5/, `${newPanels}\n\n            <div class="mt-6 pt-5`);

// Update Map Container in tim-cabang.html
const newTimMap = `<div class="lg:col-span-5 p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl flex flex-col justify-between">
            <div>
              <h4 id="cabang-map-label" class="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
                Peta Lokasi: Kantor Pusat Jakarta
              </h4>
              <div class="w-full h-64 rounded-xl overflow-hidden border border-slate-800 relative bg-slate-950">
                <iframe 
                  id="cabang-map-iframe"
                  src="${JAKARTA_MAP_EMBED}" 
                  class="w-full h-full border-0" 
                  allowfullscreen="" 
                  loading="lazy" 
                  referrerpolicy="no-referrer-when-downgrade"
                  title="Peta Lokasi Kantor Pusat KJPP NSR">
                </iframe>
              </div>
              <p id="cabang-map-alamat" class="text-[11px] text-slate-400 mt-3 leading-relaxed">
                Jl. Hankam No. 5 RT 006 RW 001, Kelurahan Ragunan, Kecamatan Pasar Minggu, Jakarta Selatan, DKI Jakarta 12550
              </p>
            </div>
            <div class="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
              <span class="text-[10px] text-slate-400">Google Maps Navigasi</span>
              <a id="cabang-map-btn" href="${JAKARTA_MAP_DIRECT}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-sm cursor-pointer">
                <svg class="w-3.5 h-3.5 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>
                Buka di Google Maps &nearr;
              </a>
            </div>
          </div>`;

timHtml = timHtml.replace(/<div class="lg:col-span-5 p-6 rounded-2xl bg-slate-900\/90 border border-slate-800 shadow-xl flex flex-col justify-between">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*<\/section>/, `${newTimMap}\n\n        </div>\n      </div>\n    </section>`);

// Update PETA_CABANG_NSR in tim-cabang.html
const new_PETA_CABANG_NSR = `const PETA_CABANG_NSR = {
      pusat: {
        nama: 'Kantor Pusat Jakarta',
        alamat: 'Jl. Hankam No. 5 RT 006 RW 001, Kelurahan Ragunan, Kecamatan Pasar Minggu, Jakarta Selatan, DKI Jakarta 12550',
        mapUrl: '${JAKARTA_MAP_EMBED}',
        directMapUrl: '${JAKARTA_MAP_DIRECT}'
      },
      bandung: {
        nama: 'Kantor Cabang Bandung',
        alamat: 'Perumahan Pancanaka Royal Garden II, Jalan Pangrango II No. 1A RT.001 RW.012, Kel. Citeureup, Kec. Cimahi Utara, Kota Cimahi, Jawa Barat 40512.',
        mapUrl: 'https://www.google.com/maps?q=-6.8597817,107.5604289&hl=id&z=17&output=embed',
        directMapUrl: 'https://maps.google.com/?q=-6.8597817,107.5604289'
      },
      padang: {
        nama: 'Kantor Cabang Padang',
        alamat: 'Jl. Parak Gadang VIII No. 19, Kel. Simpang Baru, Kec. Padang Timur, Kota Padang, Sumatera Barat',
        mapUrl: 'https://www.google.com/maps?q=-0.94932,100.376055&hl=id&z=17&output=embed',
        directMapUrl: 'https://maps.google.com/?q=-0.94932,100.376055'
      },
      makassar: {
        nama: 'Kantor Cabang Makassar',
        alamat: 'Jalan Danau Mahalona No.102 RT.000 RW.007, Kel.Tanjung Merdeka, Kec. Tamalate, Kota Makassar, Sulawesi Selatan',
        mapUrl: 'https://www.google.com/maps?q=-5.1872,119.4042&hl=id&z=17&output=embed',
        directMapUrl: 'https://maps.google.com/?q=Jl.+Danau+Mahalona+No.+102,+Tanjung+Merdeka,+Tamalate,+Makassar'
      },
      palembang: {
        nama: 'Kantor Cabang Palembang',
        alamat: 'Komplek Griya Hero Abadi Maskarebet, Jl. Rosela 1 Blok BA 04, Kel. Talang Kelapa, Kec. Alang-alang Lebar, Kota Palembang, Sumatera Selatan',
        mapUrl: 'https://www.google.com/maps?q=-2.929044,104.695981&hl=id&z=17&output=embed',
        directMapUrl: 'https://maps.google.com/?q=-2.929044,104.695981'
      }
    };`;

timHtml = timHtml.replace(/const PETA_CABANG_NSR = \{[\s\S]*?\n    \};/, new_PETA_CABANG_NSR);

fs.writeFileSync('tim-cabang.html', timHtml, 'utf8');
console.log('✓ tim-cabang.html updated');

// ==========================================
// 3. UPDATE COMPANY-PROFILE.HTML
// ==========================================
let cp = fs.readFileSync('company-profile.html', 'utf8');
cp = cp.replace(
  /<p class="text-slate-700">Jl\. Hankam No\. 5 RT\.006 RW\.001, Kel\. Ragunan, Kec\. Pasar Minggu, Jakarta Selatan 12550<\/p>/,
  `<p class="text-slate-700">Jl. Hankam No. 5 RT 006 RW 001, Kelurahan Ragunan, Kecamatan Pasar Minggu, Jakarta Selatan, DKI Jakarta 12550</p>`
);
cp = cp.replace(
  /<p class="text-slate-700">Jl\. Parak Gadang VIII No\. 19, Kel\. Simpang Haru, Kec\. Padang Timur, Kota Padang, Sumatera Barat 25123<\/p>/,
  `<p class="text-slate-700">Jl. Parak Gadang VIII No. 19, Kel. Simpang Baru, Kec. Padang Timur, Kota Padang, Sumatera Barat</p>`
);
cp = cp.replace(
  /<p class="text-slate-700">Jl\. Danau Mahalona No\. 102 RW\.007, Kel\. Tanjung Merdeka, Kec\. Tamalate, Kota Makassar, Sulawesi Selatan 90225<\/p>/,
  `<p class="text-slate-700">Jalan Danau Mahalona No.102 RT.000 RW.007, Kel.Tanjung Merdeka, Kec. Tamalate, Kota Makassar, Sulawesi Selatan</p>`
);
fs.writeFileSync('company-profile.html', cp, 'utf8');
console.log('✓ company-profile.html updated');
