import fs from 'node:fs';
import path from 'node:path';

const htmlPath = path.resolve('portal-operasional.html');
const phpPath = path.resolve('operasional-data-handler.php');

let html = fs.readFileSync(htmlPath, 'utf8');
let php = fs.readFileSync(phpPath, 'utf8');

// =========================================================================
// 1. UPDATE portal-operasional.html PRINT METADATA
// =========================================================================
const printMetaTarget = `<tr><td class="font-semibold text-slate-600">Perihal / Penugasan</td><td id="print-meta-perihal">: -</td></tr>`;
const printMetaReplacement = `<tr><td class="font-semibold text-slate-600">Perihal / Penugasan</td><td id="print-meta-perihal">: -</td></tr>
          <tr><td class="font-semibold text-slate-600">Wilayah Survey</td><td id="print-meta-wilayah">: -</td></tr>
          <tr><td class="font-semibold text-slate-600">Ref. NoLap / SPK</td><td id="print-meta-nolap">: -</td></tr>`;

if (html.includes(printMetaTarget) && !html.includes('print-meta-wilayah')) {
  html = html.replace(printMetaTarget, printMetaReplacement);
  console.log('✓ Updated print metadata table with Wilayah & NoLap fields');
}

// =========================================================================
// 2. UPDATE portal-operasional.html JAVASCRIPT
// =========================================================================
// Find start of dynamic row helpers and replace up to cariIdPenugasan
const jsStartTarget = 'function tambahBarisPersonalSurvey() {';
const jsEndTarget = 'async function cariIdPenugasan() {';

const idxJsStart = html.indexOf(jsStartTarget);
const idxJsEnd = html.indexOf(jsEndTarget);

if (idxJsStart === -1 || idxJsEnd === -1) {
  console.error('Failed to locate JavaScript row helper functions in portal-operasional.html');
  process.exit(1);
}

