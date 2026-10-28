import fs from 'node:fs';

let content = fs.readFileSync('portal-tracking.html', 'utf8');
const isCRLF = content.includes('\r\n');
let norm = content.replace(/\r\n/g, '\n');

// 1. Injeksi Toolbar Dynamic Partner Filter di atas Task Board
const oldSectionBoard = `    <!-- ==================== TAB 1: TASK BOARD TABLE ==================== -->
    <section id="panel-tab-board" class="space-y-4">
      <div class="rounded-2xl border border-slate-800 bg-slate-900/90 shadow-xl overflow-hidden backdrop-blur-md">`;

const newSectionBoard = `    <!-- ==================== TAB 1: TASK BOARD TABLE ==================== -->
    <section id="panel-tab-board" class="space-y-4">

      <!-- FILTER MITRA & KENDALI STATUS (NON-REGRESSION TOOLBAR) -->
      <div id="dynamic-partner-filter-bar" class="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-lg backdrop-blur-md">
        <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div class="flex items-center gap-2">
            <span class="text-xs font-semibold uppercase tracking-wider text-slate-400">Pemberi Tugas:</span>
            <span id="badge-partner-count" class="inline-flex items-center rounded-md border border-blue-800/60 bg-blue-950/40 px-2.5 py-0.5 text-xs font-medium text-blue-300">
              Menampilkan Seluruh Berkas
            </span>
          </div>

          <!-- Toggle Status Penugasan -->
          <div class="flex items-center gap-1.5 self-start md:self-auto">
            <button type="button" id="btn-filter-scope-active" onclick="setJobScope('active')"
              class="rounded-lg border border-blue-600 bg-blue-600 px-3 py-1 text-xs font-medium text-white shadow-sm transition cursor-pointer">
              Sedang Berjalan (M-01 s/d M-06)
            </button>
            <button type="button" id="btn-filter-scope-all" onclick="setJobScope('all')"
              class="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1 text-xs font-medium text-slate-300 transition hover:bg-slate-700 cursor-pointer">
              Semua Berkas (Termasuk M-07)
            </button>
          </div>
        </div>

        <!-- Baris Tab Mitra yang Terbentuk Otomatis -->
        <div id="partner-tabs-list" class="mt-3 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-slate-700">
          <!-- Konten diinjeksi via renderDynamicPartnerTabs() -->
        </div>
      </div>

      <div class="rounded-2xl border border-slate-800 bg-slate-900/90 shadow-xl overflow-hidden backdrop-blur-md">`;

if (norm.includes(oldSectionBoard)) {
  norm = norm.replace(oldSectionBoard, newSectionBoard);
  console.log('✓ Injected Dynamic Partner Filter Bar above Task Board table');
} else {
  console.log('oldSectionBoard not matched');
}

// 2. Injeksi Contextual Action Bar di dalam Modal Stepper (bawah Audit Log)
const oldModalAuditEnd = `            </table>
          </div>
        </div>

      </div>

      <!-- Modal Footer -->`;

const newModalAuditEnd = `            </table>
          </div>
        </div>

        <!-- KONEKTIVITAS EKOSISTEM OPINI NSR (Contextual Action Bar) -->
        <div class="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
          <div class="mb-3 flex items-center justify-between border-b border-slate-800/80 pb-2">
            <div class="flex items-center gap-2">
              <svg class="h-4 w-4 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span class="text-xs font-bold uppercase tracking-wider text-slate-300">Aksi Lintas Portal OPINI NSR</span>
            </div>
            <span class="text-[11px] text-slate-500 font-mono">Koneksi otomatis membawa konteks No. JO</span>
          </div>

          <div id="opini-cross-portal-actions" class="grid grid-cols-1 gap-2.5 sm:grid-cols-2 md:grid-cols-3">
            <!-- Di-generate dinamis sesuai milestone aktif berkas -->
          </div>
        </div>

      </div>

      <!-- Modal Footer -->`;

if (norm.includes(oldModalAuditEnd)) {
  norm = norm.replace(oldModalAuditEnd, newModalAuditEnd);
  console.log('✓ Injected Contextual Action Bar in Modal Stepper');
} else {
  console.log('oldModalAuditEnd not matched');
}

