/**
 * Integrasi Gerbang 1 Dual Smart Mitigation Gate ke portal-penugasan-jo.html
 */
import fs from 'node:fs';

const targetPath = 'portal-penugasan-jo.html';
let content = fs.readFileSync(targetPath, 'utf8');

console.log('Integrating Gerbang 1 into portal-penugasan-jo.html...');

// 1. Tambahkan Section 08 di form-penugasan sebelum tombol submit
const section08Html = `
        <!-- 8. SMART MITIGASI AWAL & PENUNJUKAN PENILAI PUBLIK (GERBANG 1) -->
        <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <h3 class="text-sm font-black text-amber-400 uppercase tracking-wider flex items-center gap-2">
              <span class="w-6 h-6 rounded-md bg-amber-400/20 text-amber-300 flex items-center justify-center text-xs">08</span>
              <span>Smart Mitigasi Awal &amp; Penunjukan Penilai Publik (Gerbang 1)</span>
            </h3>
            <span id="g1-kategori-badge" class="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
              Agunan Bank
            </span>
          </div>

          <!-- Pilihan Penilai Publik Ditunjuk -->
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
          </div>

          <!-- Checklist Dinamis Mitigasi Awal -->
          <div class="pt-2">
            <label class="block font-semibold text-slate-300 text-xs mb-2">Checklist Kepatuhan &amp; Mitigasi Risiko Awal:</label>
            <div id="g1-checklist-container" class="space-y-2 text-xs">
              <!-- Dihasilkan secara dinamis via renderChecklistMitigasiAwal -->
            </div>
          </div>

          <!-- Evaluasi Red Flag & Benturan Kepentingan -->
          <div class="pt-3 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <label class="flex items-start gap-2.5 p-2.5 rounded-xl bg-rose-950/20 border border-rose-900/50 hover:border-rose-500 cursor-pointer transition">
              <input type="checkbox" id="g1_redflag_konflik" class="mt-0.5 accent-rose-500 rounded">
              <div>
                <strong class="text-rose-300 block font-bold">Terdapat Benturan Kepentingan Finansial</strong>
                <span class="text-[11px] text-slate-400 block mt-0.5">Ada hubungan keluarga / saham / kepemilikan dengan debitur (Memicu HOLD ESKALASI).</span>
              </div>
            </label>

            <label class="flex items-start gap-2.5 p-2.5 rounded-xl bg-rose-950/20 border border-rose-900/50 hover:border-rose-500 cursor-pointer transition">
              <input type="checkbox" id="g1_redflag_legalitas" class="mt-0.5 accent-rose-500 rounded">
              <div>
                <strong class="text-rose-300 block font-bold">Terdapat Red Flag Legalitas / Sengketa</strong>
                <span class="text-[11px] text-slate-400 block mt-0.5">Sengketa pengadilan, blokir BPN, atau tumpang tindih kepemilikan (Memicu HOLD ESKALASI).</span>
              </div>
            </label>
          </div>

          <!-- Catatan Tambahan Mitigasi Pengaju -->
          <div class="pt-2">
            <label class="block font-semibold text-slate-300 text-xs mb-1">Catatan Mitigasi Tambahan dari Pengaju:</label>
            <textarea id="g1_catatan_mitigasi" rows="2" placeholder="Catatan awal terkait independensi tim, akses lokasi survei, atau dokumen awal yang diserahkan..." class="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-amber-400"></textarea>
          </div>
        </div>
`;

if (!content.includes('id="g1-checklist-container"')) {
  content = content.replace(
    '<!-- TOMBOL AKSI SUBMIT -->',
    section08Html + '\n        <!-- TOMBOL AKSI SUBMIT -->'
  );
  console.log('Section 08 Smart Mitigasi Awal added to form-penugasan.');
}