const newJsHelpers = `// ==========================================================
    // MASTER TARIF RESMI ALLOWANCE SURVEY LAPANGAN NSR (2026.1)
    // ==========================================================
    const MASTER_TARIF_ALLOWANCE = {
      versi: "2026.1",
      tanggalBerlaku: "2026-01-01",
      zonasi: {
        JABODETABEK: {
          label: "Jabodetabek",
          rates: {
            PEMIMPIN_REKAN: 405000,
            USP_EXPERT: 270000,
            KADIV: 180000,
            REVIEWER: 150000,
            SURVEYOR: 110000,
            DRIVER: 70000
          }
        },
        JAWA_BARAT: {
          label: "Jawa Barat",
          rates: {
            PEMIMPIN_REKAN: 675000,
            USP_EXPERT: 450000,
            KADIV: 360000,
            REVIEWER: 260000,
            SURVEYOR: 220000,
            DRIVER: 160000
          }
        },
        WILAYAH_LAIN: {
          label: "Wilayah Lain",
          rates: {
            PEMIMPIN_REKAN: 900000,
            USP_EXPERT: 600000,
            KADIV: 580000,
            REVIEWER: 450000,
            SURVEYOR: 430000,
            DRIVER: 290000
          }
        }
      },
      khusus: {
        TRANSPORTASI_BANDARA: {
          label: "Transportasi Bandara",
          tarif: 570000,
          satuan: "Paket / Perjalanan"
        },
        RETAIL_FREELANCE: {
          label: "Retail per titik Freelance",
          tarif: 150000,
          satuan: "Titik"
        },
        RETAIL_TETAP: {
          label: "Retail per titik Tetap",
          tarif: 100000,
          satuan: "Titik"
        }
      }
    };

    function dapatkanTarifResmi(jabatanKey, wilayahKey) {
      if (MASTER_TARIF_ALLOWANCE.khusus[jabatanKey]) {
        return MASTER_TARIF_ALLOWANCE.khusus[jabatanKey].tarif;
      }
      const zona = MASTER_TARIF_ALLOWANCE.zonasi[wilayahKey] || MASTER_TARIF_ALLOWANCE.zonasi['JABODETABEK'];
      if (zona && zona.rates[jabatanKey] !== undefined) {
        return zona.rates[jabatanKey];
      }
      return 0;
    }

    function dapatkanSatuanResmi(jabatanKey) {
      if (jabatanKey === 'RETAIL_FREELANCE' || jabatanKey === 'RETAIL_TETAP') {
        return 'Titik';
      }
      return 'Hari';
    }

    // Dynamic Row Helpers: Tabel 1 (Biaya Personal)
    function tambahBarisPersonalSurvey(defaultJabatan = 'SURVEYOR', dataItem = null) {
      const tbody = document.getElementById('tbody-survey-personal');
      const tr = document.createElement('tr');
      const selWilayah = document.getElementById('survey_wilayah');
      const wilayahKey = selWilayah ? selWilayah.value : 'JABODETABEK';

      const initialJabatan = dataItem?.jabatan || defaultJabatan || 'SURVEYOR';
      const isManual = initialJabatan === 'MANUAL';
      const isRetail = initialJabatan === 'RETAIL_FREELANCE' || initialJabatan === 'RETAIL_TETAP';
      const initialSatuan = dataItem?.satuan || (isRetail ? 'Titik' : 'Hari');
      const initialTarif = dataItem?.tarif !== undefined ? dataItem.tarif : (isManual ? 0 : dapatkanTarifResmi(initialJabatan, wilayahKey));
      const initialPersonel = dataItem?.jumlahPersonel ?? dataItem?.personel ?? 1;
      const initialDurasi = dataItem?.durasi ?? dataItem?.hari ?? (dataItem?.volume ? dataItem.volume / initialPersonel : 1);
      const initialUraian = dataItem?.uraian || '';
      const initialAlasan = dataItem?.alasanManual || '';

      tr.dataset.isManual = isManual ? 'true' : 'false';
      tr.className = "hover:bg-slate-800/40 transition";

      tr.innerHTML = \`
        <td class="p-2 space-y-1">
          <select onchange="onJabatanPersonalChange(this)" class="w-full px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-100 font-semibold item-jabatan focus:outline-none focus:border-amber-400">
            <optgroup label="Standar Zonasi Wilayah">
              <option value="SURVEYOR" \${initialJabatan === 'SURVEYOR' ? 'selected' : ''}>Surveyor Lapangan</option>
              <option value="REVIEWER" \${initialJabatan === 'REVIEWER' ? 'selected' : ''}>Reviewer</option>
              <option value="KADIV" \${initialJabatan === 'KADIV' ? 'selected' : ''}>Kadiv</option>
              <option value="USP_EXPERT" \${initialJabatan === 'USP_EXPERT' ? 'selected' : ''}>USP / Expert</option>
              <option value="PEMIMPIN_REKAN" \${initialJabatan === 'PEMIMPIN_REKAN' ? 'selected' : ''}>Pemimpin Rekan</option>
              <option value="DRIVER" \${initialJabatan === 'DRIVER' ? 'selected' : ''}>Driver Operasional</option>
            </optgroup>
            <optgroup label="Tarif Khusus Retail">
              <option value="RETAIL_FREELANCE" \${initialJabatan === 'RETAIL_FREELANCE' ? 'selected' : ''}>Retail per titik Freelance (Rp 150.000)</option>
              <option value="RETAIL_TETAP" \${initialJabatan === 'RETAIL_TETAP' ? 'selected' : ''}>Retail per titik Tetap (Rp 100.000)</option>
            </optgroup>
            <optgroup label="Pengecualian / Lainnya">
              <option value="MANUAL" \${isManual ? 'selected' : ''}>Lainnya (Manual - Perlu Alasan Khusus)</option>
            </optgroup>
          </select>
          <div class="box-manual-details \${isManual ? '' : 'hidden'} space-y-1 pt-1">
            <input type="text" class="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 text-[11px] text-slate-200 item-nama-manual placeholder-slate-500" placeholder="Uraian kebutuhan personal..." value="\${initialUraian}" />
            <input type="text" class="w-full px-2 py-1 rounded bg-slate-900 border border-amber-500/50 text-[11px] text-amber-200 item-alasan-manual placeholder-slate-500" placeholder="Alasan pengecualian tarif (wajib diisi)..." value="\${initialAlasan}" />
          </div>
        </td>
        <td class="p-2 text-center">
          <input type="number" min="1" step="1" oninput="hitungSemuaTotal()" class="w-full px-1.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-center text-slate-100 font-mono item-personel" value="\${initialPersonel}" />
        </td>
        <td class="p-2 text-center">
          <input type="number" min="1" step="1" oninput="hitungSemuaTotal()" class="w-full px-1.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-center text-slate-100 font-mono item-durasi" value="\${initialDurasi}" />
        </td>
        <td class="p-2 text-center">
          <input type="text" readonly class="w-full px-1 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-center text-slate-300 item-satuan font-semibold" value="\${initialSatuan}" />
        </td>
        <td class="p-2 text-right">
          <input type="number" min="0" step="5000" oninput="hitungSemuaTotal()" \${isManual ? '' : 'readonly'}
            class="w-full px-2 py-1.5 rounded-lg \${isManual ? 'bg-slate-950 border border-amber-500/60 text-amber-300' : 'bg-slate-900 border border-slate-800 text-amber-300/90'} text-xs text-right font-mono item-tarif" value="\${initialTarif}" />
        </td>
        <td class="p-2 text-right font-mono font-bold text-slate-100 item-subtotal">Rp 0</td>
        <td class="p-2 text-center">
          <button type="button" onclick="hapusBaris(this)" class="p-1 rounded text-rose-400 hover:bg-rose-500/10 text-sm font-bold transition">✕</button>
        </td>
      \`;

      tbody.appendChild(tr);
      hitungSemuaTotal();
    }

    function onJabatanPersonalChange(selectEl) {
      const tr = selectEl.closest('tr');
      if (!tr) return;
      const jab = selectEl.value;
      const isManual = jab === 'MANUAL';
      const isRetail = jab === 'RETAIL_FREELANCE' || jab === 'RETAIL_TETAP';
      const selWilayah = document.getElementById('survey_wilayah');
      const wilayahKey = selWilayah ? selWilayah.value : 'JABODETABEK';

      tr.dataset.isManual = isManual ? 'true' : 'false';

      // Satuan
      const satEl = tr.querySelector('.item-satuan');
      if (satEl) {
        satEl.value = isRetail ? 'Titik' : 'Hari';
      }

      // Tarif Satuan
      const tarifEl = tr.querySelector('.item-tarif');
      if (tarifEl) {
        if (isManual) {
          tarifEl.removeAttribute('readonly');
          tarifEl.className = "w-full px-2 py-1.5 rounded-lg bg-slate-950 border border-amber-500/60 text-amber-300 text-xs text-right font-mono item-tarif";
        } else {
          tarifEl.setAttribute('readonly', 'true');
          tarifEl.className = "w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-amber-300/90 text-xs text-right font-mono item-tarif";
          tarifEl.value = dapatkanTarifResmi(jab, wilayahKey);
        }
      }

      // Manual details box
      const manualBox = tr.querySelector('.box-manual-details');
      if (manualBox) {
        if (isManual) manualBox.classList.remove('hidden');
        else manualBox.classList.add('hidden');
      }

      hitungSemuaTotal();
    }

    function tanganiPerubahanWilayah() {
      const selWilayah = document.getElementById('survey_wilayah');
      const wilayahKey = selWilayah ? selWilayah.value : 'JABODETABEK';

      // Perbarui tarif untuk setiap baris non-manual & non-retail
      document.querySelectorAll('#tbody-survey-personal tr').forEach(tr => {
        const jabSelect = tr.querySelector('.item-jabatan');
        const jab = jabSelect ? jabSelect.value : 'SURVEYOR';
        const isManual = jab === 'MANUAL';
        const isRetail = jab === 'RETAIL_FREELANCE' || jab === 'RETAIL_TETAP';

        if (!isManual && !isRetail) {
          const tarifEl = tr.querySelector('.item-tarif');
          if (tarifEl) {
            tarifEl.value = dapatkanTarifResmi(jab, wilayahKey);
          }
        }
      });

      const badge = document.getElementById('badge-konfirmasi-wilayah');
      if (badge) {
        badge.innerText = 'Zonasi: ' + (selWilayah ? selWilayah.options[selWilayah.selectedIndex].text.split('(')[0].trim() : wilayahKey);
        badge.className = 'px-2 py-0.5 rounded text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-500/30 font-mono';
      }

      hitungSemuaTotal();
    }

    // Dynamic Row Helpers: Tabel 2 (Biaya Kolektif)
    function tambahBarisTransportasiBandara() {
      const tbody = document.getElementById('tbody-survey-kolektif');
      const tr = document.createElement('tr');
      tr.dataset.kategori = 'TRANSPORTASI_BANDARA';
      tr.className = "hover:bg-slate-800/40 transition bg-sky-950/20";
      const tarifBaku = MASTER_TARIF_ALLOWANCE.khusus.TRANSPORTASI_BANDARA.tarif; // 570000

      tr.innerHTML = \`
        <td class="p-2 space-y-1">
          <div class="flex items-center gap-1.5 font-semibold text-slate-100 text-xs">
            <span class="text-sky-400">✈️</span>
            <input type="text" readonly class="bg-transparent border-0 text-white font-semibold text-xs item-nama w-full focus:outline-none" value="Transportasi Bandara" />
          </div>
          <span class="text-[10px] text-sky-300 block font-mono">Master Tarif Baku NSR: Rp 570.000 / satuan</span>
        </td>
        <td class="p-2 text-center">
          <input type="number" min="1" step="1" oninput="hitungSemuaTotal()" class="w-full px-1.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-center text-slate-100 font-mono item-volume" value="1" />
        </td>
        <td class="p-2 text-center">
          <select class="w-full px-1 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-center text-slate-200 item-satuan font-semibold">
            <option value="Paket">Paket</option>
            <option value="Perjalanan">Perjalanan</option>
            <option value="Mobil">Mobil</option>
          </select>
        </td>
        <td class="p-2 text-right">
          <input type="number" readonly class="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-right text-amber-300 font-mono item-tarif" value="\${tarifBaku}" />
        </td>
        <td class="p-2 text-right font-mono font-bold text-slate-100 item-subtotal">\${formatRupiah(tarifBaku)}</td>
        <td class="p-2 text-center">
          <button type="button" onclick="hapusBaris(this)" class="p-1 rounded text-rose-400 hover:bg-rose-500/10 text-sm font-bold transition">✕</button>
        </td>
      \`;

      tbody.appendChild(tr);
      hitungSemuaTotal();
    }

    function tambahBarisKolektifSurvey(dataItem = null) {
      const tbody = document.getElementById('tbody-survey-kolektif');
      const tr = document.createElement('tr');
      tr.className = "hover:bg-slate-800/40 transition";
      const initNama = dataItem?.uraian || '';
      const initVol = dataItem?.volume ?? 1;
      const initSat = dataItem?.satuan || 'Paket';
      const initTarif = dataItem?.tarif ?? 0;
      const initAlasan = dataItem?.alasan || '';

      tr.innerHTML = \`
        <td class="p-2 space-y-1">
          <input type="text" class="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-100 item-nama placeholder-slate-500" placeholder="Uraian biaya armada/kolektif (mis: BBM, Tol, Sewa Kendaraan)..." value="\${initNama}" />
          <input type="text" class="w-full px-2 py-1 rounded bg-slate-900 border border-slate-800 text-[11px] text-slate-400 item-alasan placeholder-slate-600" placeholder="Keterangan / alasan kebutuhan..." value="\${initAlasan}" />
        </td>
        <td class="p-2 text-center">
          <input type="number" min="1" step="1" oninput="hitungSemuaTotal()" class="w-full px-1.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-center text-slate-100 font-mono item-volume" value="\${initVol}" />
        </td>
        <td class="p-2 text-center">
          <input type="text" class="w-full px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-center text-slate-200 item-satuan font-semibold" value="\${initSat}" />
        </td>
        <td class="p-2 text-right">
          <input type="number" min="0" step="10000" oninput="hitungSemuaTotal()" class="w-full px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-right text-amber-300 font-mono item-tarif" value="\${initTarif}" />
        </td>
        <td class="p-2 text-right font-mono font-bold text-slate-100 item-subtotal">Rp 0</td>
        <td class="p-2 text-center">
          <button type="button" onclick="hapusBaris(this)" class="p-1 rounded text-rose-400 hover:bg-rose-500/10 text-sm font-bold transition">✕</button>
        </td>
      \`;

      tbody.appendChild(tr);
      hitungSemuaTotal();
    }

    function tambahBarisMeeting() {
      const tbody = document.getElementById('tbody-meeting');
      const tr = document.createElement('tr');
      tr.innerHTML = \`
        <td class="p-2">
          <input type="text" class="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-200 item-nama" placeholder="Item biaya rapat..." />
        </td>
        <td class="p-2 text-center">
          <input type="number" min="0" step="1" oninput="hitungSemuaTotal()" class="w-full px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-center text-slate-200 item-volume" value="1" />
        </td>
        <td class="p-2 text-center">
          <input type="text" class="w-full px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-center text-slate-200 item-satuan" value="Paket" />
        </td>
        <td class="p-2 text-right">
          <input type="number" min="0" step="5000" oninput="hitungSemuaTotal()" class="w-full px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-right text-amber-300 font-mono item-tarif" value="0" />
        </td>
        <td class="p-2 text-right font-mono font-bold text-slate-200 item-subtotal">Rp 0</td>
        <td class="p-2 text-center">
          <button type="button" onclick="hapusBaris(this)" class="p-1 rounded text-rose-400 hover:bg-rose-500/10">✕</button>
        </td>
      \`;
      tbody.appendChild(tr);
      hitungSemuaTotal();
    }

    function tambahBarisUmum() {
      const tbody = document.getElementById('tbody-umum');
      const tr = document.createElement('tr');
      tr.innerHTML = \`
        <td class="p-2">
          <input type="text" class="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-200 item-nama" placeholder="Deskripsi barang / jasa..." />
        </td>
        <td class="p-2 text-center">
          <input type="number" min="0" step="1" oninput="hitungSemuaTotal()" class="w-full px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-center text-slate-200 item-volume" value="1" />
        </td>
        <td class="p-2 text-center">
          <input type="text" class="w-full px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-center text-slate-200 item-satuan" value="Unit" />
        </td>
        <td class="p-2 text-right">
          <input type="number" min="0" step="1000" oninput="hitungSemuaTotal()" class="w-full px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-right text-amber-300 font-mono item-tarif" value="0" />
        </td>
        <td class="p-2 text-right font-mono font-bold text-slate-200 item-subtotal">Rp 0</td>
        <td class="p-2 text-center">
          <button type="button" onclick="hapusBaris(this)" class="p-1 rounded text-rose-400 hover:bg-rose-500/10">✕</button>
        </td>
      \`;
      tbody.appendChild(tr);
      hitungSemuaTotal();
    }

    function hapusBaris(btn) {
      const row = btn.closest('tr');
      if (row) {
        row.remove();
        hitungSemuaTotal();
      }
    }

    // Kalkulasi Real-Time Seluruh Total Biaya & Terbilang
    function hitungSemuaTotal() {
      let grandTotal = 0;

      if (JENIS_AKTIF === 'OPR-SRV') {
        let subPersonal = 0;
        document.querySelectorAll('#tbody-survey-personal tr').forEach(tr => {
          const personel = Math.max(0, parseFloat(tr.querySelector('.item-personel')?.value) || 0);
          const durasi = Math.max(0, parseFloat(tr.querySelector('.item-durasi')?.value) || 0);
          const trf = Math.max(0, parseFloat(tr.querySelector('.item-tarif')?.value) || 0);
          const sub = personel * durasi * trf;
          subPersonal += sub;
          const subEl = tr.querySelector('.item-subtotal');
          if (subEl) subEl.innerText = formatRupiah(sub);
        });
        const lblP = document.getElementById('label-subtotal-personal');
        if (lblP) lblP.innerText = formatRupiah(subPersonal);

        let subKolektif = 0;
        document.querySelectorAll('#tbody-survey-kolektif tr').forEach(tr => {
          const vol = Math.max(0, parseFloat(tr.querySelector('.item-volume')?.value) || 0);
          const trf = Math.max(0, parseFloat(tr.querySelector('.item-tarif')?.value) || 0);
          const sub = vol * trf;
          subKolektif += sub;
          const subEl = tr.querySelector('.item-subtotal');
          if (subEl) subEl.innerText = formatRupiah(sub);
        });
        const lblK = document.getElementById('label-subtotal-kolektif');
        if (lblK) lblK.innerText = formatRupiah(subKolektif);

        grandTotal = subPersonal + subKolektif;
      } else if (JENIS_AKTIF === 'OPR-MTG') {
        let subMeeting = 0;
        document.querySelectorAll('#tbody-meeting tr').forEach(tr => {
          const vol = Math.max(0, parseFloat(tr.querySelector('.item-volume')?.value) || 0);
          const trf = Math.max(0, parseFloat(tr.querySelector('.item-tarif')?.value) || 0);
          const sub = vol * trf;
          subMeeting += sub;
          const subEl = tr.querySelector('.item-subtotal');
          if (subEl) subEl.innerText = formatRupiah(sub);
        });
        grandTotal = subMeeting;
      } else {
        let subUmum = 0;
        document.querySelectorAll('#tbody-umum tr').forEach(tr => {
          const vol = Math.max(0, parseFloat(tr.querySelector('.item-volume')?.value) || 0);
          const trf = Math.max(0, parseFloat(tr.querySelector('.item-tarif')?.value) || 0);
          const sub = vol * trf;
          subUmum += sub;
          const subEl = tr.querySelector('.item-subtotal');
          if (subEl) subEl.innerText = formatRupiah(sub);
        });
        grandTotal = subUmum;
      }

      const lblG = document.getElementById('label-grand-total');
      if (lblG) lblG.innerText = formatRupiah(grandTotal);
      const lblT = document.getElementById('label-terbilang');
      if (lblT) lblT.innerText = \`"\${terbilangRupiah(grandTotal)}"\`;
    }

    // Helper Deteksi Wilayah dari Teks Lokasi Objek NoLap
    function deteksiWilayahDariLokasi(lokasiText) {
      if (!lokasiText || typeof lokasiText !== 'string') return null;
      const l = lokasiText.toLowerCase();

      // Kata kunci Jabodetabek (Diprioritaskan dari kategori Jawa Barat)
      const jabodetabekKeywords = [
        'jakarta', 'dki', 'jaksel', 'jakpus', 'jakbar', 'jaktim', 'jakut',
        'bogor', 'depok', 'tangerang', 'tangsel', 'bekasi',
        'kepulauan seribu', 'cibubur', 'cibinong', 'cikarang', 'karawaci', 'bsd', 'bintaro'
      ];
      for (const kw of jabodetabekKeywords) {
        if (l.includes(kw)) {
          return {
            wilayah: 'JABODETABEK',
            label: 'Jabodetabek',
            alasan: \`Terdeteksi wilayah Jabodetabek (\${kw.toUpperCase()})\`
          };
        }
      }

      // Kata kunci Jawa Barat (Di luar Jabodetabek)
      const jabarKeywords = [
        'jawa barat', 'jabar', 'bandung', 'cimahi', 'cirebon', 'sukabumi', 'cianjur',
        'tasikmalaya', 'garut', 'subang', 'purwakarta', 'karawang', 'indramayu',
        'majalengka', 'kuningan', 'ciamis', 'pangandaran', 'banjar', 'sumedang'
      ];
      for (const kw of jabarKeywords) {
        if (l.includes(kw)) {
          return {
            wilayah: 'JAWA_BARAT',
            label: 'Jawa Barat',
            alasan: \`Terdeteksi wilayah Jawa Barat (\${kw.toUpperCase()})\`
          };
        }
      }

      // Kata kunci Wilayah Lain di Indonesia
      const pulauAtauProvinsiLain = [
        'jawa tengah', 'jateng', 'jawa timur', 'jatim', 'semarang', 'surabaya', 'solo', 'jogja', 'yogyakarta',
        'sumatera', 'medan', 'palembang', 'padang', 'lampung', 'riau', 'pekanbaru', 'batam', 'aceh', 'jambi', 'bengkulu',
        'bali', 'denpasar', 'lombok', 'ntb', 'ntt', 'kupang',
        'kalimantan', 'pontianak', 'banjarmasin', 'balikpapan', 'samarinda',
        'sulawesi', 'makassar', 'manado', 'palu', 'kendari',
        'maluku', 'ambon', 'papua', 'jayapura'
      ];
      for (const kw of pulauAtauProvinsiLain) {
        if (l.includes(kw)) {
          return {
            wilayah: 'WILAYAH_LAIN',
            label: 'Wilayah Lain',
            alasan: \`Terdeteksi di luar Jabodetabek/Jabar (\${kw.toUpperCase()})\`
          };
        }
      }

      return null;
    }

    let REKOMENDASI_WILAYAH_NOLAP = null;

    function konfirmasiWilayahNoLap() {
      if (REKOMENDASI_WILAYAH_NOLAP) {
        const selWilayah = document.getElementById('survey_wilayah');
        if (selWilayah) {
          selWilayah.value = REKOMENDASI_WILAYAH_NOLAP.wilayah;
          tanganiPerubahanWilayah();
        }
        const badge = document.getElementById('badge-konfirmasi-wilayah');
        if (badge) {
          badge.innerText = 'Dikonfirmasi: ' + REKOMENDASI_WILAYAH_NOLAP.label;
          badge.className = 'px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono';
        }
        document.getElementById('box-rekomendasi-nolap').classList.add('hidden');
        alert(\`Zonasi berhasil dikonfirmasi sebagai: \${REKOMENDASI_WILAYAH_NOLAP.label}. Tarif satuan telah disesuaikan.\`);
      }
    }

    `;

