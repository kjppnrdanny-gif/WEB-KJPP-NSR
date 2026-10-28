import fs from 'fs';

console.log('=== Mengaplikasikan Penyempurnaan JS portal-penugasan-jo.html ===');

let html = fs.readFileSync('portal-penugasan-jo.html', 'utf8');

// ============================================================================
// 1. UPDATE getObjekColumnConfig & formatObjekSpesifikasi & formatObjekLegalitas
// ============================================================================
console.log('1. Mengupdate getObjekColumnConfig & formatObjek...');

const oldGetObjekConfigStart = '    function getObjekColumnConfig(jenis = \'\') {';
const oldGetObjekConfigEndMarker = '    // ==========================================================';
const idxCfgStart = html.indexOf(oldGetObjekConfigStart);
const idxCfgEnd = html.indexOf(oldGetObjekConfigEndMarker, idxCfgStart);

if (idxCfgStart === -1 || idxCfgEnd === -1) {
  console.error('ERROR: Marker getObjekColumnConfig tidak ditemukan!');
  process.exit(1);
}

const newObjekConfigAndFormatCode = `    function getObjekColumnConfig(jenis = '') {
      const j = String(jenis || '').toLowerCase();
      
      if (j.includes('kendaraan')) {
        return {
          category: 'kendaraan',
          col3: { label: 'Merek & Tipe', placeholder: 'Contoh: Toyota Avanza 1.5 G / Hino Ranger', type: 'text' },
          col4: { label: 'No. Polisi & Warna', placeholder: 'Contoh: B 1234 XYZ / Hitam Metalik', type: 'text' },
          col5: { label: 'No. BPKB & No. Rangka/Mesin', placeholder: 'Contoh: BPKB No. M-12345 / MH1...', type: 'text' }
        };
      }
      if (j.includes('alat berat') || j.includes('heavy equipment')) {
        return {
          category: 'alat_berat',
          col3: { label: 'Merek & Model / Tipe', placeholder: 'Contoh: Komatsu PC200-8 (Excavator)', type: 'text' },
          col4: { label: 'Tahun & Kapasitas Kerja / Beban', placeholder: 'Contoh: 2021 / Kapasitas Bucket 0.93 m³ (20 Ton)', type: 'text' },
          col5: { label: 'No. Seri/Chassis & Bukti Beli', placeholder: 'Contoh: SN: KMTC200-8899 / Invoice No. INV-2021', type: 'text' }
        };
      }
      if (j.includes('mesin') || j.includes('peralatan')) {
        return {
          category: 'mesin',
          col3: { label: 'Merek & Tipe / Model Mesin', placeholder: 'Contoh: Heidelberg Speedmaster SM-74 (4 Warna)', type: 'text' },
          col4: { label: 'Tahun & Kapasitas Teknis / Spek', placeholder: 'Contoh: 2019 / Kapasitas 15.000 Sheet/Jam, 380V', type: 'text' },
          col5: { label: 'No. Seri & Faktur Perolehan', placeholder: 'Contoh: SN: HDB-9921 / Faktur No. FK-889', type: 'text' }
        };
      }
      if (j.includes('perkebunan')) {
        return {
          category: 'perkebunan',
          col3: { label: 'Luas Tertanam (Ha) & Komoditas', placeholder: 'Contoh: 250 Ha (Kelapa Sawit)', type: 'text' },
          col4: { label: 'Fase / Umur Tanaman (TBM/TM)', placeholder: 'Contoh: TM-5 (Tahun Tanam 2020)', type: 'text' },
          col5: { label: 'No. HGU / Izin Usaha Perkebunan', placeholder: 'Contoh: HGU No. 12/Kab / IUP No. ...', type: 'text' }
        };
      }
      if (j.includes('kehutanan') || j.includes('hewan') || j.includes('peternakan') || j.includes('biologis')) {
        return {
          category: 'kehutanan_hewan',
          col3: { label: 'Populasi / Jumlah (Btg/Ekor)', placeholder: 'Contoh: 1.200 Batang / 500 Ekor Sapi', type: 'text' },
          col4: { label: 'Umur / Bobot Rata-rata', placeholder: 'Contoh: Umur 6 Thn / Bobot 450 Kg/ekor', type: 'text' },
          col5: { label: 'Dokumen Legalitas / Asal Usul', placeholder: 'Contoh: SK Izin Konsesi / Sertifikat Veteriner', type: 'text' }
        };
      }
      if (isKetikBebas(jenis)) {
        return {
          category: 'lain_lain',
          col3: { label: 'Kuantitas & Satuan', placeholder: 'Contoh: 1 Unit / 500 m²', type: 'text' },
          col4: { label: 'Spesifikasi Teknis / Kondisi', placeholder: 'Contoh: Baik (85%) / Spesifikasi Khusus', type: 'text' },
          col5: { label: 'Bukti Hak / Dokumen Legalitas', placeholder: 'Contoh: Berita Acara / Surat Bukti', type: 'text' }
        };
      }
      if (j.includes('inventaris') || j.includes('khusus') || j.includes('lain')) {
        return {
          category: 'lain_lain',
          col3: { label: 'Kuantitas & Satuan', placeholder: 'Contoh: 1 Lot / 25 Unit', type: 'text' },
          col4: { label: 'Spesifikasi Teknis / Kondisi', placeholder: 'Contoh: Kondisi Baik / Spesifikasi Teknis', type: 'text' },
          col5: { label: 'Legalitas / Bukti Perolehan', placeholder: 'Contoh: Invoice / Kwitansi Pembelian', type: 'text' }
        };
      }

      // Default: Real Properti (Tanah & Bangunan / Rumah / Ruko / Gudang / Komersial)
      return {
        category: 'properti',
        col3: { label: 'LT (m²)', placeholder: 'Luas Tanah m²', type: 'number' },
        col4: { label: 'LB (m²)', placeholder: 'Luas Bangunan m²', type: 'number' },
        col5: { label: 'Status Hak & No. Sertipikat', placeholder: 'Contoh: SHM No. 1234/Ragunan a.n. Debitur', type: 'text' }
      };
    }

    function getObjekNamaDisplay(o) {
      if (!o) return '-';
      if (isKetikBebas(o.jenis)) {
        if (o.customJenis && String(o.customJenis).trim()) {
          return String(o.customJenis).trim();
        }
        return 'Lain-lain';
      }
      return o.jenis || '-';
    }

    function formatObjekSpesifikasi(o) {
      if (!o) return '-';
      const cfg = getObjekColumnConfig(o.jenis);
      const val3 = (o.col3 !== undefined && o.col3 !== '') ? o.col3 : (o.lt || '');
      const val4 = (o.col4 !== undefined && o.col4 !== '') ? o.col4 : (o.lb || '');

      if (cfg.category === 'properti') {
        const parts = [];
        if (val3 && val3 !== '-') parts.push(\`LT: \${val3} m²\`);
        if (val4 && val4 !== '-') parts.push(\`LB: \${val4} m²\`);
        return parts.length > 0 ? parts.join(' | ') : '-';
      } else if (cfg.category === 'kendaraan') {
        const parts = [];
        if (val3) parts.push(\`Merek/Tipe: \${val3}\`);
        if (val4) parts.push(\`No. Pol & Warna: \${val4}\`);
        return parts.length > 0 ? parts.join(' | ') : '-';
      } else if (cfg.category === 'alat_berat') {
        const parts = [];
        if (val3) parts.push(\`Merek/Model: \${val3}\`);
        if (val4) parts.push(\`Thn/Kapasitas: \${val4}\`);
        return parts.length > 0 ? parts.join(' | ') : '-';
      } else if (cfg.category === 'mesin') {
        const parts = [];
        if (val3) parts.push(\`Merek/Model: \${val3}\`);
        if (val4) parts.push(\`Thn/Spek: \${val4}\`);
        return parts.length > 0 ? parts.join(' | ') : '-';
      } else if (cfg.category === 'perkebunan') {
        const parts = [];
        if (val3) parts.push(\`Luas: \${val3} Ha\`);
        if (val4) parts.push(\`Fase: \${val4}\`);
        return parts.length > 0 ? parts.join(' | ') : '-';
      } else if (cfg.category === 'kehutanan_hewan') {
        const parts = [];
        if (val3) parts.push(\`Jumlah: \${val3}\`);
        if (val4) parts.push(\`Kondisi: \${val4}\`);
        return parts.length > 0 ? parts.join(' | ') : '-';
      } else {
        const parts = [];
        if (val3) parts.push(\`Kuantitas: \${val3}\`);
        if (val4) parts.push(\`Spesifikasi: \${val4}\`);
        return parts.length > 0 ? parts.join(' | ') : '-';
      }
    }

    function formatObjekLegalitas(o, p = {}) {
      if (!o) return '-';
      const val5 = (o.col5 !== undefined && o.col5 !== '') ? o.col5 : (o.status || '');
      if (val5 && val5 !== '-') return val5;
      if (p.pemilik_sertipikat) return p.pemilik_sertipikat;
      if (p.debitur_nama) return \`Milik \${p.debitur_nama}\`;
      return '-';
    }
`;

