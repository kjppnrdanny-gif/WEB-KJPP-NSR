const fs = require('fs');

console.log('1. Memperbarui renderChecklistMitigasiAwal di portal-penugasan-jo.html...');
let joHtml = fs.readFileSync('portal-penugasan-jo.html', 'utf8');

const oldRenderChecklist = `    // Generator Checklist Dinamis Berdasarkan Maksud & Tujuan Penilaian
    function renderChecklistMitigasiAwal(tujuan) {
      const container = document.getElementById('g1-checklist-container');
      const badge = document.getElementById('g1-kategori-badge');
      if (!container) return;

      const t = String(tujuan || '').toLowerCase();
      let labelKategori = 'Agunan Bank';
      let items = [
        { id: 'c_bebas_konflik', label: 'Bebas benturan kepentingan finansial atau hubungan afiliasi dengan debitur/klien.' },
        { id: 'c_izin_aktif', label: 'Kesesuaian izin Penilai Publik (P/PS) dan ketiadaan pembekuan izin Kemenkeu.' },
        { id: 'c_sla_wajar', label: 'Jadwal penyelesaian wajar dan tidak dipaksakan oleh klien.' }
      ];

      if (t.includes('pengadaan tanah') || t.includes('spi 204') || t.includes('ganti kerugian')) {
        labelKategori = 'Pengadaan Tanah (SPI 204)';
        items.push({ id: 'c_spi204', label: 'Kepatuhan SPI 204 dan kelengkapan Dokumen Perencanaan Pengadaan Tanah (DPPT).' });
        items.push({ id: 'c_penlok', label: 'Kesesuaian SK Penetapan Lokasi (Penlok) dan validitas peta bidang BPN.' });
      } else if (t.includes('laporan keuangan') || t.includes('psak') || t.includes('revaluasi')) {
        labelKategori = 'Lapkeu PSAK';
        items.push({ id: 'c_psak', label: 'Kesesuaian Standar Akuntansi Keuangan (PSAK 216 / PSAK 240 Nilai Wajar).' });
        items.push({ id: 'c_kebijakan_akuntansi', label: 'Kesesuaian model revaluasi dengan kebijakan akuntansi entitas pelapor.' });
      } else if (t.includes('jual beli') || t.includes('transaksi')) {
        labelKategori = 'Jual Beli';
        items.push({ id: 'c_verif_pasar', label: 'Verifikasi kondisi fisik & yuridis serta ketiadaan paksaan harga para pihak.' });
      } else if (t.includes('mesin') || t.includes('peralatan') || t.includes('industri')) {
        labelKategori = 'Mesin Industri';
        items.push({ id: 'c_nameplate', label: 'Verifikasi pelat nama (nameplate), kondisi operasional, dan riwayat pemeliharaan.' });
      } else {
        labelKategori = 'Agunan Bank';
        items.push({ id: 'c_pojk', label: 'Kepatuhan kriteria agunan POJK dan kelayakan pasar sekunder.' });
      }

      if (badge) badge.textContent = labelKategori;
      container.innerHTML = items.map(it => \`
        <label class="flex items-start gap-2.5 p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition cursor-pointer">
          <input type="checkbox" id="\${it.id}" checked class="mt-0.5 rounded accent-teal-400">
          <span class="text-slate-300 leading-snug">\${it.label}</span>
        </label>
      \`).join('');
    }`;