html = html.substring(0, idxJsStart) + newJsHelpers + html.substring(idxJsEnd);
console.log('✓ Successfully updated JavaScript Helper & Master Tarif logic in portal-operasional.html');

// =========================================================================
// 3. UPDATE cariIdPenugasan to integrate NoLap location recommendation
// =========================================================================
const oldCariPenugasan = `document.getElementById('label-lookup-klien').innerText = item.namaKlien || '-';
          document.getElementById('label-lookup-objek').innerText = \`\${item.jenisObjek || ''} - \${item.lokasiObjek || ''}\`;
          box.classList.remove('hidden');`;

const newCariPenugasan = `document.getElementById('label-lookup-klien').innerText = item.namaKlien || '-';
          const fullLokasi = \`\${item.jenisObjek || ''} - \${item.lokasiObjek || ''}\`;
          document.getElementById('label-lookup-objek').innerText = fullLokasi;
          box.classList.remove('hidden');

          // Rekomendasi Wilayah Berdasarkan Lokasi Objek NoLap (Bukan Alamat Kantor Pusat)
          const deteksi = deteksiWilayahDariLokasi(item.lokasiObjek || '');
          const boxRekomendasi = document.getElementById('box-rekomendasi-nolap');
          const textRekomendasi = document.getElementById('text-rekomendasi-nolap');

          if (deteksi) {
            REKOMENDASI_WILAYAH_NOLAP = deteksi;
            const selWilayah = document.getElementById('survey_wilayah');
            if (selWilayah) {
              selWilayah.value = deteksi.wilayah;
              tanganiPerubahanWilayah();
            }
            if (boxRekomendasi && textRekomendasi) {
              textRekomendasi.innerHTML = \`Rekomendasi Zonasi NoLap: <strong>\${deteksi.label}</strong> (\${deteksi.alasan}). <em>Wajib konfirmasi pilihan Anda.</em>\`;
              boxRekomendasi.classList.remove('hidden');
            }
          } else {
            REKOMENDASI_WILAYAH_NOLAP = null;
            if (boxRekomendasi && textRekomendasi) {
              textRekomendasi.innerHTML = \`Lokasi NoLap belum spesifik. Silakan pilih <strong>Wilayah Zonasi Survey</strong> secara manual.\`;
              boxRekomendasi.classList.remove('hidden');
            }
          }`;