html = html.substring(0, idxCfgStart) + newObjekConfigAndFormatCode + html.substring(idxCfgEnd);
console.log('✓ getObjekColumnConfig & formatObjek berhasil diupdate.');

// ============================================================================
// 2. UPDATE tambahBarisObjek, hapusBarisObjek, geserBarisObjek, renderTabelObjek
// ============================================================================
console.log('2. Mengupdate renderTabelObjek & reordering...');

const oldTabelObjekJsStart = '    let objekRows = [];';
const oldTabelObjekJsEndMarker = '    // ==========================================================';
const idxTblJsStart = html.indexOf(oldTabelObjekJsStart);
const idxTblJsEnd = html.indexOf(oldTabelObjekJsEndMarker, idxTblJsStart);

if (idxTblJsStart === -1 || idxTblJsEnd === -1) {
  console.error('ERROR: Marker Tabel Objek JS tidak ditemukan!');
  process.exit(1);
}

const newTabelObjekJsCode = `    let objekRows = [];
    window.objekRows = objekRows;

    function tambahBarisObjek(data = null) {
      const rowId = 'objek-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
      const defaultData = data || {
        jenis: "Tanah & Bangunan Rumah Tinggal",
        customJenis: "",
        col3: "300",
        col4: "200",
        col5: "SHM No. ... a.n. Debitur",
        lt: "300",
        lb: "200",
        status: "SHM No. ... a.n. Debitur",
        lokasi: "Jl. Hankam No. 5, Ragunan, Pasar Minggu, Jakarta Selatan"
      };

      const newRow = {
        id: rowId,
        ...defaultData,
        customJenis: defaultData.customJenis || "",
        col3: defaultData.col3 || defaultData.lt || "",
        col4: defaultData.col4 || defaultData.lb || "",
        col5: defaultData.col5 || defaultData.status || "",
        lt: defaultData.lt || defaultData.col3 || "",
        lb: defaultData.lb || defaultData.col4 || "",
        status: defaultData.status || defaultData.col5 || "",
        lokasi: defaultData.lokasi || ""
      };

      objekRows.push(newRow);
      renderTabelObjek();
      updateRekomendasiTemplate();
    }

    function hapusBarisObjek(rowId) {
      if (objekRows.length <= 1) {
        alert("Minimal harus ada 1 baris objek penilaian.");
        return;
      }
      objekRows = objekRows.filter(r => r.id !== rowId);
      renderTabelObjek();
      updateRekomendasiTemplate();
    }

    function geserBarisObjek(rowId, direction) {
      const idx = objekRows.findIndex(r => r.id === rowId);
      if (idx === -1) return;
      const targetIdx = idx + direction;
      if (targetIdx < 0 || targetIdx >= objekRows.length) return;
      
      const temp = objekRows[idx];
      objekRows[idx] = objekRows[targetIdx];
      objekRows[targetIdx] = temp;
      
      renderTabelObjek();
      updateRekomendasiTemplate();
    }
    window.geserBarisObjek = geserBarisObjek;

    function updateObjekCustomJenis(rowId, val) {
      const r = objekRows.find(item => item.id === rowId);
      if (!r) return;
      r.customJenis = val;
      updateRekomendasiTemplate();
    }

    function updateObjekData(rowId, field, val) {
      const r = objekRows.find(item => item.id === rowId);
      if (!r) return;
      r[field] = val;
      const cfg = getObjekColumnConfig(r.jenis);

      if (field === 'col3') {
        if (cfg.category === 'properti') { r.lt = val; }
      } else if (field === 'col4') {
        if (cfg.category === 'properti') { r.lb = val; }
      } else if (field === 'col5') {
        r.status = val;
      } else if (field === 'lt') {
        r.col3 = val;
      } else if (field === 'lb') {
        r.col4 = val;
      } else if (field === 'status') {
        r.col5 = val;
      }
    }

    function handleJenisObjekChange(rowId, jenisVal) {
      const r = objekRows.find(item => item.id === rowId);
      if (!r) return;
      r.jenis = jenisVal;
      if (!isKetikBebas(jenisVal)) {
        r.customJenis = '';
      }
      
      const cfg = getObjekColumnConfig(jenisVal);
      // Bersihkan LT & LB jika objek bukan Properti untuk mencegah salah input
      if (cfg.category !== 'properti') {
        r.lt = '';
        r.lb = '';
      }
      
      updateRekomendasiTemplate();
      renderTabelObjek();
    }

    function renderTabelObjek() {
      const tbody = document.getElementById('tbody-objek');
      if (!tbody) return;

      tbody.innerHTML = objekRows.map((row, idx) => {
        const cfg = getObjekColumnConfig(row.jenis);
        const val3 = (row.col3 !== undefined) ? row.col3 : (row.lt || '');
        const val4 = (row.col4 !== undefined) ? row.col4 : (row.lb || '');
        const val5 = (row.col5 !== undefined) ? row.col5 : (row.status || '');
        const valLokasi = row.lokasi || '';

        const optgroupsHtml = DAFTAR_KATEGORI_OBJEK.map(group => \`
          <optgroup label="\${group.group}">
            \${group.items.map(opt => {
              const isExact = (row.jenis === opt);
              const isSelected = isExact || (
                !row.jenis && opt.includes('Rumah')
              ) || (
                row.jenis &&
                !DAFTAR_KATEGORI_OBJEK.some(g => g.items.includes(row.jenis)) &&
                row.jenis !== 'LAINNYA' &&
                (
                  (row.jenis.includes('Rumah') && opt.includes('Rumah')) ||
                  (row.jenis.includes('Gudang') && opt.includes('Gudang')) ||
                  (row.jenis.includes('Pabrik') && opt.includes('Gudang')) ||
                  (row.jenis.includes('Ruko') && opt.includes('Ruko')) ||
                  (row.jenis.includes('Perkebunan') && opt.includes('Perkebunan')) ||
                  (row.jenis.includes('Mesin') && opt.includes('Mesin'))
                )
              );
              return \`<option value="\${opt}" \${isSelected ? 'selected' : ''}>\${opt}</option>\`;
            }).join('')}
          </optgroup>
        \`).join('');

        const isLainnya = isKetikBebas(row.jenis);

        return \`
          <tr class="hover:bg-slate-800/40 transition">
            <td class="p-2.5 text-center text-slate-400 font-mono font-bold align-top pt-3.5">\${idx + 1}</td>
            <td class="p-2 align-top">
              <span class="block text-[10px] text-amber-400 font-semibold mb-0.5">Kategori &amp; Jenis Objek</span>
              <select onchange="handleJenisObjekChange('\${row.id}', this.value)" class="w-full h-8 px-2 rounded bg-slate-900 border border-slate-700 text-slate-200 text-xs focus:border-amber-400 focus:outline-none">
                \${optgroupsHtml}
                <option value="LAINNYA" \${row.jenis === 'LAINNYA' ? 'selected' : ''}>Lainnya / Input Bebas (Custom)...</option>
              </select>
              \${isLainnya ? \`
                <input type="text" 
                       class="input-custom-jenis-objek mt-1.5 w-full rounded-lg border border-amber-500/60 bg-slate-900/90 px-3 py-1.5 text-xs text-amber-200 placeholder-slate-400 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400" 
                       placeholder="Ketik jenis objek di sini (misal: Jetty / Kapal Tugboat / Dermaga)..." 
                       value="\${(row.customJenis || '').replace(/"/g, '&quot;')}" 
                       oninput="updateObjekCustomJenis('\${row.id}', this.value)" 
                       required>
              \` : ''}
            </td>
            <td class="p-2 align-top">
              <span class="block text-[10px] text-amber-400 font-semibold mb-0.5 truncate" title="\${cfg.col3.label}">\${cfg.col3.label}</span>
              <input type="\${cfg.col3.type}" value="\${val3}" placeholder="\${cfg.col3.placeholder}" oninput="updateObjekData('\${row.id}', 'col3', this.value)" class="w-full h-8 px-2 rounded bg-slate-900 border border-slate-700 text-slate-200 text-xs focus:border-amber-400 focus:outline-none font-mono \${cfg.col3.type === 'number' ? 'text-right' : ''}">
            </td>
            <td class="p-2 align-top">
              <span class="block text-[10px] text-amber-400 font-semibold mb-0.5 truncate" title="\${cfg.col4.label}">\${cfg.col4.label}</span>
              <input type="\${cfg.col4.type}" value="\${val4}" placeholder="\${cfg.col4.placeholder}" oninput="updateObjekData('\${row.id}', 'col4', this.value)" class="w-full h-8 px-2 rounded bg-slate-900 border border-slate-700 text-slate-200 text-xs focus:border-amber-400 focus:outline-none font-mono \${cfg.col4.type === 'number' ? 'text-right' : ''}">
            </td>
            <td class="p-2 align-top">
              <span class="block text-[10px] text-amber-400 font-semibold mb-0.5 truncate" title="\${cfg.col5.label}">\${cfg.col5.label}</span>
              <input type="text" value="\${val5}" placeholder="\${cfg.col5.placeholder}" oninput="updateObjekData('\${row.id}', 'col5', this.value)" class="w-full h-8 px-2 rounded bg-slate-900 border border-slate-700 text-slate-200 text-xs focus:border-amber-400 focus:outline-none">
            </td>
            <td class="p-2 align-top">
              <span class="block text-[10px] text-slate-400 font-medium mb-0.5">Alamat Lengkap</span>
              <input type="text" value="\${valLokasi}" placeholder="Alamat lengkap lokasi / Kota" oninput="updateObjekData('\${row.id}', 'lokasi', this.value)" class="w-full h-8 px-2 rounded bg-slate-900 border border-slate-700 text-slate-200 text-xs focus:border-amber-400 focus:outline-none">
            </td>
            <td class="p-2 text-center align-top pt-3">
              <div class="flex items-center justify-center gap-1">
                <button type="button" onclick="geserBarisObjek('\${row.id}', -1)" class="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-300 transition" title="Geser Naik (Pindah Urutan Atas)">
                  ▲
                </button>
                <button type="button" onclick="geserBarisObjek('\${row.id}', 1)" class="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-300 transition" title="Geser Turun (Pindah Urutan Bawah)">
                  ▼
                </button>
                <button type="button" onclick="hapusBarisObjek('\${row.id}')" class="p-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 transition" title="Hapus baris">
                  <svg class="w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                </button>
              </div>
            </td>
          </tr>
        \`;
      }).join('');
    }
`;