const newRenderChecklist = `    // Generator Checklist Dinamis Berdasarkan Maksud & Tujuan Penilaian (Integrated Smart Risk Mitigation)
    async function renderChecklistMitigasiAwal(tujuan) {
      const container = document.getElementById('g1-checklist-container');
      const badge = document.getElementById('g1-kategori-badge');
      if (!container) return;

      const t = String(tujuan || '').toLowerCase();
      let labelKategori = 'Agunan Bank';
      if (t.includes('pengadaan tanah') || t.includes('spi 204') || t.includes('ganti kerugian')) {
        labelKategori = 'Pengadaan Tanah (SPI 204)';
      } else if (t.includes('laporan keuangan') || t.includes('psak') || t.includes('revaluasi')) {
        labelKategori = 'Lapkeu PSAK';
      } else if (t.includes('jual beli') || t.includes('transaksi')) {
        labelKategori = 'Jual Beli';
      } else if (t.includes('mesin') || t.includes('peralatan') || t.includes('industri')) {
        labelKategori = 'Mesin Industri';
      }
      if (badge) badge.textContent = labelKategori;

      // Coba panggil API checklist dinamis dari nolap-data-handler.php
      let items = [];
      try {
        const selObjek = document.getElementById('jenis_objek')?.value || 'Tanah dan Bangunan';
        const res = await fetch(\`/nolap-data-handler.php?action=getDynamicRiskChecklist&tujuanPenilaian=\${encodeURIComponent(tujuan)}&jenisObjek=\${encodeURIComponent(selObjek)}\`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.checklist) && json.checklist.length > 0) {
            items = json.checklist;
          }
        }
      } catch (_) {}

      // Fallback jika offline atau endpoint belum selesai memuat
      if (!items || items.length === 0) {
        items = [
          { risk_id: 'R1-IND-01', risk_name: 'Bebas Benturan Kepentingan', severity: 'CRITICAL', question: 'Tim penilai bebas dari benturan kepentingan finansial atau hubungan afiliasi.', spi_kepi_ref: { code: 'KEPI Butir 3.1 & 3.2' }, legal_ref: { code: 'PMK 101/2014 Pasal 30' }, allowed_answers: ['YA', 'TIDAK', 'BELUM DIVERIFIKASI', 'TIDAK RELEVAN'], default_answer: 'YA' },
          { risk_id: 'R1-COMP-03', risk_name: 'Kesesuaian Izin Penilai', severity: 'CRITICAL', question: 'Penilai Publik berizin aktif sesuai klasifikasi (PS/P) dan tidak dalam pembekuan.', spi_kepi_ref: { code: 'KEPI Butir 3.3' }, legal_ref: { code: 'PMK 101/2014 Pasal 27' }, allowed_answers: ['YA', 'TIDAK', 'BELUM DIVERIFIKASI', 'TIDAK RELEVAN'], default_answer: 'YA' },
          { risk_id: 'R3-TUJ-01', risk_name: 'Kesesuaian Maksud & Tujuan', severity: 'HIGH', question: 'Maksud dan tujuan penilaian ditetapkan spesifik sesuai batasan hukum dan SPI 103.', spi_kepi_ref: { code: 'SPI 103 Klausul 5.1' }, legal_ref: { code: 'POJK 40/2019' }, allowed_answers: ['YA', 'TIDAK', 'BELUM DIVERIFIKASI', 'TIDAK RELEVAN'], default_answer: 'YA' },
          { risk_id: 'R4-DATA-01', risk_name: 'Kecukupan Akses Data & Survei', severity: 'HIGH', question: 'Klien berkomitmen menyediakan dokumen legalitas dan akses inspeksi fisik lapangan.', spi_kepi_ref: { code: 'SPI 104 Klausul 5.2' }, legal_ref: { code: 'PMK 101/2014' }, allowed_answers: ['YA', 'TIDAK', 'BELUM DIVERIFIKASI', 'TIDAK RELEVAN'], default_answer: 'YA' }
        ];
      }

      container.innerHTML = items.map((it, idx) => {
        const sevColor = it.severity === 'CRITICAL' ? 'bg-rose-950/40 text-rose-300 border-rose-800/50' : (it.severity === 'HIGH' ? 'bg-amber-950/40 text-amber-300 border-amber-800/50' : 'bg-sky-950/40 text-sky-300 border-sky-800/50');
        const spiText = it.spi_kepi_ref?.code ? \`<span class="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-teal-300 border border-teal-500/30">📜 \${it.spi_kepi_ref.code}</span>\` : '';
        const legalText = it.legal_ref?.code || it.legal_ref?.title ? \`<span class="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-amber-300 border border-amber-500/30">⚖️ \${it.legal_ref.code || it.legal_ref.title}</span>\` : '';

        return \`
          <div class="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 hover:border-slate-700 transition">
            <div class="flex flex-wrap items-center justify-between gap-1.5">
              <div class="flex items-center gap-1.5">
                <span class="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">\${it.risk_id}</span>
                <strong class="text-white text-xs">\${it.risk_name}</strong>
              </div>
              <span class="px-2 py-0.5 rounded-full text-[9px] font-bold border \${sevColor}">\${it.severity}</span>
            </div>
            <p class="text-[11px] text-slate-300 leading-snug">\${it.question || it.objective}</p>
            <div class="flex flex-wrap items-center gap-1.5 pt-1">
              \${spiText}
              \${legalText}
            </div>
            <div class="flex flex-wrap items-center gap-3 pt-1 border-t border-slate-800/60 text-[11px]">
              <label class="flex items-center gap-1 text-emerald-400 cursor-pointer">
                <input type="radio" name="g1_ans_\${it.risk_id}" value="YA" checked class="accent-emerald-400"> YA (Aman)
              </label>
              <label class="flex items-center gap-1 text-rose-400 cursor-pointer">
                <input type="radio" name="g1_ans_\${it.risk_id}" value="TIDAK" class="accent-rose-400"> TIDAK (Tinggi)
              </label>
              <label class="flex items-center gap-1 text-amber-400 cursor-pointer">
                <input type="radio" name="g1_ans_\${it.risk_id}" value="BELUM DIVERIFIKASI" class="accent-amber-400"> BELUM DIVERIFIKASI
              </label>
            </div>
          </div>
        \`;
      }).join('');
    }`;

