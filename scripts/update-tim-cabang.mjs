import fs from 'fs';

const filePath = 'tim-cabang.html';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Remove "Pusat Nolap" badge on Jakarta card in tim-cabang.html
const oldBadge = '<span class="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold">Pusat Nolap</span>';
const newBadge = '<span class="px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-bold">Kantor Pusat</span>';

if (!content.includes(oldBadge)) {
  console.error('Could not find old badge');
} else {
  content = content.replace(oldBadge, newBadge);
  console.log('Replaced Pusat Nolap badge with Kantor Pusat badge');
}

// 2. Update panel-kantor-pusat details
const oldPusatDetails = `<p class="text-slate-300"><strong>Alamat Resmi Kantor Pusat:</strong> Jl. Hankam No. 5 RT.006 RW.001, Kel. Ragunan, Kec. Pasar Minggu, Jakarta Selatan, DKI Jakarta 12550.</p>
                <p class="text-slate-300"><strong>Telepon:</strong> (021) 7884-9996 / (021) 5835-7388</p>
                <p class="text-slate-300"><strong>Email Operasional:</strong> nanang_kjpp@yahoo.co.id / kjppnr.danny@gmail.com</p>
                <p class="text-slate-300"><strong>Pimpinan Rekan:</strong> Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)</p>
                <p class="text-slate-300"><strong>Wilayah Penugasan:</strong> Seluruh Indonesia, Jabodetabek, Banten, dan Proyek Strategis Nasional.</p>`;

const newPusatDetails = `<p class="text-slate-300"><strong>Alamat Resmi Kantor Pusat:</strong> Jl. Hankam No. 5 RT.006 RW.001, Kel. Ragunan, Kec. Pasar Minggu, Kota Jakarta Selatan, DKI Jakarta - 12550.</p>
                <p class="text-slate-300"><strong>Telepon &amp; Fax:</strong> (021) 7884 9996, 7884 8837 | Fax: (021) 7884 9997 | WA Admin: 0851-1051-3157</p>
                <p class="text-slate-300"><strong>Email Operasional:</strong> nanang_kjpp@yahoo.co.id / kjppnrr.bd@gmail.com</p>
                <p class="text-slate-300"><strong>Pimpinan Rekan:</strong> Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.) (Izin PB-1.09.00021)</p>
                <p class="text-slate-300"><strong>Klasifikasi Izin:</strong> Penilai Properti (P)</p>
                <p class="text-slate-300"><strong>Wilayah Penugasan:</strong> Seluruh Indonesia, Jabodetabek, Banten, dan Proyek Strategis Nasional.</p>`;

if (content.replace(/\r\n/g, '\n').includes(oldPusatDetails.replace(/\r\n/g, '\n'))) {
  // Replace using normalized line endings
  const isCRLF = content.includes('\r\n');
  const target = isCRLF ? oldPusatDetails.replace(/\n/g, '\r\n') : oldPusatDetails;
  const replacement = isCRLF ? newPusatDetails.replace(/\n/g, '\r\n') : newPusatDetails;
  content = content.replace(target, replacement);
  console.log('Updated panel-kantor-pusat details');
} else {
  console.error('Could not find oldPusatDetails');
}

// 3. Update panel-kantor-bandung details
const oldBdgDetails = `<p class="text-slate-300"><strong>Alamat Resmi:</strong> Perumahan Pancanaka Royal Garden II, Jl. Pangrango II No. 1A, Kel. Citeureup, Kec. Cimahi Utara, Kota Cimahi, Jawa Barat 40512.</p>
                <p class="text-slate-300"><strong>Telepon:</strong> (022) 6622088</p>
                <p class="text-slate-300"><strong>Pimpinan Cabang:</strong> Deni Siswandi, S.T., MAPPI (Cert.)</p>
                <p class="text-slate-300"><strong>Wilayah Penugasan:</strong> Seluruh Indonesia, Kota Bandung, Cimahi, Kab. Bandung, Bekasi, Karawang, Purwakarta, Cirebon, Sukabumi.</p>`;

