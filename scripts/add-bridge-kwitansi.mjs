import fs from 'fs';

const filePath = 'portal-kwitansi.html';
let raw = fs.readFileSync(filePath, 'utf8');
const isCrlf = raw.includes('\r\n');
let content = raw.replace(/\r\n/g, '\n');

const bridgeHtml = `          <!-- AUTO-POPULATE BRIDGE: TARIK DATA DARI PENUGASAN NSR (SPK / LINGKUP PENUGASAN) -->
          <div class="p-4 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950/30 border border-amber-400/40 shadow-xl space-y-3">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div class="flex items-center gap-2.5">
                <div class="w-8 h-8 rounded-xl bg-amber-400/20 border border-amber-400/40 text-amber-300 flex items-center justify-center font-black text-sm">
                  ⚡
                </div>
                <div>
                  <h4 class="text-xs sm:text-sm font-extrabold text-white flex items-center gap-2">
                    <span>Tarik Data Otomatis dari No. SPK / No. Lingkup Penugasan</span>
                    <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-400 text-slate-950">Auto-Populate Bridge</span>
                  </h4>
                  <p class="text-[11px] text-slate-400">Ketik No. SPK / No. Lingkup Penugasan / ID JO untuk sinkronisasi otomatis Klien, Keterangan Penugasan, dan Nilai Kontrak.</p>
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
                <input type="text" id="cari-spk-kwitansi-bridge" onkeydown="if(event.key==='Enter'){event.preventDefault();tarikDataPenugasanKwitansi();}" placeholder="Ketik No. SPK / No. Lingkup Penugasan (misal: 0416/NSR/PN-APP/X/2026 atau SPK/2026/099)..." class="w-full h-11 pl-9 pr-3 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 placeholder-slate-500 text-xs font-semibold focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition">
              </div>
              <button type="button" onclick="tarikDataPenugasanKwitansi()" id="btn-tarik-spk-kwitansi" class="h-11 px-5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg hover:shadow-amber-500/20 hover:scale-[1.01] transition cursor-pointer flex items-center justify-center gap-2 shrink-0">
                <svg class="w-4 h-4 text-slate-950" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                <span>Tarik Data</span>
              </button>
            </div>
            <div id="status-tarik-kwitansi" class="hidden text-xs rounded-xl p-3"></div>
          </div>
`;