if (html.includes(oldCariPenugasan)) {
  html = html.replace(oldCariPenugasan, newCariPenugasan);
  console.log('✓ Successfully integrated NoLap location auto-recommendation');
}

// =========================================================================
// 4. UPDATE simpanPengajuan() for structured payload with master rates
// =========================================================================
const oldSimpanSurvey = `if (JENIS_AKTIF === 'OPR-SRV') {
        const biayaPersonal = [];
        document.querySelectorAll('#tbody-survey-personal tr').forEach(tr => {
          biayaPersonal.push({
            uraian: tr.querySelector('.item-nama')?.value || '',
            volume: parseFloat(tr.querySelector('.item-volume')?.value) || 0,
            satuan: tr.querySelector('.item-satuan')?.value || '',
            tarif: parseFloat(tr.querySelector('.item-tarif')?.value) || 0
          });
        });

        const biayaKolektif = [];
        document.querySelectorAll('#tbody-survey-kolektif tr').forEach(tr => {
          biayaKolektif.push({
            uraian: tr.querySelector('.item-nama')?.value || '',
            volume: parseFloat(tr.querySelector('.item-volume')?.value) || 0,
            satuan: tr.querySelector('.item-satuan')?.value || '',
            tarif: parseFloat(tr.querySelector('.item-tarif')?.value) || 0
          });
        });

        payload.survey = {
          idPenugasan: document.getElementById('label-lookup-id').innerText !== '-' ? document.getElementById('label-lookup-id').innerText : '',
          nomorLaporan: document.getElementById('label-lookup-nolap').innerText !== '-' ? document.getElementById('label-lookup-nolap').innerText : '',
          namaKlien: document.getElementById('label-lookup-klien').innerText !== '-' ? document.getElementById('label-lookup-klien').innerText : '',
          lokasiObjek: document.getElementById('label-lookup-objek').innerText !== '-' ? document.getElementById('label-lookup-objek').innerText : '',
          tglMulaiSurvey: document.getElementById('survey_tgl_mulai').value,
          tglSelesaiSurvey: document.getElementById('survey_tgl_selesai').value,
          daftarSurveyor: [document.getElementById('survey_daftar_surveyor').value],
          biayaPersonal: biayaPersonal,
          biayaKolektif: biayaKolektif
        };`;

