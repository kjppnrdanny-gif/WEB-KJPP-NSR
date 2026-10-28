import fs from 'fs';

console.log('=== IMPLEMENTING 3 TRACKING ENHANCEMENTS ===');

// ============================================================================
// 1. UPDATE backend/job-tracking-handler.php
// ============================================================================
let phpHandler = fs.readFileSync('backend/job-tracking-handler.php', 'utf8');
phpHandler = phpHandler.replaceAll("'wa_admin' => '6281218008899'", "'wa_admin' => '6285110513157'");
fs.writeFileSync('backend/job-tracking-handler.php', phpHandler, 'utf8');
console.log('✓ backend/job-tracking-handler.php hotline updated to 6285110513157');

// ============================================================================
// 2. UPDATE gas-job-tracking.gs
// ============================================================================
let gasTracking = fs.readFileSync('gas-job-tracking.gs', 'utf8');
gasTracking = gasTracking.replaceAll("wa_admin: '6281218008899'", "wa_admin: '6285110513157'");
fs.writeFileSync('gas-job-tracking.gs', gasTracking, 'utf8');
console.log('✓ gas-job-tracking.gs hotline updated to 6285110513157');

// ============================================================================
// 3. UPDATE data/job_tracking_staging.json
// ============================================================================
if (fs.existsSync('data/job_tracking_staging.json')) {
  let stagingData = fs.readFileSync('data/job_tracking_staging.json', 'utf8');
  stagingData = stagingData.replaceAll('"wa_admin":"6281218008899"', '"wa_admin":"6285110513157"');
  stagingData = stagingData.replaceAll('"wa_admin": "6281218008899"', '"wa_admin": "6285110513157"');
  fs.writeFileSync('data/job_tracking_staging.json', stagingData, 'utf8');
  console.log('✓ data/job_tracking_staging.json updated to 6285110513157');
}

// ============================================================================
// 4. UPDATE portal-tracking.html
// ============================================================================
let ptHtml = fs.readFileSync('portal-tracking.html', 'utf8');

// 4.1 Update hotline
ptHtml = ptHtml.replaceAll('6281218008899', '6285110513157');

// 4.2 Add Team Container to Header Overview Card in modal-tracking-stepper
const ptTeamContainerOld = `          <div class="pt-2 border-t border-slate-800/80 text-[11px] text-slate-300 space-y-1">
            <div><span class="text-slate-400">Objek Agunan:</span> <span id="modal-objek" class="text-white font-medium">Pabrik &amp; Gudang Logistik Komersial</span></div>
            <div><span class="text-slate-400">Lokasi Aset:</span> <span id="modal-lokasi" class="text-slate-300">Jl. Rawa Gelam IV No. 12, Kawasan Industri Pulogadung, Jakarta Timur</span></div>
            <div class="flex items-center justify-between pt-1 font-mono text-[10px] text-slate-400">
              <span>Target Batas SLA: <strong id="modal-sla-target" class="text-amber-300">29 Okt 2026</strong></span>
              <span>Progres Keseluruhan: <strong id="modal-progress-percent" class="text-emerald-400">57%</strong></span>
            </div>
          </div>`;