html = html.substring(0, idxTblJsStart) + newTabelObjekJsCode + html.substring(idxTblJsEnd);
console.log('✓ renderTabelObjek & reordering berhasil diupdate.');

// ============================================================================
// 3. UPDATE kalkulasiBiaya
// ============================================================================
console.log('3. Mengupdate kalkulasiBiaya...');

const oldKalkulasiBiayaStart = '    function kalkulasiBiaya() {';
const oldKalkulasiBiayaEndMarker = '    function hitungTotalSLA() {';
const idxKalkStart = html.indexOf(oldKalkulasiBiayaStart);
const idxKalkEnd = html.indexOf(oldKalkulasiBiayaEndMarker, idxKalkStart);

if (idxKalkStart === -1 || idxKalkEnd === -1) {
  console.error('ERROR: Marker kalkulasiBiaya tidak ditemukan!');
  process.exit(1);
}

const newKalkulasiBiayaCode = `    function kalkulasiBiaya() {
      const isBelumDisepakati = document.getElementById('chk_biaya_belum_disepakati')?.checked || false;
      const bannerBelum = document.getElementById('banner_biaya_belum_disepakati');
      
      const honor = parseFloat(document.getElementById('biaya_honorarium')?.value) || 0;
      const transport = parseFloat(document.getElementById('biaya_transportasi')?.value) || 0;
      const akomodasi = parseFloat(document.getElementById('biaya_akomodasi')?.value) || 0;
      const operasional = parseFloat(document.getElementById('biaya_operasional_lain')?.value) || 0;
      
      const statusTransport = document.getElementById('status_transportasi')?.value || 'INCLUDED';
      const statusAkomodasi = document.getElementById('status_akomodasi')?.value || 'INCLUDED';
      const statusOperasional = document.getElementById('status_operasional_lain')?.value || 'INCLUDED';
      
      const kenaPpn = document.getElementById('chk_kena_ppn')?.checked ?? true;

      // Update format text komponen
      const elHonFmt = document.getElementById('view_honorarium_formatted');
      const elTransFmt = document.getElementById('view_transportasi_formatted');
      const elAkomFmt = document.getElementById('view_akomodasi_formatted');
      const elOpsFmt = document.getElementById('view_operasional_formatted');

      if (elHonFmt) elHonFmt.textContent = formatRupiah(honor);
      if (elTransFmt) elTransFmt.textContent = \`\${formatRupiah(transport)} (\${statusTransport})\`;
      if (elAkomFmt) elAkomFmt.textContent = \`\${formatRupiah(akomodasi)} (\${statusAkomodasi})\`;
      if (elOpsFmt) elOpsFmt.textContent = \`\${formatRupiah(operasional)} (\${statusOperasional})\`;

      if (isBelumDisepakati) {
        if (bannerBelum) bannerBelum.classList.remove('hidden');
        document.getElementById('biaya_dpp').value = 0;
        document.getElementById('biaya_ppn').value = 0;
        document.getElementById('biaya_total').value = "Belum Disepakati";

        document.getElementById('view_dpp_formatted').textContent = "Belum Disepakati";
        document.getElementById('view_ppn_formatted').textContent = "Rp 0,-";
        document.getElementById('view_total_formatted').textContent = "Belum Disepakati (Tahap Penawaran)";
        document.getElementById('view_terbilang').textContent = "Belum Disepakati (Dalam Tahap Penawaran Tertulis)";
        return;
      }

      if (bannerBelum) bannerBelum.classList.add('hidden');

      // Hitung DPP: Honorarium + komponen yang EXCLUDED (ditagihkan terpisah)
      let dpp = honor;
      if (statusTransport === 'EXCLUDED') dpp += transport;
      if (statusAkomodasi === 'EXCLUDED') dpp += akomodasi;
      if (statusOperasional === 'EXCLUDED') dpp += operasional;

      // Fallback jika honorarium 0 tapi biaya_dpp lama terisi
      if (dpp === 0) {
        const legacyDpp = parseFloat(document.getElementById('biaya_dpp')?.value) || 0;
        if (legacyDpp > 0) dpp = legacyDpp;
      }

      const ppn = kenaPpn ? Math.round(dpp * 0.11) : 0;
      const total = dpp + ppn;

      document.getElementById('biaya_dpp').value = dpp;
      document.getElementById('biaya_ppn').value = ppn;
      document.getElementById('biaya_total').value = total;

      document.getElementById('view_dpp_formatted').textContent = formatRupiah(dpp);
      document.getElementById('view_ppn_formatted').textContent = formatRupiah(ppn);
      document.getElementById('view_total_formatted').textContent = formatRupiah(total);

      document.getElementById('view_terbilang').textContent = total > 0 ? angkaTerbilang(total) : 'Nol Rupiah';
    }
`;