const newBdgDetails = `<p class="text-slate-300"><strong>Alamat Resmi:</strong> Perumahan Pancanaka Royal Garden II, Jl. Pangrango II No. 1A RT.001 RW.012, Kel. Citeureup, Kec. Cimahi Utara, Kota Cimahi, Jawa Barat - 40512.</p>
                <p class="text-slate-300"><strong>Telepon / Fax:</strong> (022) 6622088 | WA Admin: 0851-1051-3157</p>
                <p class="text-slate-300"><strong>Email Operasional:</strong> nsr.bdg1@gmail.com</p>
                <p class="text-slate-300"><strong>Pimpinan Cabang:</strong> Deni Siswandi, S.T., MAPPI (Cert.) (Izin No. 326/KM.1/2020)</p>
                <p class="text-slate-300"><strong>Klasifikasi Izin:</strong> Penilai Properti (P)</p>
                <p class="text-slate-300"><strong>PIC Operasional:</strong> Heru Kurnia (+62 813-2019-3535)</p>
                <p class="text-slate-300"><strong>Wilayah Penugasan:</strong> Seluruh Indonesia, Kota Bandung, Cimahi, Kab. Bandung, Bekasi, Karawang, Purwakarta, Cirebon, Sukabumi.</p>`;

if (content.replace(/\r\n/g, '\n').includes(oldBdgDetails.replace(/\r\n/g, '\n'))) {
  const isCRLF = content.includes('\r\n');
  const target = isCRLF ? oldBdgDetails.replace(/\n/g, '\r\n') : oldBdgDetails;
  const replacement = isCRLF ? newBdgDetails.replace(/\n/g, '\r\n') : newBdgDetails;
  content = content.replace(target, replacement);
  console.log('Updated panel-kantor-bandung details');
} else {
  console.error('Could not find oldBdgDetails');
}

// 4. Update panel-kantor-padang details
const oldPdgDetails = `<p class="text-slate-300"><strong>Alamat Resmi:</strong> Jl. Parak Gadang VIII No. 19, Kel. Simpang Haru, Kec. Padang Timur, Kota Padang, Sumatera Barat 25123.</p>
                <p class="text-slate-300"><strong>Telepon:</strong> (0751) 891460</p>
                <p class="text-slate-300"><strong>Pimpinan Cabang:</strong> Hernita, S.Si., MAPPI (Cert.)</p>
                <p class="text-slate-300"><strong>Wilayah Penugasan:</strong> Seluruh Indonesia, Sumatera Barat, Riau, Kepri, Jambi, Sumatera Utara, dan ruas Tol Trans Sumatera.</p>`;

const newPdgDetails = `<p class="text-slate-300"><strong>Alamat Resmi:</strong> Jl. Parak Gadang VIII No. 19, Kel. Simpang Haru, Kec. Padang Timur, Kota Padang, Sumatera Barat - 25123.</p>
                <p class="text-slate-300"><strong>Telepon / Fax:</strong> (0751) 891460 | WA Admin: 0851-1051-3157</p>
                <p class="text-slate-300"><strong>Email Operasional:</strong> padangkjppnsr@gmail.com</p>
                <p class="text-slate-300"><strong>Pimpinan Cabang:</strong> Hernita, S.Si., MAPPI (Cert.) (Izin No. 363/KM.1/2019 / Izin PS-1.15.00046)</p>
                <p class="text-slate-300"><strong>Klasifikasi Izin:</strong> Properti Sederhana (PS)</p>
                <p class="text-slate-300"><strong>PIC Operasional:</strong> Rahmad Andika (+62 823-8136-5221)</p>
                <p class="text-slate-300"><strong>Wilayah Penugasan:</strong> Seluruh Indonesia, Sumatera Barat, Riau, Kepri, Jambi, Sumatera Utara, dan ruas Tol Trans Sumatera.</p>`;

if (content.replace(/\r\n/g, '\n').includes(oldPdgDetails.replace(/\r\n/g, '\n'))) {
  const isCRLF = content.includes('\r\n');
  const target = isCRLF ? oldPdgDetails.replace(/\n/g, '\r\n') : oldPdgDetails;
  const replacement = isCRLF ? newPdgDetails.replace(/\n/g, '\r\n') : newPdgDetails;
  content = content.replace(target, replacement);
  console.log('Updated panel-kantor-padang details');
} else {
  console.error('Could not find oldPdgDetails');
}

// 5. Update panel-kantor-makassar details (with new address)
const oldMksDetails = `<p class="text-slate-300"><strong>Alamat Resmi:</strong> Jl. Nuri Lr. 301 No. 7, Kel. Mariso, Kec. Mariso, Kota Makassar, Sulawesi Selatan 90126.</p>
                <p class="text-slate-300"><strong>Telepon:</strong> (0411) 839860</p>
                <p class="text-slate-300"><strong>Pimpinan Cabang:</strong> Muhammad Amin Sade, S.M., MAPPI (Cert.)</p>
                <p class="text-slate-300"><strong>Wilayah Penugasan:</strong> Seluruh Indonesia, Sulawesi Selatan, Sulawesi Tengah, Sulawesi Tenggara, Sulawesi Utara, Maluku, dan Papua.</p>`;