const ptTeamContainerNew = `          <div class="pt-2 border-t border-slate-800/80 text-[11px] text-slate-300 space-y-1">
            <div><span class="text-slate-400">Objek Agunan:</span> <span id="modal-objek" class="text-white font-medium">Pabrik &amp; Gudang Logistik Komersial</span></div>
            <div><span class="text-slate-400">Lokasi Aset:</span> <span id="modal-lokasi" class="text-slate-300">Jl. Rawa Gelam IV No. 12, Kawasan Industri Pulogadung, Jakarta Timur</span></div>
            <div class="flex items-center justify-between pt-1 font-mono text-[10px] text-slate-400">
              <span>Target Batas SLA: <strong id="modal-sla-target" class="text-amber-300">29 Okt 2026</strong></span>
              <span>Progres Keseluruhan: <strong id="modal-progress-percent" class="text-emerald-400">57%</strong></span>
            </div>
          </div>

          <!-- Tim Penilai & Kendali Mutu Resmi -->
          <div class="pt-2.5 border-t border-slate-800/80">
            <span class="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1.5">Personel Kunci Penugasan:</span>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div class="p-2 rounded-lg bg-slate-900 border border-slate-800 text-[11px]">
                <span class="text-[9.5px] text-slate-400 block font-medium">Penilai Pelaksana / PIC Lapangan:</span>
                <strong id="modal-team-pelaksana" class="text-white font-semibold block truncate mt-0.5">-</strong>
              </div>
              <div class="p-2 rounded-lg bg-slate-900 border border-slate-800 text-[11px]">
                <span class="text-[9.5px] text-slate-400 block font-medium">Reviewer SPM:</span>
                <strong id="modal-team-reviewer" class="text-sky-300 font-semibold block truncate mt-0.5">-</strong>
              </div>
              <div class="p-2 rounded-lg bg-slate-900 border border-slate-800 text-[11px]">
                <span class="text-[9.5px] text-slate-400 block font-medium">Penilai Publik Berizin:</span>
                <strong id="modal-team-penilaipublik" class="text-amber-300 font-semibold block truncate mt-0.5">-</strong>
              </div>
            </div>
          </div>`;

ptHtml = ptHtml.replace(ptTeamContainerOld, ptTeamContainerNew);
// CRLF variant
ptHtml = ptHtml.replace(ptTeamContainerOld.replace(/\n/g, '\r\n'), ptTeamContainerNew.replace(/\n/g, '\r\n'));

// 4.3 Add Dispatch Button in Table Rows
const ptTableRowActionOld = `<div class="flex items-center justify-center gap-1.5">
                <button type="button" onclick="bukaModalTracking('\${j.id}')" class="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-400 hover:text-white transition" title="Lihat 7 Milestone Stepper &amp; Riwayat Log">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                </button>
                \${!isDone ? \`
                  <button type="button" onclick="bukaModalUpdateMilestone('\${j.id}')" class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[10px] font-bold transition active:scale-95" title="Menaikkan Milestone (Otorisasi NIK + PIN)">
                    <span>Majukan</span>
                    <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
                  </button>
                \` : \`
                  <span class="text-[10px] text-emerald-400 font-bold px-2 py-1 bg-emerald-500/10 rounded-lg border border-emerald-500/20">Tuntas</span>
                \`}
              </div>`;

const ptTableRowActionNew = `<div class="flex items-center justify-center gap-1.5">
                <button type="button" onclick="bukaModalTracking('\${j.id}')" class="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-400 hover:text-white transition" title="Lihat 7 Milestone Stepper &amp; Riwayat Log">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                </button>
                <button type="button" onclick="kirimWaKodeLacak('\${j.id}')" class="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold transition active:scale-95" title="Kirim Kode Lacak ke WhatsApp PIC Pemohon">
                  <svg class="w-3.5 h-3.5 fill-current text-emerald-400" viewBox="0 0 24 24"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.299.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86.174.086.275.072.376-.043.101-.116.433-.506.549-.68.116-.173.231-.145.39-.086s1.011.477 1.184.564.289.13.332.202c.043.073.043.419-.101.824z"/></svg>
                  <span class="hidden xl:inline">Kirim WA</span>
                </button>
                \${!isDone ? \`
                  <button type="button" onclick="bukaModalUpdateMilestone('\${j.id}')" class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[10px] font-bold transition active:scale-95" title="Menaikkan Milestone (Otorisasi NIK + PIN)">
                    <span>Majukan</span>
                    <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
                  </button>
                \` : \`
                  <span class="text-[10px] text-emerald-400 font-bold px-2 py-1 bg-emerald-500/10 rounded-lg border border-emerald-500/20">Tuntas</span>
                \`}
              </div>`;

ptHtml = ptHtml.replace(ptTableRowActionOld, ptTableRowActionNew);
ptHtml = ptHtml.replace(ptTableRowActionOld.replace(/\n/g, '\r\n'), ptTableRowActionNew.replace(/\n/g, '\r\n'));