html = html.substring(0, idxKalkStart) + newKalkulasiBiayaCode + html.substring(idxKalkEnd);
console.log('✓ kalkulasiBiaya berhasil diupdate.');

// ============================================================================
// 4. UPDATE presetSameAsClientPenugasan & togglePenggunaSamaDenganPemberi
// ============================================================================
console.log('4. Mengupdate preset & toggle Pengguna Laporan...');

const oldPresetStart = '    function presetSameAsClientPenugasan() {';
const oldPresetEndMarker = '    function onKlasifikasiJasaJoChange() {';
const idxPresetStart = html.indexOf(oldPresetStart);
const idxPresetEnd = html.indexOf(oldPresetEndMarker, idxPresetStart);

if (idxPresetStart === -1 || idxPresetEnd === -1) {
  console.error('ERROR: Marker presetSameAsClientPenugasan tidak ditemukan!');
  process.exit(1);
}

const newPresetCode = `    function togglePenggunaSamaDenganPemberi() {
      const chk = document.getElementById('chk_pengguna_sama_pemberi');
      const badge = document.getElementById('badge_pengguna_sync');
      const inpA = document.getElementById('pengguna_laporan_a');
      const inpAAlamat = document.getElementById('pengguna_laporan_a_alamat');
      const inpAPic = document.getElementById('pengguna_laporan_a_pic');
      const inpAJabatan = document.getElementById('pengguna_laporan_a_jabatan');
      const inpAKontak = document.getElementById('pengguna_laporan_a_kontak');
      const inpAEmail = document.getElementById('pengguna_laporan_a_email');
      const inpABidang = document.getElementById('pengguna_laporan_a_bidang');

      if (chk && chk.checked) {
        if (badge) badge.classList.remove('hidden');
        syncPenggunaDariPemberi();
        [inpA, inpAAlamat, inpAPic, inpAJabatan, inpAKontak, inpAEmail, inpABidang].forEach(el => {
          if (el) {
            el.readOnly = true;
            el.classList.add('bg-slate-900/60', 'text-amber-200');
          }
        });
      } else {
        if (badge) badge.classList.add('hidden');
        [inpA, inpAAlamat, inpAPic, inpAJabatan, inpAKontak, inpAEmail, inpABidang].forEach(el => {
          if (el) {
            el.readOnly = false;
            el.classList.remove('bg-slate-900/60', 'text-amber-200');
          }
        });
      }
    }
    window.togglePenggunaSamaDenganPemberi = togglePenggunaSamaDenganPemberi;

    function syncPenggunaDariPemberi() {
      const chk = document.getElementById('chk_pengguna_sama_pemberi');
      if (!chk || !chk.checked) return;

      const namaKlien = document.getElementById('pemberi_tugas_nama')?.value || '';
      const alamatKlien = document.getElementById('pemberi_tugas_alamat')?.value || '';
      const bidangKlien = document.getElementById('pemberi_tugas_bidang')?.value || '';
      const picKlien = document.getElementById('pemberi_tugas_pic')?.value || '';
      const jabatanKlien = document.getElementById('pemberi_tugas_jabatan')?.value || '';
      const kontakKlien = document.getElementById('pemberi_tugas_kontak')?.value || '';
      const emailKlien = document.getElementById('pemberi_tugas_email')?.value || '';

      const inpA = document.getElementById('pengguna_laporan_a');
      const inpAAlamat = document.getElementById('pengguna_laporan_a_alamat');
      const inpAPic = document.getElementById('pengguna_laporan_a_pic');
      const inpAJabatan = document.getElementById('pengguna_laporan_a_jabatan');
      const inpAKontak = document.getElementById('pengguna_laporan_a_kontak');
      const inpAEmail = document.getElementById('pengguna_laporan_a_email');
      const inpABidang = document.getElementById('pengguna_laporan_a_bidang');

      if (inpA) inpA.value = namaKlien;
      if (inpAAlamat) inpAAlamat.value = alamatKlien;
      if (inpAPic) inpAPic.value = picKlien;
      if (inpAJabatan) inpAJabatan.value = jabatanKlien;
      if (inpAKontak) inpAKontak.value = kontakKlien;
      if (inpAEmail) inpAEmail.value = emailKlien;
      if (inpABidang) inpABidang.value = bidangKlien;
    }
    window.syncPenggunaDariPemberi = syncPenggunaDariPemberi;

    function presetSameAsClientPenugasan() {
      const chk = document.getElementById('chk_pengguna_sama_pemberi');
      if (chk) {
        chk.checked = true;
        togglePenggunaSamaDenganPemberi();
      } else {
        syncPenggunaDariPemberi();
      }
    }

    function presetBankDebiturPenugasan() {
      const chk = document.getElementById('chk_pengguna_sama_pemberi');
      if (chk) {
        chk.checked = false;
        togglePenggunaSamaDenganPemberi();
      }

      const namaKlien = document.getElementById('pemberi_tugas_nama')?.value || '';
      const alamatKlien = document.getElementById('pemberi_tugas_alamat')?.value || '';
      const namaDebitur = document.getElementById('debitur_nama')?.value || '';
      
      let alamatDebitur = '';
      if (window.objekRows && window.objekRows.length > 0 && window.objekRows[0].lokasi) {
        alamatDebitur = window.objekRows[0].lokasi;
      }

      const inpA = document.getElementById('pengguna_laporan_a');
      const inpAAlamat = document.getElementById('pengguna_laporan_a_alamat');
      const inpB = document.getElementById('pengguna_laporan_b');
      const inpBAlamat = document.getElementById('pengguna_laporan_b_alamat');

      if (inpA) inpA.value = namaKlien;
      if (inpAAlamat) inpAAlamat.value = alamatKlien;
      if (inpB) inpB.value = namaDebitur;
      if (inpBAlamat) inpBAlamat.value = alamatDebitur;
    }

    function clearPenggunaLaporanPenugasan() {
      const chk = document.getElementById('chk_pengguna_sama_pemberi');
      if (chk) {
        chk.checked = false;
        togglePenggunaSamaDenganPemberi();
      }

      const inpA = document.getElementById('pengguna_laporan_a');
      const inpAAlamat = document.getElementById('pengguna_laporan_a_alamat');
      const inpAPic = document.getElementById('pengguna_laporan_a_pic');
      const inpAJabatan = document.getElementById('pengguna_laporan_a_jabatan');
      const inpAKontak = document.getElementById('pengguna_laporan_a_kontak');
      const inpAEmail = document.getElementById('pengguna_laporan_a_email');
      const inpABidang = document.getElementById('pengguna_laporan_a_bidang');

      const inpB = document.getElementById('pengguna_laporan_b');
      const inpBAlamat = document.getElementById('pengguna_laporan_b_alamat');

      [inpA, inpAAlamat, inpAPic, inpAJabatan, inpAKontak, inpAEmail, inpABidang, inpB, inpBAlamat].forEach(el => {
        if (el) el.value = '';
      });
    }

    function handleCopyPengguna() {
      presetSameAsClientPenugasan();
    }
`;