// 2. Tambahkan Modal Review Gerbang 1 untuk Danny (SPM) dan Deni (Divtek)
const reviewModalHtml = `
  <!-- MODAL REVIEW GERBANG 1: SPM (DANNY) & DIVTEK (DENI) -->
  <div id="modal-review-gerbang1" class="hidden fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
    <div class="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl text-xs">
      <div class="flex items-center justify-between border-b border-slate-800 pb-3">
        <div>
          <h3 id="modal-g1-title" class="text-sm font-black text-amber-400 uppercase tracking-wide">Review Lingkup Penugasan &amp; Mitigasi Awal</h3>
          <p id="modal-g1-subtitle" class="text-[11px] text-slate-400 mt-0.5">ID: - &bull; Klien: -</p>
        </div>
        <button type="button" onclick="tutupModalReviewGerbang1()" class="text-slate-400 hover:text-white p-1 rounded-lg">✕</button>
      </div>

      <div id="modal-g1-body" class="space-y-3">
        <!-- Render detail dinamis -->
      </div>

      <div>
        <label class="block font-semibold text-slate-300 mb-1">Catatan Telaah Evaluasi Resmi <span class="text-rose-400">*</span></label>
        <textarea id="modal-g1-catatan" rows="3" class="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-amber-400" placeholder="Ketik catatan evaluasi kepatuhan/metodologi di sini..."></textarea>
      </div>

      <div class="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-800">
        <button type="button" onclick="tutupModalReviewGerbang1()" class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition">Batal</button>
        <div class="flex items-center gap-2">
          <button type="button" onclick="eksekusiReviewGerbang1Submit('REVISI')" class="px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold transition">Minta Revisi</button>
          <button type="button" onclick="eksekusiReviewGerbang1Submit('TOLAK')" class="px-4 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 font-bold transition">Tolak</button>
          <button type="button" onclick="eksekusiReviewGerbang1Submit('SETUJU')" class="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black shadow-lg transition">Setujui Mitigasi</button>
        </div>
      </div>
    </div>
  </div>
`;

if (!content.includes('id="modal-review-gerbang1"')) {
  content = content.replace(
    '</body>',
    reviewModalHtml + '\n</body>'
  );
  console.log('Modal Review Gerbang 1 added before body close.');
}