const bridgeJs = `
    // ==========================================================
    // AUTO-POPULATE BRIDGE: TARIK DATA DARI PENUGASAN NSR (SPK / LINGKUP PENUGASAN)
    // ==========================================================
    const GAS_PENUGASAN_ENDPOINT = "https://script.google.com/macros/s/AKfycbwAq8vKXq8rbKgAtxUlSHkxWqqM7329UZyVtXTmEK0bcX7p9dyaidm7KCXG2iALwZ9d/exec";
    let cachedPenugasanKwitansiList = null;

    async function getPenugasanKwitansiDataset() {
      if (cachedPenugasanKwitansiList && cachedPenugasanKwitansiList.length > 0) {
        return cachedPenugasanKwitansiList;
      }
      let combined = [];

      try {
        const local = localStorage.getItem('NSR_PENUGASAN_DB');
        if (local) {
          const parsed = JSON.parse(local);
          if (Array.isArray(parsed)) combined = combined.concat(parsed);
        }
      } catch (e) {
        console.warn('Gagal membaca NSR_PENUGASAN_DB:', e);
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
        console.warn('Live fetch DB Penugasan tidak merespon:', err);
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
          Nama_Pemberi_Tugas: "PT BANK CONTOH NASIONAL TBK (SIMULASI)",
          pemberi_tugas_nama: "PT BANK CONTOH NASIONAL TBK (SIMULASI)",
          Alamat_Pemberi_Tugas: "Jl. P. Diponegoro No. 15 Medan, Kel. Petisah Tengah, Kec. Medan Petisah, Kota Medan, Sumatera Utara",
          Nama_Debitur_Utama: "PT SIMULASI DEBITUR PRIMA (CONTOH)",
          Tujuan_Penilaian: "Penjaminan Utang / Agunan Kredit",
          Biaya_Net_DPP: 35000000,
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
          Alamat_Pemberi_Tugas: "Jl. Jend. Sudirman Kav. 45-46, Jakarta Selatan",
          Nama_Debitur_Utama: "DEBITUR UJI COBA LIVE",
          Tujuan_Penilaian: "Penjaminan Utang / Agunan Kredit",
          Biaya_Net_DPP: 25000000,
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
      cachedPenugasanKwitansiList = unique;
      return unique;
    }

    async function tarikDataPenugasanKwitansi() {
      const inputEl = document.getElementById('cari-spk-kwitansi-bridge');
      const btnEl = document.getElementById('btn-tarik-spk-kwitansi');
      const statusEl = document.getElementById('status-tarik-kwitansi');
      if (!inputEl) return;

      const queryRaw = inputEl.value.trim();
      if (!queryRaw) {
        if (statusEl) {
          statusEl.className = 'p-3 rounded-xl bg-amber-950/80 border border-amber-500/50 text-amber-200 text-xs flex items-center gap-2';
          statusEl.innerHTML = '<span>⚠️ Masukkan No. SPK / No. Lingkup Penugasan / ID JO untuk menarik data.</span>';
          statusEl.classList.remove('hidden');
        }
        inputEl.focus();
        return;
      }

      const oriText = btnEl ? btnEl.innerHTML : '';
      if (btnEl) {
        btnEl.disabled = true;
        btnEl.innerHTML = '<svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-slate-950 inline" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path></svg> <span>Menarik Data...</span>';
      }

      try {
        const dataset = await getPenugasanKwitansiDataset();
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
            statusEl.innerHTML = '<div><span>❌ Penugasan tidak ditemukan untuk kata kunci: <strong>' + queryRaw + '</strong>. Pastikan penugasan telah disahkan di Portal Lingkup Penugasan.</span></div>' +
              '<button type="button" onclick="this.parentElement.classList.add(\\'hidden\\')" class="text-rose-300 font-bold hover:text-white">&times;</button>';
            statusEl.classList.remove('hidden');
          }
          return;
        }

        // Isi Kolom Kwitansi
        const noSpk = match.No_Lingkup_Penugasan || match.nomor_lp || match.No_Surat_Klien || match.rujukan_surat_nomor || '';
        const elNoSpk = document.getElementById('no-spk');
        if (elNoSpk) elNoSpk.value = noSpk;

        const elKlien = document.getElementById('identitas-klien');
        if (elKlien) {
          const namaKlien = match.Nama_Pemberi_Tugas || match.pemberi_tugas_nama || '';
          const alamatKlien = match.Alamat_Pemberi_Tugas || match.pemberi_tugas_alamat || '';
          elKlien.value = \`\${namaKlien}\${alamatKlien ? ', ' + alamatKlien : ''}\`;
        }

        const elKet = document.getElementById('keterangan-penugasan');
        if (elKet) {
          const deb = match.Nama_Debitur_Utama || match.debitur_nama || 'Debitur Proyek';
          const tujuan = match.Tujuan_Penilaian || match.tujuan_penilaian || 'Penilaian Properti';
          elKet.value = \`Biaya Penilaian Aset Properti: \${deb} (\${tujuan}), sesuai Surat Perintah Kerja (SPK) No. \${noSpk}\`;
        }

        // Nilai Kontrak SPK / Biaya Jasa (DPP)
        const feeDpp = Number(match.Biaya_Net_DPP || match.biaya_dpp || 0);
        if (feeDpp > 0) {
          const elKontrak = document.getElementById('nilai-kontrak-spk');
          const elHarga = document.getElementById('harga-dasar');
          if (elKontrak) elKontrak.value = feeDpp;
          if (elHarga) elHarga.value = feeDpp;
        }

        // Kantor Cabang
        if (match.Kantor_Wilayah) {
          const elCabang = document.getElementById('cabang-pengaju');
          if (elCabang) {
            for (let opt of elCabang.options) {
              if (match.Kantor_Wilayah.toLowerCase().includes(opt.value.toLowerCase()) || opt.value.toLowerCase().includes(match.Kantor_Wilayah.toLowerCase())) {
                elCabang.value = opt.value;
                break;
              }
            }
          }
        }

        if (typeof hitungKwitansi === 'function') hitungKwitansi();

        if (statusEl) {
          statusEl.className = 'p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-xs flex items-center justify-between gap-3 shadow-lg';
          statusEl.innerHTML = '<div class="flex items-center gap-2.5">' +
            '<span class="text-base">✅</span>' +
            '<div>' +
              '<div class="font-bold text-white">Data SPK Berhasil Ditarik! (' + noSpk + ')</div>' +
              '<div class="text-[11px] text-emerald-300 mt-0.5">Klien, Keterangan Penugasan, dan Nilai Kontrak Rp ' + (feeDpp ? feeDpp.toLocaleString('id-ID') : '0') + ' telah disinkronkan.</div>' +
            '</div>' +
          '</div>' +
          '<button type="button" onclick="this.parentElement.classList.add(\\'hidden\\')" class="px-2 py-1 rounded bg-emerald-900/50 hover:bg-emerald-800 text-emerald-200 font-bold text-xs transition">Tutup</button>';
          statusEl.classList.remove('hidden');
        }

        [elNoSpk, elKlien, elKet].forEach(el => {
          if (el) {
            el.classList.add('ring-2', 'ring-amber-400');
            setTimeout(() => el.classList.remove('ring-2', 'ring-amber-400'), 2500);
          }
        });

      } catch (err) {
        console.error('Error saat menarik data kwitansi:', err);
        if (statusEl) {
          statusEl.className = 'p-3 rounded-xl bg-rose-950/80 border border-rose-500/50 text-rose-200 text-xs flex items-center justify-between gap-2';
          statusEl.innerHTML = '<div><span>❌ Terjadi kesalahan: ' + err.message + '</span></div>' +
            '<button type="button" onclick="this.parentElement.classList.add(\\'hidden\\')" class="text-rose-300 font-bold">&times;</button>';
          statusEl.classList.remove('hidden');
        }
      } finally {
        if (btnEl) {
          btnEl.disabled = false;
          btnEl.innerHTML = oriText;
        }
      }
    }
`;