// 4.4 Add Post-Registration Confirmation Modal with WhatsApp Dispatch
const ptPostRegModal = `
  <!-- ==================== MODAL KONFIRMASI REGISTRASI & DISPATCH WA ==================== -->
  <div id="modal-konfirmasi-registrasi" class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md hidden">
    <div class="relative w-full max-w-md bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col text-slate-100">
      <div class="px-5 py-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
          </div>
          <div>
            <h3 class="text-sm font-bold text-white">Job Order Berhasil Diterbitkan</h3>
            <p class="text-[11px] text-slate-400">Kode Lacak Pelacakan 7 Milestone Siap Dikirim</p>
          </div>
        </div>
        <button type="button" onclick="tutupModalKonfirmasiRegistrasi()" class="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>
      <div class="p-5 space-y-3.5 text-xs">
        <div class="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
          <div class="flex justify-between">
            <span class="text-slate-400">Nomor JO:</span>
            <strong id="confirm-jo-number" class="font-mono text-white">-</strong>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-slate-400">Kode Lacak Unik:</span>
            <span id="confirm-kode-lacak" class="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-amber-400/20 text-amber-300 border border-amber-400/40">-</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-400">Debitur:</span>
            <span id="confirm-debitur" class="text-slate-200 font-medium">-</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-400">WhatsApp PIC:</span>
            <span id="confirm-pic" class="text-emerald-400 font-mono">-</span>
          </div>
        </div>
        <p class="text-[11px] text-slate-400 leading-relaxed">
          Kirimkan kode lacak pelacakan ini langsung ke WhatsApp PIC Pemohon agar klien bank dapat memantau progres tahapan M-01 s/d M-07 secara mandiri.
        </p>
        <div class="space-y-2 pt-1">
          <button type="button" id="btn-dispatch-wa-modal" onclick="eksekusiDispatchWaBaru()" class="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition active:scale-[0.99] cursor-pointer">
            <svg class="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.299.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86.174.086.275.072.376-.043.101-.116.433-.506.549-.68.116-.173.231-.145.39-.086s1.011.477 1.184.564.289.13.332.202c.043.073.043.419-.101.824z"/></svg>
            <span>Kirim Kode Lacak ke WhatsApp Klien</span>
          </button>
          <button type="button" onclick="tutupModalKonfirmasiRegistrasi()" class="w-full py-2 px-4 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 hover:text-white font-medium text-xs transition">
            Selesai &amp; Kembali ke Task Board
          </button>
        </div>
      </div>
    </div>
  </div>
`;

if (!ptHtml.includes('id="modal-konfirmasi-registrasi"')) {
  ptHtml = ptHtml.replace('</body>', ptPostRegModal + '\n</body>');
}