// 3. Tambahkan Engine Logic JS untuk Gerbang 1
const jsEngineCode = `
  <script>
    // =========================================================================
    // DUAL SMART MITIGATION GATE ENGINE (GERBANG 1 FRONTEND LOGIC)
    // =========================================================================

    const DUAL_GATE_API_URL = '/api/nolap-data-proxy';
    let g1ActiveReviewItem = null;
    let g1ActiveReviewRole = null;

    // Generator Checklist Dinamis Berdasarkan Maksud & Tujuan Penilaian
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
    }

    // Inisialisasi saat form dimuat
    document.addEventListener('DOMContentLoaded', () => {
      const selTujuan = document.getElementById('maksud_tujuan_penilaian');
      if (selTujuan) {
        renderChecklistMitigasiAwal(selTujuan.value);
        selTujuan.addEventListener('change', () => renderChecklistMitigasiAwal(selTujuan.value));
      }
    });

    // Helper Modal Review Gerbang 1
    function bukaModalReviewGerbang1(idPenugasan, role) {
      const auth = window.CURRENT_AUTH_SESSION || (typeof dapatkanSesiLogin === 'function' ? dapatkanSesiLogin() : null) || userSession;
      g1ActiveReviewRole = role || auth?.role;

      // Ambil detail dual gate dari backend
      fetch(\`\${DUAL_GATE_API_URL}?action=getDualGateDetail&idPenugasan=\${encodeURIComponent(idPenugasan)}\`, {
        headers: { 'X-NSR-Token': auth?.token || auth?.sessionToken || 'NSR-ADMIN-PUSAT-2026' }
      })
      .then(res => res.json())
      .then(json => {
        if (!json.success || !json.record) {
          alert('Data permohonan mitigasi tidak ditemukan di basis data terintegrasi.');
          return;
        }
        g1ActiveReviewItem = json.record;

        const roleTitle = (g1ActiveReviewRole === 'KEPALA_SPM') ? 'Review SPM (Danny Taufik, S.H.)' : 'Review Teknis (Deni Siswandi, S.T.)';
        document.getElementById('modal-g1-title').textContent = roleTitle;
        document.getElementById('modal-g1-subtitle').textContent = \`ID: \${g1ActiveReviewItem.idPenugasan} • Klien: \${g1ActiveReviewItem.namaKlien}\`;

        const body = document.getElementById('modal-g1-body');
        body.innerHTML = \`
          <div class="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5 text-slate-300">
            <div><strong class="text-amber-400">Tujuan Penilaian:</strong> \${g1ActiveReviewItem.tujuanPenilaian || '-'}</div>
            <div><strong class="text-sky-400">Jenis Objek:</strong> \${g1ActiveReviewItem.jenisObjek || '-'}</div>
            <div><strong class="text-teal-400">Penilai Ditunjuk:</strong> \${g1ActiveReviewItem.penugasan?.penilaiPublikDitunjuk || '-'}</div>
            <div><strong class="text-slate-400">Status Saat Ini:</strong> <span class="font-mono text-emerald-400">\${g1ActiveReviewItem.gerbang1?.status || '-'}</span></div>
            \${g1ActiveReviewItem.gerbang1?.catatanPengaju ? \`<div class="text-[11px] text-slate-400 pt-1 border-t border-slate-800">Catatan Pengaju: "\${g1ActiveReviewItem.gerbang1.catatanPengaju}"</div>\` : ''}
            \${g1ActiveReviewItem.gerbang1?.reviewDanny ? \`<div class="text-[11px] text-indigo-300 pt-1 border-t border-slate-800">Review Danny (SPM): \${g1ActiveReviewItem.gerbang1.reviewDanny.keputusan} - "\${g1ActiveReviewItem.gerbang1.reviewDanny.catatan}"</div>\` : ''}
          </div>
        \`;

        document.getElementById('modal-g1-catatan').value = (g1ActiveReviewRole === 'KEPALA_SPM') ? 
          'Independensi tim, ketiadaan benturan kepentingan, dan pemenuhan syarat mitigasi awal telah ditelaah memadai.' : 
          'Metodologi teknis dan susunan tim kerja sesuai standar SPI.';
        document.getElementById('modal-review-gerbang1').classList.remove('hidden');
      })
      .catch(err => {
        alert('Gagal mengambil data review: ' + err);
      });
    }

    function tutupModalReviewGerbang1() {
      document.getElementById('modal-review-gerbang1')?.classList.add('hidden');
    }

    async function eksekusiReviewGerbang1Submit(keputusan) {
      if (!g1ActiveReviewItem) return;
      const auth = window.CURRENT_AUTH_SESSION || (typeof dapatkanSesiLogin === 'function' ? dapatkanSesiLogin() : null) || userSession;
      const catatan = document.getElementById('modal-g1-catatan').value.trim();
      if (!catatan) {
        alert('Catatan telaah resmi wajib diisi.');
        return;
      }

      const isDanny = (g1ActiveReviewRole === 'KEPALA_SPM' || (auth && auth.sub === 'danny_spm'));
      const actionName = isDanny ? 'reviewDannyGerbang1' : 'reviewDeniGerbang1';

      try {
        const res = await fetch(\`\${DUAL_GATE_API_URL}?action=\${actionName}\`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-NSR-Token': auth?.token || auth?.sessionToken || (isDanny ? (process.env.NSR_SPM_TOKEN || "NSR_MOCK_SPM_TOKEN") : (process.env.NSR_DIVTEK_TOKEN || "NSR_MOCK_DIVTEK_TOKEN"))
          },
          body: JSON.stringify({
            idPenugasan: g1ActiveReviewItem.idPenugasan,
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
          tutupModalReviewGerbang1();
          if (typeof renderDashboardTabel === 'function') renderDashboardTabel();
        } else {
          alert('Gagal: ' + json.error);
        }
      } catch (err) {
        alert('Terjadi kesalahan jaringan: ' + err);
      }
    }
  </script>
`;

if (!content.includes('DUAL SMART MITIGATION GATE ENGINE (GERBANG 1 FRONTEND LOGIC)')) {
  content = content.replace('</body>', jsEngineCode + '\n</body>');
  console.log('Gerbang 1 Frontend JS engine injected.');
}

fs.writeFileSync(targetPath, content, 'utf8');
console.log('portal-penugasan-jo.html successfully integrated!');
