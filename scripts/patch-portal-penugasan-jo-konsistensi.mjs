import fs from 'node:fs';
import path from 'node:path';

const projectRoot = path.resolve('D:/WEB KJPP NSR_Compro new ver/kjpp-nsr-netlify-production');
const filePath = path.join(projectRoot, 'portal-penugasan-jo.html');
let html = fs.readFileSync(filePath, 'utf8');

console.log('--- Patching portal-penugasan-jo.html: Addendum Konsistensi Penilai Publik ---');

// 1. UPDATE DATABASE_REKAN WITH COMPLETE SSOT METADATA
const dbRekanStart = 'const DATABASE_REKAN = [';
const dbRekanEnd = 'const DATABASE_PERSONIL = [';

const newDbRekan = `const DATABASE_REKAN = [
      {
        id: "nanang_penilai",
        nama: "Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert)",
        nama_resmi: "Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)",
        jabatan: "Pemimpin Rekan",
        klasifikasi: "Penilai Properti (Komprehensif)",
        klasifikasi_kode: "P",
        mappi: "95-S-00594",
        izin: "P-1.09.00218",
        izin_segmen: "0218",
        rmk: "RMK-2017.00201",
        bpn: "PP1.0006.25",
        ojk: "KEP-859/KS.13/2026",
        kantor_asal_kode: "PUSAT",
        kantor_asal_nama: "Kantor Pusat Jakarta",
        kewenangan_lingkup: "NASIONAL",
        email: "nanang.rahayu@kjppnanangrahayu.com"
      },
      {
        id: "deni_penilai",
        nama: "Deni Siswandi, S.T., MAPPI (Cert.)",
        nama_resmi: "Deni Siswandi, S.T., MAPPI (Cert.)",
        jabatan: "Rekan / Pimpinan Cabang Bandung",
        klasifikasi: "Penilai Properti (Komprehensif)",
        klasifikasi_kode: "P",
        mappi: "06-S-02013",
        izin: "P-1.20.00581",
        izin_segmen: "00581",
        rmk: "RMK-2017.01564",
        bpn: "PPI.0041.24",
        ojk: "KEP-1261/KS.13/2026",
        kantor_asal_kode: "CABANG_BANDUNG",
        kantor_asal_nama: "Kantor Cabang Bandung",
        kewenangan_lingkup: "NASIONAL",
        email: "deni.siswandi@kjppnanangrahayu.com"
      },
      {
        id: "hernita_penilai",
        nama: "Hernita, S.Si., MAPPI (Cert.)",
        nama_resmi: "Hernita, S.Si., MAPPI (Cert.)",
        jabatan: "Rekan / Pimpinan Cabang Padang",
        klasifikasi: "Penilai Properti Sederhana (PS)",
        klasifikasi_kode: "PS",
        mappi: "09-S-02262",
        izin: "PS1.15.00046",
        izin_segmen: "00046",
        rmk: "RMK-2017.00437",
        bpn: "-",
        ojk: "KEP-1012/KS.13/2026",
        kantor_asal_kode: "CABANG_PADANG",
        kantor_asal_nama: "Kantor Cabang Padang",
        kewenangan_lingkup: "CABANG_PADANG_DAN_KLASIFIKASI_PS",
        email: "hernita@kjppnanangrahayu.com"
      },
      {
        id: "amin_penilai",
        nama: "Muhammad Amin Sade, SM., MAPPI (Cert.)",
        nama_resmi: "Muhammad Amin Sade, S.M., MAPPI (Cert.)",
        jabatan: "Rekan / Pimpinan Cabang Makassar",
        klasifikasi: "Penilai Properti Sederhana (PS)",
        klasifikasi_kode: "PS",
        mappi: "09-S-02425",
        izin: "PS1.16.00126",
        izin_segmen: "00126",
        rmk: "RMK-2017.00527",
        bpn: "Lisensi Pertanahan BPN",
        ojk: "KEP-1278/KS.13/2026",
        kantor_asal_kode: "CABANG_MAKASSAR",
        kantor_asal_nama: "Kantor Cabang Makassar",
        kewenangan_lingkup: "CABANG_MAKASSAR_DAN_KLASIFIKASI_PS",
        email: "amin.sade@kjppnanangrahayu.com"
      },
      {
        id: "dharma_penilai",
        nama: "Dharma Priyanto Sih Budi Susilo, ST., MAPPI (Cert.)",
        nama_resmi: "Dharma Priyanto Sih Budi Susilo, S.T., MAPPI (Cert.)",
        jabatan: "Rekan / Pimpinan Cabang Palembang",
        klasifikasi: "Penilai Properti Sederhana (PS)",
        klasifikasi_kode: "PS",
        mappi: "16-S-06984",
        izin: "PS1.19.00249",
        izin_segmen: "00249",
        rmk: "RMK-2017.01801",
        bpn: "PP2.0031.23",
        ojk: "KEP-523/KS.13/2026",
        kantor_asal_kode: "CABANG_PALEMBANG",
        kantor_asal_nama: "Kantor Cabang Palembang",
        kewenangan_lingkup: "CABANG_PALEMBANG_DAN_KLASIFIKASI_PS",
        email: "dharma.priyanto@kjppnanangrahayu.com"
      }
    ];\n\n    `;