// 4.5 Update JS functions: populate team in modal, add explicit PIC per milestone, implement kirimWaKodeLacak
const ptJsFunctions = `
    let newlyCreatedJobForDispatch = null;

    function getPicAssignment(milestoneKey, job) {
      const pelaksana = job.penilai_pelaksana || job.surveyor || 'Tim Penilai Pelaksana';
      const reviewer = job.reviewer || job.reviewer_spm || 'Reviewer SPM';
      const penilaiPublik = job.penilai_publik ? job.penilai_publik.split('-')[0].trim() : 'Penilai Publik Berizin (Partner)';

      switch(milestoneKey) {
        case 'M-01': return { role: 'PIC Registrasi', name: 'Admin Operasional' };
        case 'M-02': return { role: 'PIC Penugasan', name: 'Pimpinan Rekan / Kasubdiv' };
        case 'M-03': return { role: 'PIC Lapangan', name: pelaksana };
        case 'M-04': return { role: 'PIC Analisis', name: \`\${pelaksana} / Tim Teknis\` };
        case 'M-05': return { role: 'PIC Kendali Mutu', name: reviewer };
        case 'M-06': return { role: 'PIC Otorisasi', name: penilaiPublik };
        case 'M-07': return { role: 'PIC Distribusi', name: 'Admin Pengiriman / Logistik' };
        default: return { role: 'Penanggung Jawab', name: '-' };
      }
    }

    function kirimWaKodeLacak(joId) {
      const job = globalJobs.find(x => x.id === joId || x.jo_number === joId);
      if (!job) return alert('Data penugasan tidak ditemukan.');

      let picContact = (job.pic_contact || '').replace(/[^0-9]/g, '');
      if (picContact.startsWith('0')) {
        picContact = '62' + picContact.slice(1);
      }
      if (!picContact || picContact.length < 8) {
        picContact = '6285110513157';
      }

      const picName = job.pic_pemohon || 'Bapak/Ibu PIC Pemohon';
      const pesan = \`Yth. Bapak/Ibu \${picName},
Terima kasih atas kepercayaan penugasan penilaian properti kepada KJPP Nanang Rahayu Sigit Paryanto & Rekan.

Penugasan Anda telah resmi teregistrasi pada sistem OPINI NSR:
• No. SPK / JO: \${job.jo_number}
• Debitur: \${job.debitur}
• Objek & Lokasi: \${job.jenis_properti} - \${job.lokasi_aset}
• Kode Unik Lacak: \${job.kode_lacak || '-'}

Anda dapat memantau tahapan progres pekerjaan secara langsung dan real-time melalui tautan berikut:
https://kjppnanangrahayu.com?track=\${job.kode_lacak || job.jo_number}

Salam hormat,
Administrasi Operasional KJPP NSR\`;

      const waUrl = \`https://wa.me/\${picContact}?text=\${encodeURIComponent(pesan)}\`;
      window.open(waUrl, '_blank', 'noopener,noreferrer');
    }

    function eksekusiDispatchWaBaru() {
      if (newlyCreatedJobForDispatch) {
        kirimWaKodeLacak(newlyCreatedJobForDispatch.jo_number);
        tutupModalKonfirmasiRegistrasi();
      }
    }

    function tutupModalKonfirmasiRegistrasi() {
      document.getElementById('modal-konfirmasi-registrasi').classList.add('hidden');
    }
`;

// Insert helper functions before bukaModalTracking
ptHtml = ptHtml.replace('// MODAL STEPPER & AUDIT TRAIL LOG PROGRESS', ptJsFunctions + '\n    // MODAL STEPPER & AUDIT TRAIL LOG PROGRESS');

// Update bukaModalTracking to populate team
const ptPopulateTeamOld = `document.getElementById('modal-sla-target').textContent = job.sla_deadline;`;
const ptPopulateTeamNew = `document.getElementById('modal-sla-target').textContent = job.sla_deadline;
      document.getElementById('modal-team-pelaksana').textContent = job.penilai_pelaksana || job.surveyor || '-';
      document.getElementById('modal-team-reviewer').textContent = job.reviewer || job.reviewer_spm || '-';
      document.getElementById('modal-team-penilaipublik').textContent = job.penilai_publik || 'Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)';`;

ptHtml = ptHtml.replace(ptPopulateTeamOld, ptPopulateTeamNew);

// Update renderVerticalStepper to display explicit PIC assignment
const ptRenderStepperOld = `              <div class="mt-2 pt-2 border-t border-slate-800/60 flex flex-wrap items-center justify-between gap-2 text-[10px]">
                <span class="text-slate-300"><strong class="text-slate-500">Catatan:</strong> \${item.note || '-'}</span>
                <span class="font-mono text-slate-400">\${item.timestamp || '-'}</span>
              </div>`;

const ptRenderStepperNew = `              <div class="mt-2 pt-2 border-t border-slate-800/60 flex flex-wrap items-center justify-between gap-2 text-[10px]">
                <div class="flex items-center gap-1.5 \${isInProgress ? 'text-amber-300 font-bold' : 'text-slate-300'}">
                  <svg class="w-3.5 h-3.5 \${isInProgress ? 'text-amber-400' : 'text-slate-500'} shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                  <span>\${picInfo.role}: <strong class="\${isInProgress ? 'text-amber-300 font-extrabold' : 'text-slate-200'}">\${picInfo.name}</strong></span>
                </div>
                <span class="font-mono text-slate-400">\${item.timestamp || '-'}</span>
              </div>
              <div class="mt-1 text-[10px] text-slate-400">
                <span class="text-slate-500 font-medium">Catatan:</span> \${item.note || '-'}
              </div>`;

