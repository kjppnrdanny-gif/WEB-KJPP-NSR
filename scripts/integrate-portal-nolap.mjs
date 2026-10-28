/**
 * Integrasi Gerbang 2 Dual Smart Mitigation Gate ke portal-nolap.html
 */
import fs from 'node:fs';

const targetPath = 'portal-nolap.html';
let content = fs.readFileSync(targetPath, 'utf8');

console.log('Integrating Gerbang 2 into portal-nolap.html...');

// 1. Tambahkan Modal Pengajuan Gerbang 2 dan Modal Review Gerbang 2
const dualGateModalsHtml = `
  <!-- MODAL PENGAJUAN GERBANG 2: NOLAP & SMART MITIGASI AKHIR -->
  <div id="modal-submit-gerbang2" class="hidden fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
    <div class="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl text-xs">
      <div class="flex items-center justify-between border-b border-slate-800 pb-3">
        <div>
          <h3 class="text-sm font-black text-amber-400 uppercase tracking-wide">Pengajuan NoLap &amp; Smart Mitigasi Akhir (Gerbang 2)</h3>
          <p class="text-[11px] text-slate-400 mt-0.5">Tautkan Lingkup Penugasan terverifikasi dan lengkapi bukti draf laporan.</p>
        </div>
        <button type="button" onclick="tutupModalSubmitGerbang2()" class="text-slate-400 hover:text-white p-1 rounded-lg">✕</button>
      </div>

      <form id="form-modal-g2" onsubmit="eksekusiSubmitGerbang2Modal(event)" class="space-y-3">
        <div>
          <label class="block font-semibold text-slate-300 mb-1">ID Penugasan Resmi (Gerbang 1 Terverifikasi) <span class="text-rose-400">*</span></label>
          <input type="text" id="g2-id-penugasan" required placeholder="Contoh: NSR-2026-BDG-0012" class="w-full h-9 px-3 rounded-xl bg-slate-950 border border-slate-700 text-amber-300 font-mono font-bold text-xs focus:outline-none focus:border-amber-400">
          <p class="text-[10px] text-slate-400 mt-1">Hanya penugasan yang telah lulus verifikasi Gerbang 1 (SIAP_TERBIT_LP / LP_DITERBITKAN) yang dapat diproses.</p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block font-semibold text-slate-300 mb-1">URL Draf Laporan Penilaian (Google Drive) <span class="text-rose-400">*</span></label>
            <input type="url" id="g2-url-draf" required placeholder="https://drive.google.com/..." class="w-full h-9 px-3 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-amber-400">
          </div>
          <div>
            <label class="block font-semibold text-slate-300 mb-1">URL Berita Acara Inspeksi / BAI (PDF) <span class="text-rose-400">*</span></label>
            <input type="url" id="g2-url-bai" required placeholder="https://drive.google.com/..." class="w-full h-9 px-3 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-amber-400">
          </div>
        </div>

        <div class="pt-2 border-t border-slate-800">
          <label class="block font-semibold text-slate-300 mb-2">Checklist Smart Mitigasi Akhir (QC &amp; Kertas Kerja):</label>
          <div class="space-y-2">
            <label class="flex items-start gap-2 p-2 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
              <input type="checkbox" id="g2-ceklis-geotag" checked required class="mt-0.5 accent-teal-400 rounded">
              <span class="text-slate-300">Foto objek lengkap dengan koordinat geotagging valid &amp; tanggal survei riil.</span>
            </label>
            <label class="flex items-start gap-2 p-2 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
              <input type="checkbox" id="g2-ceklis-pembanding" checked required class="mt-0.5 accent-teal-400 rounded">
              <span class="text-slate-300">Minimal 3 data pembanding terkonfirmasi dengan narasumber independen.</span>
            </label>
            <label class="flex items-start gap-2 p-2 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
              <input type="checkbox" id="g2-ceklis-kertas-kerja" checked required class="mt-0.5 accent-teal-400 rounded">
              <span class="text-slate-300">Kertas kerja perhitungan nilai telah diperiksa silang (cross-checked).</span>
            </label>
          </div>
        </div>

        <div class="pt-2 border-t border-slate-800">
          <label class="block font-semibold text-slate-300 mb-1">Delta Analysis (Kesesuaian Fisik vs Yuridis &amp; Deviasi Luas):</label>
          <label class="flex items-start gap-2 p-2 rounded-xl bg-rose-950/20 border border-rose-900/50 mb-2 cursor-pointer">
            <input type="checkbox" id="g2-delta-deviasi" class="mt-0.5 accent-rose-500 rounded">
            <div>
              <strong class="text-rose-300 block font-bold">Terdapat Deviasi Material Tanpa Justifikasi</strong>
              <span class="text-[10px] text-slate-400 block">Perbedaan luas fisik &gt;10% dibanding sertifikat tanpa penjelasan BPN (Memicu HOLD ESKALASI).</span>
            </div>
          </label>
          <textarea id="g2-delta-keterangan" rows="2" placeholder="Keterangan hasil rekonsiliasi luas fisik vs yuridis dan penjelasan asumsi khusus jika ada..." class="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-amber-400"></textarea>
        </div>

        <div class="pt-3 flex items-center justify-between gap-3 border-t border-slate-800">
          <button type="button" onclick="tutupModalSubmitGerbang2()" class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition">Batal</button>
          <button type="submit" class="px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black shadow-lg transition">Kirim ke Kepala SPM (Danny Taufik)</button>
        </div>
      </form>
    </div>
  </div>

  <!-- MODAL REVIEW GERBANG 2: SPM & DIVTEK -->
  <div id="modal-review-gerbang2" class="hidden fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
    <div class="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl text-xs">
      <div class="flex items-center justify-between border-b border-slate-800 pb-3">
        <div>
          <h3 id="modal-g2-title" class="text-sm font-black text-amber-400 uppercase tracking-wide">Review NoLap &amp; Mitigasi Akhir</h3>
          <p id="modal-g2-subtitle" class="text-[11px] text-slate-400 mt-0.5">ID: -</p>
        </div>
        <button type="button" onclick="tutupModalReviewGerbang2()" class="text-slate-400 hover:text-white p-1 rounded-lg">✕</button>
      </div>

      <div id="modal-g2-body" class="space-y-3">
        <!-- Render detail dinamis -->
      </div>

      <div>
        <label class="block font-semibold text-slate-300 mb-1">Catatan Telaah Evaluasi Akhir <span class="text-rose-400">*</span></label>
        <textarea id="modal-g2-catatan" rows="3" class="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-amber-400" placeholder="Ketik catatan evaluasi hasil penilaian akhir..."></textarea>
      </div>

      <div class="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-800">
        <button type="button" onclick="tutupModalReviewGerbang2()" class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition">Batal</button>
        <div class="flex items-center gap-2">
          <button type="button" onclick="eksekusiReviewGerbang2Submit('REVISI')" class="px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold transition">Minta Revisi</button>
          <button type="button" onclick="eksekusiReviewGerbang2Submit('TOLAK')" class="px-4 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 font-bold transition">Tolak</button>
          <button type="button" onclick="eksekusiReviewGerbang2Submit('SETUJU')" class="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black shadow-lg transition">Setujui Mitigasi Akhir</button>
        </div>
      </div>
    </div>
  </div>
`;