// 3. Tambahkan Logika Dynamic Partner Filter & Contextual Action Bar di JavaScript
const filterLogicJs = `
    // =========================================================================
    // DYNAMIC PARTNER FILTER & CONTEXTUAL ACTION BAR (NON-DESTRUCTIVE)
    // =========================================================================
    let selectedPartnerFilter = 'ALL';
    let activeScopeFilter = 'active'; // 'active' (M-01 s/d M-06) atau 'all' (semua termasuk M-07)

    /**
     * Ekstraksi daftar mitra unik dan perhitungannya langsung dari dataset penugasan riil
     */
    function extractUniquePartners() {
      const counts = { ALL: 0 };
      const jobs = globalJobs || [];
      if (!Array.isArray(jobs)) return counts;

      jobs.forEach(job => {
        const isDone = (job.current_milestone === 'M-07' || job.milestone === 'M-07' || job.sla_status === 'completed' || job.status === 'SELESAI');
        if (activeScopeFilter === 'active' && isDone) return;

        counts.ALL++;
        const partner = (job.pemberi_tugas || job.instansi || 'Non-Bank / Perorangan').trim();
        counts[partner] = (counts[partner] || 0) + 1;
      });

      return counts;
    }

    /**
     * Render tab mitra dinamis
     */
    function renderDynamicPartnerTabs() {
      const container = document.getElementById('partner-tabs-list');
      if (!container) return;

      const counts = extractUniquePartners();
      const partners = Object.keys(counts).filter(k => k !== 'ALL').sort();

      let html = \`
        <button type="button" onclick="handlePartnerSelect('ALL')" 
          class="whitespace-nowrap rounded-lg border px-3 py-1.5 text-xs font-semibold transition cursor-pointer \${
            selectedPartnerFilter === 'ALL'
              ? 'border-blue-500 bg-blue-600 text-white shadow'
              : 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700'
          }">
          Semua Mitra <span class="ml-1.5 rounded-full bg-slate-950/60 px-1.5 py-0.5 font-mono text-[10px]">\${counts.ALL || 0}</span>
        </button>
      \`;

      partners.forEach(partner => {
        const isActive = (selectedPartnerFilter === partner);
        const escapedPartner = partner.replace(/'/g, "\\\\'");
        html += \`
          <button type="button" onclick="handlePartnerSelect('\${escapedPartner}')" 
            class="whitespace-nowrap rounded-lg border px-3 py-1.5 text-xs font-semibold transition cursor-pointer \${
              isActive
                ? 'border-amber-500 bg-amber-600 text-white shadow'
                : 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700'
            }">
            \${partner} <span class="ml-1.5 rounded-full bg-slate-950/60 px-1.5 py-0.5 font-mono text-[10px]">\${counts[partner] || 0}</span>
          </button>
        \`;
      });

      container.innerHTML = html;
    }

    function handlePartnerSelect(partner) {
      selectedPartnerFilter = partner;
      executeJobFiltering();
      renderDynamicPartnerTabs();
    }

    function setJobScope(scope) {
      activeScopeFilter = scope;
      const btnActive = document.getElementById('btn-filter-scope-active');
      const btnAll = document.getElementById('btn-filter-scope-all');

      if (scope === 'active') {
        if (btnActive) btnActive.className = "rounded-lg border border-blue-600 bg-blue-600 px-3 py-1 text-xs font-medium text-white shadow-sm transition cursor-pointer";
        if (btnAll) btnAll.className = "rounded-lg border border-slate-700 bg-slate-800 px-3 py-1 text-xs font-medium text-slate-300 transition hover:bg-slate-700 cursor-pointer";
      } else {
        if (btnActive) btnActive.className = "rounded-lg border border-slate-700 bg-slate-800 px-3 py-1 text-xs font-medium text-slate-300 transition hover:bg-slate-700 cursor-pointer";
        if (btnAll) btnAll.className = "rounded-lg border border-blue-600 bg-blue-600 px-3 py-1 text-xs font-medium text-white shadow-sm transition cursor-pointer";
      }

      // Reset partner filter jika tidak ada berkas di scope terpilih
      const counts = extractUniquePartners();
      if (selectedPartnerFilter !== 'ALL' && !counts[selectedPartnerFilter]) {
        selectedPartnerFilter = 'ALL';
      }

      executeJobFiltering();
      renderDynamicPartnerTabs();
    }

    /**
     * Filter gabungan: Scope + Partner + Input Text Search + Filter Wilayah
     */
    function executeJobFiltering() {
      const searchInput = document.getElementById('filter-keyword') || document.getElementById('search-job-input') || document.querySelector('input[type="search"]');
      const query = searchInput ? searchInput.value.trim().toLowerCase() : '';
      const kantor = document.getElementById('filter-kantor')?.value || '';

      const jobs = globalJobs || [];
      const filtered = jobs.filter(job => {
        // 1. Filter Scope (Active vs All)
        const isDone = (job.current_milestone === 'M-07' || job.milestone === 'M-07' || job.sla_status === 'completed' || job.status === 'SELESAI');
        if (activeScopeFilter === 'active' && isDone) return false;

        // 2. Filter Partner
        if (selectedPartnerFilter !== 'ALL') {
          const partner = (job.pemberi_tugas || job.instansi || 'Non-Bank / Perorangan').trim();
          if (partner !== selectedPartnerFilter) return false;
        }

        // 3. Filter Wilayah Kantor (Preserve Branch Isolation)
        if (kantor && currentUserSession.access_level !== 'BRANCH_ISOLATED') {
          let jCode = (job.kantor_code || '').toUpperCase();
          if (jCode === 'JKT') jCode = 'PUSAT';
          if (jCode !== kantor.toUpperCase()) return false;
        }

        // 4. Filter Kotak Pencarian
        if (query) {
          const searchBlob = [
            job.jo_number,
            job.no_jo,
            job.kode_lacak,
            job.spk_number,
            job.debitur,
            job.nama_debitur,
            job.pemberi_tugas,
            job.pengguna_laporan,
            job.instansi,
            job.lokasi_aset,
            job.alamat_agunan,
            job.jenis_properti,
            job.penilai_pelaksana,
            job.surveyor
          ].filter(Boolean).join(' ').toLowerCase();

          if (!searchBlob.includes(query)) return false;
        }

        return true;
      });

      const countBadge = document.getElementById('badge-partner-count');
      if (countBadge) {
        if (selectedPartnerFilter === 'ALL') {
          countBadge.textContent = \`Menampilkan \${filtered.length} dari \${jobs.length} Penugasan\`;
        } else {
          countBadge.textContent = \`Mitra: \${selectedPartnerFilter} (\${filtered.length} Berkas)\`;
        }
      }

      renderTaskBoard(filtered);
    }

    /**
     * Membentuk tombol jalan pintas kontekstual ke portal lain di OPINI NSR
     */
    function updateCrossPortalActions(job) {
      const container = document.getElementById('opini-cross-portal-actions');
      if (!container || !job) return;

      const jo = job.jo_number || job.no_jo || '';
      const joParam = encodeURIComponent(jo);
      const debiturParam = encodeURIComponent(job.debitur || job.nama_debitur || '');
      const partnerParam = encodeURIComponent(job.pemberi_tugas || job.instansi || '');
      const currentM = job.current_milestone || job.milestone || 'M-01';

      let actionsHtml = '';

      // 1. Tautan Portal Lingkup Penugasan & SPK (Tersedia untuk semua berkas)
      actionsHtml += \`
        <a href="portal-spk.html?jo=\${joParam}" target="_blank" rel="noopener noreferrer"
          class="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-900/90 px-3 py-2 text-xs font-medium text-slate-200 transition hover:border-sky-500 hover:bg-slate-800 shadow-sm">
          <span class="truncate">Surat Penugasan (SPK)</span>
          <svg class="h-3.5 w-3.5 text-slate-400 ml-1 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
        </a>
      \`;

      // 2. Tahap M-02, M-03, M-04 -> Tautan ke Portal Biaya Operasional (BOP)
      if (['M-02', 'M-03', 'M-04'].includes(currentM)) {
        const surveyor = job.penilai_pelaksana || job.surveyor || '';
        actionsHtml += \`
          <a href="portal-bop.html?jo=\${joParam}&pic=\${encodeURIComponent(surveyor)}&bank=\${partnerParam}" target="_blank" rel="noopener noreferrer"
            class="flex items-center justify-between rounded-lg border border-amber-600/40 bg-amber-950/20 px-3 py-2 text-xs font-medium text-amber-200 transition hover:border-amber-500 hover:bg-amber-900/30 shadow-sm">
            <span class="truncate">Pengajuan BOP Survei</span>
            <svg class="h-3.5 w-3.5 text-amber-400 ml-1 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
          </a>
        \`;
      }

      // 3. Tahap M-05, M-06, M-07 -> Tautan ke Portal Nomor Laporan (NoLap Kemenkeu)
      if (['M-05', 'M-06', 'M-07'].includes(currentM)) {
        const klasifikasi = job.klasifikasi_izin_objek || job.klasifikasi_objek || 'P';
        actionsHtml += \`
          <a href="portal-nolap.html?jo=\${joParam}&debitur=\${debiturParam}&klasifikasi=\${encodeURIComponent(klasifikasi)}" target="_blank" rel="noopener noreferrer"
            class="flex items-center justify-between rounded-lg border border-sky-600/40 bg-sky-950/30 px-3 py-2 text-xs font-medium text-sky-200 transition hover:border-sky-500 hover:bg-sky-900/40 shadow-sm">
            <span class="truncate">Registrasi NoLap Kemenkeu</span>
            <svg class="h-3.5 w-3.5 text-sky-400 ml-1 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
          </a>
        \`;
      }

      // 4. Tahap M-06 & M-07 -> Tautan ke Portal Kwitansi & Tagihan Keuangan
      if (['M-06', 'M-07'].includes(currentM)) {
        actionsHtml += \`
          <a href="portal-keuangan.html?jo=\${joParam}&client=\${partnerParam}" target="_blank" rel="noopener noreferrer"
            class="flex items-center justify-between rounded-lg border border-emerald-600/40 bg-emerald-950/20 px-3 py-2 text-xs font-medium text-emerald-200 transition hover:border-emerald-500 hover:bg-emerald-900/30 shadow-sm">
            <span class="truncate">Verifikasi Kwitansi &amp; Tagihan</span>
            <svg class="h-3.5 w-3.5 text-emerald-400 ml-1 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
          </a>
        \`;
      }

      container.innerHTML = actionsHtml;
    }
`;