// Inside renderVerticalStepper loop
ptHtml = ptHtml.replace(
  `        const isCompleted = item.status === 'completed';
        const isInProgress = item.status === 'in_progress';`,
  `        const isCompleted = item.status === 'completed';
        const isInProgress = item.status === 'in_progress';
        const picInfo = getPicAssignment(key, activeJob || {});`
);
ptHtml = ptHtml.replace(ptRenderStepperOld, ptRenderStepperNew);
ptHtml = ptHtml.replace(ptRenderStepperOld.replace(/\n/g, '\r\n'), ptRenderStepperNew.replace(/\n/g, '\r\n'));

// Update eksekusiRegistrasiJO to trigger post-registration confirmation modal
const ptRegSuccessOld = `        if (res && res.status === 'success') {
          alert('Sukses! Job Order baru berhasil diterbitkan:\\n\\n• Nomor JO: ' + res.data.jo_number + '\\n• Kode Lacak Unik: ' + (res.data.kode_lacak || '-') + '\\n• Debitur: ' + (res.data.debitur || '-') + '\\n• Kantor: ' + (res.data.kantor || '-') + '\\n\\nKode Lacak ini dapat diberikan langsung kepada PIC Pemohon / Debitur untuk melacak penugasan di halaman beranda.');
          document.getElementById('form-registrasi-jo').reset();
          document.getElementById('tarik-feedback-banner')?.classList.add('hidden');
          switchTab('board');
          await muatDataTaskBoard();
        } else {`;

const ptRegSuccessNew = `        if (res && res.status === 'success') {
          document.getElementById('form-registrasi-jo').reset();
          document.getElementById('tarik-feedback-banner')?.classList.add('hidden');
          switchTab('board');
          await muatDataTaskBoard();

          newlyCreatedJobForDispatch = res.data;
          document.getElementById('confirm-jo-number').textContent = res.data.jo_number || '-';
          document.getElementById('confirm-kode-lacak').textContent = res.data.kode_lacak || '-';
          document.getElementById('confirm-debitur').textContent = res.data.debitur || '-';
          document.getElementById('confirm-pic').textContent = (res.data.pic_pemohon || '-') + ' (' + (res.data.pic_contact || '-') + ')';
          document.getElementById('modal-konfirmasi-registrasi').classList.remove('hidden');
        } else {`;

ptHtml = ptHtml.replace(ptRegSuccessOld, ptRegSuccessNew);
ptHtml = ptHtml.replace(ptRegSuccessOld.replace(/\n/g, '\r\n'), ptRegSuccessNew.replace(/\n/g, '\r\n'));

fs.writeFileSync('portal-tracking.html', ptHtml, 'utf8');
console.log('✓ portal-tracking.html updated');


// ============================================================================
// 5. UPDATE index.html
// ============================================================================
let idxHtml = fs.readFileSync('index.html', 'utf8');

// 5.1 Update hotline in index.html
idxHtml = idxHtml.replaceAll('6281218008899', '6285110513157');

// 5.2 Add team overview container to index.html modal
const idxTeamContainerOld = `          <div class="pt-2 border-t border-slate-800/80 text-[11px] text-slate-300 space-y-1">
            <div><span class="text-slate-400">Objek Agunan:</span> <span id="pub-modal-objek" class="text-white font-medium">Pabrik &amp; Gudang Logistik Komersial</span></div>
            <div><span class="text-slate-400">Lokasi Aset:</span> <span id="pub-modal-lokasi" class="text-slate-300">Jl. Rawa Gelam IV No. 12, Kawasan Industri Pulogadung, Jakarta Timur</span></div>
            <div class="flex items-center justify-between pt-1 font-mono text-[10px] text-slate-400">
              <span>Target Batas SLA: <strong id="pub-modal-sla-target" class="text-amber-300">29 Okt 2026</strong></span>
              <span>Progres Keseluruhan: <strong id="pub-modal-progress-percent" class="text-emerald-400">57%</strong></span>
            </div>
          </div>`;

