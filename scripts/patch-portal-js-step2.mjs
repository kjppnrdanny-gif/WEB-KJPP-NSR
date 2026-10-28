import fs from 'fs';

const filePath = 'portal-penugasan-jo.html';
let content = fs.readFileSync(filePath, 'utf8');

function safeReplace(str, search, replacement) {
  const normStr = str.replace(/\r\n/g, '\n');
  const normSearch = search.replace(/\r\n/g, '\n');
  const normRepl = replacement.replace(/\r\n/g, '\n');
  if (!normStr.includes(normSearch)) {
    throw new Error('Search target not found in file: ' + normSearch.substring(0, 80));
  }
  const result = normStr.replace(normSearch, normRepl);
  return result.replace(/\n/g, '\r\n');
}

// 1. ADD MODAL RIWAYAT REGISTER SPK/JO
const targetBeforeModalEnd = `          <div class="pt-2 flex items-center justify-end gap-3">
            <button type="button" onclick="tutupModalApproval()" class="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition">
              Batal
            </button>
            <button type="submit" id="btn-konfirmasi-approval" class="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition shadow-lg flex items-center gap-2">
              <span>Setujui &amp; Terbitkan Dokumen Resmi</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>`;

const modalRiwayatHtml = `          <div class="pt-2 flex items-center justify-end gap-3">
            <button type="button" onclick="tutupModalApproval()" class="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition">
              Batal
            </button>
            <button type="submit" id="btn-konfirmasi-approval" class="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition shadow-lg flex items-center gap-2">
              <span>Setujui &amp; Terbitkan Dokumen Resmi</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>

  <!-- ========================================================
       MODAL RIWAYAT SMART REGISTER SPK & JO RESMI (OPINI NSR)
       ======================================================== -->
  <div id="modal-riwayat-register-spk-jo" class="fixed inset-0 z-50 bg-slate-950/85 flex items-center justify-center p-4 backdrop-blur-sm hidden" role="dialog" aria-modal="true">
    <div class="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full shadow-2xl text-xs flex flex-col max-h-[85vh] overflow-hidden">
      <div class="flex items-center justify-between px-5 py-4 border-b border-slate-800 shrink-0 bg-slate-950/40">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30 font-bold">
            📜
          </div>
          <div>
            <h3 class="text-sm font-black text-white">Buku Riwayat Smart Register SPK &amp; JO</h3>
            <p class="text-[11px] text-slate-400">Sinkronisasi resmi baseline DB_PENUGASAN_JO_NSR 2026</p>
          </div>
        </div>
        <button type="button" onclick="tutupModalRiwayatRegisterSpkJo()" class="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>
      <div class="p-5 overflow-y-auto space-y-4">
        <!-- Rekap SPK -->
        <div class="p-3.5 rounded-xl bg-slate-950 border border-amber-500/30 space-y-2">
          <div class="flex items-center justify-between border-b border-slate-800 pb-2">
            <span class="font-bold text-amber-400 flex items-center gap-1.5">📘 Register Lingkup Penugasan (SPK)</span>
            <span class="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 font-mono font-bold">STATUS: AKTIF</span>
          </div>
          <div class="grid grid-cols-2 gap-2 text-[11px]">
            <div><span class="text-slate-400">Kantor:</span> <strong class="text-white">Pusat (2.0160-00)</strong></div>
            <div><span class="text-slate-400">Periode:</span> <strong class="text-white">2026</strong></div>
            <div><span class="text-slate-400">Baseline Rekap:</span> <strong id="hist-spk-last" class="font-mono text-amber-300">0415</strong></div>
            <div><span class="text-slate-400">Kandidat Berikutnya:</span> <strong id="hist-spk-next" class="font-mono text-emerald-300">0416</strong></div>
          </div>
          <p class="text-[10.5px] text-slate-400 leading-relaxed pt-1 border-t border-slate-900">
            Sumber Bukti: <em class="text-slate-300">Rekap Resmi DB_PENUGASAN_JO_NSR (Baseline 415)</em>. Format: <code class="text-amber-300">[Seq]/NSR/[PN-APP|PN-RTL]/[Bulan]/[Tahun]</code>.
          </p>
        </div>

        <!-- Rekap JO -->
        <div class="p-3.5 rounded-xl bg-slate-950 border border-sky-500/30 space-y-2">
          <div class="flex items-center justify-between border-b border-slate-800 pb-2">
            <span class="font-bold text-sky-400 flex items-center gap-1.5">📁 Register Job Order (JO)</span>
            <span class="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 font-mono font-bold">STATUS: AKTIF</span>
          </div>
          <div class="grid grid-cols-2 gap-2 text-[11px]">
            <div><span class="text-slate-400">Kantor:</span> <strong class="text-white">Pusat (2.0160-00)</strong></div>
            <div><span class="text-slate-400">Periode:</span> <strong class="text-white">2026</strong></div>
            <div><span class="text-slate-400">Baseline Rekap:</span> <strong id="hist-jo-last" class="font-mono text-sky-300">0415</strong></div>
            <div><span class="text-slate-400">Kandidat Berikutnya:</span> <strong id="hist-jo-next" class="font-mono text-emerald-300">0416</strong></div>
          </div>
          <p class="text-[10.5px] text-slate-400 leading-relaxed pt-1 border-t border-slate-900">
            Sumber Bukti: <em class="text-slate-300">Rekap Resmi DB_PENUGASAN_JO_NSR (Baseline 415)</em>. Format: <code class="text-sky-300">[Seq]/JO/NSR/[Bulan]/[Tahun]</code>.
          </p>
        </div>

        <!-- Nomor Terpakai Terakhir -->
        <div class="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2 text-[11px]">
          <h5 class="font-bold text-slate-300">Nomor Terpakai / Terbit Terakhir di Sesi Ini:</h5>
          <div id="hist-daftar-terpakai" class="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
            <span class="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">0415 (Baseline DB_PENUGASAN_JO_NSR)</span>
          </div>
        </div>
      </div>
      <div class="px-5 py-3 border-t border-slate-800 flex justify-end bg-slate-950/40">
        <button type="button" onclick="tutupModalRiwayatRegisterSpkJo()" class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition">
          Tutup
        </button>
      </div>
    </div>
  </div>`;