const newSimpanSurvey = `if (JENIS_AKTIF === 'OPR-SRV') {
        const selWilayah = document.getElementById('survey_wilayah');
        const wilayahVal = selWilayah ? selWilayah.value : 'JABODETABEK';
        const wilayahLabel = selWilayah ? selWilayah.options[selWilayah.selectedIndex].text.split('(')[0].trim() : 'Jabodetabek';

        const biayaPersonal = [];
        document.querySelectorAll('#tbody-survey-personal tr').forEach(tr => {
          const selJabatan = tr.querySelector('.item-jabatan');
          const jab = selJabatan ? selJabatan.value : 'SURVEYOR';
          const isManual = jab === 'MANUAL';
          const jabLabel = selJabatan ? selJabatan.options[selJabatan.selectedIndex].text.split('(')[0].trim() : 'Surveyor Lapangan';
          const uraian = isManual ? (tr.querySelector('.item-nama-manual')?.value || 'Biaya Personal Manual') : \`Allowance \${jabLabel}\`;
          const personel = Math.max(0, parseInt(tr.querySelector('.item-personel')?.value) || 0);
          const durasi = Math.max(0, parseFloat(tr.querySelector('.item-durasi')?.value) || 0);
          const satuan = tr.querySelector('.item-satuan')?.value || 'Hari';
          const tarif = Math.max(0, parseFloat(tr.querySelector('.item-tarif')?.value) || 0);
          const alasan = isManual ? (tr.querySelector('.item-alasan-manual')?.value || '') : '';
          const subtotal = personel * durasi * tarif;

          biayaPersonal.push({
            jabatan: jab,
            jabatanLabel: jabLabel,
            uraian: uraian,
            jumlahPersonel: personel,
            durasi: durasi,
            volume: personel * durasi,
            satuan: satuan,
            tarif: tarif,
            total: subtotal,
            isManual: isManual,
            alasanManual: alasan
          });
        });

        const biayaKolektif = [];
        document.querySelectorAll('#tbody-survey-kolektif tr').forEach(tr => {
          const uraian = tr.querySelector('.item-nama')?.value || '';
          const vol = Math.max(0, parseFloat(tr.querySelector('.item-volume')?.value) || 0);
          const sat = tr.querySelector('.item-satuan')?.value || 'Paket';
          const trf = Math.max(0, parseFloat(tr.querySelector('.item-tarif')?.value) || 0);
          const isBandara = tr.dataset.kategori === 'TRANSPORTASI_BANDARA' || uraian.toLowerCase().includes('bandara');
          const alasan = tr.querySelector('.item-alasan')?.value || '';
          const subtotal = vol * trf;

          biayaKolektif.push({
            uraian: uraian,
            volume: vol,
            satuan: sat,
            tarif: trf,
            total: subtotal,
            isBandara: isBandara,
            alasan: alasan
          });
        });

        payload.survey = {
          wilayahSurvey: wilayahVal,
          wilayahSurveyLabel: wilayahLabel,
          idPenugasan: document.getElementById('label-lookup-id').innerText !== '-' ? document.getElementById('label-lookup-id').innerText : '',
          nomorLaporan: document.getElementById('label-lookup-nolap').innerText !== '-' ? document.getElementById('label-lookup-nolap').innerText : '',
          namaKlien: document.getElementById('label-lookup-klien').innerText !== '-' ? document.getElementById('label-lookup-klien').innerText : '',
          lokasiObjek: document.getElementById('label-lookup-objek').innerText !== '-' ? document.getElementById('label-lookup-objek').innerText : '',
          tglMulaiSurvey: document.getElementById('survey_tgl_mulai').value,
          tglSelesaiSurvey: document.getElementById('survey_tgl_selesai').value,
          daftarSurveyor: [document.getElementById('survey_daftar_surveyor').value],
          biayaPersonal: biayaPersonal,
          biayaKolektif: biayaKolektif,
          tarifSnapshot: {
            versi: '2026.1',
            wilayahSurvey: wilayahVal,
            timestamp: new Date().toISOString()
          }
        };`;