const idxTeamContainerNew = `          <div class="pt-2 border-t border-slate-800/80 text-[11px] text-slate-300 space-y-1">
            <div><span class="text-slate-400">Objek Agunan:</span> <span id="pub-modal-objek" class="text-white font-medium">Pabrik &amp; Gudang Logistik Komersial</span></div>
            <div><span class="text-slate-400">Lokasi Aset:</span> <span id="pub-modal-lokasi" class="text-slate-300">Jl. Rawa Gelam IV No. 12, Kawasan Industri Pulogadung, Jakarta Timur</span></div>
            <div class="flex items-center justify-between pt-1 font-mono text-[10px] text-slate-400">
              <span>Target Batas SLA: <strong id="pub-modal-sla-target" class="text-amber-300">29 Okt 2026</strong></span>
              <span>Progres Keseluruhan: <strong id="pub-modal-progress-percent" class="text-emerald-400">57%</strong></span>
            </div>
          </div>

          <!-- Tim Penilai & Kendali Mutu Resmi -->
          <div class="pt-2.5 border-t border-slate-800/80">
            <span class="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1.5">Personel Kunci Penugasan:</span>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div class="p-2 rounded-lg bg-slate-900 border border-slate-800 text-[11px]">
                <span class="text-[9.5px] text-slate-400 block font-medium">Penilai Pelaksana / PIC Lapangan:</span>
                <strong id="pub-modal-team-pelaksana" class="text-white font-semibold block truncate mt-0.5">-</strong>
              </div>
              <div class="p-2 rounded-lg bg-slate-900 border border-slate-800 text-[11px]">
                <span class="text-[9.5px] text-slate-400 block font-medium">Reviewer SPM:</span>
                <strong id="pub-modal-team-reviewer" class="text-sky-300 font-semibold block truncate mt-0.5">-</strong>
              </div>
              <div class="p-2 rounded-lg bg-slate-900 border border-slate-800 text-[11px]">
                <span class="text-[9.5px] text-slate-400 block font-medium">Penilai Publik Berizin:</span>
                <strong id="pub-modal-team-penilaipublik" class="text-amber-300 font-semibold block truncate mt-0.5">-</strong>
              </div>
            </div>
          </div>`;

idxHtml = idxHtml.replace(idxTeamContainerOld, idxTeamContainerNew);
idxHtml = idxHtml.replace(idxTeamContainerOld.replace(/\n/g, '\r\n'), idxTeamContainerNew.replace(/\n/g, '\r\n'));

// 5.3 In bukaModalTrackingPublik, populate team elements & explicit PIC per milestone
const idxPopulateTeamOld = `document.getElementById('pub-modal-sla-target').textContent = job.sla_deadline || '-';`;
const idxPopulateTeamNew = `document.getElementById('pub-modal-sla-target').textContent = job.sla_deadline || '-';
      document.getElementById('pub-modal-team-pelaksana').textContent = job.penilai_pelaksana || job.surveyor || '-';
      document.getElementById('pub-modal-team-reviewer').textContent = job.reviewer || job.reviewer_spm || '-';
      document.getElementById('pub-modal-team-penilaipublik').textContent = job.penilai_publik || 'Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)';`;

idxHtml = idxHtml.replace(idxPopulateTeamOld, idxPopulateTeamNew);

// Function getPicAssignment for index.html
const idxPicHelper = `
    function getPicAssignmentPublik(milestoneKey, job) {
      const pelaksana = job.penilai_pelaksana || job.surveyor || 'Tim Penilai Pelaksana';
      const reviewer = job.reviewer || job.reviewer_spm || 'Reviewer SPM';
      const penilaiPublik = job.penilai_publik ? job.penilai_publik.split('-')[0].trim() : 'Penilai Publik Berizin (Partner)';

      switch(milestoneKey) {
        case 'M-01': return { role: 'PIC Registrasi', name: 'Admin Operasional' };
        case 'M-02': return { role: 'PIC Penugasan', name: 'Pimpinan Rekan / Kasubdiv' };
        case 'M-03': return { role: 'PIC Lapangan', name: pelaksana };
        case 'M-04': return { role: 'PIC Analisis', name: pelaksana + ' / Tim Teknis' };
        case 'M-05': return { role: 'PIC Kendali Mutu', name: reviewer };
        case 'M-06': return { role: 'PIC Otorisasi', name: penilaiPublik };
        case 'M-07': return { role: 'PIC Distribusi', name: 'Admin Pengiriman / Logistik' };
        default: return { role: 'Penanggung Jawab', name: '-' };
      }
    }
`;