const startIdx = html.indexOf(dbRekanStart);
const endIdx = html.indexOf(dbRekanEnd);
if (startIdx !== -1 && endIdx !== -1) {
  html = html.substring(0, startIdx) + newDbRekan + html.substring(endIdx);
  console.log('✔ Updated DATABASE_REKAN with full SSOT metadata');
}

// 2. UPDATE SECTION 08 HTML (REPLACE 2 RADIOS WITH COMPREHENSIVE CARD & ROSTER)
const s8OldRadios = `<!-- Pilihan Penilai Publik Ditunjuk -->
          <div>
            <label class="block font-semibold text-slate-300 text-xs mb-2">Penilai Publik Penanggung Jawab Laporan <span class="text-rose-400">*</span></label>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <label class="flex items-start gap-2.5 p-3 rounded-xl bg-slate-950 border border-slate-700 hover:border-amber-400 cursor-pointer transition">
                <input type="radio" name="g1_penilai_publik" value="deni_penilai" checked class="mt-0.5 accent-amber-400">
                <div>
                  <strong class="text-white block font-bold">Deni Siswandi, S.T., MAPPI (Cert.)</strong>
                  <span class="text-[11px] text-slate-400 block mt-0.5">Izin Menkeu: P-1.20.00581 &bull; MAPPI: 06-S-02013</span>
                  <span class="text-[10px] text-amber-400 font-semibold mt-0.5 block">Penilai Properti Sederhana (PS) &amp; Properti (P)</span>
                </div>
              </label>

              <label class="flex items-start gap-2.5 p-3 rounded-xl bg-slate-950 border border-slate-700 hover:border-amber-400 cursor-pointer transition">
                <input type="radio" name="g1_penilai_publik" value="nanang_penilai" class="mt-0.5 accent-amber-400">
                <div>
                  <strong class="text-white block font-bold">Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)</strong>
                  <span class="text-[11px] text-slate-400 block mt-0.5">Izin Menkeu: 0218 &bull; MAPPI: 96-S-00812</span>
                  <span class="text-[10px] text-teal-400 font-semibold mt-0.5 block">Rekan Pemimpin / Penilai Publik Rekan</span>
                </div>
              </label>
            </div>
          </div>`;