const normalize = s => s.replace(/\r\n/g, '\n');
if (normalize(joHtml).includes(normalize(oldRenderChecklist))) {
  const isCrlf = joHtml.includes('\r\n');
  const target = isCrlf ? oldRenderChecklist.replace(/\n/g, '\r\n') : oldRenderChecklist;
  const rep = isCrlf ? newRenderChecklist.replace(/\n/g, '\r\n') : newRenderChecklist;
  joHtml = joHtml.replace(target, rep);
  fs.writeFileSync('portal-penugasan-jo.html', joHtml, 'utf8');
  console.log('✔ portal-penugasan-jo.html berhasil diperbarui dengan Dynamic Risk Engine!');
} else {
  console.error('Target oldRenderChecklist tidak ditemukan di portal-penugasan-jo.html');
  process.exit(1);
}

console.log('\n2. Memperbarui Delta Analysis di portal-nolap.html...');
let nolapHtml = fs.readFileSync('portal-nolap.html', 'utf8');

const oldDeltaBlock = `        <div class="pt-2 border-t border-slate-800">
          <label class="block font-semibold text-slate-300 mb-1">Delta Analysis (Kesesuaian Fisik vs Yuridis &amp; Deviasi Luas):</label>
          <label class="flex items-start gap-2 p-2 rounded-xl bg-rose-950/20 border border-rose-900/50 mb-2 cursor-pointer">
            <input type="checkbox" id="g2-delta-deviasi" class="mt-0.5 accent-rose-500 rounded">
            <div>
              <strong class="text-rose-300 block font-bold">Terdapat Deviasi Material Tanpa Justifikasi</strong>
              <span class="text-[10px] text-slate-400 block">Perbedaan luas fisik &gt;10% dibanding sertifikat tanpa penjelasan BPN (Memicu HOLD ESKALASI).</span>
            </div>
          </label>
          <textarea id="g2-delta-keterangan" rows="2" placeholder="Keterangan hasil rekonsiliasi luas fisik vs yuridis dan penjelasan asumsi khusus jika ada..." class="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-amber-400"></textarea>
        </div>`;

const newDeltaBlock = `        <div class="pt-2 border-t border-slate-800 space-y-2">
          <div class="flex items-center justify-between">
            <label class="block font-semibold text-slate-300 text-xs">Delta Analysis — Uji Deviasi Luas Fisik vs Yuridis (SPI 105 &amp; Master D):</label>
            <span id="g2-delta-badge" class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">Deviasi: 0%</span>
          </div>
          <div class="grid grid-cols-2 gap-2 text-xs">
            <div>
              <label class="block text-[11px] text-slate-400 mb-1">Luas Yuridis Sertifikat (m²):</label>
              <input type="number" step="0.01" id="g2-luas-yuridis" value="1000" oninput="hitungDeviasiLuasGerbang2()" class="w-full h-8 px-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-amber-400">
            </div>
            <div>
              <label class="block text-[11px] text-slate-400 mb-1">Luas Fisik Hasil Ukur (m²):</label>
              <input type="number" step="0.01" id="g2-luas-fisik" value="1000" oninput="hitungDeviasiLuasGerbang2()" class="w-full h-8 px-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-amber-400">
            </div>
          </div>
          <div id="g2-delta-alert-box" class="p-2 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-300">
            ℹ️ <span id="g2-delta-alert-text">Luas fisik sesuai dokumen yuridis. Evaluasi konsistensi normal.</span>
          </div>
          <label class="flex items-start gap-2 p-2 rounded-xl bg-rose-950/20 border border-rose-900/50 cursor-pointer">
            <input type="checkbox" id="g2-delta-deviasi" class="mt-0.5 accent-rose-500 rounded">
            <div>
              <strong class="text-rose-300 block font-bold text-xs">Terdapat Deviasi Material Tanpa Justifikasi</strong>
              <span class="text-[10px] text-slate-400 block">Centang apabila terdapat temuan material yang belum didukung BAI atau penjelasan BPN.</span>
            </div>
          </label>
          <textarea id="g2-delta-keterangan" rows="2" placeholder="Penjelasan rekonsiliasi luas fisik vs yuridis, dampak terhadap nilai pasar, dan klausul pengungkapan draf laporan..." class="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-amber-400"></textarea>
        </div>`;

