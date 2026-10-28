import fs from 'fs';

const filePath = 'portal-nolap.html';
let content = fs.readFileSync(filePath, 'utf8');

// Detect line ending used in the document
const eol = content.includes('\r\n') ? '\r\n' : '\n';

const bridgeHtml = `          <!-- AUTO-POPULATE BRIDGE: TARIK DATA DARI PENUGASAN (SPK / LINGKUP PENUGASAN) -->
          <div class="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950/30 border border-amber-400/40 shadow-xl space-y-3">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div class="flex items-center gap-2.5">
                <div class="w-8 h-8 rounded-xl bg-amber-400/20 border border-amber-400/40 text-amber-300 flex items-center justify-center font-black text-sm">
                  ⚡
                </div>
                <div>
                  <h3 class="text-xs sm:text-sm font-extrabold text-white flex items-center gap-2">
                    <span>Tarik Data Otomatis dari Penugasan (Auto-Populate Bridge)</span>
                    <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-400 text-slate-950">SPI 103 &amp; SPI 204</span>
                  </h3>
                  <p class="text-[11px] text-slate-400">Ketik Nomor SPK / No. Lingkup Penugasan / ID JO untuk sinkronisasi otomatis Klien, Pengguna Laporan, Objek, dan Dasar Nilai.</p>
                </div>
              </div>
              <span class="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 self-start sm:self-auto">
                🔗 Single Source of Truth
              </span>
            </div>

            <div class="flex flex-col sm:flex-row gap-2 pt-1">
              <div class="relative flex-1">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 text-xs">
                  🔍
                </div>
                <input type="text" id="input_cari_spk_bridge" onkeydown="if(event.key==='Enter'){event.preventDefault();tarikDataDariPenugasan();}" placeholder="Ketik No. SPK / No. Lingkup Penugasan (misal: 0416/NSR/PN-APP/X/2026 atau SPK/2026/099)..." class="w-full h-11 pl-9 pr-3 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 placeholder-slate-500 text-xs font-semibold focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition">
              </div>
              <button type="button" onclick="tarikDataDariPenugasan()" id="btn_tarik_spk_bridge" class="h-11 px-5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg hover:shadow-amber-500/20 hover:scale-[1.01] transition cursor-pointer flex items-center justify-center gap-2 shrink-0">
                <svg class="w-4 h-4 text-slate-950" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                <span>Tarik Data</span>
              </button>
            </div>

            <!-- Status / Feedback Banner Tarik Data -->
            <div id="status_tarik_bridge" class="hidden text-xs rounded-xl p-3"></div>
          </div>
`.replace(/\r?\n/g, eol);

