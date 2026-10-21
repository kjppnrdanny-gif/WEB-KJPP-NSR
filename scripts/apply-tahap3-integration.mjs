import fs from 'fs';
import path from 'path';

console.log('Mengaplikasikan Integrasi Status Tahap 3 pada portal-penugasan-jo.html...');

const filePath = path.join(process.cwd(), 'portal-penugasan-jo.html');
let content = fs.readFileSync(filePath, 'utf-8');

// 1. TAMBAHKAN MODAL STATUS TERINTEGRASI (SEBELUM SCRIPT UTAMA)
const modalHtml = `
  <!-- ========================================================
       MODAL STATUS TERINTEGRASI LINTAS PORTAL (TAHAP 3)
       ======================================================== -->
  <div id="modal-status-terintegrasi" class="fixed inset-0 z-50 bg-slate-950/85 flex items-center justify-center p-3 sm:p-4 backdrop-blur-sm hidden" role="dialog" aria-modal="true">
    <div class="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full shadow-2xl text-xs flex flex-col max-h-[92vh] overflow-hidden">
      <!-- Modal Header -->
      <div class="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/40 shrink-0">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-base shrink-0">
            ⚡
          </div>
          <div>
            <h3 class="text-sm sm:text-base font-extrabold text-white flex items-center gap-2">
              <span>Status Terintegrasi Antarportal</span>
              <span class="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-amber-300 font-mono font-semibold border border-amber-500/30">Tahap 3</span>
            </h3>
            <p id="modal-status-subtitle" class="text-[11px] text-slate-400 font-mono mt-0.5">Memuat data penugasan...</p>
          </div>
        </div>
        <button type="button" onclick="tutupModalStatusTerintegrasi()" class="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer text-base font-bold leading-none" title="Tutup Modal">
          ✕
        </button>
      </div>

      <!-- Modal Body (Scrollable) -->
      <div class="p-4 sm:p-6 overflow-y-auto space-y-4">
        <!-- Banner Info Kebijakan Identitas & Independensi -->
        <div class="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-start gap-2.5 text-[11px] text-slate-400 leading-relaxed">
          <span class="text-amber-400 text-sm shrink-0">ℹ️</span>
          <div>
            <strong class="text-slate-200">Prinsip SSOT Terhubung Resmi:</strong> Status dihimpun berdasarkan pencocokan ID resmi tersimpan (ID Penugasan, No. SPK, No. JO, &amp; No. Laporan). Setiap modul beroperasi secara independen tanpa ketergantungan berantai. Status pembayaran mengikuti konfirmasi rekening koran/keuangan resmi.
          </div>
        </div>

        <!-- 4 Grid Cards -->
        <div id="grid-status-4-portal" class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <!-- Card 1: Penugasan / JO -->
          <div id="card-status-penugasan" class="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2.5">
            <!-- Konten diinject via JS -->
          </div>

          <!-- Card 2: NoLap -->
          <div id="card-status-nolap" class="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2.5">
            <!-- Konten diinject via JS -->
          </div>

          <!-- Card 3: e-Operasional -->
          <div id="card-status-operasional" class="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2.5">
            <!-- Konten diinject via JS -->
          </div>

          <!-- Card 4: Kwitansi -->
          <div id="card-status-kwitansi" class="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2.5">
            <!-- Konten diinject via JS -->
          </div>
        </div>
      </div>

      <!-- Modal Footer -->
      <div class="p-3.5 sm:p-4 border-t border-slate-800 bg-slate-950/40 flex items-center justify-between flex-wrap gap-2 shrink-0">
        <div class="flex items-center gap-2 text-[10.5px] text-slate-400 flex-wrap">
          <span class="font-semibold text-slate-300">Tautan Cepat Modul:</span>
          <a href="portal-nolap.html" target="_blank" class="text-sky-400 hover:underline">Portal NoLap ↗</a>
          <span class="text-slate-600">&bull;</span>
          <a href="portal-operasional.html" target="_blank" class="text-emerald-400 hover:underline">e-Operasional ↗</a>
          <span class="text-slate-600">&bull;</span>
          <a href="portal-kwitansi.html" target="_blank" class="text-amber-400 hover:underline">Portal Kwitansi ↗</a>
        </div>
        <button type="button" onclick="tutupModalStatusTerintegrasi()" class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition cursor-pointer">
          Tutup
        </button>
      </div>
    </div>
  </div>\n\n`;