const newMksDetails = `<p class="text-slate-300"><strong>Alamat Resmi:</strong> Jl. Danau Mahalona No. 102 RW.007, Kel. Tanjung Merdeka, Kec. Tamalate, Kota Makassar, Sulawesi Selatan - 90225.</p>
                <p class="text-slate-300"><strong>Telepon / Fax:</strong> (0411) 839860 | WA Admin: 0851-1051-3157</p>
                <p class="text-slate-300"><strong>Email Operasional:</strong> kjpp.wawan@gmail.com</p>
                <p class="text-slate-300"><strong>Pimpinan Cabang:</strong> Muhammad Amin Sade, S.M., MAPPI (Cert.) (Izin No. 364/KM.1/2019 / Izin PS-1.16.00126)</p>
                <p class="text-slate-300"><strong>Klasifikasi Izin:</strong> Properti Sederhana (PS) | <strong>STTD OJK:</strong> KEP-1278/KS.13/2026</p>
                <p class="text-slate-300"><strong>PIC Operasional:</strong> Wawan Kurniawan (+62 852-4062-2201)</p>
                <p class="text-slate-300"><strong>Wilayah Penugasan:</strong> Seluruh Indonesia, Sulawesi Selatan, Sulawesi Tengah, Sulawesi Tenggara, Sulawesi Utara, Maluku, dan Papua.</p>`;

if (content.replace(/\r\n/g, '\n').includes(oldMksDetails.replace(/\r\n/g, '\n'))) {
  const isCRLF = content.includes('\r\n');
  const target = isCRLF ? oldMksDetails.replace(/\n/g, '\r\n') : oldMksDetails;
  const replacement = isCRLF ? newMksDetails.replace(/\n/g, '\r\n') : newMksDetails;
  content = content.replace(target, replacement);
  console.log('Updated panel-kantor-makassar details');
} else {
  console.error('Could not find oldMksDetails');
}

// 6. Update panel-kantor-palembang details
const oldPlbDetails = `<p class="text-slate-300"><strong>Alamat Resmi:</strong> Komplek Griya Hero Abadi Maskarebet Jl. Rosela 1 Blok BA 04, Kel. Talang Kelapa, Kec. Alang-alang Lebar, Kota Palembang, Sumatera Selatan 30151.</p>
                <p class="text-slate-300"><strong>Pimpinan Cabang:</strong> Dharma Priyanto Sih Budi Susilo, S.T., MAPPI (Cert.)</p>
                <p class="text-slate-300"><strong>Lisensi ATR/BPN:</strong> PP2.0031.23 | <strong>STTD OJK:</strong> KEP-523/KS.13/2026</p>
                <p class="text-slate-300"><strong>Wilayah Penugasan:</strong> Seluruh Indonesia, Sumatera Selatan, Lampung, Bengkulu, Kep. Bangka Belitung.</p>`;

const newPlbDetails = `<p class="text-slate-300"><strong>Alamat Resmi:</strong> Komplek Griya Hero Abadi Maskarebet Jl. Rosela 1 Blok BA 04, Kel. Talang Kelapa, Kec. Alang-alang Lebar, Kota Palembang, Sumatera Selatan - 30151.</p>
                <p class="text-slate-300"><strong>Telepon / Kontak:</strong> Kantor Pusat (021) 7884 9996 / WA Admin: 0851-1051-3157</p>
                <p class="text-slate-300"><strong>Email Operasional:</strong> kjppnsrpalembang@gmail.com</p>
                <p class="text-slate-300"><strong>Pimpinan Cabang:</strong> Dharma Priyanto Sih Budi Susilo, S.T., MAPPI (Cert.) (Izin No. 230/KM.1/2022 / Izin PS-1.19.00249)</p>
                <p class="text-slate-300"><strong>Klasifikasi Izin:</strong> Properti Sederhana (PS) | <strong>Lisensi ATR/BPN:</strong> PP2.0031.23 | <strong>STTD OJK:</strong> KEP-523/KS.13/2026</p>
                <p class="text-slate-300"><strong>PIC Operasional:</strong> Rafdinal Ardhi (+62 813-6808-7781)</p>
                <p class="text-slate-300"><strong>Wilayah Penugasan:</strong> Seluruh Indonesia, Sumatera Selatan, Lampung, Bengkulu, Kep. Bangka Belitung.</p>`;