html = html.substring(0, idxPresetStart) + newPresetCode + html.substring(idxPresetEnd);
console.log('✓ preset & toggle Pengguna Laporan berhasil diupdate.');

// ============================================================================
// 5. UPDATE SUBMIT NON-ADMIN: submitPermintaanAwalNonAdmin
// ============================================================================
console.log('5. Menambahkan submitPermintaanAwalNonAdmin ke handleFormSubmit...');

const oldSubmitGuardStart = "      // Guard: Penilai dan Reviewer tidak diizinkan membuat JO";
const oldSubmitGuardEndMarker = "      // Guard Anti-Double: Blokir keras jika nomor duplikat";
const idxGuardStart = html.indexOf(oldSubmitGuardStart);
const idxGuardEnd = html.indexOf(oldSubmitGuardEndMarker, idxGuardStart);

if (idxGuardStart === -1 || idxGuardEnd === -1) {
  console.error('ERROR: Marker guard handleFormSubmit tidak ditemukan!');
  process.exit(1);
}

const newNonAdminSubmitGuard = `      // ALUR PERAN KHUSUS (PRIORITAS 1):
      // Marketing, Surveyor, dan Penilai Beregister mengirim Permintaan Awal (bukan nomor SPK/JO resmi)
      if (userSession.role === 'MARKETING' || userSession.role === 'SURVEYOR' || userSession.role === 'PENILAI') {
        await submitPermintaanAwalNonAdmin();
        return;
      }
`;