content = safeReplace(content, targetBeforeModalEnd, modalRiwayatHtml);
console.log('Step 1: Modal Riwayat Register added.');

// 2. UPDATE APPROVAL JS FUNCTIONS (LINES 2483-2591)
const oldApprFunctions = `    function handleApprovalJenisLaporanChange() {
      const jenis = document.getElementById('appr-jenis-laporan').value;
      const targetCode = (jenis === 'RTL') ? 'PN-RTL' : 'PN-APP';
      const elLp = document.getElementById('appr-nomor-lp');
      if (elLp && elLp.value) {
        if (elLp.value.includes('PN-APP') || elLp.value.includes('PN-RTL')) {
          elLp.value = elLp.value.replace(/PN-(APP|RTL)/, targetCode);
        }
      }
      validasiApprovalDuplikatLive();
    }

    function formatApprovalNomorInputOtomatis() {
      const elLp = document.getElementById('appr-nomor-lp');
      const elAdm = document.getElementById('appr-nomor-adm');
      if (!elLp) return;
      const rawVal = elLp.value.trim();
      const match = rawVal.match(/^(\\d{1,5})$/);
      if (match) {
        const seq = parseInt(match[1], 10);
        const pad = String(seq).padStart(4, '0');
        const pId = document.getElementById('appr-target-project-id').value;
        const p = projectDatabase.find(item => item.id === pId);
        const d = new Date((p && (p.tanggal_surat || p.tgl_dibuat)) || new Date());
        const romawi = getBulanRomawi(d);
        const thn = d.getFullYear() || 2026;
        const jenis = document.getElementById('appr-jenis-laporan').value;
        const kodeLap = (jenis === 'RTL') ? 'PN-RTL' : 'PN-APP';
        elLp.value = \`\${pad}/NSR/\${kodeLap}/\${romawi}/\${thn}\`;
        if (elAdm) {
          elAdm.value = \`\${pad}/JO/NSR/\${romawi}/\${thn}\`;
        }
      }
      validasiApprovalDuplikatLive();
    }

    function validasiApprovalDuplikatLive() {
      const elLp = document.getElementById('appr-nomor-lp');
      const elAdm = document.getElementById('appr-nomor-adm');
      const warnDiv = document.getElementById('appr-warning-duplikat');
      const btnSubmit = document.getElementById('btn-konfirmasi-approval');
      const pId = document.getElementById('appr-target-project-id').value;

      if (!elLp) return true;

      const lpVal = elLp.value.trim();
      const admVal = elAdm ? elAdm.value.trim() : '';

      const check = cekDuplikasiNomor(lpVal, admVal, pId);
      if (check.isDuplicate) {
        elLp.classList.add('border-rose-500', 'bg-rose-950/40', 'text-rose-200');
        if (warnDiv) {
          const p = check.duplicateItem || {};
          const deb = p.debitur_nama || p.Nama_Debitur_Utama || 'Debitur';
          warnDiv.innerHTML = \`⚠️ <strong>Nomor sudah terpakai (Double)!</strong> Tidak dapat melakukan Approval dengan nomor ini (Terpakai di Debitur: <strong>\${deb}</strong>). Silakan ganti ke nomor yang unik.\`;
          warnDiv.classList.remove('hidden');
        }
        if (btnSubmit) {
          btnSubmit.disabled = true;
          btnSubmit.classList.add('opacity-50', 'cursor-not-allowed');
        }
        return false;
      } else {
        elLp.classList.remove('border-rose-500', 'bg-rose-950/40', 'text-rose-200');
        if (warnDiv) warnDiv.classList.add('hidden');
        if (btnSubmit) {
          btnSubmit.disabled = false;
          btnSubmit.classList.remove('opacity-50', 'cursor-not-allowed');
        }
        return true;
      }
    }

    function tutupModalApproval() {
      const modal = document.getElementById('modal-approval-pusat');
      if (modal) modal.classList.add('hidden');
      resetApprovalDualMethodState();
    }

    function gunakanSaranApprovalNomor() {
      const pId = document.getElementById('appr-target-project-id').value;
      const p = projectDatabase.find(item => item.id === pId);
      const d = new Date((p && (p.tanggal_surat || p.tgl_dibuat)) || new Date());
      const romawi = getBulanRomawi(d);
      const thn = d.getFullYear() || 2026;
      const jenis = document.getElementById('appr-jenis-laporan').value;
      const kodeLap = (jenis === 'RTL') ? 'PN-RTL' : 'PN-APP';

      const cLp = parseInt(String(serverCounter.LAST_NO_LP_SPK || 415).trim(), 10);
      const cAdm = parseInt(String(serverCounter.LAST_NO_ADM_JO || 415).trim(), 10);
      let maxCounter = Math.max(isNaN(cLp) ? 415 : cLp, isNaN(cAdm) ? 415 : cAdm);
      if (maxCounter >= 100000) maxCounter = 415;

      projectDatabase.forEach(item => {
        if (item.status === "APPROVED") {
          const numAdm = extractSeqNumber(item.nomor_adm);
          if (numAdm > maxCounter) maxCounter = numAdm;
          const numLp = extractSeqNumber(item.nomor_lp);
          if (numLp > maxCounter) maxCounter = numLp;
        }
      });
      const nextVal = maxCounter + 1;
      const nextNum = nextVal.toString().padStart(4, '0');

      document.getElementById('appr-nomor-lp').value = \`\${nextNum}/NSR/\${kodeLap}/\${romawi}/\${thn}\`;
      document.getElementById('appr-nomor-adm').value = \`\${nextNum}/JO/NSR/\${romawi}/\${thn}\`;
      validasiApprovalDuplikatLive();
    }`;