if (normalize(nolapHtml).includes(normalize(oldDeltaBlock))) {
  const isCrlf = nolapHtml.includes('\r\n');
  const target = isCrlf ? oldDeltaBlock.replace(/\n/g, '\r\n') : oldDeltaBlock;
  const rep = isCrlf ? newDeltaBlock.replace(/\n/g, '\r\n') : newDeltaBlock;
  nolapHtml = nolapHtml.replace(target, rep);

  // Tambahkan fungsi kalkulator hitungDeviasiLuasGerbang2 jika belum ada
  const scriptHook = 'function eksekusiSubmitGerbang2Modal(e) {';
  const calcCode = `function hitungDeviasiLuasGerbang2() {
      const y = parseFloat(document.getElementById('g2-luas-yuridis')?.value) || 0;
      const f = parseFloat(document.getElementById('g2-luas-fisik')?.value) || 0;
      const badge = document.getElementById('g2-delta-badge');
      const alertBox = document.getElementById('g2-delta-alert-box');
      const alertText = document.getElementById('g2-delta-alert-text');
      const devCheck = document.getElementById('g2-delta-deviasi');
      if (!badge || !alertBox || !alertText) return;

      if (y <= 0 || f <= 0) {
        badge.textContent = 'Deviasi: -';
        return;
      }
      const persen = Math.round((Math.abs(f - y) / y) * 10000) / 100;
      badge.textContent = 'Deviasi: ' + persen + '%';

      if (persen <= 5) {
        badge.className = 'px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-950/60 text-emerald-300 border border-emerald-800/60';
        alertBox.className = 'p-2 rounded-xl bg-emerald-950/20 border border-emerald-800/40 text-[11px] text-emerald-300';
        alertText.innerHTML = '✔ <strong>Konsisten (Deviasi <= 5%):</strong> Perbedaan dalam batas wajar toleransi ukur. Cantumkan catatan kaki pada laporan.';
        if (devCheck) devCheck.checked = false;
      } else if (persen <= 15) {
        badge.className = 'px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-950/60 text-amber-300 border border-amber-800/60';
        alertBox.className = 'p-2 rounded-xl bg-amber-950/30 border border-amber-700/50 text-[11px] text-amber-300';
        alertText.innerHTML = '⚠️ <strong>Deviasi Sedang (' + persen + '%):</strong> Sesuai SPI 105 & Master D, wajib melampirkan Berita Acara Inspeksi (BAI) dan penjelasan pengungkapan nilai.';
      } else {
        badge.className = 'px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-950/60 text-rose-300 border border-rose-800/60';
        alertBox.className = 'p-2 rounded-xl bg-rose-950/40 border border-rose-700/60 text-[11px] text-rose-300';
        alertText.innerHTML = '🚨 <strong>DEVIASI MATERIAL (' + persen + '% > 15%):</strong> Memerlukan peninjauan ulang Lingkup Penugasan (SPI 103 Klausul 5.1). Sistem akan memicu status HOLD_MATERIAL_CHANGE.';
        if (devCheck) devCheck.checked = true;
      }
    }
    `;

  if (!nolapHtml.includes('function hitungDeviasiLuasGerbang2')) {
    nolapHtml = nolapHtml.replace(scriptHook, calcCode + scriptHook);
  }

  fs.writeFileSync('portal-nolap.html', nolapHtml, 'utf8');
  console.log('✔ portal-nolap.html berhasil diperbarui dengan Delta Analysis Calculator!');
} else {
  console.error('Target oldDeltaBlock tidak ditemukan di portal-nolap.html');
  process.exit(1);
}