idxHtml = idxHtml.replace('// Buka Modal Tangga Progres Publik', idxPicHelper + '\n    // Buka Modal Tangga Progres Publik');

// Update render stepper inside index.html
const idxRenderStepperOld = `            '<p class="text-[11px] text-slate-400 leading-snug">' + (item.desc || '') + '</p>' +
            '<div class="mt-2 pt-2 border-t border-slate-800/60 flex flex-wrap items-center justify-between gap-2 text-[10px]">' +
              '<span class="text-slate-300"><strong class="text-slate-500">Catatan:</strong> ' + (item.note || '-') + '</span>' +
              '<span class="font-mono text-slate-400">' + (item.timestamp || '-') + '</span>' +
            '</div>' +`;

const idxRenderStepperNew = `            '<p class="text-[11px] text-slate-400 leading-snug">' + (item.desc || '') + '</p>' +
            '<div class="mt-2 pt-2 border-t border-slate-800/60 flex flex-wrap items-center justify-between gap-2 text-[10px]">' +
              '<div class="flex items-center gap-1.5 ' + (isInProgress ? 'text-amber-300 font-bold' : 'text-slate-300') + '">' +
                '<svg class="w-3.5 h-3.5 ' + (isInProgress ? 'text-amber-400' : 'text-slate-500') + ' shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>' +
                '<span>' + picInfo.role + ': <strong class="' + (isInProgress ? 'text-amber-300 font-extrabold' : 'text-slate-200') + '">' + picInfo.name + '</strong></span>' +
              '</div>' +
              '<span class="font-mono text-slate-400">' + (item.timestamp || '-') + '</span>' +
            '</div>' +
            '<div class="mt-1 text-[10px] text-slate-400"><span class="text-slate-500 font-medium">Catatan:</span> ' + (item.note || '-') + '</div>' +`;

idxHtml = idxHtml.replace(
  `        const isCompleted = item.status === 'completed';
        const isInProgress = item.status === 'in_progress';`,
  `        const isCompleted = item.status === 'completed';
        const isInProgress = item.status === 'in_progress';
        const picInfo = getPicAssignmentPublik(key, job || {});`
);
idxHtml = idxHtml.replace(idxRenderStepperOld, idxRenderStepperNew);
idxHtml = idxHtml.replace(idxRenderStepperOld.replace(/\n/g, '\r\n'), idxRenderStepperNew.replace(/\n/g, '\r\n'));

// 5.4 Add URL query parameter handler ?track= or ?jo= for one-click deep tracking link
const idxUrlParamHandler = `
    // One-Click URL Dispatch Handler (?track=TRK-... atau ?jo=JO-...)
    document.addEventListener('DOMContentLoaded', function() {
      const urlParams = new URLSearchParams(window.location.search);
      const trackParam = urlParams.get('track') || urlParams.get('jo');
      if (trackParam) {
        const inputJo = document.getElementById('track-jo-input');
        const sectionLacak = document.getElementById('lacak-penugasan');
        if (inputJo) {
          inputJo.value = trackParam.trim();
        }
        if (sectionLacak) {
          setTimeout(function() {
            sectionLacak.scrollIntoView({ behavior: 'smooth', block: 'center' });
            if (typeof eksekusiLacakPenugasanPublik === 'function') {
              eksekusiLacakPenugasanPublik();
            }
          }, 400);
        }
      }
    });
`;

idxHtml = idxHtml.replace('// Inisialisasi Carousel Portfolio Otomatis', idxUrlParamHandler + '\n    // Inisialisasi Carousel Portfolio Otomatis');

fs.writeFileSync('index.html', idxHtml, 'utf8');
console.log('✓ index.html updated');

console.log('=== ALL 3 ENHANCEMENTS APPLIED SUCCESSFULLY ===');