if (html.includes(oldSimpanSurvey)) {
  html = html.replace(oldSimpanSurvey, newSimpanSurvey);
  console.log('✓ Successfully updated simpanPengajuan() with allowance master rate payload');
}

// =========================================================================
// 5. UPDATE siapkanDanCetakDokumen() PRINT RENDERING
// =========================================================================
const oldPrintTableSurvey = `if (doc.jenisOperasional === 'OPR-SRV' && doc.survey) {
        if (doc.survey.biayaPersonal) {
          doc.survey.biayaPersonal.forEach(p => {
            const vol = p.volume ?? p.hari ?? p.qty ?? 1;
            const sat = p.satuan || 'Hari';
            const tarif = p.tarif ?? p.uangHarian ?? p.hargaSatuan ?? 0;
            const tot = p.total ?? p.nominal ?? (vol * tarif);
            rowsHtml += \`
              <tr>
                <td class="border border-slate-400 p-1 text-center">\${rowNum++}</td>
                <td class="border border-slate-400 p-1">\${p.uraian || p.nama || 'Biaya Personal'} (Personal)</td>
                <td class="border border-slate-400 p-1 text-center">\${vol}</td>
                <td class="border border-slate-400 p-1 text-center">\${sat}</td>
                <td class="border border-slate-400 p-1 text-right font-mono">\${formatRupiah(tarif)}</td>
                <td class="border border-slate-400 p-1 text-right font-mono font-bold">\${formatRupiah(tot)}</td>
              </tr>
            \`;
          });
        }`;

