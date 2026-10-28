import fs from 'node:fs';

let content = fs.readFileSync('portal-tracking.html', 'utf8');
let isCRLF = content.includes('\r\n');
let norm = content.replace(/\r\n/g, '\n');

// 1. Update Modal Stepper Overview Card (Pemberi Tugas, Pengguna Laporan, WhatsApp Dispatch & Survey buttons)
const oldModalOverview = `          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
            <div>
              <span class="text-[10px] text-slate-400 uppercase font-semibold block">Instansi Pemohon:</span>
              <strong id="modal-instansi" class="text-white">PT Bank Tabungan Negara (Persero) Tbk</strong>
              <p id="modal-unit-kerja" class="text-[11px] text-sky-400">KC Jakarta Harmoni</p>
            </div>
            <div>
              <span class="text-[10px] text-slate-400 uppercase font-semibold block">Nama Debitur:</span>
              <strong id="modal-debitur" class="text-amber-300">PT Bangun Prima Perkasa</strong>
              <p id="modal-pic-contact" class="text-[11px] text-slate-400">PIC: Bambang Sudarsono (081288997766)</p>
            </div>
          </div>`;

const newModalOverview = `          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
            <div class="space-y-0.5">
              <span class="text-[10px] text-slate-400 uppercase font-semibold block">Pemberi Tugas (Client - SPI 103):</span>
              <strong id="modal-pemberi-tugas" class="text-white block">-</strong>
              <p class="text-[11px] text-slate-400">Pengguna Laporan: <span id="modal-pengguna-laporan" class="text-sky-300 font-medium">-</span></p>
              <p id="modal-unit-kerja" class="text-[10px] text-slate-500 font-mono">-</p>
            </div>
            <div class="space-y-0.5">
              <span class="text-[10px] text-slate-400 uppercase font-semibold block">Nama Debitur / Entitas:</span>
              <strong id="modal-debitur" class="text-amber-300 block">-</strong>
              <p class="text-[11px] text-slate-300">PIC Pemberi Tugas: <span id="modal-client-pic" class="text-emerald-400 font-mono font-medium">-</span></p>
              <p class="text-[10px] text-slate-400">Pendamping Survei: <span id="modal-survey-pic" class="text-slate-300">-</span></p>
            </div>
          </div>

          <!-- Tombol WhatsApp Aksi Langsung Modal -->
          <div class="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-800/80">
            <button type="button" onclick="if(activeJob) kirimWaKodeLacak(activeJob.id)" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow transition active:scale-95" title="Kirim Kode Lacak TRK eksklusif ke Pemberi Tugas">
              <svg class="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.299.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86.174.086.275.072.376-.043.101-.116.433-.506.549-.68.116-.173.231-.145.39-.086s1.011.477 1.184.564.289.13.332.202c.043.073.043.419-.101.824z"/></svg>
              <span>Kirim Kode Lacak ke Pemberi Tugas</span>
            </button>
            <button type="button" id="btn-modal-survey-wa" onclick="if(activeJob) hubungiPendampingSurvei(activeJob.id)" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-300 hover:text-white font-medium text-xs border border-slate-700 transition active:scale-95" title="Koordinasi jadwal survei fisik tanpa kode lacak">
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
              <span>Hubungi Pendamping Survei</span>
            </button>
          </div>`;

if (norm.includes(oldModalOverview)) {
  norm = norm.replace(oldModalOverview, newModalOverview);
  console.log('✓ Modal stepper overview card updated with client/intended user and dual WA buttons');
} else {
  console.log('oldModalOverview not matched');
}

// 2. Update Modal Update Milestone (Add dynamic fields for M-03/M-04 & M-06)
const oldTargetSelect = `<select id="update-target-milestone" required class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400">`;
const newTargetSelect = `<select id="update-target-milestone" onchange="sesuaikanFieldMilestone(this.value)" required class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400">`;

if (norm.includes(oldTargetSelect)) {
  norm = norm.replace(oldTargetSelect, newTargetSelect);
  console.log('✓ update-target-milestone onchange added');
}

