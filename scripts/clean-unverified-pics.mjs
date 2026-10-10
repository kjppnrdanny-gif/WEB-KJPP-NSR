import fs from 'node:fs';

const file = 'd:\\WEB KJPP NSR_Compro new ver\\kjpp-nsr-netlify-production\\index.html';
let html = fs.readFileSync(file, 'utf8');

// 1. Bandung Card
html = html.replace(
  `<p class="text-[11px] text-slate-400 ">PIC Cabang: Heru Kurnia &bull; <a href="https://wa.me/6281320193535" target="_blank" rel="noopener noreferrer" class="text-emerald-400 hover:underline font-medium">+62 813-2019-3535</a></p>`,
  `<p class="text-[11px] text-slate-400">Pimpinan Cabang Berizin Kemenkeu RI</p>`
);

// 2. Padang Card
html = html.replace(
  `<p class="text-[11px] text-slate-400 ">PIC Cabang: Rahmad Andika &bull; <a href="https://wa.me/6282381365221" target="_blank" rel="noopener noreferrer" class="text-sky-400 hover:underline font-medium">+62 823-8136-5221</a></p>`,
  `<p class="text-[11px] text-slate-400">Pimpinan Cabang Berizin Kemenkeu RI</p>`
);

// 3. Makassar Card
html = html.replace(
  `<p class="text-[11px] text-slate-400 ">PIC Cabang: Wawan Kurniawan &bull; <a href="https://wa.me/6285240622201" target="_blank" rel="noopener noreferrer" class="text-indigo-400 hover:underline font-medium">+62 852-4062-2201</a></p>`,
  `<p class="text-[11px] text-slate-400">Pimpinan Cabang Berizin Kemenkeu RI</p>`
);

// 4. Palembang Card
html = html.replace(
  `<p class="text-[11px] text-slate-400 ">PIC Cabang: Rafdinal Ardhi &bull; <a href="https://wa.me/6281368087781" target="_blank" rel="noopener noreferrer" class="text-amber-400 hover:underline font-medium">+62 813-6808-7781</a></p>`,
  `<p class="text-[11px] text-slate-400">Pimpinan Cabang Berizin Kemenkeu RI</p>`
);

// Palembang card phone: change from personal cell to official note
html = html.replace(
  `<p class="text-slate-200">PIC Operasional: +62 813-6808-7781</p>`,
  `<p class="text-slate-200">Layanan Cabang Palembang &bull; Hubungi Pusat: (021) 7884 9996</p>`
);

// 5. Warta Makassar line 5772
html = html.replace(
  `Pelayanan konsultasi penilaian properti dan koordinasi penugasan wilayah Indonesia Timur dikoordinasikan langsung melalui PIC Operasional Cabang: <strong>Wawan Kurniawan (+62 852-4062-2201)</strong>.`,
  `Pelayanan konsultasi penilaian properti dan koordinasi penugasan wilayah Indonesia Timur dikoordinasikan langsung melalui Kantor Cabang Makassar: <strong>Telp. (0411) 839860</strong> atau <strong>WA Admin: 0851-1051-3157</strong>.`
);

// 6. DATA_KANTOR_NSR in index.html
// Bandung
html = html.replace(
  `picHtml: '<p class="text-white font-semibold">Deni Siswandi, S.T. <button type="button" onclick="bukaModal(\\'modal-cv-deni\\')" class="text-xs text-amber-300 hover:underline ml-1 font-normal">(Lihat CV Rekan)</button></p><p class="text-emerald-400 text-xs mt-0.5">Izin Cabang: No. 326/KM.1/2020 (2 Juli 2020)</p><p class="text-slate-300 text-xs mt-0.5">PIC Operasional: Heru Kurnia (+62 813-2019-3535)</p>',`,
  `picHtml: '<p class="text-white font-semibold">Deni Siswandi, S.T., MAPPI (Cert.) <button type="button" onclick="bukaModal(\\'modal-cv-deni\\')" class="text-xs text-amber-300 hover:underline ml-1 font-normal">(Lihat CV Rekan)</button></p><p class="text-emerald-400 text-xs mt-0.5">Pimpinan Cabang | Izin Cabang: No. 326/KM.1/2020</p>',`
);