const newPrintTableSurvey = `if (doc.jenisOperasional === 'OPR-SRV' && doc.survey) {
        const elWilayah = document.getElementById('print-meta-wilayah');
        if (elWilayah) elWilayah.innerText = \`: \${doc.survey.wilayahSurveyLabel || doc.survey.wilayahSurvey || 'Jabodetabek'}\`;
        const elNolap = document.getElementById('print-meta-nolap');
        if (elNolap) elNolap.innerText = \`: \${doc.survey.idPenugasan || doc.survey.nomorLaporan || '-'}\`;

        if (doc.survey.biayaPersonal) {
          doc.survey.biayaPersonal.forEach(p => {
            const jmlPersonel = p.jumlahPersonel || 1;
            const durasi = p.durasi ?? p.volume ?? 1;
            const sat = p.satuan || 'Hari';
            const tarif = p.tarif ?? 0;
            const tot = p.total ?? (jmlPersonel * durasi * tarif);
            const labelRincian = \`\${p.uraian || 'Allowance'} (\${jmlPersonel} Personel &times; \${durasi} \${sat})\`;
            rowsHtml += \`
              <tr>
                <td class="border border-slate-400 p-1 text-center">\${rowNum++}</td>
                <td class="border border-slate-400 p-1">\${labelRincian}</td>
                <td class="border border-slate-400 p-1 text-center font-mono">\${jmlPersonel * durasi}</td>
                <td class="border border-slate-400 p-1 text-center">\${sat}</td>
                <td class="border border-slate-400 p-1 text-right font-mono">\${formatRupiah(tarif)}</td>
                <td class="border border-slate-400 p-1 text-right font-mono font-bold">\${formatRupiah(tot)}</td>
              </tr>
            \`;
          });
        }`;

if (html.includes(oldPrintTableSurvey)) {
  html = html.replace(oldPrintTableSurvey, newPrintTableSurvey);
  console.log('✓ Successfully updated print table rendering for survey allowance');
}

// =========================================================================
// 6. UPDATE DOMContentLoaded initial state (clean, no dummy values)
// =========================================================================
const oldDomInit = `renderAlurPreview();
      hitungSemuaTotal();
      periksaSesiLogin();`;

const newDomInit = `renderAlurPreview();
      // Inisialisasi baris awal allowance tanpa data contoh hardcoded
      tambahBarisPersonalSurvey('SURVEYOR');
      hitungSemuaTotal();
      periksaSesiLogin();`;

if (html.includes(oldDomInit)) {
  html = html.replace(oldDomInit, newDomInit);
  console.log('✓ Successfully updated DOMContentLoaded initialization');
}

fs.writeFileSync(htmlPath, html, 'utf8');

// =========================================================================
// 7. UPDATE PHP BACKEND (operasional-data-handler.php)
// =========================================================================
// Add Master Tarif Constant in PHP
const phpTargetSurveyStart = `if ($jenisOperasional === 'OPR-SRV') {`;
const idxPhpSurvey = php.indexOf(phpTargetSurveyStart);

if (idxPhpSurvey === -1) {
  console.error('Failed to find OPR-SRV handler in operasional-data-handler.php');
  process.exit(1);
}

// Find end of survey block
const phpTargetSurveyEnd = `} elseif ($jenisOperasional === 'OPR-MTG') {`;
const idxPhpSurveyEnd = php.indexOf(phpTargetSurveyEnd);

if (idxPhpSurveyEnd === -1) {
  console.error('Failed to find OPR-MTG boundary in operasional-data-handler.php');
  process.exit(1);
}

