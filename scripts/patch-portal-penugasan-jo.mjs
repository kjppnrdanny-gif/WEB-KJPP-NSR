import fs from 'node:fs';

const filePath = 'portal-penugasan-jo.html';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Move #modal-review-gerbang1 markup before <script>
const modalMarkup = `  <!-- MODAL REVIEW GERBANG 1: SPM (DANNY) & DIVTEK (DENI) -->
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
  </div>`;

// Insert modalMarkup before <!-- ==================== JAVASCRIPT MASTER SISTEM ==================== -->
const scriptStartToken = '<!-- ==================== JAVASCRIPT MASTER SISTEM ==================== -->';
if (content.includes(scriptStartToken)) {
  content = content.replace(scriptStartToken, modalMarkup + '\n\n' + scriptStartToken);
}

// 2. Fix the corrupted block inside unduhSuratRepresentasiWord
// The corrupted block starts after `</div>` of Section1 (line 10788)
// and ends before `function muatDatabaseLokal()`
const corruptedPattern = /<\/div>\s*<!-- MODAL REVIEW GERBANG 1: SPM \(DANNY\) & DIVTEK \(DENI\) -->[\s\S]*?function muatDatabaseLokal\(\)/;

const fixedBlock = `</div>
</body>
</html>
      \`.trim();

      const blob = new Blob(['\\ufeff' + wordHtml], { type: 'application/msword;charset=utf-8' });
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(downloadUrl), 1500);
    }

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
        headers: { 'X-NSR-Token': auth?.token || auth?.tokenHash || auth?.sessionToken || '' }
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
            'X-NSR-Token': auth?.token || auth?.tokenHash || auth?.sessionToken || ''
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

    function muatDatabaseLokal()`;

if (corruptedPattern.test(content)) {
  content = content.replace(corruptedPattern, fixedBlock);
  console.log('✓ Corrupted block in unduhSuratRepresentasiWord replaced cleanly');
} else {
  console.log('⚠️ corruptedPattern not matched in portal-penugasan-jo.html');
}

// 3. Add data-testid attributes
// 3a. jo-session-status and jo-current-role
content = content.replace(
  '<div id="session-badge" class="inline-flex',
  '<div id="session-badge" data-testid="jo-session-status" class="inline-flex'
);
content = content.replace(
  '<span id="session-label" class="font-bold">Memuat Sesi...</span>',
  '<span id="session-label" data-testid="jo-current-role" class="font-bold">Memuat Sesi...</span>'
);

// 3b. Tab buttons data-testid & keyboard accessibility
content = content.replace(
  '<button id="btn-tab-form" onclick="gantiTab(1)"',
  '<button id="btn-tab-form" onclick="gantiTab(1)" onkeydown="if(event.key===\'Enter\'||event.key===\' \'){event.preventDefault();gantiTab(1);}"'
);
content = content.replace(
  '<button id="btn-tab-dashboard" data-alias="tab-btn-2" onclick="gantiTab(2)"',
  '<button id="btn-tab-dashboard" data-testid="jo-tab-approval" data-alias="tab-btn-2" onclick="gantiTab(2)" onkeydown="if(event.key===\'Enter\'||event.key===\' \'){event.preventDefault();gantiTab(2);}" tabindex="0"'
);
content = content.replace(
  '<button id="btn-tab-preview" onclick="gantiTab(3)"',
  '<button id="btn-tab-preview" data-testid="jo-tab-print" onclick="gantiTab(3)" onkeydown="if(event.key===\'Enter\'||event.key===\' \'){event.preventDefault();gantiTab(3);}" tabindex="0"'
);

// 3c. Tab panels data-testid
content = content.replace(
  '<div id="tab-content-dashboard" class="hidden space-y-6">',
  '<div id="tab-content-dashboard" data-testid="jo-approval-panel" class="hidden space-y-6">'
);
content = content.replace(
  '<div id="tab-3" data-alias="tab-content-preview" class="hidden space-y-6">',
  '<div id="tab-3" data-testid="jo-print-panel" data-alias="tab-content-preview" class="hidden space-y-6">'
);
content = content.replace(
  '<div id="tab3-lock-screen" class="hidden flex-col',
  '<div id="tab3-lock-screen" data-testid="jo-print-lock-reason" class="hidden flex-col'
);

// 4. Update AUTH_HASH_REGISTRY for KING in portal-penugasan-jo.html
content = content.replace(
  /'47e9420b3a60a28be92802a6b88515da8f3fdaa624a86a9d9e57d60b859ab7c0':\s*\{"valid":true,"role":"SUPER ADMIN"/g,
  `'47e9420b3a60a28be92802a6b88515da8f3fdaa624a86a9d9e57d60b859ab7c0': {"valid":true,"role":"SUPER_ADMIN","roleLabel":"SUPER ADMIN • KING","displayRole":"SUPER ADMIN • KANTOR PUSAT","isKing":true,"isSuperAdmin":true,"canApprove":true,"canApprovePusat":true,"mode":"PUSAT","permissions":["spm.review","divtek.review","lp.issue","nolap.issue","system.emergency_override","opr.view","opr.submit","admin.all"]`
);
content = content.replace(
  /'387f1132894c759ea61674434d9e7f34958a5445dc4f20c408a4a5b251396e5f':\s*\{"valid":true,"role":"SUPER ADMIN"/g,
  `'387f1132894c759ea61674434d9e7f34958a5445dc4f20c408a4a5b251396e5f': {"valid":true,"role":"SUPER_ADMIN","roleLabel":"SUPER ADMIN • KING","displayRole":"SUPER ADMIN • KANTOR PUSAT","isKing":true,"isSuperAdmin":true,"canApprove":true,"canApprovePusat":true,"mode":"PUSAT","permissions":["spm.review","divtek.review","lp.issue","nolap.issue","system.emergency_override","opr.view","opr.submit","admin.all"]`
);

// 5. Update verifySessionChecksum to accept backend checksum
const oldVerifySig = `if (sess.sessionChecksum && sess.sessionChecksum === expectedChecksum) return true;`;
const newVerifySig = `const backendChecksum = sha256Hex([
        'NSR_SESSION_INTEGRITY_2026_x7k9::',
        sess.tokenHash || '',
        sess.role || '',
        sess.wilayah || '',
        sess.expiresAt || sess.loginTime || '',
        sess.isSuperAdmin ? 'TRUE' : 'FALSE',
        'NSR_ZERO_TRUST_SIG_2026_9x4m'
      ].join('::'));
      if (sess.sessionChecksum && (sess.sessionChecksum === expectedChecksum || sess.sessionChecksum === backendChecksum)) return true;`;

if (content.includes(oldVerifySig)) {
  content = content.replace(oldVerifySig, newVerifySig);
  console.log('✓ verifySessionChecksum enhanced with dual format support');
}

// 6. Update role matching in isSuperAdmin
content = content.replace(
  /const isSuperAdmin = Boolean\(auth && \(auth\.isSuperAdmin \|\| auth\.role === 'SUPER_ADMIN' \|\| auth\.role === 'ADMIN_PUSAT'\)\);/g,
  "const isSuperAdmin = Boolean(auth && (auth.isSuperAdmin || auth.role === 'SUPER_ADMIN' || auth.role === 'SUPER ADMIN' || auth.role === 'ADMIN_PUSAT' || auth.isKing));"
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('✓ portal-penugasan-jo.html successfully updated and patched!');