const bridgeJs = `
    // ==========================================================
    // AUTO-POPULATE BRIDGE: TARIK DATA DARI DB PENUGASAN (SPK / LINGKUP PENUGASAN)
    // ==========================================================
    const GAS_PENUGASAN_ENDPOINT = "https://script.google.com/macros/s/AKfycbwAq8vKXq8rbKgAtxUlSHkxWqqM7329UZyVtXTmEK0bcX7p9dyaidm7KCXG2iALwZ9d/exec";
    let cachedPenugasanList = null;

    async function getPenugasanDataset() {
      if (cachedPenugasanList && cachedPenugasanList.length > 0) {
        return cachedPenugasanList;
      }
      let combined = [];

      try {
        const local = localStorage.getItem('NSR_PENUGASAN_DB');
        if (local) {
          const parsed = JSON.parse(local);
          if (Array.isArray(parsed)) combined = combined.concat(parsed);
        }
      } catch (e) {
        console.warn('Gagal membaca NSR_PENUGASAN_DB lokal:', e);
      }

      try {
        const resp = await fetch(GAS_PENUGASAN_ENDPOINT, { method: 'GET', redirect: 'follow' });
        if (resp.ok) {
          const json = await resp.json();
          if (json && json.submissions && Array.isArray(json.submissions)) {
            combined = json.submissions.concat(combined);
          }
        }
      } catch (err) {
        console.warn('Live fetch DB Penugasan tidak merespon, menggunakan data cadangan:', err);
      }

      const seedPenugasan = [
        {
          id: "NSR-2026-0415",
          ID_Penugasan: "NSR-2026-0415",
          nomor_adm: "0415/JO/NSR/X/2026",
          No_Adm_JO: "0415/JO/NSR/X/2026",
          nomor_lp: "0415/NSR/PN-APP/X/2026",
          No_Lingkup_Penugasan: "0415/NSR/PN-APP/X/2026",
          rujukan_surat_nomor: "012/SPK-SIM/X/2026",
          No_Surat_Klien: "012/SPK-SIM/X/2026",
          rujukan_surat_tanggal: "2026-10-11",
          Tgl_Surat_Klien: "2026-10-11",
          Nama_Pemberi_Tugas: "PT BANK CONTOH NASIONAL TBK (SIMULASI)",
          pemberi_tugas_nama: "PT BANK CONTOH NASIONAL TBK (SIMULASI)",
          Bidang_Usaha_Klien: "Perbankan",
          NPWP_Klien: "01.000.000.0-000.000",
          pemberi_tugas_npwp: "01.000.000.0-000.000",
          PIC_Klien: "Divisi Kredit Komersial",
          pemberi_tugas_pic: "Divisi Kredit Komersial",
          Jabatan_PIC: "Pimpinan Bagian Agunan",
          Telp_PIC: "021-5000-8899",
          Alamat_Pemberi_Tugas: "Jl. P. Diponegoro No. 15 Medan, Kel. Petisah Tengah, Kec. Medan Petisah, Kota Medan, Sumatera Utara",
          pemberi_tugas_alamat: "Jl. P. Diponegoro No. 15 Medan, Kel. Petisah Tengah, Kec. Medan Petisah, Kota Medan, Sumatera Utara",
          Pengguna_Laporan_A: "PT BANK CONTOH NASIONAL TBK (SIMULASI)",
          Pengguna_Laporan_B: "-",
          Nama_Debitur_Utama: "PT SIMULASI DEBITUR PRIMA (CONTOH)",
          Nama_Pemilik_Sertipikat: "PT SIMULASI DEBITUR PRIMA (CONTOH)",
          Tujuan_Penilaian: "Penjaminan Utang / Agunan Kredit",
          Dasar_Nilai: "Nilai Pasar (Market Value)",
          Kantor_Wilayah: "Kantor Pusat Jakarta"
        },
        {
          id: "NSR-2026-0416",
          ID_Penugasan: "TEST-LIVE-1792033957082",
          nomor_adm: "0416/JO/NSR/X/2026",
          No_Adm_JO: 416,
          nomor_lp: "0416/NSR/PN-APP/X/2026",
          No_Lingkup_Penugasan: "0416/NSR/PN-APP/X/2026",
          rujukan_surat_nomor: "SPK/2026/099",
          No_Surat_Klien: "SPK/2026/099",
          Nama_Pemberi_Tugas: "PT SISTEM VALIDASI TESTING",
          pemberi_tugas_nama: "PT SISTEM VALIDASI TESTING",
          Bidang_Usaha_Klien: "Perbankan",
          Alamat_Pemberi_Tugas: "Jl. Jend. Sudirman Kav. 45-46, Jakarta Selatan",
          Pengguna_Laporan_A: "PT SISTEM VALIDASI TESTING",
          Pengguna_Laporan_B: "-",
          Nama_Debitur_Utama: "DEBITUR UJI COBA LIVE",
          Nama_Pemilik_Sertipikat: "DEBITUR UJI COBA LIVE",
          Tujuan_Penilaian: "Penjaminan Utang / Agunan Kredit",
          Dasar_Nilai: "Nilai Pasar (Market Value)",
          Kantor_Wilayah: "Kantor Pusat Jakarta"
        }
      ];

      combined = combined.concat(seedPenugasan);
      const seen = new Set();
      const unique = [];
      for (const item of combined) {
        const key = item.No_Lingkup_Penugasan || item.nomor_lp || item.ID_Penugasan || item.id || JSON.stringify(item);
        if (!seen.has(key)) {
          seen.add(key);
          unique.push(item);
        }
      }
      cachedPenugasanList = unique;
      return unique;
    }

    async function tarikDataDariPenugasan() {
      const inputEl = document.getElementById('input_cari_spk_bridge');
      const btnEl = document.getElementById('btn_tarik_spk_bridge');
      const statusEl = document.getElementById('status_tarik_bridge');
      if (!inputEl) return;

      const queryRaw = inputEl.value.trim();
      if (!queryRaw) {
        if (statusEl) {
          statusEl.className = 'p-3 rounded-xl bg-amber-950/80 border border-amber-500/50 text-amber-200 text-xs flex items-center gap-2';
          statusEl.innerHTML = '<span>⚠️ Mohon ketikkan Nomor SPK, Nomor Lingkup Penugasan, atau ID JO yang ingin ditarik.</span>';
          statusEl.classList.remove('hidden');
        }
        inputEl.focus();
        return;
      }

      const oriBtnText = btnEl ? btnEl.innerHTML : '';
      if (btnEl) {
        btnEl.disabled = true;
        btnEl.innerHTML = '<svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-slate-950 inline" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path></svg> <span>Menarik Data...</span>';
      }

      try {
        const dataset = await getPenugasanDataset();
        const qClean = queryRaw.toLowerCase().replace(/[\\\\/\\-\\s]/g, '');

        const match = dataset.find(p => {
          const lp = String(p.No_Lingkup_Penugasan || p.nomor_lp || '').toLowerCase();
          const adm = String(p.No_Adm_JO || p.nomor_adm || '').toLowerCase();
          const spk = String(p.No_Surat_Klien || p.rujukan_surat_nomor || '').toLowerCase();
          const id = String(p.ID_Penugasan || p.id || '').toLowerCase();
          const deb = String(p.Nama_Debitur_Utama || p.debitur_nama || '').toLowerCase();
          const klien = String(p.Nama_Pemberi_Tugas || p.pemberi_tugas_nama || '').toLowerCase();

          return lp.includes(queryRaw.toLowerCase()) ||
                 lp.replace(/[\\\\/\\-\\s]/g, '').includes(qClean) ||
                 adm.includes(queryRaw.toLowerCase()) ||
                 adm.replace(/[\\\\/\\-\\s]/g, '').includes(qClean) ||
                 spk.includes(queryRaw.toLowerCase()) ||
                 spk.replace(/[\\\\/\\-\\s]/g, '').includes(qClean) ||
                 id.includes(queryRaw.toLowerCase()) ||
                 deb.includes(queryRaw.toLowerCase()) ||
                 klien.includes(queryRaw.toLowerCase());
        });

        if (!match) {
          if (statusEl) {
            statusEl.className = 'p-3 rounded-xl bg-rose-950/80 border border-rose-500/50 text-rose-200 text-xs flex items-center justify-between gap-2';
            statusEl.innerHTML = '<div><span>❌ Data tidak ditemukan untuk kata kunci: <strong>' + queryRaw + '</strong>. Pastikan nomor penugasan telah diterbitkan di Portal Lingkup Penugasan.</span></div>' +
              '<button type="button" onclick="this.parentElement.classList.add(\\'hidden\\')" class="text-rose-300 font-bold hover:text-white">&times;</button>';
            statusEl.classList.remove('hidden');
          }
          return;
        }

        // 1. Entitas & Identitas Pemberi Tugas (Klien)
        const isPerorangan = (match.entitas_pemberi_tugas === 'Perorangan' ||
                             String(match.Bidang_Usaha_Klien || '').includes('Perorangan'));
        const radBadan = document.getElementById('entitas-badan');
        const radPerorangan = document.getElementById('entitas-perorangan');
        if (isPerorangan && radPerorangan) {
          radPerorangan.checked = true;
        } else if (radBadan) {
          radBadan.checked = true;
        }
        if (typeof toggleKlasifikasiEntitas === 'function') {
          toggleKlasifikasiEntitas();
        }

        const elKlien = document.getElementById('f-klien');
        if (elKlien) elKlien.value = match.Nama_Pemberi_Tugas || match.pemberi_tugas_nama || '';

        const elAlamatKlien = document.getElementById('f-alamat-klien');
        if (elAlamatKlien) elAlamatKlien.value = match.Alamat_Pemberi_Tugas || match.pemberi_tugas_alamat || '';

        const elNpwp = document.getElementById('f-npwp');
        if (elNpwp) elNpwp.value = match.NPWP_Klien || match.pemberi_tugas_npwp || '-';

        const elKontak = document.getElementById('f-kontak-klien');
        if (elKontak) {
          const pic = match.PIC_Klien || match.pemberi_tugas_pic || '';
          const telp = match.Telp_PIC || match.pemberi_tugas_kontak || '';
          elKontak.value = [pic, telp].filter(Boolean).join(' - ') || '-';
        }

        // 2. Pengguna Laporan Penilaian (SPI 103)
        const rawPenggunaA = match.Pengguna_Laporan_A || match.pengguna_laporan_a || (match.Nama_Pemberi_Tugas || match.pemberi_tugas_nama || '');
        let namaA = rawPenggunaA;
        let alamatA = '';
        if (rawPenggunaA.includes(', Alamat: ')) {
          const partsA = rawPenggunaA.split(', Alamat: ');
          namaA = partsA[0];
          alamatA = partsA.slice(1).join(', Alamat: ');
        } else if (match.pengguna_laporan_a_nama) {
          namaA = match.pengguna_laporan_a_nama;
          alamatA = match.pengguna_laporan_a_alamat || '';
        }
        const inpPenggunaANama = document.getElementById('input_pengguna_lap_a_nama');
        const inpPenggunaAAlamat = document.getElementById('input_pengguna_lap_a_alamat');
        if (inpPenggunaANama) inpPenggunaANama.value = namaA;
        if (inpPenggunaAAlamat) inpPenggunaAAlamat.value = alamatA;

        const rawPenggunaB = match.Pengguna_Laporan_B || match.pengguna_laporan_b || '';
        let namaB = '';
        let alamatB = '';
        if (rawPenggunaB && rawPenggunaB !== '-') {
          if (rawPenggunaB.includes(', Alamat: ')) {
            const partsB = rawPenggunaB.split(', Alamat: ');
            namaB = partsB[0];
            alamatB = partsB.slice(1).join(', Alamat: ');
          } else if (match.pengguna_laporan_b_nama) {
            namaB = match.pengguna_laporan_b_nama;
            alamatB = match.pengguna_laporan_b_alamat || '';
          } else {
            namaB = rawPenggunaB;
          }
        }
        const inpPenggunaBNama = document.getElementById('input_pengguna_lap_b_nama');
        const inpPenggunaBAlamat = document.getElementById('input_pengguna_lap_b_alamat');
        if (inpPenggunaBNama) inpPenggunaBNama.value = namaB;
        if (inpPenggunaBAlamat) inpPenggunaBAlamat.value = alamatB;

        // 3. Objek Penilaian
        const elPemilik = document.getElementById('f-pemilik-objek');
        if (elPemilik) elPemilik.value = match.Nama_Pemilik_Sertipikat || match.Nama_Debitur_Utama || match.debitur_nama || '';

        let objekList = [];
        try {
          if (match.Rincian_Objek_JSON) objekList = JSON.parse(match.Rincian_Objek_JSON);
          else if (match.objek_list) objekList = match.objek_list;
        } catch (e) {}

        if (Array.isArray(objekList) && objekList.length > 0) {
          const o1 = objekList[0];
          if (o1.jenis && document.getElementById('f-jenis-objek')) document.getElementById('f-jenis-objek').value = o1.jenis;
          if (o1.lokasi && document.getElementById('f-lokasi-objek')) document.getElementById('f-lokasi-objek').value = o1.lokasi;
          if (o1.luas_tanah && document.getElementById('f-luas-tanah')) document.getElementById('f-luas-tanah').value = o1.luas_tanah;
          if (o1.luas_bangunan && document.getElementById('f-luas-bangunan')) document.getElementById('f-luas-bangunan').value = o1.luas_bangunan;
        } else if (match.Alamat_Lokasi_Objek && document.getElementById('f-lokasi-objek')) {
          document.getElementById('f-lokasi-objek').value = match.Alamat_Lokasi_Objek;
        }

        // 4. Maksud, Tujuan & Dasar Nilai
        const rawTujuan = match.Tujuan_Penilaian || match.tujuan_penilaian || '';
        const elTujuan = document.getElementById('input_tujuan_penilaian');
        const isTanah = rawTujuan.includes('Pengadaan Tanah') || rawTujuan.includes('SPI 204');
        if (elTujuan) {
          if (isTanah) {
            elTujuan.value = 'Pengadaan Tanah';
          } else {
            let foundOption = false;
            for (let opt of elTujuan.options) {
              if (rawTujuan.toLowerCase().includes(opt.value.toLowerCase()) || opt.value.toLowerCase().includes(rawTujuan.toLowerCase())) {
                elTujuan.value = opt.value;
                foundOption = true;
                break;
              }
            }
            if (!foundOption) {
              elTujuan.value = 'LAINNYA';
              const customTujuan = document.getElementById('input_tujuan_penilaian_custom');
              if (customTujuan) {
                customTujuan.classList.remove('hidden');
                customTujuan.value = rawTujuan;
              }
            }
          }
          if (typeof onTujuanPenilaianChange === 'function') onTujuanPenilaianChange();
        }

        if (isTanah) {
          if (rawTujuan.includes('Skala Besar') || (match.skala_pengadaan_tanah && match.skala_pengadaan_tanah.includes('Besar'))) {
            const radBesar = document.getElementById('skala-besar');
            if (radBesar) radBesar.checked = true;
          } else if (rawTujuan.includes('Tanpa Tahapan') || (match.skala_pengadaan_tanah && match.skala_pengadaan_tanah.includes('Tanpa Tahapan'))) {
            const radTanpa = document.getElementById('skala-kecil-tanpa-tahapan');
            if (radTanpa) radTanpa.checked = true;
          } else {
            const radKecil = document.getElementById('skala-kecil-tahapan');
            if (radKecil) radKecil.checked = true;
          }
          if (typeof onKategoriSkalaTanahChange === 'function') onKategoriSkalaTanahChange();

          if (match.no_danom && document.getElementById('input_no_danom')) document.getElementById('input_no_danom').value = match.no_danom;
          if (match.no_penlok && document.getElementById('input_no_penlok')) document.getElementById('input_no_penlok').value = match.no_penlok;
          if (match.tgl_penlok && document.getElementById('input_tgl_penlok')) document.getElementById('input_tgl_penlok').value = match.tgl_penlok;
          if (match.kesesuaian_rtrw && document.getElementById('input_kesesuaian_rtrw')) document.getElementById('input_kesesuaian_rtrw').value = match.kesesuaian_rtrw;
        }

        const elDasar = document.getElementById('f-dasar-nilai');
        if (elDasar && match.Dasar_Nilai) {
          elDasar.value = match.Dasar_Nilai;
        }

        // 5. SPK & Tanggal
        const noSpk = match.No_Surat_Klien && match.No_Surat_Klien !== '-' ? match.No_Surat_Klien : (match.No_Lingkup_Penugasan || match.nomor_lp || '');
        const elNoSpk = document.getElementById('f-no-spk');
        if (elNoSpk) elNoSpk.value = noSpk;

        const tglSpk = match.Tgl_Surat_Klien || match.rujukan_surat_tanggal || match.Tgl_Dibuat || match.tanggal_surat;
        const elTglSpk = document.getElementById('f-tgl-spk');
        if (elTglSpk && tglSpk) {
          const d = new Date(tglSpk);
          if (!isNaN(d.getTime())) elTglSpk.value = d.toISOString().split('T')[0];
        }

        // 6. Penilai Rekan & Cabang Wilayah
        if (match.Rekan_Penilai_Publik) {
          const elPenilai = document.getElementById('f-penilai');
          if (elPenilai) {
            for (let opt of elPenilai.options) {
              if (match.Rekan_Penilai_Publik.includes(opt.value) || opt.value.includes(match.Rekan_Penilai_Publik)) {
                elPenilai.value = opt.value;
                break;
              }
            }
          }
        }
        if (match.Kantor_Wilayah) {
          const elCabang = document.getElementById('f-cabang');
          if (elCabang) {
            for (let opt of elCabang.options) {
              if (match.Kantor_Wilayah.toLowerCase().includes(opt.value.toLowerCase())) {
                elCabang.value = opt.value;
                break;
              }
            }
          }
        }

        if (typeof updateLivePreview === 'function') updateLivePreview();

        // 7. Visual Feedback Banner
        if (statusEl) {
          const noRefTampil = match.No_Lingkup_Penugasan || match.nomor_lp || match.No_Surat_Klien || match.ID_Penugasan;
          statusEl.className = 'p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-xs flex items-center justify-between gap-3 shadow-lg';
          statusEl.innerHTML = '<div class="flex items-center gap-2.5">' +
            '<span class="text-base">✅</span>' +
            '<div>' +
              '<div class="font-bold text-white">Data Penugasan Berhasil Ditarik! (' + noRefTampil + ')</div>' +
              '<div class="text-[11px] text-emerald-300 mt-0.5">Klien: <strong>' + (match.Nama_Pemberi_Tugas || match.pemberi_tugas_nama) + '</strong> | Pengguna Laporan, Objek &amp; SPK telah disinkronkan.</div>' +
            '</div>' +
          '</div>' +
          '<button type="button" onclick="this.parentElement.classList.add(\\'hidden\\')" class="px-2 py-1 rounded bg-emerald-900/50 hover:bg-emerald-800 text-emerald-200 font-bold text-xs transition">Tutup</button>';
          statusEl.classList.remove('hidden');
        }

        // Highlight visual feedback
        [elKlien, elAlamatKlien, inpPenggunaANama, elNoSpk].forEach(el => {
          if (el) {
            el.classList.add('ring-2', 'ring-amber-400');
            setTimeout(() => el.classList.remove('ring-2', 'ring-amber-400'), 2500);
          }
        });

      } catch (err) {
        console.error('Error saat menarik data penugasan:', err);
        if (statusEl) {
          statusEl.className = 'p-3 rounded-xl bg-rose-950/80 border border-rose-500/50 text-rose-200 text-xs flex items-center justify-between gap-2';
          statusEl.innerHTML = '<div><span>❌ Terjadi kesalahan: ' + err.message + '</span></div>' +
            '<button type="button" onclick="this.parentElement.classList.add(\\'hidden\\')" class="text-rose-300 font-bold">&times;</button>';
          statusEl.classList.remove('hidden');
        }
      } finally {
        if (btnEl) {
          btnEl.disabled = false;
          btnEl.innerHTML = oriBtnText;
        }
      }
    }
`.replace(/\r?\n/g, eol);