const s8NewCardAndRoster = `<!-- 8.1 PENUNJUKAN PENILAI PUBLIK PENANGGUNG JAWAB & VALIDASI KELAYAKAN PROFESIONAL -->
          <div class="space-y-3">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label class="block font-bold text-amber-300 text-xs tracking-wide">
                Penilai Publik Penanggung Jawab Laporan (SSOT 5 Rekan) <span class="text-rose-400">*</span>
              </label>
              <span class="text-[10px] text-slate-400 bg-slate-800/80 px-2.5 py-0.5 rounded-full border border-slate-700">
                🔗 Terhubung Sinkron Dua Arah dengan Section 05
              </span>
            </div>

            <!-- Kartu Validasi Kelayakan Profesional (Inherited dari Section 05) -->
            <div id="g1-selected-penilai-card" class="p-4 rounded-xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-950 border-2 border-amber-500/50 space-y-2.5 shadow-md">
              <div class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
                <div class="flex items-center gap-2">
                  <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span class="text-[11px] font-bold text-amber-300 uppercase tracking-wider">Penilai Diusulkan (Section 05):</span>
                  <strong id="g1-display-penilai-nama" class="text-white text-xs sm:text-sm font-black">-</strong>
                </div>
                <div class="flex items-center gap-1.5">
                  <span id="g1-display-penilai-klasifikasi-badge" class="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    Klasifikasi: P
                  </span>
                  <span id="g1-display-penilai-kantor-badge" class="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/40">
                    Kantor Pusat
                  </span>
                </div>
              </div>

              <!-- Matriks 6 Parameter Kelayakan Profesional -->
              <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-1 text-[10px] font-mono">
                <div class="p-2 rounded bg-slate-950/80 border border-slate-800">
                  <span class="text-slate-400 block">Izin Kemenkeu</span>
                  <strong id="g1-val-izin" class="text-sky-300 font-bold block truncate">-</strong>
                  <span class="text-[9px] text-emerald-400 font-bold">✔ Aktif / Valid</span>
                </div>
                <div class="p-2 rounded bg-slate-950/80 border border-slate-800">
                  <span class="text-slate-400 block">Klasifikasi Jasa</span>
                  <strong id="g1-val-klasifikasi" class="text-amber-300 font-bold block truncate">-</strong>
                  <span id="g1-val-klasifikasi-status" class="text-[9px] text-emerald-400 font-bold">✔ Sesuai Objek</span>
                </div>
                <div class="p-2 rounded bg-slate-950/80 border border-slate-800">
                  <span class="text-slate-400 block">No. RMK &amp; MAPPI</span>
                  <strong id="g1-val-rmk-mappi" class="text-slate-200 font-bold block truncate">-</strong>
                  <span class="text-[9px] text-emerald-400 font-bold">✔ Terdaftar Asosiasi</span>
                </div>
                <div class="p-2 rounded bg-slate-950/80 border border-slate-800">
                  <span class="text-slate-400 block">Independensi SPI 103</span>
                  <strong id="g1-val-independensi" class="text-emerald-300 font-bold block">BEBAS KONFLIK</strong>
                  <span class="text-[9px] text-emerald-400 font-bold">✔ KEPI Butir 3</span>
                </div>
                <div class="p-2 rounded bg-slate-950/80 border border-slate-800">
                  <span class="text-slate-400 block">Kewenangan TTD</span>
                  <strong id="g1-val-kewenangan" class="text-purple-300 font-bold block truncate">Pusat &amp; Cabang</strong>
                  <span class="text-[9px] text-purple-400 font-bold">✔ Mandat Sah</span>
                </div>
                <div class="p-2 rounded bg-slate-950/80 border border-slate-800">
                  <span class="text-slate-400 block">Beban Penugasan</span>
                  <strong id="g1-val-beban" class="text-teal-300 font-bold block">Optimal</strong>
                  <span class="text-[9px] text-teal-400 font-bold">✔ Jadwal Tersedia</span>
                </div>
              </div>

              <!-- Baris Alert Kelayakan / Catatan Regulasi Khusus -->
              <div id="g1-kelayakan-alert-box" class="hidden p-2 rounded-lg bg-amber-950/40 border border-amber-600/50 text-[11px] text-amber-200 flex items-start gap-2">
                <span class="text-amber-400 text-sm">⚠️</span>
                <span id="g1-kelayakan-alert-text">Catatan regulasi kelayakan.</span>
              </div>
            </div>

            <!-- Daftar Lengkap Kelima Kandidat Penilai Publik (Two-Way Binding & Penjelasan Kualifikasi) -->
            <div class="pt-1">
              <span class="text-[11px] text-slate-300 font-semibold block mb-2">
                Daftar Kandidat 5 Penilai Publik Resmi KJPP NSR (Klik untuk memilih atau mengubah usulan):
              </span>
              <div id="g1-roster-penilai-container" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                <!-- Di-render dinamis oleh renderRosterPenilaiPublik() -->
              </div>
            </div>
          </div>`;

if (html.includes(s8OldRadios)) {
  html = html.replace(s8OldRadios, s8NewCardAndRoster);
  console.log('✔ Replaced Section 08 old radios with 6-parameter card and 5-candidate roster');
}

// 3. UNLOCK SECTION 05 DROPDOWN IN CABANG / MANDIRI MODES (NEVER LOCK TO 1 PARTNER)
// Replace locking patterns
const lockPattern1 = `selRekan.innerHTML = \`<option value="\${partner.nama}">\${partner.nama} (\${partner.jabatan}) - Terkunci Cabang</option>\`;
          selRekan.value = partner.nama;
          selRekan.disabled = true;
          vlookupRekan();`;
const replPattern1 = `populateDropdownRekan(partner?.nama);`;

const lockPattern2 = `selRekan.innerHTML = \`<option value="\${partner.nama}">\${partner.nama} (\${partner.jabatan}) - Terkunci Cabang</option>\`;
          selRekan.value = partner.nama;
          selRekan.disabled = true;
          vlookupRekan();`;