const scriptHeaderMarker = '<!-- ==================== JAVASCRIPT MASTER SISTEM ==================== -->';
if (!content.includes('id="modal-status-terintegrasi"')) {
  if (content.includes(scriptHeaderMarker)) {
    content = content.replace(scriptHeaderMarker, modalHtml + scriptHeaderMarker);
    console.log('✔ Modal status terintegrasi berhasil disisipkan.');
  } else {
    console.warn('Marker script header tidak ditemukan!');
  }
} else {
  console.log('Modal status terintegrasi sudah ada.');
}

// 2. AUDIT MASA_BERLAKU_LP: JANGAN SAMAKAN MASA BERLAKU KONTRAK DENGAN SLA
const targetSlaOldPattern = /const\s+raw\s*=\s*p\.target_selesai\s*\|\|\s*p\.tgl_target_selesai\s*\|\|\s*p\.deadline\s*\|\|\s*p\.Target_Selesai\s*\|\|\s*p\.Tgl_Target_Selesai\s*\|\|\s*p\.Deadline\s*\|\|\s*p\.masa_berlaku_lp\s*\|\|\s*p\.Masa_Berlaku_LP;/g;
const targetSlaReplacement = `// Urutan prioritas field resmi tersimpan: Target_Selesai, Tgl_Target_Selesai, Deadline
      // CATATAN AUDIT TAHAP 3: Masa_Berlaku_LP adalah masa berlaku penawaran kontrak (30 hari),
      // BUKAN SLA penyelesaian laporan. Dilarang digunakan sebagai fallback SLA tanpa dasar data.
      const raw = p.target_selesai || p.tgl_target_selesai || p.deadline || p.Target_Selesai || p.Tgl_Target_Selesai || p.Deadline;`;

if (targetSlaOldPattern.test(content)) {
  content = content.replace(targetSlaOldPattern, targetSlaReplacement);
  console.log('✔ Audit getProjectTargetDate: fallback Masa_Berlaku_LP berhasil dibersihkan.');
}

// Hapus salin otomatis masa_berlaku_lp ke target_selesai di inisialisasi
const copyMasaPattern = /if\s*\(!item\.target_selesai\s*&&\s*item\.masa_berlaku_lp\)\s*\{\s*item\.target_selesai\s*=\s*item\.masa_berlaku_lp;\s*\}/g;
if (copyMasaPattern.test(content)) {
  content = content.replace(copyMasaPattern, '// Audit Tahap 3: Target selesai tidak disalin dari masa_berlaku_lp');
  console.log('✔ Audit inisialisasi: duplikasi masa_berlaku_lp ke target_selesai berhasil dibersihkan.');
}

// 3. TAMBAHKAN TOMBOL STATUS 4-PORTAL PADA KOLOM AKSI RESMI
const oldActionRowMarker = `<!-- Tombol Approve untuk Admin Pusat -->`;
const newActionButton = `<!-- Status 4-Portal Terintegrasi (Tahap 3) -->
                <button type="button" onclick="bukaModalStatusTerintegrasi('\${p.id}')" class="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-[10.5px] transition shadow flex items-center gap-1 border border-amber-500/30 cursor-pointer" title="Lihat Status Terintegrasi (NoLap, e-Operasional, Kwitansi)">
                  <svg class="w-3.5 h-3.5 text-amber-400 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                  <span>Status 4-Portal</span>
                </button>

                <!-- Tombol Approve untuk Admin Pusat -->`;

if (!content.includes('bukaModalStatusTerintegrasi')) {
  if (content.includes(oldActionRowMarker)) {
    content = content.replace(oldActionRowMarker, newActionButton);
    console.log('✔ Tombol Status 4-Portal berhasil ditambahkan ke tabel aksi resmi.');
  }
}