// Injeksi fungsi baru sebelum filterTaskBoard
if (!norm.includes('function renderDynamicPartnerTabs()')) {
  norm = norm.replace('// Filter Task Board\n    function filterTaskBoard() {', filterLogicJs + '\n    // Filter Task Board (Delegated to executeJobFiltering)\n    function filterTaskBoard() {');
  console.log('✓ Injected Dynamic Partner Filter JS logic & Cross Portal Action Generator');
}

// 4. Update filterTaskBoard implementation to call executeJobFiltering & renderDynamicPartnerTabs
const oldFilterTaskBoard = `    // Filter Task Board (Delegated to executeJobFiltering)
    function filterTaskBoard() {
      const kw = (document.getElementById('filter-keyword')?.value || '').toLowerCase().trim();
      const kantor = document.getElementById('filter-kantor')?.value || '';

      const filtered = globalJobs.filter(j => {
        const matchKw = !kw || 
          (j.jo_number && j.jo_number.toLowerCase().includes(kw)) ||
          (j.kode_lacak && j.kode_lacak.toLowerCase().includes(kw)) ||
          (j.debitur && j.debitur.toLowerCase().includes(kw)) ||
          (j.instansi && j.instansi.toLowerCase().includes(kw)) ||
          (j.spk_number && j.spk_number.toLowerCase().includes(kw));
        
        let matchKantor = true;
        if (kantor && currentUserSession.access_level !== 'BRANCH_ISOLATED') {
          let jCode = (j.kantor_code || '').toUpperCase();
          if (jCode === 'JKT') jCode = 'PUSAT';
          matchKantor = (jCode === kantor.toUpperCase());
        }

        return matchKw && matchKantor;
      });

      renderTaskBoard(filtered);
    }`;