const targetHtml = `<form id="form-pengajuan-kwitansi" onsubmit="prosesSubmitPengajuan(event)" class="space-y-4">
          
          <!-- Baris 1: Cabang Pemohon & Tanggal -->`;

if (!content.includes(targetHtml)) {
  throw new Error('Target HTML not found in portal-kwitansi.html');
}

content = content.replace(targetHtml, `<form id="form-pengajuan-kwitansi" onsubmit="prosesSubmitPengajuan(event)" class="space-y-4">\n${bridgeHtml}\n          <!-- Baris 1: Cabang Pemohon & Tanggal -->`);

// Insert before the last </script> of the main code block (before line with privacy-consent)
const marker = 'function cetakPDFKwitansi() {';
const markerIdx = content.indexOf(marker);
if (markerIdx === -1) {
  throw new Error('Marker cetakPDFKwitansi not found in portal-kwitansi.html');
}
const nextScriptEnd = content.indexOf('</script>', markerIdx);
if (nextScriptEnd === -1) {
  throw new Error('End script after marker not found in portal-kwitansi.html');
}

content = content.slice(0, nextScriptEnd) + bridgeJs + '\n  ' + content.slice(nextScriptEnd);

if (isCrlf) {
  content = content.replace(/\n/g, '\r\n');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully updated portal-kwitansi.html with Auto-Populate Bridge!');