if (!content.includes('id="modal-submit-gerbang2"')) {
  content = content.replace(
    '</body>',
    dualGateModalsHtml + '\n</body>'
  );
  console.log('Dual Gate Gerbang 2 Modals added before body close.');
}

// 2. Tambahkan tombol "Ajukan Gerbang 2" di header panel-pengajuan atau panel-spm
const btnBukaG2Snippet = `
  <div class="p-4 rounded-2xl bg-gradient-to-r from-teal-950/60 to-slate-900 border border-teal-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xl mb-4">
    <div>
      <div class="flex items-center gap-2 mb-0.5">
        <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30 font-mono">GERBANG 2 OPINI NSR</span>
        <span class="text-xs font-bold text-white">Smart Mitigasi Akhir &amp; Penetapan NoLap</span>
      </div>
      <p class="text-[11px] text-slate-400">Pengajuan nomor laporan definitif terhubung dengan Lingkup Penugasan terverifikasi dan melalui telaah berjenjang SPM &rarr; Divtek &rarr; Penilai Publik.</p>
    </div>
    <button type="button" onclick="bukaModalSubmitGerbang2()" class="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-xs shrink-0 shadow-lg shadow-teal-500/20 transition flex items-center gap-1.5 cursor-pointer">
      <span>🚀</span>
      <span>Ajukan Mitigasi Akhir (Gerbang 2)</span>
    </button>
  </div>
`;