// 1. Insert HTML
const targetAnchor = `<div class="border-b border-slate-800 pb-4">` + eol +
`            <h3 class="text-base font-extrabold text-white flex items-center gap-2">` + eol +
`              <span class="w-6 h-6 rounded-md bg-amber-400 text-slate-950 flex items-center justify-center text-xs font-black">A</span>`;

const anchorPos = content.indexOf(targetAnchor);
if (anchorPos === -1) {
  throw new Error('Could not find targetAnchor in portal-nolap.html');
}

content = content.slice(0, anchorPos) + bridgeHtml + eol + '          ' + content.slice(anchorPos);

// 2. Fix privacy-consent script tag if needed
const privacyTagBroken = '<script src="lib/privacy-consent.js">' + eol;
const privacyTagFixed = '<script src="lib/privacy-consent.js"></script>' + eol + '  <script>' + eol;
if (content.includes(privacyTagBroken)) {
  content = content.replace(privacyTagBroken, privacyTagFixed);
}

// 3. Insert JS before the last </script>
const lastScriptEnd = content.lastIndexOf('</script>');
if (lastScriptEnd === -1) {
  throw new Error('Could not find lastScriptEnd in portal-nolap.html');
}

content = content.slice(0, lastScriptEnd) + bridgeJs + eol + '  ' + content.slice(lastScriptEnd);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Cleanly updated portal-nolap.html');