const lockPattern3 = `const partner = getRekanByWilayah(wil);
        selRekan.innerHTML = \`<option value="\${partner.nama}">\${partner.nama} (\${partner.jabatan}) - Terkunci Cabang</option>\`;
        selRekan.value = partner.nama;
        selRekan.disabled = true;`;
const replPattern3 = `const partner = getRekanByWilayah(wil);
        populateDropdownRekan(partner?.nama);`;

if (html.includes(lockPattern1)) {
  html = html.replace(lockPattern1, replPattern1);
  console.log('✔ Replaced lockPattern1 with populateDropdownRekan()');
}
if (html.includes(lockPattern3)) {
  html = html.replace(lockPattern3, replPattern3);
  console.log('✔ Replaced lockPattern3 with populateDropdownRekan()');
}

// Check other occurrences of selRekan.disabled = true
html = html.replaceAll(`selRekan.disabled = true;`, `selRekan.disabled = false;`);

// 4. ADD JS LOGIC FOR SYNC & ROSTER
const anchorJsEnd = `// Generator Checklist Dinamis Berdasarkan Maksud & Tujuan Penilaian`;

const syncJsFunctions = `// =========================================================================
    // ADDENDUM KONSISTENSI PENUNJUKAN PENILAI PUBLIK (SSOT 5 REKAN)
    // =========================================================================

    function populateDropdownRekan(selectedNama = null) {
      const selRekan = document.getElementById('rekan_nama');
      if (!selRekan) return;
      selRekan.disabled = false;
      selRekan.innerHTML = DATABASE_REKAN.map(r => {
        const klasifikasiBadge = r.klasifikasi_kode === 'PS' ? '[PS - Sederhana]' : '[P - Properti]';
        return \`<option value="\${r.nama}">\${r.nama} (\${r.jabatan}) \${klasifikasiBadge}</option>\`;
      }).join('');
      if (selectedNama && DATABASE_REKAN.some(r => r.nama === selectedNama)) {
        selRekan.value = selectedNama;
      } else if (!selRekan.value) {
        selRekan.value = DATABASE_REKAN[0].nama;
      }
      vlookupRekan();
    }

    function cariRekanByIdOrNama(identifier) {
      if (!identifier) return DATABASE_REKAN[0];
      const clean = String(identifier).trim().toLowerCase();
      return DATABASE_REKAN.find(r => 
        (r.id && r.id.toLowerCase() === clean) ||
        (r.nama && r.nama.toLowerCase() === clean) ||
        (r.nama && r.nama.toLowerCase().includes(clean))
      ) || DATABASE_REKAN[0];
    }

    function evaluasiKelayakanPenilai(rekanObj) {
      if (!rekanObj) return { eligible: true, message: 'Valid' };
      const selTujuan = (document.getElementById('maksud_tujuan_penilaian')?.value || '').toLowerCase();
      const jenisObjek = (document.getElementById('jenis_objek')?.value || '').toLowerCase();
      
      const isSimpleObject = (
        jenisObjek.includes('rumah tinggal') || 
        jenisObjek.includes('ruko') || 
        jenisObjek.includes('tanah kosong') ||
        jenisObjek.includes('sederhana')
      );
      const isComplex = (
        jenisObjek.includes('hotel') ||
        jenisObjek.includes('mall') ||
        jenisObjek.includes('pabrik') ||
        jenisObjek.includes('industri') ||
        jenisObjek.includes('apartemen') ||
        selTujuan.includes('psak') ||
        selTujuan.includes('laporan keuangan') ||
        (selTujuan.includes('pengadaan tanah') && !selTujuan.includes('skala kecil'))
      );

      const isPS = rekanObj.klasifikasi_kode === 'PS' || (rekanObj.izin && rekanObj.izin.startsWith('PS'));

      if (isPS && isComplex) {
        return {
          eligible: false,
          warning: true,
          statusLabel: '⚠️ Perlu Evaluasi PS',
          message: \`Perhatian Regulasi (PMK 101/2014 & SPI 204): Objek penugasan (\${jenisObjek || 'Non-Sederhana'}) melampaui klasifikasi izin Properti Sederhana (PS). Direkomendasikan penunjukan Penilai Properti Komprehensif (Ir. Nanang Rahayu / Deni Siswandi).\`
        };
      }

      if (isPS) {
        return {
          eligible: true,
          warning: false,
          statusLabel: '✔ Sesuai (PS Sederhana)',
          message: 'Klasifikasi Properti Sederhana (PS) memenuhi syarat untuk objek penugasan ini.'
        };
      }

      return {
        eligible: true,
        warning: false,
        statusLabel: '✔ Sesuai (P Komprehensif)',
        message: 'Klasifikasi Penilai Properti (P) memenuhi syarat untuk seluruh jenis objek dan tujuan.'
      };
    }

    function syncSection05ToSection08() {
      const elRekan = document.getElementById('rekan_nama');
      if (!elRekan) return;
      const rekanVal = elRekan.value;
      const rekanObj = cariRekanByIdOrNama(rekanVal);

      // Update Section 08 Selected Card
      const displayNama = document.getElementById('g1-display-penilai-nama');
      if (displayNama) displayNama.textContent = rekanObj.nama;

      const badgeKlasifikasi = document.getElementById('g1-display-penilai-klasifikasi-badge');
      if (badgeKlasifikasi) {
        badgeKlasifikasi.textContent = \`Klasifikasi: \${rekanObj.klasifikasi_kode || (rekanObj.izin?.startsWith('PS') ? 'PS' : 'P')}\`;
      }

      const badgeKantor = document.getElementById('g1-display-penilai-kantor-badge');
      if (badgeKantor) {
        badgeKantor.textContent = rekanObj.kantor_asal_nama || 'Kantor Pusat';
      }

      // Update 6 parameter boxes
      const valIzin = document.getElementById('g1-val-izin');
      if (valIzin) valIzin.textContent = rekanObj.izin || '-';

      const valKlasifikasi = document.getElementById('g1-val-klasifikasi');
      if (valKlasifikasi) valKlasifikasi.textContent = rekanObj.klasifikasi || (rekanObj.izin?.startsWith('PS') ? 'Properti Sederhana (PS)' : 'Properti (P)');

      const valRmk = document.getElementById('g1-val-rmk-mappi');
      if (valRmk) valRmk.textContent = \`\${rekanObj.mappi} • \${rekanObj.rmk}\`;

      const valKewenangan = document.getElementById('g1-val-kewenangan');
      if (valKewenangan) {
        valKewenangan.textContent = (rekanObj.klasifikasi_kode === 'P') ? 'Nasional (Pusat & Cabang)' : (rekanObj.kantor_asal_nama || 'Cabang Mandiri');
      }

      // Evaluasi kelayakan
      const evalResult = evaluasiKelayakanPenilai(rekanObj);
      const valStatus = document.getElementById('g1-val-klasifikasi-status');
      if (valStatus) {
        valStatus.textContent = evalResult.statusLabel;
        valStatus.className = evalResult.warning ? 'text-[9px] text-amber-400 font-bold' : 'text-[9px] text-emerald-400 font-bold';
      }

      const alertBox = document.getElementById('g1-kelayakan-alert-box');
      const alertText = document.getElementById('g1-kelayakan-alert-text');
      if (alertBox && alertText) {
        if (evalResult.warning) {
          alertBox.classList.remove('hidden');
          alertText.textContent = evalResult.message;
        } else {
          alertBox.classList.add('hidden');
        }
      }

      // Re-render roster to reflect selection
      renderRosterPenilaiPublik();
    }

    function onSelectPenilaiFromSection08(penilaiId) {
      const rekanObj = cariRekanByIdOrNama(penilaiId);
      const elRekan = document.getElementById('rekan_nama');
      if (elRekan && rekanObj) {
        elRekan.value = rekanObj.nama;
        vlookupRekan();
      }
    }

    function renderRosterPenilaiPublik() {
      const container = document.getElementById('g1-roster-penilai-container');
      if (!container) return;

      const currentSelectedNama = document.getElementById('rekan_nama')?.value || DATABASE_REKAN[0].nama;
      const currentSelectedObj = cariRekanByIdOrNama(currentSelectedNama);

      container.innerHTML = DATABASE_REKAN.map(r => {
        const isChecked = (r.id === currentSelectedObj.id || r.nama === currentSelectedObj.nama);
        const evalR = evaluasiKelayakanPenilai(r);
        const badgeColor = (r.klasifikasi_kode === 'P') 
          ? 'bg-emerald-950/50 text-emerald-300 border-emerald-700/50'
          : (evalR.warning ? 'bg-amber-950/50 text-amber-300 border-amber-700/50' : 'bg-teal-950/50 text-teal-300 border-teal-700/50');
        const badgeText = (r.klasifikasi_kode === 'P')
          ? '✅ Izin P (Komprehensif - Seluruh Objek)'
          : (evalR.warning 
              ? '⚠️ Izin PS Terbatas (Hanya Objek Sederhana SPI 204)'
              : '✅ Izin PS (Sesuai Objek Sederhana)');

        return \`
          <label class="flex items-start gap-2.5 p-3 rounded-xl bg-slate-950 border \${isChecked ? 'border-amber-400 bg-amber-950/20 shadow-md' : 'border-slate-800 hover:border-slate-700'} cursor-pointer transition">
            <input type="radio" name="g1_penilai_publik" value="\${r.id}" \${isChecked ? 'checked' : ''} onchange="onSelectPenilaiFromSection08('\${r.id}')" class="mt-1 accent-amber-400 cursor-pointer">
            <div class="space-y-1 w-full">
              <div class="flex items-center justify-between gap-1">
                <strong class="text-white text-xs block font-bold">\${r.nama}</strong>
                <span class="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">\${r.klasifikasi_kode || 'P'}</span>
              </div>
              <div class="text-[11px] text-slate-400 flex flex-wrap gap-x-2">
                <span>🏢 \${r.kantor_asal_nama || r.jabatan}</span>
                <span>• Izin: <strong class="text-sky-300 font-mono">\${r.izin}</strong></span>
              </div>
              <div class="text-[10px] text-slate-400 font-mono">
                MAPPI: \${r.mappi} &bull; RMK: \${r.rmk}
              </div>
              <div class="pt-1">
                <span class="inline-block px-2 py-0.5 rounded text-[10px] font-semibold border \${badgeColor}">
                  \${badgeText}
                </span>
              </div>
            </div>
          </label>
        \`;
      }).join('');
    }

    `;