if (!content.includes('GERBANG 2 OPINI NSR')) {
  content = content.replace(
    '<div id="panel-spm" class="hidden space-y-6">',
    '<div id="panel-spm" class="hidden space-y-6">\n' + btnBukaG2Snippet
  );
  console.log('Button Ajukan Gerbang 2 added to panel-spm.');
}

// 3. Tambahkan JS Engine Gerbang 2 di bagian bawah script portal-nolap.html
const g2JsEngine = `
  <script>
    // =========================================================================
    // DUAL SMART MITIGATION GATE ENGINE (GERBANG 2 FRONTEND LOGIC)
    // =========================================================================

    const DUAL_GATE_NOLAP_API = '/api/nolap-data-proxy';
    let g2ActiveReviewItem = null;
    let g2ActiveReviewRole = null;

    function bukaModalSubmitGerbang2(idPenugasan = '') {
      if (idPenugasan) {
        document.getElementById('g2-id-penugasan').value = idPenugasan;
      }
      document.getElementById('modal-submit-gerbang2').classList.remove('hidden');
    }

    function tutupModalSubmitGerbang2() {
      document.getElementById('modal-submit-gerbang2')?.classList.add('hidden');
    }

    async function eksekusiSubmitGerbang2Modal(e) {
      e.preventDefault();
      const auth = window.CURRENT_AUTH_SESSION || (typeof dapatkanSesiLogin === 'function' ? dapatkanSesiLogin() : null) || userSession;
      const idPenugasan = document.getElementById('g2-id-penugasan').value.trim();
      const urlDraf = document.getElementById('g2-url-draf').value.trim();
      const urlBai = document.getElementById('g2-url-bai').value.trim();
      const deviasi = document.getElementById('g2-delta-deviasi').checked;
      const ketDelta = document.getElementById('g2-delta-keterangan').value.trim();

      const payload = {
        idPenugasan: idPenugasan,
        drafLaporanUrl: urlDraf,
        baiUrl: urlBai,
        checklistAkhir: {
          fotoGeotagLengkap: document.getElementById('g2-ceklis-geotag').checked,
          tigaPembandingTersedia: document.getElementById('g2-ceklis-pembanding').checked,
          kertasKerjaTereview: document.getElementById('g2-ceklis-kertas-kerja').checked
        },
        deltaAnalysis: {
          deviasiMaterialTanpaJustifikasi: deviasi,
          keterangan: ketDelta || 'Luas fisik sesuai yuridis.'
        }
      };

      try {
        const res = await fetch(\`\${DUAL_GATE_NOLAP_API}?action=submitGerbang2Akhir\`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-NSR-Token': auth?.token || auth?.sessionToken || 'NSR-ADMIN-PUSAT-2026'
          },
          body: JSON.stringify(payload)
        });
        const json = await res.json();
        if (json.success) {
          alert('Berhasil! Pengajuan NoLap & Smart Mitigasi Akhir telah didaftarkan.\\nStatus saat ini: ' + json.status);
          if (json.waManualLink) {
            const bukaWa = confirm('Buka WhatsApp untuk mengonfirmasi ke Kepala SPM (Danny Taufik)?');
            if (bukaWa) window.open(json.waManualLink, '_blank');
          }
          tutupModalSubmitGerbang2();
          if (typeof muatUlangTabel === 'function') muatUlangTabel();
        } else {
          alert('Gagal: ' + json.error);
        }
      } catch (err) {
        alert('Terjadi kesalahan jaringan: ' + err);
      }
    }

    function bukaModalReviewGerbang2(idPenugasan, role) {
      const auth = window.CURRENT_AUTH_SESSION || (typeof dapatkanSesiLogin === 'function' ? dapatkanSesiLogin() : null) || userSession;
      g2ActiveReviewRole = role || auth?.role;

      fetch(\`\${DUAL_GATE_NOLAP_API}?action=getDualGateDetail&idPenugasan=\${encodeURIComponent(idPenugasan)}\`, {
        headers: { 'X-NSR-Token': auth?.token || auth?.sessionToken || 'NSR-ADMIN-PUSAT-2026' }
      })
      .then(res => res.json())
      .then(json => {
        if (!json.success || !json.record) {
          alert('Data mitigasi akhir tidak ditemukan.');
          return;
        }
        g2ActiveReviewItem = json.record;

        const roleTitle = (g2ActiveReviewRole === 'KEPALA_SPM') ? 'Review SPM Akhir (Danny Taufik, S.H.)' : 'Review Divtek Akhir (Deni Siswandi, S.T.)';
        document.getElementById('modal-g2-title').textContent = roleTitle;
        document.getElementById('modal-g2-subtitle').textContent = \`ID: \${g2ActiveReviewItem.idPenugasan} • Klien: \${g2ActiveReviewItem.namaKlien}\`;

        const body = document.getElementById('modal-g2-body');
        body.innerHTML = \`
          <div class="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5 text-slate-300">
            <div><strong class="text-amber-400">Tujuan:</strong> \${g2ActiveReviewItem.tujuanPenilaian || '-'}</div>
            <div><strong class="text-sky-400">Objek:</strong> \${g2ActiveReviewItem.jenisObjek || '-'}</div>
            <div><strong class="text-teal-400">Penilai Ditunjuk:</strong> \${g2ActiveReviewItem.penugasan?.penilaiPublikDitunjuk || '-'}</div>
            <div><strong class="text-slate-400">Status Gerbang 2:</strong> <span class="font-mono text-emerald-400">\${g2ActiveReviewItem.gerbang2?.status || '-'}</span></div>
            \${g2ActiveReviewItem.gerbang2?.drafLaporanUrl ? \`<div><a href="\${g2ActiveReviewItem.gerbang2.drafLaporanUrl}" target="_blank" class="text-sky-400 underline font-semibold">&bull; Buka Draf Laporan Penilaian (Drive)</a></div>\` : ''}
            \${g2ActiveReviewItem.gerbang2?.baiUrl ? \`<div><a href="\${g2ActiveReviewItem.gerbang2.baiUrl}" target="_blank" class="text-teal-400 underline font-semibold">&bull; Buka Berita Acara Inspeksi (BAI)</a></div>\` : ''}
            \${g2ActiveReviewItem.gerbang2?.deltaAnalysis ? \`<div class="text-[11px] text-slate-400 pt-1 border-t border-slate-800">Delta Analysis: "\${g2ActiveReviewItem.gerbang2.deltaAnalysis.keterangan || '-'}"</div>\` : ''}
            \${g2ActiveReviewItem.gerbang2?.reviewDanny ? \`<div class="text-[11px] text-indigo-300 pt-1 border-t border-slate-800">Review Danny (SPM): \${g2ActiveReviewItem.gerbang2.reviewDanny.keputusan} - "\${g2ActiveReviewItem.gerbang2.reviewDanny.catatan}"</div>\` : ''}
          </div>
        \`;

        document.getElementById('modal-g2-catatan').value = (g2ActiveReviewRole === 'KEPALA_SPM') ? 
          'Kelengkapan QC draf laporan, kertas kerja, dan bukti geotag telah diperiksa memadai.' : 
          'Kalkulasi nilai pasar telah diverifikasi akurat dan sesuai SPI 2024.';
        document.getElementById('modal-review-gerbang2').classList.remove('hidden');
      })
      .catch(err => {
        alert('Gagal mengambil data review Gerbang 2: ' + err);
      });
    }

    function tutupModalReviewGerbang2() {
      document.getElementById('modal-review-gerbang2')?.classList.add('hidden');
    }

    async function eksekusiReviewGerbang2Submit(keputusan) {
      if (!g2ActiveReviewItem) return;
      const auth = window.CURRENT_AUTH_SESSION || (typeof dapatkanSesiLogin === 'function' ? dapatkanSesiLogin() : null) || userSession;
      const catatan = document.getElementById('modal-g2-catatan').value.trim();
      if (!catatan) {
        alert('Catatan evaluasi resmi wajib diisi.');
        return;
      }

      const isDanny = (g2ActiveReviewRole === 'KEPALA_SPM' || (auth && auth.sub === 'danny_spm'));
      const actionName = isDanny ? 'reviewDannyGerbang2' : 'reviewDeniGerbang2';

      try {
        const res = await fetch(\`\${DUAL_GATE_NOLAP_API}?action=\${actionName}\`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-NSR-Token': auth?.token || auth?.sessionToken || (isDanny ? (process.env.NSR_SPM_TOKEN || "NSR_MOCK_SPM_TOKEN") : (process.env.NSR_DIVTEK_TOKEN || "NSR_MOCK_DIVTEK_TOKEN"))
          },
          body: JSON.stringify({
            idPenugasan: g2ActiveReviewItem.idPenugasan,
            keputusan: keputusan,
            catatan: catatan
          })
        });
        const json = await res.json();
        if (json.success) {
          alert(\`Keputusan '\${keputusan}' berhasil disimpan.\\nStatus baru: \${json.newStatus}\`);
          if (json.waManualLink) {
            window.open(json.waManualLink, '_blank');
          }
          tutupModalReviewGerbang2();
          if (typeof muatUlangTabel === 'function') muatUlangTabel();
        } else {
          alert('Gagal: ' + json.error);
        }
      } catch (err) {
        alert('Terjadi kesalahan jaringan: ' + err);
      }
    }

    // Aksi Penerbitan NoLap Definitif (Admin Pusat)
    async function eksekusiTerbitNoLapDualGate(idPenugasan) {
      const auth = window.CURRENT_AUTH_SESSION || (typeof dapatkanSesiLogin === 'function' ? dapatkanSesiLogin() : null) || userSession;
      if (!confirm(\`Terbitkan Nomor Laporan Definitif 7 Segmen Kemenkeu untuk penugasan \${idPenugasan}?\`)) return;

      try {
        const res = await fetch(\`\${DUAL_GATE_NOLAP_API}?action=issueDefinitiveNoLap\`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-NSR-Token': auth?.token || auth?.sessionToken || 'NSR-ADMIN-PUSAT-2026'
          },
          body: JSON.stringify({ idPenugasan: idPenugasan })
        });
        const json = await res.json();
        if (json.success) {
          alert(\`SUKSES! Nomor Laporan Definitif Resmi Berhasil Diterbitkan:\\n\\n\${json.nomorDefinitif}\\nStatus: MENUNGGU_TTD_PENILAI\`);
          if (typeof muatUlangTabel === 'function') muatUlangTabel();
        } else {
          alert('Gagal: ' + json.error);
        }
      } catch (err) {
        alert('Kesalahan jaringan: ' + err);
      }
    }

    // Aksi Tanda Tangan Penilai Publik (Nanang Rahayu / Deni Siswandi)
    async function eksekusiTtdPenilaiDualGate(idPenugasan) {
      const auth = window.CURRENT_AUTH_SESSION || (typeof dapatkanSesiLogin === 'function' ? dapatkanSesiLogin() : null) || userSession;
      if (!confirm(\`Konfirmasi Tanda Tangan Resmi Penilai Publik untuk penugasan \${idPenugasan}?\`)) return;

      try {
        const res = await fetch(\`\${DUAL_GATE_NOLAP_API}?action=signLaporanPenilaiPublik\`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-NSR-Token': auth?.token || auth?.sessionToken || (process.env.NSR_PENILAI_DENI_TOKEN || "NSR_MOCK_PENILAI_TOKEN")
          },
          body: JSON.stringify({ idPenugasan: idPenugasan, metodeTandaTangan: 'DIGITAL_VERIFIED' })
        });
        const json = await res.json();
        if (json.success) {
          alert(\`SELAMAT! Laporan Penilaian Resmi telah ditandatangani oleh \${json.penilaiPenandatangan}.\\nStatus Akhir: LAPORAN_FINAL.\`);
          if (typeof muatUlangTabel === 'function') muatUlangTabel();
        } else {
          alert('Gagal: ' + json.error);
        }
      } catch (err) {
        alert('Kesalahan jaringan: ' + err);
      }
    }
  </script>
`;

if (!content.includes('DUAL SMART MITIGATION GATE ENGINE (GERBANG 2 FRONTEND LOGIC)')) {
  content = content.replace('</body>', g2JsEngine + '\n</body>');
  console.log('Gerbang 2 Frontend JS engine injected.');
}

fs.writeFileSync(targetPath, content, 'utf8');
console.log('portal-nolap.html successfully integrated!');