const newPhpSurveyBlock = `if ($jenisOperasional === 'OPR-SRV') {
            // Master Tarif Resmi Allowance NSR 2026
            $MASTER_TARIF_NSR = [
                'versi' => '2026.1',
                'tanggalBerlaku' => '2026-01-01',
                'zonasi' => [
                    'JABODETABEK' => [
                        'PEMIMPIN_REKAN' => 405000,
                        'USP_EXPERT'     => 270000,
                        'KADIV'          => 180000,
                        'REVIEWER'       => 150000,
                        'SURVEYOR'       => 110000,
                        'DRIVER'         => 70000,
                    ],
                    'JAWA_BARAT' => [
                        'PEMIMPIN_REKAN' => 675000,
                        'USP_EXPERT'     => 450000,
                        'KADIV'          => 360000,
                        'REVIEWER'       => 260000,
                        'SURVEYOR'       => 220000,
                        'DRIVER'         => 160000,
                    ],
                    'WILAYAH_LAIN' => [
                        'PEMIMPIN_REKAN' => 900000,
                        'USP_EXPERT'     => 600000,
                        'KADIV'          => 580000,
                        'REVIEWER'       => 450000,
                        'SURVEYOR'       => 430000,
                        'DRIVER'         => 290000,
                    ]
                ],
                'khusus' => [
                    'TRANSPORTASI_BANDARA' => 570000,
                    'RETAIL_FREELANCE'     => 150000,
                    'RETAIL_TETAP'         => 100000,
                ]
            ];

            $wilayahSurvey = strtoupper(trim($payload['survey']['wilayahSurvey'] ?? 'JABODETABEK'));
            if (!in_array($wilayahSurvey, ['JABODETABEK', 'JAWA_BARAT', 'WILAYAH_LAIN'], true)) {
                $wilayahSurvey = 'JABODETABEK';
            }

            $personal = $payload['survey']['biayaPersonal'] ?? [];
            $kolektif = $payload['survey']['biayaKolektif'] ?? [];
            $subPersonal = 0;
            $subKolektif = 0;
            $catatanAuditTarif = [];

            // Evaluasi & Rekalkulasi Biaya Personal Sesuai Master Tarif NSR
            foreach ($personal as &$pItem) {
                $jabatan = strtoupper(trim($pItem['jabatan'] ?? 'SURVEYOR'));
                $personel = max(1, (int)($pItem['jumlahPersonel'] ?? 1));
                $durasi = max(0, (float)($pItem['durasi'] ?? $pItem['volume'] ?? 1));
                $satuan = trim($pItem['satuan'] ?? 'Hari');
                $isManual = !empty($pItem['isManual']) || $jabatan === 'MANUAL';
                $alasanManual = trim($pItem['alasanManual'] ?? '');

                if ($personel < 0 || $durasi < 0) {
                    return ['success' => false, 'http_code' => 400, 'error' => 'Jumlah personel dan durasi allowance tidak boleh bernilai negatif.'];
                }

                // Hitung tarif resmi dari Master Data
                $tarifResmi = 0;
                if (isset($MASTER_TARIF_NSR['khusus'][$jabatan])) {
                    $tarifResmi = $MASTER_TARIF_NSR['khusus'][$jabatan];
                    $satuan = 'Titik';
                } elseif (isset($MASTER_TARIF_NSR['zonasi'][$wilayahSurvey][$jabatan])) {
                    $tarifResmi = $MASTER_TARIF_NSR['zonasi'][$wilayahSurvey][$jabatan];
                    $satuan = 'Hari';
                }

                if (!$isManual && $tarifResmi > 0) {
                    // Penegakan tarif server: jangan percaya kiriman browser
                    $trf = (float)$tarifResmi;
                } else {
                    // Manual rate: validasi otorisasi & alasan
                    $trf = (float)($pItem['tarif'] ?? 0);
                    if ($trf < 0) {
                        return ['success' => false, 'http_code' => 400, 'error' => 'Nomor tarif biaya personal tidak boleh negatif.'];
                    }
                    if ($trf !== (float)$tarifResmi) {
                        $catatanAuditTarif[] = "Pengecualian tarif manual [{$jabatan}]: Rp " . number_format($trf, 0, ',', '.') . " (Alasan: " . ($alasanManual ?: 'Penetapan khusus penugasan') . ")";
                    }
                }

                $tot = $personel * $durasi * $trf;
                $pItem['jumlahPersonel'] = $personel;
                $pItem['durasi']         = $durasi;
                $pItem['volume']         = $personel * $durasi;
                $pItem['satuan']         = $satuan;
                $pItem['tarif']          = $trf;
                $pItem['total']          = $tot;
                $subPersonal += $tot;
            }
            unset($pItem);

            // Evaluasi & Rekalkulasi Biaya Kolektif (Termasuk Transportasi Bandara)
            foreach ($kolektif as &$kItem) {
                $uraian = trim($kItem['uraian'] ?? '');
                $vol = max(0, (float)($kItem['volume'] ?? 1));
                $satuan = trim($kItem['satuan'] ?? 'Paket');
                $isBandara = !empty($kItem['isBandara']) || stripos($uraian, 'bandara') !== false;

                if ($vol < 0) {
                    return ['success' => false, 'http_code' => 400, 'error' => 'Volume biaya kolektif tidak boleh bernilai negatif.'];
                }

                if ($isBandara) {
                    // Master tarif baku Rp 570.000
                    $trf = 570000;
                    $uraian = 'Transportasi Bandara';
                } else {
                    $trf = (float)($kItem['tarif'] ?? 0);
                    if ($trf < 0) {
                        return ['success' => false, 'http_code' => 400, 'error' => 'Tarif biaya kolektif tidak boleh bernilai negatif.'];
                    }
                }

                $tot = $vol * $trf;
                $kItem['uraian'] = $uraian;
                $kItem['volume'] = $vol;
                $kItem['satuan'] = $satuan;
                $kItem['tarif']  = $trf;
                $kItem['total']  = $tot;
                $subKolektif += $tot;
            }
            unset($kItem);

            $totalEstimasi = $subPersonal + $subKolektif;
            $surveyData = [
                'wilayahSurvey'     => $wilayahSurvey,
                'wilayahSurveyLabel'=> $wilayahSurvey === 'JABODETABEK' ? 'Jabodetabek' : ($wilayahSurvey === 'JAWA_BARAT' ? 'Jawa Barat' : 'Wilayah Lain'),
                'idPenugasan'       => trim($payload['survey']['idPenugasan'] ?? ''),
                'nomorLaporan'      => trim($payload['survey']['nomorLaporan'] ?? ''),
                'namaKlien'         => trim($payload['survey']['namaKlien'] ?? ''),
                'lokasiObjek'       => trim($payload['survey']['lokasiObjek'] ?? ''),
                'tglMulaiSurvey'    => trim($payload['survey']['tglMulaiSurvey'] ?? $today),
                'tglSelesaiSurvey'  => trim($payload['survey']['tglSelesaiSurvey'] ?? $today),
                'daftarSurveyor'    => $payload['survey']['daftarSurveyor'] ?? [($currentUser['displayName'] ?? 'Holik Kelana')],
                'biayaPersonal'     => $personal,
                'biayaKolektif'     => $kolektif,
                'subtotalPersonal'  => $subPersonal,
                'subtotalKolektif'  => $subKolektif,
                'tarifSnapshot'     => [
                    'versi'           => '2026.1',
                    'tanggalBerlaku'  => '2026-01-01',
                    'wilayahSurvey'   => $wilayahSurvey,
                    'waktuPengajuan'  => $now,
                    'masterTarifZonasi' => $MASTER_TARIF_NSR['zonasi'][$wilayahSurvey] ?? [],
                    'tarifKhusus'     => $MASTER_TARIF_NSR['khusus'] ?? []
                ]
            ];`;

php = php.substring(0, idxPhpSurvey) + newPhpSurveyBlock + '\n        ' + php.substring(idxPhpSurveyEnd);
console.log('✓ Successfully updated PHP Backend Master Tarif verification & snapshot logic');

// Add audit trail logging for tarif exceptions in PHP if any
const phpAuditTarget = `$auditTrail = $existing['auditTrail'] ?? [];`;
const phpAuditReplacement = `$auditTrail = $existing['auditTrail'] ?? [];
        if (!empty($catatanAuditTarif)) {
            $auditTrail[] = [
                'timestamp'  => $now,
                'action'     => 'TARIF_EXCEPTION_RECORDED',
                'user'       => $currentUser['displayName'] ?? 'Petugas Pusat',
                'keterangan' => implode(' | ', $catatanAuditTarif)
            ];
        }`;

if (php.includes(phpAuditTarget) && !php.includes('TARIF_EXCEPTION_RECORDED')) {
  php = php.replace(phpAuditTarget, phpAuditReplacement);
  console.log('✓ Successfully added audit trail recording for tarif exceptions');
}

fs.writeFileSync(phpPath, php, 'utf8');
console.log('ALL UPDATES COMPLETE!');