if (content.replace(/\r\n/g, '\n').includes(oldPlbDetails.replace(/\r\n/g, '\n'))) {
  const isCRLF = content.includes('\r\n');
  const target = isCRLF ? oldPlbDetails.replace(/\n/g, '\r\n') : oldPlbDetails;
  const replacement = isCRLF ? newPlbDetails.replace(/\n/g, '\r\n') : newPlbDetails;
  content = content.replace(target, replacement);
  console.log('Updated panel-kantor-palembang details');
} else {
  console.error('Could not find oldPlbDetails');
}

// 7. Update Map Container in tim-cabang.html
const oldMapContainer = `<div class="lg:col-span-5 p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl">
            <h4 class="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
              Peta Lokasi Kantor Pusat Jakarta
            </h4>
            <div class="w-full h-64 rounded-xl overflow-hidden border border-slate-800 relative bg-slate-950">
              <iframe 
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3965.7483758362544!2d106.82472507573177!3d-6.296766493692348!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e69f21f57989d67%3A0xc48ad150cf716fa5!2sJl.%20Hankam%20No.5%2C%20RT.6%2FRW.1%2C%20Ragunan%2C%20Kec.%20Ps.%20Minggu%2C%20Kota%20Jakarta%20Selatan%2C%20Daerah%20Khusus%20Ibukota%20Jakarta%2012550!5e0!3m2!1sid!2sid!4v1710000000000!5m2!1sid!2sid" 
                class="w-full h-full border-0" 
                allowfullscreen="" 
                loading="lazy" 
                referrerpolicy="no-referrer-when-downgrade"
                title="Peta Lokasi Kantor Pusat KJPP NSR">
              </iframe>
            </div>
            <p class="text-[11px] text-slate-400 mt-3 leading-relaxed">
              Lokasi strategis dekat Koridor TB Simatupang &amp; Cilandak Commercial Estate, memudahkan koordinasi tatap muka dengan perbankan nasional.
            </p>
          </div>`;

const newMapContainer = `<div class="lg:col-span-5 p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl flex flex-col justify-between">
            <div>
              <h4 id="cabang-map-label" class="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
                Peta Lokasi: Kantor Pusat Jakarta
              </h4>
              <div class="w-full h-64 rounded-xl overflow-hidden border border-slate-800 relative bg-slate-950">
                <iframe 
                  id="cabang-map-iframe"
                  src="https://www.google.com/maps?q=-6.3056,106.8208&hl=id&z=17&output=embed" 
                  class="w-full h-full border-0" 
                  allowfullscreen="" 
                  loading="lazy" 
                  referrerpolicy="no-referrer-when-downgrade"
                  title="Peta Lokasi Kantor KJPP NSR">
                </iframe>
              </div>
              <p id="cabang-map-alamat" class="text-[11px] text-slate-400 mt-3 leading-relaxed">
                Jl. Hankam No. 5 RT.006 RW.001, Kel. Ragunan, Kec. Pasar Minggu, Kota Jakarta Selatan, DKI Jakarta - 12550
              </p>
            </div>
            <div class="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
              <span class="text-[10px] text-slate-400">Google Maps Navigasi</span>
              <a id="cabang-map-btn" href="https://maps.google.com/?q=Jl.+Hankam+No.+5,+Ragunan,+Pasar+Minggu,+Jakarta+Selatan" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-sm cursor-pointer">
                <svg class="w-3.5 h-3.5 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>
                Buka di Google Maps &nearr;
              </a>
            </div>
          </div>`;

if (content.replace(/\r\n/g, '\n').includes(oldMapContainer.replace(/\r\n/g, '\n'))) {
  const isCRLF = content.includes('\r\n');
  const target = isCRLF ? oldMapContainer.replace(/\n/g, '\r\n') : oldMapContainer;
  const replacement = isCRLF ? newMapContainer.replace(/\n/g, '\r\n') : newMapContainer;
  content = content.replace(target, replacement);
  console.log('Updated Map Container in Section 3');
} else {
  console.error('Could not find oldMapContainer');
}

// 8. Update pilihKantor function in tim-cabang.html script
const oldPilihKantor = `function pilihKantor(id, btn) {
      document.querySelectorAll('.panel-kantor').forEach(p => p.classList.add('hidden'));
      const activePanel = document.getElementById('panel-kantor-' + id);
      if (activePanel) activePanel.classList.remove('hidden');

      document.querySelectorAll('.btn-kantor').forEach(b => {
        b.className = 'btn-kantor px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 text-slate-300 border border-slate-700 hover:bg-slate-800 transition';
      });
      if (btn) {
        btn.className = 'btn-kantor px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white border border-amber-400/60 shadow-lg transition';
      }
    }`;