html = html.substring(0, idxGuardStart) + newNonAdminSubmitGuard + html.substring(idxGuardEnd);

// Tambahkan implementasi fungsi submitPermintaanAwalNonAdmin
const submitPermintaanNonAdminFunction = `
    async function submitPermintaanAwalNonAdmin() {
      const btnSubmit = document.getElementById('btn-submit-form');
      const labelSubmit = document.getElementById('label-btn-submit');
      const origText = labelSubmit ? labelSubmit.textContent : 'Kirim Permintaan';

      if (btnSubmit) {
        btnSubmit.disabled = true;
        if (labelSubmit) labelSubmit.textContent = 'Mengirim Permintaan...';
      }

      try {
        const pNama = (document.getElementById('pengaju_nama_display')?.value || userSession.displayName || 'Pengaju').trim();
        const pNik = (document.getElementById('pengaju_nik_input')?.value || '-').trim();
        const pJabatan = (document.getElementById('pengaju_jabatan_input')?.value || userSession.role).trim();
        const pEmail = (document.getElementById('pengaju_email_display')?.value || '').trim();
        const pWa = (document.getElementById('pengaju_wa_display')?.value || '').trim();

        const namaKlien = (document.getElementById('pemberi_tugas_nama')?.value || '').trim();
        const alamatKlien = (document.getElementById('pemberi_tugas_alamat')?.value || '').trim();
        const picKlien = (document.getElementById('pemberi_tugas_pic')?.value || '').trim();
        const kontakKlien = (document.getElementById('pemberi_tugas_kontak')?.value || '').trim();
        const emailKlien = (document.getElementById('pemberi_tugas_email')?.value || '').trim();
        const bidangKlien = (document.getElementById('pemberi_tugas_bidang')?.value || '').trim();

        const namaDebitur = (document.getElementById('debitur_nama')?.value || '-').trim();
        const cpDebitur = (document.getElementById('debitur_cp')?.value || '').trim();

        const rawTujuan = typeof getResolvedTujuanPenilaian === 'function' ? getResolvedTujuanPenilaian() : (document.getElementById('tujuan_penilaian')?.value || 'Agunan Bank');
        const selObjek = (document.getElementById('jenis_objek_spk')?.value || 'Properti').trim();

        const isBelumDisepakati = document.getElementById('chk_biaya_belum_disepakati')?.checked || false;
        const honorarium = parseFloat(document.getElementById('biaya_honorarium')?.value) || parseFloat(document.getElementById('biaya_dpp')?.value) || 0;
        const transport = parseFloat(document.getElementById('biaya_transportasi')?.value) || 0;
        const akomodasi = parseFloat(document.getElementById('biaya_akomodasi')?.value) || 0;
        const operasional = parseFloat(document.getElementById('biaya_operasional_lain')?.value) || 0;
        const dpp = parseFloat(document.getElementById('biaya_dpp')?.value) || 0;
        const ppn = parseFloat(document.getElementById('biaya_ppn')?.value) || 0;
        const total = parseFloat(document.getElementById('biaya_total')?.value) || 0;

        const payload = {
          pengaju_nama: pNama,
          pengaju_nik: pNik,
          pengaju_jabatan: pJabatan,
          pengaju_email: pEmail,
          pengaju_wa: pWa,
          pemberi_tugas_nama: namaKlien,
          pemberi_tugas_alamat: alamatKlien,
          pemberi_tugas_pic: picKlien,
          pemberi_tugas_kontak: kontakKlien,
          pemberi_tugas_email: emailKlien,
          pemberi_tugas_bidang: bidangKlien,
          pengguna_laporan_a: (document.getElementById('pengguna_laporan_a')?.value || namaKlien).trim(),
          pengguna_laporan_a_alamat: (document.getElementById('pengguna_laporan_a_alamat')?.value || alamatKlien).trim(),
          pengguna_laporan_a_pic: (document.getElementById('pengguna_laporan_a_pic')?.value || picKlien).trim(),
          pengguna_laporan_a_jabatan: (document.getElementById('pengguna_laporan_a_jabatan')?.value || '').trim(),
          pengguna_laporan_a_kontak: (document.getElementById('pengguna_laporan_a_kontak')?.value || kontakKlien).trim(),
          pengguna_laporan_a_email: (document.getElementById('pengguna_laporan_a_email')?.value || emailKlien).trim(),
          pengguna_laporan_a_bidang: (document.getElementById('pengguna_laporan_a_bidang')?.value || bidangKlien).trim(),
          pengguna_laporan_b: (document.getElementById('pengguna_laporan_b')?.value || '').trim(),
          pengguna_laporan_b_alamat: (document.getElementById('pengguna_laporan_b_alamat')?.value || '').trim(),
          pengguna_sama_pemberi: document.getElementById('chk_pengguna_sama_pemberi')?.checked || false,
          debitur_nama: namaDebitur,
          debitur_cp: cpDebitur,
          tujuan_penilaian: rawTujuan,
          jenis_objek: selObjek,
          kantor_wilayah: userSession.wilayah || 'Kantor Pusat Jakarta',
          biaya_belum_disepakati: isBelumDisepakati,
          biaya_honorarium: honorarium,
          biaya_transportasi: transport,
          status_transportasi: document.getElementById('status_transportasi')?.value || 'INCLUDED',
          biaya_akomodasi: akomodasi,
          status_akomodasi: document.getElementById('status_akomodasi')?.value || 'INCLUDED',
          biaya_operasional_lain: operasional,
          status_operasional_lain: document.getElementById('status_operasional_lain')?.value || 'INCLUDED',
          biaya_dpp: dpp,
          biaya_ppn: ppn,
          biaya_total: total,
          objek_rows: window.objekRows || []
        };

        const res = await fetch('/nolap-data-handler.php?action=submitPermintaanAwalJO', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (!data.success) {
          throw new Error(data.error || 'Gagal menyampaikan permintaan.');
        }

        const noRef = data.noPermintaan;
        // Simpan ke local database browser agar langsung terlihat di Tab 2 Permintaan Saya
        const localReq = {
          id: noRef,
          noPermintaan: noRef,
          nomor_adm: noRef,
          nomor_lp: '[Menunggu Verifikasi Admin]',
          tanggal_surat: new Date().toISOString().split('T')[0],
          debitur_nama: namaDebitur,
          pemberi_tugas_nama: namaKlien,
          kantor_wilayah: userSession.wilayah || 'Kantor Pusat Jakarta',
          status: 'MENUNGGU_VERIFIKASI_ADMIN',
          status_approval: 'MENUNGGU_VERIFIKASI_ADMIN',
          role_pengaju: userSession.role,
          pengaju_nama: pNama,
          catatan_admin: 'Menunggu verifikasi dan penyusunan administrasi oleh Staf Admin.',
          objek_rows: window.objekRows || [],
          biaya_total: total,
          biaya_dpp: dpp
        };

        projectDatabase.unshift(localReq);

        alert(\`🎉 PERMINTAAN AWAL BERHASIL DIKIRIM!\n\nNomor Referensi: \${noRef}\nStatus: MENUNGGU VERIFIKASI ADMIN\n\nPermintaan penugasan Anda telah dicatat ke server. Staf Admin akan memverifikasi dan menyusun formulir administrasi resmi SPI 103.\`);

        gantiTab(2);
      } catch (err) {
        alert('Gagal mengirim permintaan: ' + err.message);
      } finally {
        if (btnSubmit) {
          btnSubmit.disabled = false;
          if (labelSubmit) labelSubmit.textContent = origText;
        }
      }
    }
    window.submitPermintaanAwalNonAdmin = submitPermintaanAwalNonAdmin;
`;

html = html.replace('function bangunDraftDariForm() {', submitPermintaanNonAdminFunction + '\n    function bangunDraftDariForm() {');
console.log('✓ submitPermintaanAwalNonAdmin berhasil dipasang.');

fs.writeFileSync('portal-penugasan-jo.html', html, 'utf8');
console.log('✓ Seluruh perubahan JS portal-penugasan-jo.html berhasil disimpan.');