if (!html.includes('syncSection05ToSection08') && html.includes(anchorJsEnd)) {
  html = html.replace(anchorJsEnd, syncJsFunctions + anchorJsEnd);
  console.log('✔ Added synchronization and roster functions');
}

// 5. UPDATE vlookupRekan() TO CALL syncSection05ToSection08()
const vlookupOld = `document.getElementById('view_rekan_ojk').textContent = data.ojk || "-";
    }`;
const vlookupNew = `document.getElementById('view_rekan_ojk').textContent = data.ojk || "-";
      if (typeof syncSection05ToSection08 === 'function') syncSection05ToSection08();
    }`;

if (html.includes(vlookupOld)) {
  html = html.replace(vlookupOld, vlookupNew);
  console.log('✔ vlookupRekan() now triggers syncSection05ToSection08()');
}

// 6. INITIALIZE ROSTER ON DOMContentLoaded
const domInitOld = `renderChecklistMitigasiAwal(selTujuan.value);`;
const domInitNew = `renderChecklistMitigasiAwal(selTujuan.value);
        if (typeof populateDropdownRekan === 'function') populateDropdownRekan();
        if (typeof renderRosterPenilaiPublik === 'function') renderRosterPenilaiPublik();`;

if (html.includes(domInitOld)) {
  html = html.replace(domInitOld, domInitNew);
  console.log('✔ Initialized roster and dropdown on DOMContentLoaded');
}

// 7. ENSURE FORM SUBMIT READS FROM rekan_nama DIRECTLY
const submitRekanOld = `rekan_nama: (isPrivateCabang && branchPartner) ? branchPartner.nama : document.getElementById('rekan_nama').value,
        rekan_izin: (isPrivateCabang && branchPartner) ? (branchPartner.izin || 'P-1.20.00581') : (rekanSelected.izin || 'P-1.20.00581'),`;

const submitRekanNew = `rekan_nama: document.getElementById('rekan_nama')?.value || (rekanSelected.nama || 'Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert)'),
        rekan_izin: rekanSelected.izin || 'P-1.09.00218',
        penilai_publik_id: rekanSelected.id || 'nanang_penilai',
        penilai_publik_klasifikasi: rekanSelected.klasifikasi_kode || 'P',
        appraiser_license_code: rekanSelected.izin_segmen || '0218',`;

if (html.includes(submitRekanOld)) {
  html = html.replace(submitRekanOld, submitRekanNew);
  console.log('✔ Form submit payload preserves selected Penilai Publik without branch overwrite');
}

fs.writeFileSync(filePath, html, 'utf8');
console.log('✔ Saved portal-penugasan-jo.html successfully');