const newFilterTaskBoard = `    // Filter Task Board (Delegated to executeJobFiltering)
    function filterTaskBoard() {
      executeJobFiltering();
      renderDynamicPartnerTabs();
    }`;

if (norm.includes(oldFilterTaskBoard)) {
  norm = norm.replace(oldFilterTaskBoard, newFilterTaskBoard);
  console.log('✓ filterTaskBoard seamlessly wired to executeJobFiltering & renderDynamicPartnerTabs');
}

// 5. Update muatDataTaskBoard: invoke renderDynamicPartnerTabs & executeJobFiltering after fetching
const oldMuatSuccess = `        if (res && res.status === 'success' && Array.isArray(res.data)) {
          globalJobs = res.data;
          renderTaskBoard(globalJobs);
          updateKPIStats(globalJobs);
        } else {`;

const newMuatSuccess = `        if (res && res.status === 'success' && Array.isArray(res.data)) {
          globalJobs = res.data;
          renderDynamicPartnerTabs();
          executeJobFiltering();
          updateKPIStats(globalJobs);
        } else {`;

if (norm.includes(oldMuatSuccess)) {
  norm = norm.replace(oldMuatSuccess, newMuatSuccess);
  console.log('✓ muatDataTaskBoard triggers renderDynamicPartnerTabs & executeJobFiltering');
}

// 6. Update bukaModalTracking: call updateCrossPortalActions(job)
const oldBukaModalEnd = `      // Render Audit Trail Log
      await renderAuditTrailLog(job.jo_number);

      // Open Modal
      document.getElementById('modal-tracking-stepper').classList.remove('hidden');`;

const newBukaModalEnd = `      // Render Audit Trail Log
      await renderAuditTrailLog(job.jo_number);

      // Update Contextual Action Bar OPINI NSR
      updateCrossPortalActions(job);

      // Open Modal
      document.getElementById('modal-tracking-stepper').classList.remove('hidden');`;

if (norm.includes(oldBukaModalEnd)) {
  norm = norm.replace(oldBukaModalEnd, newBukaModalEnd);
  console.log('✓ bukaModalTracking triggers updateCrossPortalActions(job)');
}

fs.writeFileSync('portal-tracking.html', isCRLF ? norm.replace(/\n/g, '\r\n') : norm, 'utf8');
console.log('✓ portal-tracking.html successfully updated with Non-Destructive Hub & Spoke features');