const oldNikPinBox = `<!-- NIK & PIN INPUT (OPSI B) -->`;
const newNikPinBox = `<!-- Dynamic Field M-03 & M-04: Tanggal Penilaian & Dokumen Kepemilikan -->
        <div id="container-field-m03-m04" class="hidden p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5 text-xs">
          <div class="flex items-center gap-1.5 text-amber-400 font-bold text-[11px] uppercase tracking-wider">
            <span>Substansi Survei &amp; Kertas Kerja (SPI 103)</span>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-[10.5px] font-semibold text-slate-300 mb-1">Tanggal Penilaian (Cut-Off Valuation Date)</label>
              <input type="date" id="update-tanggal-penilaian" class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400">
            </div>
            <div>
              <label class="block text-[10.5px] font-semibold text-slate-300 mb-1">Dokumen Kepemilikan Terverifikasi</label>
              <input type="text" id="update-dokumen-kepemilikan" placeholder="Cth: SHM No. 402/Kuningan" class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400">
            </div>
          </div>
        </div>

        <!-- Dynamic Field M-06: NoLap & Otorisasi Opini Nilai (Internal Eksklusif) -->
        <div id="container-field-m06" class="hidden p-3.5 rounded-xl bg-slate-950 border border-amber-500/40 space-y-2.5 text-xs">
          <div class="flex items-center justify-between">
            <span class="text-[11px] font-bold text-amber-400 uppercase tracking-wider">Substansi NoLap &amp; Opini Nilai (SPI 105)</span>
            <span class="px-1.5 py-0.5 rounded text-[9px] font-black bg-rose-500/20 text-rose-300 border border-rose-500/30">INTERNAL STAF SAJA</span>
          </div>
          <div>
            <label class="block text-[10.5px] font-semibold text-slate-300 mb-1">Nomor Laporan Resmi (NoLap) <span class="text-rose-400">*</span></label>
            <input type="text" id="update-nomor-laporan-resmi" placeholder="Contoh: 0042/2.0160-01/PI/X/2026" class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-amber-400">
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-[10.5px] font-semibold text-slate-300 mb-1">Kesimpulan Nilai Pasar / NPW (Rp) <span class="text-rose-400">*</span></label>
              <input type="text" id="update-opini-nilai-pasar" placeholder="Contoh: 2.850.000.000" class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono text-amber-300 focus:outline-none focus:border-amber-400">
            </div>
            <div>
              <label class="block text-[10.5px] font-semibold text-slate-300 mb-1">Indikasi Nilai Likuidasi (Rp)</label>
              <input type="text" id="update-opini-nilai-likuidasi" placeholder="Contoh: 2.280.000.000" class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono text-sky-300 focus:outline-none focus:border-amber-400">
            </div>
          </div>
          <p class="text-[10px] text-slate-400 leading-tight">Sesuai KEPI &amp; SPI 105, nilai pasar &amp; likuidasi ini otomatis diseka (di-strip) dari endpoint publik.</p>
        </div>

        <!-- NIK & PIN INPUT (OPSI B) -->`;

if (norm.includes(oldNikPinBox)) {
  norm = norm.replace(oldNikPinBox, newNikPinBox);
  console.log('✓ Dynamic fields M-03/M-04 & M-06 added to update modal');
} else {
  console.log('oldNikPinBox not matched');
}

// 3. Update Modal Konfirmasi Registrasi HTML (Detailed client vs intended user info)
const oldModalConfirmBox = `        <div class="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
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
          </button>`;

const newModalConfirmBox = `        <div class="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
          <div class="flex justify-between items-center">
            <span class="text-slate-400">Nomor JO:</span>
            <strong id="confirm-jo-number" class="font-mono text-white text-xs">-</strong>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-slate-400">Kode Lacak Unik:</span>
            <span id="confirm-kode-lacak" class="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-amber-400/20 text-amber-300 border border-amber-400/40">-</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-slate-400">Pemberi Tugas:</span>
            <span id="confirm-pemberi-tugas" class="text-slate-200 font-medium text-right text-[11px]">-</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-slate-400">Debitur / Entitas:</span>
            <span id="confirm-debitur" class="text-amber-300 font-medium text-right text-[11px]">-</span>
          </div>
          <div class="flex justify-between items-center border-t border-slate-800/80 pt-1.5">
            <span class="text-slate-400">Penerima Resmi WA:</span>
            <span id="confirm-pic" class="text-emerald-400 font-mono text-[11px]">-</span>
          </div>
        </div>
        <div class="p-2.5 rounded-lg bg-amber-400/10 border border-amber-400/20 text-[10.5px] text-amber-300 leading-snug flex items-start gap-2">
          <svg class="w-4 h-4 text-amber-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
          <span>Sesuai standar etika KEPI dan SPI 103, Kode Unik Pelacakan <strong>HANYA diberikan kepada Pemberi Tugas</strong>. Pendamping lapangan dan debitur tidak diberikan kode lacak.</span>
        </div>
        <div class="space-y-2 pt-1">
          <button type="button" id="btn-dispatch-wa-modal" onclick="eksekusiDispatchWaBaru()" class="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition active:scale-[0.99] cursor-pointer">
            <svg class="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.299.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86.174.086.275.072.376-.043.101-.116.433-.506.549-.68.116-.173.231-.145.39-.086s1.011.477 1.184.564.289.13.332.202c.043.073.043.419-.101.824z"/></svg>
            <span>Kirim Kode Lacak ke Pemberi Tugas</span>
          </button>`;

if (norm.includes(oldModalConfirmBox)) {
  norm = norm.replace(oldModalConfirmBox, newModalConfirmBox);
  console.log('✓ Modal konfirmasi registrasi updated');
} else {
  console.log('oldModalConfirmBox not matched');
}

const finalContent = isCRLF ? norm.replace(/\n/g, '\r\n') : norm;
fs.writeFileSync('portal-tracking.html', finalContent, 'utf8');
console.log('✓ portal-tracking.html HTML components saved');