const newApprFunctions = `    function handleApprovalJenisLaporanChange() {
      const jenis = document.getElementById('appr-jenis-laporan').value;
      const targetCode = (jenis === 'RTL') ? 'PN-RTL' : 'PN-APP';
      const elLp = document.getElementById('appr-nomor-lp');
      if (elLp && elLp.value) {
        if (elLp.value.includes('PN-APP') || elLp.value.includes('PN-RTL')) {
          elLp.value = elLp.value.replace(/PN-(APP|RTL)/, targetCode);
        } else {
          sinkronkanSeqKeNomorLp();
        }
      }
      validasiApprovalDuplikatLive();
    }

    function handleApprovalWilayahChange() {
      validasiApprovalDuplikatLive();
    }

    function handleApprovalTanggalChange() {
      const tglStr = document.getElementById('appr-tanggal-surat')?.value;
      if (!tglStr) return;
      const d = new Date(tglStr);
      const romawi = getBulanRomawi(d);
      const thn = d.getFullYear() || 2026;
      const jenis = document.getElementById('appr-jenis-laporan')?.value || 'APP';
      const kodeLap = (jenis === 'RTL') ? 'PN-RTL' : 'PN-APP';

      const elLp = document.getElementById('appr-nomor-lp');
      const elAdm = document.getElementById('appr-nomor-adm');
      if (elLp && elLp.value) {
        const seq = extractSeqNumber(elLp.value);
        if (seq > 0) {
          elLp.value = \`\${String(seq).padStart(4, '0')}/NSR/\${kodeLap}/\${romawi}/\${thn}\`;
        }
      }
      if (elAdm && elAdm.value) {
        const seq = extractSeqNumber(elAdm.value);
        if (seq > 0) {
          elAdm.value = \`\${String(seq).padStart(4, '0')}/JO/NSR/\${romawi}/\${thn}\`;
        }
      }
      validasiApprovalDuplikatLive();
    }

    function sinkronkanSeqKeNomorLp() {
      const elSeq = document.getElementById('appr-spk-seq');
      const elLp = document.getElementById('appr-nomor-lp');
      if (!elSeq || !elLp) return;
      const seqVal = parseInt(elSeq.value, 10);
      if (isNaN(seqVal) || seqVal < 1) return;

      const pad = String(seqVal).padStart(4, '0');
      const tglStr = document.getElementById('appr-tanggal-surat')?.value || new Date().toISOString().split('T')[0];
      const d = new Date(tglStr);
      const romawi = getBulanRomawi(d);
      const thn = d.getFullYear() || 2026;
      const jenis = document.getElementById('appr-jenis-laporan')?.value || 'APP';
      const kodeLap = (jenis === 'RTL') ? 'PN-RTL' : 'PN-APP';

      elLp.value = \`\${pad}/NSR/\${kodeLap}/\${romawi}/\${thn}\`;

      // Cek peringatan loncatan (>20 angka)
      const lastSpk = parseInt(document.getElementById('appr-spk-last')?.textContent || '415', 10);
      const warnJump = document.getElementById('appr-warning-loncatan');
      if (warnJump) {
        if (seqVal > lastSpk + 20) {
          warnJump.classList.remove('hidden');
        } else {
          warnJump.classList.add('hidden');
        }
      }

      validasiApprovalDuplikatLive();
    }

    function sinkronkanSeqKeNomorAdm() {
      const elSeq = document.getElementById('appr-jo-seq');
      const elAdm = document.getElementById('appr-nomor-adm');
      if (!elSeq || !elAdm) return;
      const seqVal = parseInt(elSeq.value, 10);
      if (isNaN(seqVal) || seqVal < 1) return;

      const pad = String(seqVal).padStart(4, '0');
      const tglStr = document.getElementById('appr-tanggal-surat')?.value || new Date().toISOString().split('T')[0];
      const d = new Date(tglStr);
      const romawi = getBulanRomawi(d);
      const thn = d.getFullYear() || 2026;

      elAdm.value = \`\${pad}/JO/NSR/\${romawi}/\${thn}\`;

      // Cek peringatan loncatan (>20 angka)
      const lastJo = parseInt(document.getElementById('appr-jo-last')?.textContent || '415', 10);
      const warnJump = document.getElementById('appr-warning-loncatan');
      if (warnJump) {
        if (seqVal > lastJo + 20) {
          warnJump.classList.remove('hidden');
        } else {
          warnJump.classList.add('hidden');
        }
      }

      validasiApprovalDuplikatLive();
    }

    function formatApprovalNomorInputOtomatis() {
      const elLp = document.getElementById('appr-nomor-lp');
      if (!elLp) return;
      const rawVal = elLp.value.trim();
      const match = rawVal.match(/^(\\d{1,5})$/);
      if (match) {
        const seq = parseInt(match[1], 10);
        const elSeq = document.getElementById('appr-spk-seq');
        if (elSeq) elSeq.value = seq;
        sinkronkanSeqKeNomorLp();
      } else {
        const seq = extractSeqNumber(rawVal);
        if (seq > 0) {
          const elSeq = document.getElementById('appr-spk-seq');
          if (elSeq) elSeq.value = seq;
        }
      }
      validasiApprovalDuplikatLive();
    }

    function gunakanSaranSpk() {
      const saranSeq = parseInt(document.getElementById('appr-spk-saran')?.textContent || '416', 10);
      const elSeq = document.getElementById('appr-spk-seq');
      if (elSeq) elSeq.value = saranSeq;
      sinkronkanSeqKeNomorLp();
    }

    function gunakanSaranJo() {
      const saranSeq = parseInt(document.getElementById('appr-jo-saran')?.textContent || '416', 10);
      const elSeq = document.getElementById('appr-jo-seq');
      if (elSeq) elSeq.value = saranSeq;
      sinkronkanSeqKeNomorAdm();
    }

    function validasiApprovalDuplikatLive() {
      const elLp = document.getElementById('appr-nomor-lp');
      const elAdm = document.getElementById('appr-nomor-adm');
      const warnDiv = document.getElementById('appr-warning-duplikat');
      const btnSubmit = document.getElementById('btn-konfirmasi-approval');
      const pId = document.getElementById('appr-target-project-id')?.value;

      if (!elLp || !elAdm) return true;

      const lpVal = elLp.value.trim();
      const admVal = elAdm.value.trim();

      let isDuplicate = false;
      let dupMessage = "";

      // 1. Cek duplikasi nomor SPK
      if (lpVal && !lpVal.includes('MENUNGGU') && !lpVal.includes('Menunggu')) {
        const matchLp = projectDatabase.find(item => item.id !== pId && item.nomor_lp && item.nomor_lp.trim().toUpperCase() === lpVal.toUpperCase() && item.status !== 'VOID' && item.status !== 'DIBATALKAN');
        if (matchLp) {
          isDuplicate = true;
          dupMessage = \`Nomor SPK '\${lpVal}' sudah terdaftar pada penugasan \${matchLp.id} (\${matchLp.debitur_nama || matchLp.Nama_Debitur_Utama || 'Debitur'}).\`;
        }
      }

      // 2. Cek duplikasi nomor JO
      if (!isDuplicate && admVal && !admVal.includes('MENUNGGU') && !admVal.includes('Menunggu')) {
        const matchAdm = projectDatabase.find(item => item.id !== pId && item.nomor_adm && item.nomor_adm.trim().toUpperCase() === admVal.toUpperCase() && item.status !== 'VOID' && item.status !== 'DIBATALKAN');
        if (matchAdm) {
          isDuplicate = true;
          dupMessage = \`Nomor JO '\${admVal}' sudah terdaftar pada penugasan \${matchAdm.id} (\${matchAdm.debitur_nama || matchAdm.Nama_Debitur_Utama || 'Debitur'}).\`;
        }
      }

      if (isDuplicate) {
        elLp.classList.add('border-rose-500', 'bg-rose-950/40', 'text-rose-200');
        elAdm.classList.add('border-rose-500', 'bg-rose-950/40', 'text-rose-200');
        if (warnDiv) {
          warnDiv.innerHTML = \`⚠️ <strong>PENERBITAN DITOLAK (NOMOR DUPLIKAT):</strong> \${dupMessage} Mohon ganti nomor urut agar unik.\`;
          warnDiv.classList.remove('hidden');
        }
        if (btnSubmit) {
          btnSubmit.disabled = true;
          btnSubmit.classList.add('opacity-50', 'cursor-not-allowed');
        }
        return false;
      } else {
        elLp.classList.remove('border-rose-500', 'bg-rose-950/40', 'text-rose-200');
        elAdm.classList.remove('border-rose-500', 'bg-rose-950/40', 'text-rose-200');
        if (warnDiv) warnDiv.classList.add('hidden');
        if (btnSubmit) {
          btnSubmit.disabled = false;
          btnSubmit.classList.remove('opacity-50', 'cursor-not-allowed');
        }
        return true;
      }
    }

    function tutupModalApproval() {
      const modal = document.getElementById('modal-approval-pusat');
      if (modal) modal.classList.add('hidden');
      resetApprovalDualMethodState();
    }

    function bukaModalRiwayatRegisterSpkJo() {
      const modal = document.getElementById('modal-riwayat-register-spk-jo');
      if (!modal) return;
      const spkLast = document.getElementById('appr-spk-last')?.textContent || '0415';
      const spkNext = document.getElementById('appr-spk-saran')?.textContent || '0416';
      const joLast = document.getElementById('appr-jo-last')?.textContent || '0415';
      const joNext = document.getElementById('appr-jo-saran')?.textContent || '0416';

      const elHistSpkLast = document.getElementById('hist-spk-last');
      const elHistSpkNext = document.getElementById('hist-spk-next');
      const elHistJoLast = document.getElementById('hist-jo-last');
      const elHistJoNext = document.getElementById('hist-jo-next');
      if (elHistSpkLast) elHistSpkLast.textContent = spkLast;
      if (elHistSpkNext) elHistSpkNext.textContent = spkNext;
      if (elHistJoLast) elHistJoLast.textContent = joLast;
      if (elHistJoNext) elHistJoNext.textContent = joNext;

      const container = document.getElementById('hist-daftar-terpakai');
      if (container) {
        const approvedItems = projectDatabase.filter(p => p.status === 'APPROVED');
        if (approvedItems.length === 0) {
          container.innerHTML = '<span class="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">0415 (Baseline Resmi DB_PENUGASAN_JO_NSR)</span>';
        } else {
          container.innerHTML = '<span class="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">0415 (Baseline)</span>' +
            approvedItems.map(p => \`<span class="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono text-[10px]">\${escapeHtml(p.nomor_lp || p.id)} | \${escapeHtml(p.nomor_adm || '-')}</span>\`).join('');
        }
      }
      modal.classList.remove('hidden');
    }

    function tutupModalRiwayatRegisterSpkJo() {
      const modal = document.getElementById('modal-riwayat-register-spk-jo');
      if (modal) modal.classList.add('hidden');
    }`;

content = safeReplace(content, oldApprFunctions, newApprFunctions);
console.log('Step 2: Approval JS Functions updated.');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Saved changes after Step 2.');