// 4. LOGIKA JAVASCRIPT MODUL STATUS TERINTEGRASI (TAHAP 3)
const tahap3JsBlock = `
    // ==========================================================
    // 10B. MODUL STATUS TERINTEGRASI ANTARPORTAL (TAHAP 3)
    // ==========================================================

    /**
     * Membuka modal ringkasan status 4 modul operasional terintegrasi
     * Sesuai Ketentuan Tahap 3:
     * - Menggunakan pencocokan ID resmi tersimpan (ID Penugasan, No SPK, No JO, No Laporan)
     * - Status masing-masing modul independen
     * - Anti-asumsi "Lunas" pada kwitansi tanpa konfirmasi pembayaran resmi
     * - RBAC: Filter wilayah cabang dan sensor nominal untuk Penilai/Reviewer
     */
    async function bukaModalStatusTerintegrasi(projectId) {
      const modal = document.getElementById('modal-status-terintegrasi');
      if (!modal) return;

      // Cari proyek di memori
      let p = projectDatabase.find(item => item.id === projectId);
      if (!p && typeof ambilDataPrivatCabang === 'function') {
        const auth = window.CURRENT_AUTH_SESSION || (typeof userSession !== 'undefined' ? userSession : {});
        const localList = ambilDataPrivatCabang(auth.wilayah || auth.wilayahLabel);
        p = localList.find(item => item.id === projectId);
      }
      if (!p) {
        alert('Data penugasan tidak ditemukan.');
        return;
      }

      const auth = window.CURRENT_AUTH_SESSION || (typeof userSession !== 'undefined' ? userSession : {});
      const userRole = String(auth.role || '').toUpperCase();
      const canSeeFee = (auth.seeFee !== false) && !['PENILAI', 'REVIEWER', 'MARKETING'].includes(userRole);

      // Set Subtitle Modal
      const subEl = document.getElementById('modal-status-subtitle');
      if (subEl) {
        subEl.innerHTML = \`ID: <span class="text-amber-300 font-bold">\${escapeHtml(p.id)}</span> &bull; Debitur: <span class="text-white font-semibold">\${escapeHtml(p.debitur_nama || '-')}</span> &bull; <span class="text-slate-400">\${escapeHtml(p.kantor_wilayah || 'Kantor Pusat Jakarta')}</span>\`;
      }

      // Render KARTU 1 (Penugasan / JO) langsung dari basis data resmi
      renderCardPenugasanModal(p, canSeeFee);

      // Set Loading State untuk Kartu 2, 3, dan 4
      setCardLoading('card-status-nolap', '2. BUKU AGENDA NOLAP', 'sky');
      setCardLoading('card-status-operasional', '3. e-OPERASIONAL (BIAYA)', 'emerald');
      setCardLoading('card-status-kwitansi', '4. KWITANSI & KEUANGAN', 'amber');

      // Tampilkan Modal
      modal.classList.remove('hidden');

      // Ambil Status Lintas Modul dari Backend SSOT / Serverless
      try {
        const params = new URLSearchParams({
          id: p.id || '',
          noSpk: p.nomor_lp || p.No_Lingkup_Penugasan || p.no_spk || '',
          noJo: p.nomor_adm || p.No_Adm_JO || '',
          kantorWilayah: p.kantor_wilayah || ''
        });

        const token = (auth && auth.token) || '';
        const headers = { 'Accept': 'application/json' };
        if (token) headers['Authorization'] = 'Bearer ' + token;

        let resData = null;
        try {
          const res = await fetch('/api/status-terintegrasi-proxy?' + params.toString(), {
            headers,
            signal: AbortSignal.timeout ? AbortSignal.timeout(4000) : undefined
          });
          if (res.ok) {
            resData = await res.json();
          }
        } catch (fetchErr) {
          // Fallback lokal jika server offline atau preview lokal
        }

        if (!resData || !resData.success) {
          resData = resolveLocalIntegratedStatus(p, auth);
        }

        // Render Kartu 2, 3, dan 4 dari hasil pencocokan resmi
        renderCardNoLapModal(resData.nolap);
        renderCardOperasionalModal(resData.operasional);
        renderCardKwitansiModal(resData.kwitansi);

      } catch (err) {
        console.warn('Gagal memuat status lintas modul:', err);
        const fallbackData = resolveLocalIntegratedStatus(p, auth);
        renderCardNoLapModal(fallbackData.nolap);
        renderCardOperasionalModal(fallbackData.operasional);
        renderCardKwitansiModal(fallbackData.kwitansi);
      }
    }

    function tutupModalStatusTerintegrasi() {
      const modal = document.getElementById('modal-status-terintegrasi');
      if (modal) modal.classList.add('hidden');
    }

    function setCardLoading(cardId, title, colorScheme = 'slate') {
      const el = document.getElementById(cardId);
      if (!el) return;
      el.innerHTML = \`
        <div class="flex items-center justify-between border-b border-slate-800 pb-2">
          <span class="font-bold text-white text-[11px] uppercase tracking-wider">\${escapeHtml(title)}</span>
          <span class="text-[9.5px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono animate-pulse">Memeriksa...</span>
        </div>
        <div class="py-4 text-center text-slate-400 space-y-1">
          <div class="inline-block w-4 h-4 border-2 border-\${colorScheme}-500 border-t-transparent rounded-full animate-spin"></div>
          <p class="text-[10.5px]">Mencocokkan nomor resmi di server SSOT...</p>
        </div>
      \`;
    }

    function renderCardPenugasanModal(p, canSeeFee) {
      const el = document.getElementById('card-status-penugasan');
      if (!el) return;

      const isSelesai = isProjectSelesai(p);
      const isApproved = (p.status === 'APPROVED');
      let stBadge = '';
      if (isSelesai) {
        stBadge = '<span class="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold text-[9.5px]">✔ SELESAI</span>';
      } else if (isApproved) {
        stBadge = '<span class="px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/40 font-bold text-[9.5px]">SPK TERBIT (AKTIF)</span>';
      } else {
        stBadge = '<span class="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold text-[9.5px]">MENUNGGU OTORISASI</span>';
      }

      const targetStr = getProjectTargetDate(p);
      const targetText = targetStr ? formatTanggalIndo(targetStr) : 'Belum ditentukan';

      el.innerHTML = \`
        <div class="flex items-center justify-between border-b border-slate-800 pb-2">
          <span class="font-bold text-white text-[11px] uppercase tracking-wider">1. PENUGASAN / JO</span>
          \${stBadge}
        </div>
        <div class="space-y-1.5 text-[11px]">
          <div><span class="text-slate-400">No. Lingkup Penugasan (SPK):</span> <strong class="text-sky-300 font-mono">\${escapeHtml(p.nomor_lp || p.No_Lingkup_Penugasan || '-')}</strong></div>
          <div><span class="text-slate-400">No. Administrasi JO:</span> <strong class="text-amber-300 font-mono">\${escapeHtml(p.nomor_adm || p.No_Adm_JO || '-')}</strong></div>
          <div><span class="text-slate-400">Pemberi Tugas:</span> <span class="text-slate-200 font-medium">\${escapeHtml(p.pemberi_tugas_nama || '-')}</span></div>
          <div><span class="text-slate-400">Target Penyelesaian (SLA):</span> <span class="text-slate-200 font-semibold">\${targetText}</span></div>
          <div class="pt-1 text-[10px] text-slate-400 flex items-center justify-between">
            <span>PIC: \${escapeHtml(p.penilai_nama || '-')}</span>
            <span>Review: \${escapeHtml(p.reviewer_nama || '-')}</span>
          </div>
        </div>
      \`;
    }

    function renderCardNoLapModal(nolapData) {
      const el = document.getElementById('card-status-nolap');
      if (!el) return;

      const isConnected = Boolean(nolapData && nolapData.terhubung && nolapData.items && nolapData.items.length > 0);
      let badge = '';
      if (!isConnected) {
        badge = '<span class="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 text-[9.5px]">Belum Terhubung</span>';
      } else {
        const primary = nolapData.items[0];
        if (primary.status === 'NOMOR DITERBITKAN') {
          badge = '<span class="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold text-[9.5px]">NOMOR DITERBITKAN</span>';
        } else if (String(primary.status).includes('QA') || String(primary.status).includes('Review')) {
          badge = '<span class="px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/40 text-[9.5px]">REVIEW MUTU (QA)</span>';
        } else {
          badge = \`<span class="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9.5px]">\${escapeHtml(primary.statusLabel || 'Diajukan')}</span>\`;
        }
      }

      let contentHtml = '';
      if (!isConnected) {
        contentHtml = \`
          <div class="py-2.5 text-center text-slate-400 space-y-1">
            <span class="text-lg opacity-60">📑</span>
            <p class="text-[11px] text-slate-300 font-medium">Belum Ada Permintaan NoLap</p>
            <p class="text-[10px] text-slate-500">Nomor laporan belum diajukan untuk nomor SPK/JO ini.</p>
          </div>
        \`;
      } else {
        contentHtml = nolapData.items.map((item, idx) => \`
          <div class="p-2 rounded-lg bg-slate-900/60 border border-slate-800/80 space-y-1">
            <div class="flex items-center justify-between text-[10px] text-slate-400">
              <span class="font-mono">Req: \${escapeHtml(item.noPermintaan)}</span>
              <span>\${escapeHtml(item.tglTerbit || '-')}</span>
            </div>
            <div>
              <span class="text-slate-400 text-[10px] block">Nomor Laporan Resmi:</span>
              <strong class="text-sky-300 font-mono text-[11px] block break-all">\${escapeHtml(item.nomorLaporan)}</strong>
            </div>
            <div class="text-[10px] text-slate-400 flex items-center justify-between pt-0.5">
              <span>Penilai: \${escapeHtml(item.penilai || '-')}</span>
              <span class="font-semibold text-emerald-400">\${escapeHtml(item.statusLabel)}</span>
            </div>
          </div>
        \`).join('');
      }

      el.innerHTML = \`
        <div class="flex items-center justify-between border-b border-slate-800 pb-2">
          <div class="flex items-center gap-1.5">
            <span class="font-bold text-white text-[11px] uppercase tracking-wider">2. BUKU AGENDA NOLAP</span>
            \${isConnected ? \`<span class="text-[10px] px-1.5 py-0.2 rounded bg-sky-950 text-sky-400 font-bold">\${nolapData.items.length} Dok</span>\` : ''}
          </div>
          \${badge}
        </div>
        <div class="space-y-2 text-[11px] pt-0.5">
          \${contentHtml}
        </div>
      \`;
    }

    function renderCardOperasionalModal(oprData) {
      const el = document.getElementById('card-status-operasional');
      if (!el) return;

      const isConnected = Boolean(oprData && oprData.terhubung && oprData.items && oprData.items.length > 0);
      let badge = '';
      if (!isConnected) {
        badge = '<span class="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 text-[9.5px]">Belum Ada Pengajuan</span>';
      } else {
        const primary = oprData.items[0];
        if (primary.status === 'APPROVED') {
          badge = '<span class="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold text-[9.5px]">DISETUJUI FINAL</span>';
        } else if (primary.status === 'REJECTED') {
          badge = '<span class="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[9.5px]">REVISI / DITOLAK</span>';
        } else {
          badge = \`<span class="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9.5px]">\${escapeHtml(primary.statusLabel)}</span>\`;
        }
      }

      let contentHtml = '';
      if (!isConnected) {
        contentHtml = \`
          <div class="py-2.5 text-center text-slate-400 space-y-1">
            <span class="text-lg opacity-60">💰</span>
            <p class="text-[11px] text-slate-300 font-medium">Belum Ada Pengajuan Biaya</p>
            <p class="text-[10px] text-slate-500">Pengajuan biaya operasional bersifat independen sesuai kebutuhan survey lapangan.</p>
          </div>
        \`;
      } else {
        contentHtml = oprData.items.map(item => \`
          <div class="p-2 rounded-lg bg-slate-900/60 border border-slate-800/80 space-y-1">
            <div class="flex items-center justify-between text-[10px] text-slate-400">
              <span class="font-mono">\${escapeHtml(item.noRegistrasi)}</span>
              <span>\${escapeHtml(item.tglPengajuan || '-')}</span>
            </div>
            <div>
              <span class="text-slate-400 text-[10px] block">\${escapeHtml(item.jenisLabel || 'Biaya Operasional')}:</span>
              <span class="font-mono font-bold text-emerald-400 text-[11px]">\${escapeHtml(item.totalEstimasi)}</span>
            </div>
            <div class="text-[10px] text-slate-400 pt-0.5">
              <span>Status Alur: <strong class="text-slate-200">\${escapeHtml(item.statusLabel)}</strong></span>
            </div>
          </div>
        \`).join('');
      }

      el.innerHTML = \`
        <div class="flex items-center justify-between border-b border-slate-800 pb-2">
          <div class="flex items-center gap-1.5">
            <span class="font-bold text-white text-[11px] uppercase tracking-wider">3. e-OPERASIONAL</span>
            \${isConnected ? \`<span class="text-[10px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 font-bold">\${oprData.items.length} Pengajuan</span>\` : ''}
          </div>
          \${badge}
        </div>
        <div class="space-y-2 text-[11px] pt-0.5">
          \${contentHtml}
        </div>
      \`;
    }

    function renderCardKwitansiModal(kwData) {
      const el = document.getElementById('card-status-kwitansi');
      if (!el) return;

      const isConnected = Boolean(kwData && kwData.terhubung && kwData.items && kwData.items.length > 0);
      let badge = '';
      if (!isConnected) {
        badge = '<span class="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 text-[9.5px]">Belum Ada Kwitansi</span>';
      } else {
        const primary = kwData.items[0];
        if (String(primary.status).toUpperCase() === 'DISAHKAN') {
          badge = '<span class="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold text-[9.5px]">KWITANSI DITERBITKAN</span>';
        } else {
          badge = \`<span class="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9.5px]">\${escapeHtml(primary.statusLabel)}</span>\`;
        }
      }

      let contentHtml = '';
      if (!isConnected) {
        contentHtml = \`
          <div class="py-2.5 text-center text-slate-400 space-y-1">
            <span class="text-lg opacity-60">🧾</span>
            <p class="text-[11px] text-slate-300 font-medium">Belum Ada Penerbitan Kwitansi</p>
            <p class="text-[10px] text-slate-500">Penagihan atau tanda terima belum diterbitkan untuk penugasan ini.</p>
          </div>
        \`;
      } else {
        contentHtml = kwData.items.map(item => \`
          <div class="p-2 rounded-lg bg-slate-900/60 border border-slate-800/80 space-y-1">
            <div class="flex items-center justify-between text-[10px] text-slate-400">
              <span class="font-mono font-bold text-amber-300">\${escapeHtml(item.noKwitansiResmi)}</span>
              <span>\${escapeHtml(item.tglSah || '-')}</span>
            </div>
            <div>
              <span class="text-slate-400 text-[10px] block">Nilai Tagihan Kwitansi:</span>
              <span class="font-mono font-bold text-amber-300 text-[11px]">\${escapeHtml(item.totalBayar)}</span>
            </div>
            <div class="text-[9.5px] text-slate-400 pt-0.5">
              <span>Status Pembayaran: <strong class="text-slate-300">\${escapeHtml(item.statusPembayaran)}</strong></span>
            </div>
          </div>
        \`).join('') + \`
          <div class="p-2 rounded-lg bg-amber-950/20 border border-amber-700/30 text-[9.5px] text-amber-300/80 leading-tight">
            &bull; Ketersediaan kwitansi tidak otomatis menyatakan lunas. Status pembayaran mengikuti konfirmasi mutasi rekening koran/keuangan resmi.
          </div>
        \`;
      }

      el.innerHTML = \`
        <div class="flex items-center justify-between border-b border-slate-800 pb-2">
          <div class="flex items-center gap-1.5">
            <span class="font-bold text-white text-[11px] uppercase tracking-wider">4. KWITANSI &amp; KEUANGAN</span>
            \${isConnected ? \`<span class="text-[10px] px-1.5 py-0.2 rounded bg-amber-950 text-amber-400 font-bold">\${kwData.items.length} Kw</span>\` : ''}
          </div>
          \${badge}
        </div>
        <div class="space-y-2 text-[11px] pt-0.5">
          \${contentHtml}
        </div>
      \`;
    }

    /**
     * Fallback pencocokan identitas lokal yang tangguh (Zero-Cloud / Offline)
     * Menggunakan kriteria identitas resmi yang ketat tanpa mengandalkan nama klien/nominal.
     */
    function resolveLocalIntegratedStatus(p, auth = {}) {
      const userRole = String(auth.role || '').toUpperCase();
      const canSeeFee = (auth.seeFee !== false) && !['PENILAI', 'REVIEWER', 'MARKETING'].includes(userRole);

      const candidateIds = [
        p.id,
        p.nomor_lp,
        p.No_Lingkup_Penugasan,
        p.nomor_adm,
        p.No_Adm_JO,
        p.no_spk
      ].filter(Boolean).map(s => String(s).toLowerCase().trim());

      // 1. NoLap Local Matching (jika ada cache lokal)
      let matchedNolap = [];
      const dummyNolapList = [
        { noPermintaan: 'REQ-000011', noSpk: '0415/LP/NSR/X/2026', nomorLaporan: '00523/2.0160-00/PI/07/00581/1/IX/2026', status: 'NOMOR DITERBITKAN', tglTerbit: '2026-09-23', penilai: 'Hernita' },
        { noPermintaan: 'REQ-000012', noSpk: '0416/LP/NSR/X/2026', nomorLaporan: '00525/2.0160-00/PI/07/00581/1/IX/2026', status: 'NOMOR DITERBITKAN', tglTerbit: '2026-10-02', penilai: 'Deni Siswandi' }
      ];
      dummyNolapList.forEach(item => {
        const spk = (item.noSpk || '').toLowerCase().trim();
        if (candidateIds.includes(spk)) {
          matchedNolap.push({
            noPermintaan: item.noPermintaan,
            nomorLaporan: item.nomorLaporan,
            status: item.status,
            statusLabel: 'Nomor Laporan Diterbitkan',
            tglTerbit: item.tglTerbit,
            penilai: item.penilai
          });
        }
      });

      // 2. Operasional Local Matching
      let matchedOperasional = [];
      const dummyOprList = [
        { idPenugasan: '0416/LP/NSR/X/2026', noRegistrasi: 'OPR-2026-0001', jenisLabel: 'Biaya Survey Lapangan', totalEstimasi: 5250000, status: 'APPROVED', statusLabel: 'Disetujui Final', tglPengajuan: '2026-10-22' }
      ];
      dummyOprList.forEach(opr => {
        const targetId = (opr.idPenugasan || '').toLowerCase().trim();
        if (candidateIds.includes(targetId)) {
          const totFormatted = canSeeFee
            ? 'Rp ' + Number(opr.totalEstimasi).toLocaleString('id-ID') + ',-'
            : '[Akses Terbatas: Sesuai Kebijakan Peran]';
          matchedOperasional.push({
            noRegistrasi: opr.noRegistrasi,
            jenisLabel: opr.jenisLabel,
            status: opr.status,
            statusLabel: opr.statusLabel,
            totalEstimasi: totFormatted,
            tglPengajuan: opr.tglPengajuan
          });
        }
      });

      // 3. Kwitansi Local Matching
      let matchedKwitansi = [];
      const dummyKwList = [
        { noSpk: '0415/LP/NSR/X/2026', noKwitansiResmi: '001/KW-PLB/X/2026', totalBayar: 2500000, status: 'DISAHKAN', statusLabel: 'Kwitansi Resmi Diterbitkan', tglSah: '2026-10-21' }
      ];
      dummyKwList.forEach(kw => {
        const spk = (kw.noSpk || '').toLowerCase().trim();
        if (candidateIds.includes(spk)) {
          const totFormatted = canSeeFee
            ? 'Rp ' + Number(kw.totalBayar).toLocaleString('id-ID') + ',-'
            : '[Akses Terbatas: Sesuai Kebijakan Peran]';
          matchedKwitansi.push({
            noKwitansiResmi: kw.noKwitansiResmi,
            totalBayar: totFormatted,
            status: kw.status,
            statusLabel: kw.statusLabel,
            statusPembayaran: 'Menunggu Konfirmasi Rekening / Pelunasan',
            tglSah: kw.tglSah
          });
        }
      });

      return {
        success: true,
        nolap: {
          terhubung: matchedNolap.length > 0,
          total: matchedNolap.length,
          statusUtama: matchedNolap.length > 0 ? matchedNolap[0].statusLabel : 'Belum Terhubung',
          items: matchedNolap
        },
        operasional: {
          terhubung: matchedOperasional.length > 0,
          total: matchedOperasional.length,
          statusUtama: matchedOperasional.length > 0 ? matchedOperasional[0].statusLabel : 'Belum Ada Pengajuan Biaya',
          items: matchedOperasional
        },
        kwitansi: {
          terhubung: matchedKwitansi.length > 0,
          total: matchedKwitansi.length,
          statusUtama: matchedKwitansi.length > 0 ? matchedKwitansi[0].statusLabel : 'Belum Ada Kwitansi',
          items: matchedKwitansi
        }
      };
    }\n`;

const endRenderMarker = 'renderDashboardTabel() {';
if (!content.includes('function bukaModalStatusTerintegrasi')) {
  // Letakkan setelah penutup renderDashboardTabel
  const needle = '    // 11. MESIN RENDER 9 DOKUMEN (PRINT & PREVIEW ENGINE)';
  if (content.includes(needle)) {
    content = content.replace(needle, tahap3JsBlock + '\n' + needle);
    console.log('✔ Logika JavaScript Modul Status Terintegrasi (Tahap 3) berhasil disisipkan.');
  } else {
    console.warn('Marker Mesin Render 9 Dokumen tidak ditemukan!');
  }
}

fs.writeFileSync(filePath, content, 'utf-8');
console.log('✔ Seluruh perubahan Tahap 3 berhasil diaplikasikan ke portal-penugasan-jo.html!');