const newPilihKantor = `const PETA_CABANG_NSR = {
      pusat: {
        nama: 'Kantor Pusat Jakarta',
        alamat: 'Jl. Hankam No. 5 RT.006 RW.001, Kel. Ragunan, Kec. Pasar Minggu, Kota Jakarta Selatan, DKI Jakarta - 12550',
        mapUrl: 'https://www.google.com/maps?q=-6.3056,106.8208&hl=id&z=17&output=embed',
        directMapUrl: 'https://maps.google.com/?q=Jl.+Hankam+No.+5,+Ragunan,+Pasar+Minggu,+Jakarta+Selatan'
      },
      bandung: {
        nama: 'Kantor Cabang Bandung',
        alamat: 'Perumahan Pancanaka Royal Garden II, Jl. Pangrango II No. 1A RT.001 RW.012, Kel. Citeureup, Kec. Cimahi Utara, Kota Cimahi, Jawa Barat - 40512',
        mapUrl: 'https://www.google.com/maps?q=-6.8597817,107.5604289&hl=id&z=17&output=embed',
        directMapUrl: 'https://maps.google.com/?q=-6.8597817,107.5604289'
      },
      padang: {
        nama: 'Kantor Cabang Padang',
        alamat: 'Jl. Parak Gadang VIII No. 19, Kel. Simpang Haru, Kec. Padang Timur, Kota Padang, Sumatera Barat - 25123',
        mapUrl: 'https://www.google.com/maps?q=-0.94932,100.376055&hl=id&z=17&output=embed',
        directMapUrl: 'https://maps.google.com/?q=-0.94932,100.376055'
      },
      makassar: {
        nama: 'Kantor Cabang Makassar',
        alamat: 'Jl. Danau Mahalona No. 102 RW.007, Kel. Tanjung Merdeka, Kec. Tamalate, Kota Makassar, Sulawesi Selatan - 90225',
        mapUrl: 'https://www.google.com/maps?q=-5.1872,119.4042&hl=id&z=17&output=embed',
        directMapUrl: 'https://maps.google.com/?q=Jl.+Danau+Mahalona+No.+102,+Tanjung+Merdeka,+Tamalate,+Makassar'
      },
      palembang: {
        nama: 'Kantor Cabang Palembang',
        alamat: 'Komplek Griya Hero Abadi Maskarebet Jl. Rosela 1 Blok BA 04, Kel. Talang Kelapa, Kec. Alang-alang Lebar, Kota Palembang, Sumatera Selatan - 30151',
        mapUrl: 'https://www.google.com/maps?q=-2.929044,104.695981&hl=id&z=17&output=embed',
        directMapUrl: 'https://maps.google.com/?q=-2.929044,104.695981'
      }
    };

    function pilihKantor(id, btn) {
      document.querySelectorAll('.panel-kantor').forEach(p => p.classList.add('hidden'));
      const activePanel = document.getElementById('panel-kantor-' + id);
      if (activePanel) activePanel.classList.remove('hidden');

      document.querySelectorAll('.btn-kantor').forEach(b => {
        b.className = 'btn-kantor px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 text-slate-300 border border-slate-700 hover:bg-slate-800 transition';
      });
      if (btn) {
        btn.className = 'btn-kantor px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white border border-amber-400/60 shadow-lg transition';
      }

      // Update Peta Dinamis Cabang
      const peta = PETA_CABANG_NSR[id];
      if (peta) {
        const elLabel = document.getElementById('cabang-map-label');
        const elIframe = document.getElementById('cabang-map-iframe');
        const elAlamat = document.getElementById('cabang-map-alamat');
        const elBtn = document.getElementById('cabang-map-btn');

        if (elLabel) elLabel.innerHTML = '<span class="w-2 h-2 rounded-full bg-emerald-400"></span> Peta Lokasi: ' + peta.nama;
        if (elIframe && elIframe.src !== peta.mapUrl) elIframe.src = peta.mapUrl;
        if (elAlamat) elAlamat.textContent = peta.alamat;
        if (elBtn) elBtn.href = peta.directMapUrl;
      }
    }`;

if (content.replace(/\r\n/g, '\n').includes(oldPilihKantor.replace(/\r\n/g, '\n'))) {
  const isCRLF = content.includes('\r\n');
  const target = isCRLF ? oldPilihKantor.replace(/\n/g, '\r\n') : oldPilihKantor;
  const replacement = isCRLF ? newPilihKantor.replace(/\n/g, '\r\n') : newPilihKantor;
  content = content.replace(target, replacement);
  console.log('Updated pilihKantor function in script');
} else {
  console.error('Could not find oldPilihKantor');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Finished updating tim-cabang.html');