// Padang
html = html.replace(
  `picHtml: '<p class="text-white font-semibold">Hernita, S.Si. <button type="button" onclick="bukaModal(\\'modal-cv-hernita\\')" class="text-xs text-amber-300 hover:underline ml-1 font-normal">(Lihat CV Rekan)</button></p><p class="text-emerald-400 text-xs mt-0.5">Izin Cabang: No. 363/KM.1/2019 (15 Juli 2019)</p><p class="text-slate-300 text-xs mt-0.5">PIC Operasional: Rahmad Andika (+62 823-8136-5221)</p>',`,
  `picHtml: '<p class="text-white font-semibold">Hernita, S.Si., MAPPI (Cert.) <button type="button" onclick="bukaModal(\\'modal-cv-hernita\\')" class="text-xs text-amber-300 hover:underline ml-1 font-normal">(Lihat CV Rekan)</button></p><p class="text-emerald-400 text-xs mt-0.5">Pimpinan Cabang | Izin Cabang: No. 363/KM.1/2019</p>',`
);

// Makassar
html = html.replace(
  `picHtml: '<p class="text-white font-semibold">M. Amin Sade, S.M. <button type="button" onclick="bukaModal(\\'modal-cv-amin\\')" class="text-xs text-amber-300 hover:underline ml-1 font-normal">(Lihat CV Rekan)</button></p><p class="text-emerald-400 text-xs mt-0.5">Izin Cabang: No. 364/KM.1/2019 (15 Juli 2019) &bull; STTD OJK: KEP-1278/KS.13/2026</p><p class="text-slate-300 text-xs mt-0.5">PIC Operasional: Wawan Kurniawan (+62 852-4062-2201)</p>',`,
  `picHtml: '<p class="text-white font-semibold">Muhammad Amin Sade, S.M., MAPPI (Cert.) <button type="button" onclick="bukaModal(\\'modal-cv-amin\\')" class="text-xs text-amber-300 hover:underline ml-1 font-normal">(Lihat CV Rekan)</button></p><p class="text-emerald-400 text-xs mt-0.5">Pimpinan Cabang | Izin Cabang: No. 364/KM.1/2019 &bull; STTD OJK: KEP-1278/KS.13/2026</p>',`
);

// Palembang
html = html.replace(
  `telp: 'PIC Operasional: +62 813-6808-7781',`,
  `telp: 'Telp/Kontak: Kantor Pusat (021) 7884 9996 / WA Admin: 0851-1051-3157',`
);
html = html.replace(
  `picHtml: '<p class="text-white font-semibold">Dharma Priyanto, S.T. <button type="button" onclick="bukaModal(\\'modal-cv-dharma\\')" class="text-xs text-amber-300 hover:underline ml-1 font-normal">(Lihat CV Rekan)</button></p><p class="text-emerald-400 text-xs mt-0.5">Izin Cabang: No. 230/KM.1/2022 (8 Maret 2022) &bull; Lisensi ATR/BPN: PP2.0031.23</p><p class="text-slate-300 text-xs mt-0.5">PIC Operasional: Rafdinal Ardhi (+62 813-6808-7781)</p>',`,
  `picHtml: '<p class="text-white font-semibold">Dharma Priyanto Sih Budi Susilo, S.T., MAPPI (Cert.) <button type="button" onclick="bukaModal(\\'modal-cv-dharma\\')" class="text-xs text-amber-300 hover:underline ml-1 font-normal">(Lihat CV Rekan)</button></p><p class="text-emerald-400 text-xs mt-0.5">Pimpinan Cabang | Izin Cabang: No. 230/KM.1/2022 &bull; Lisensi ATR/BPN: PP2.0031.23 &bull; STTD OJK: KEP-523/KS.13/2026</p>',`
);

fs.writeFileSync(file, html, 'utf8');
console.log('✓ index.html: All unverified PIC names and cell numbers cleaned!');
