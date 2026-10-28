import fs from 'fs';

let content = fs.readFileSync('portal-nolap.html', 'utf8');

function toCrlf(str) {
  return str.replace(/\r?\n/g, '\r\n');
}

function safeReplace(str, target, replacement) {
  const normTarget = toCrlf(target);
  const normReplacement = toCrlf(replacement);
  if (!str.includes(normTarget)) {
    console.error('Target not found:', target.slice(0, 60));
    return str;
  }
  console.log('✔ Match found and replaced for:', target.slice(0, 60));
  return str.replace(normTarget, normReplacement);
}

// 1. UPDATE applyRBAC to isolate SPM audit panels
const rbacTarget = `        if (isHiddenPanelActive) {
          gantiTabModul('pengajuan');
        }
      }
    }
    if (typeof validasiFormDanMitigasiLive === 'function') validasiFormDanMitigasiLive();
    window.applyRBAC = applyRBAC;`;

const rbacReplacement = `        if (isHiddenPanelActive) {
          gantiTabModul('pengajuan');
        }
      }

      // PEMISAHAN MUTLAK UI: Panel Audit SPM (F01-F07 & Tombol Persetujuan Resmi)
      // HANYA Kepala SPM Danny Taufik Hidayat, S.H. (KEPALA_SPM / danny_spm) atau SUPER_ADMIN yang berhak melihat & mengeksekusi
      const rawUserRole = String(activeUser?.role || '').toUpperCase().trim();
      const rawUserSub = String(activeUser?.sub || '').toLowerCase().trim();
      const isKepalaSpmOrKing = (rawUserRole === 'KEPALA_SPM' || rawUserRole === 'SPM' || rawUserSub === 'danny_spm' || isSuperOrAdmin);

      if (isKepalaSpmOrKing) {
        document.body.classList.add('is-spm-auditor');
        document.querySelectorAll('.spm-audit-only-panel').forEach(p => {
          p.classList.remove('hidden');
          p.style.display = 'block';
        });
      } else {
        document.body.classList.remove('is-spm-auditor');
        document.querySelectorAll('.spm-audit-only-panel').forEach(p => {
          p.classList.add('hidden');
          p.style.display = 'none';
        });
      }
    }
    if (typeof validasiFormDanMitigasiLive === 'function') validasiFormDanMitigasiLive();
    window.applyRBAC = applyRBAC;

    // FUNGSI NAVIGASI WIZARD FORM 2-TAHAP
    function navigasiKeStepWizard(step) {
      const step1 = document.getElementById('wizard-step-1');
      const step2 = document.getElementById('wizard-step-2');
      const circle1 = document.getElementById('step-circle-1');
      const circle2 = document.getElementById('step-circle-2');
      const label1 = document.getElementById('step-label-1');
      const label2 = document.getElementById('step-label-2');
      const nav2 = document.getElementById('step-nav-2');
      const line = document.getElementById('step-progress-line');

      if (step === 2) {
        const klien = (document.getElementById('f-klien')?.value || '').trim();
        const pemohon = (document.getElementById('f-pemohon')?.value || '').trim();
        if (!klien || !pemohon) {
          if (!confirm('⚠️ Nama Klien atau Nama Pemohon belum terisi lengkap. Tetap lanjut ke Kertas Kerja Mitigasi?')) {
            if (!pemohon) document.getElementById('f-pemohon')?.focus();
            else document.getElementById('f-klien')?.focus();
            return;
          }
        }
        if (step1) step1.classList.add('hidden');
        if (step2) step2.classList.remove('hidden');

        if (circle1) {
          circle1.className = 'w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center font-black text-xs sm:text-sm bg-teal-500 text-slate-950 shadow-lg shadow-teal-500/20 transition-all';
          circle1.innerHTML = '✔';
        }
        if (label1) label1.className = 'text-xs font-bold text-teal-300 tracking-wide uppercase';

        if (circle2) {
          circle2.className = 'w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center font-black text-xs sm:text-sm bg-amber-400 text-slate-950 shadow-lg shadow-amber-400/20 transition-all';
          circle2.innerHTML = '2';
        }
        if (label2) label2.className = 'text-xs font-extrabold text-amber-300 tracking-wide uppercase';
        if (nav2) nav2.classList.remove('opacity-60');

        if (line) line.style.width = '100%';
        step2?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        if (step2) step2.classList.add('hidden');
        if (step1) step1.classList.remove('hidden');

        if (circle1) {
          circle1.className = 'w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center font-black text-xs sm:text-sm bg-amber-400 text-slate-950 shadow-lg shadow-amber-400/20 transition-all';
          circle1.innerHTML = '1';
        }
        if (label1) label1.className = 'text-xs font-black text-amber-300 tracking-wide uppercase';

        if (circle2) {
          circle2.className = 'w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center font-bold text-xs sm:text-sm bg-slate-800 text-slate-400 border border-slate-700 transition-all';
          circle2.innerHTML = '2';
        }
        if (label2) label2.className = 'text-xs font-bold text-slate-400 tracking-wide uppercase';
        if (nav2) nav2.classList.add('opacity-60');

        if (line) line.style.width = '0%';
        step1?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      if (typeof validasiFormDanMitigasiLive === 'function') validasiFormDanMitigasiLive();
    }
    window.navigasiKeStepWizard = navigasiKeStepWizard;`;

content = safeReplace(content, rbacTarget, rbacReplacement);

// 2. UPDATE ajukanPermohonanNoLap
const ajukanTarget = `    async function ajukanPermohonanNoLap(e) {
      if (e && e.preventDefault) e.preventDefault();

      const btn = document.getElementById('btn-submit-pengajuan');
      const textOriginal = btn ? btn.innerHTML : 'Kirim Permohonan NoLap';

      // P0 HOTFIX: Validasi Mandatory Kontak Pemohon Manual (Anti-Autofill)
      const pemohon = (document.getElementById('f-pemohon')?.value || '').trim();
      const nikPemohon = (document.getElementById('f-nik-pemohon')?.value || '').trim();
      const jabatan = (document.getElementById('f-jabatan')?.value || '').trim();
      const emailPemohon = (document.getElementById('f-email-pemohon')?.value || '').trim();
      const waPemohon = (document.getElementById('f-wa-pemohon')?.value || '').trim();

      if (!pemohon) {
        alert('⚠️ INPUT MANDATORY: Nama Pemohon (Penilai/Staf) wajib diisi secara manual.');
        document.getElementById('f-pemohon')?.focus();
        return;
      }
      if (!nikPemohon) {
        alert('⚠️ INPUT MANDATORY: NIK / ID Personel Pemohon wajib diisi secara manual.');
        document.getElementById('f-nik-pemohon')?.focus();
        return;
      }
      if (!jabatan) {
        alert('⚠️ INPUT MANDATORY: Jabatan Pemohon wajib diisi secara manual.');
        document.getElementById('f-jabatan')?.focus();
        return;
      }
      if (!emailPemohon || !emailPemohon.includes('@') || !emailPemohon.includes('.')) {
        alert('⚠️ INPUT MANDATORY: Email Pemohon wajib diisi dengan format email yang valid.');
        document.getElementById('f-email-pemohon')?.focus();
        return;
      }
      if (!waPemohon || waPemohon.replace(/\D/g, '').length < 8) {
        alert('⚠️ INPUT MANDATORY: WhatsApp Pemohon wajib diisi dengan nomor yang valid (minimal 8 digit).');
        document.getElementById('f-wa-pemohon')?.focus();
        return;
      }

      // Validasi Wajib Sektor Industri Master 01-12 (Anti-Fallback Diam-Diam)
      const rawIndSubmit = (document.getElementById('f-industri')?.value || '').trim();
      const numIndSubmit = parseInt(rawIndSubmit, 10);
      if (!rawIndSubmit || isNaN(numIndSubmit) || numIndSubmit < 1 || numIndSubmit > 12) {
        alert('⚠️ INPUT MANDATORY: Sektor Industri Kemenkeu (01–12) wajib dipilih sesuai master klasifikasi resmi.');
        document.getElementById('f-industri')?.focus();
        return;
      }

      if (btn) {
        btn.disabled = true;
        btn.innerText = 'Memproses Pengajuan...';
      }`;

const ajukanReplacement = `    async function ajukanPermohonanNoLap(e, isDraft = false) {
      if (e && e.preventDefault) e.preventDefault();

      const btn = isDraft ? document.getElementById('btn-simpan-draf') : document.getElementById('btn-submit-pengajuan');
      const textOriginal = btn ? btn.innerHTML : (isDraft ? 'Simpan Draf' : 'Kirim Permohonan NoLap');

      // P0 HOTFIX: Validasi Mandatory Kontak Pemohon Manual (Anti-Autofill)
      const pemohon = (document.getElementById('f-pemohon')?.value || '').trim();
      const nikPemohon = (document.getElementById('f-nik-pemohon')?.value || '').trim();
      const jabatan = (document.getElementById('f-jabatan')?.value || '').trim();
      const emailPemohon = (document.getElementById('f-email-pemohon')?.value || '').trim();
      const waPemohon = (document.getElementById('f-wa-pemohon')?.value || '').trim();

      if (!isDraft) {
        if (!pemohon) {
          alert('⚠️ INPUT MANDATORY: Nama Pemohon (Penilai/Staf) wajib diisi secara manual.');
          navigasiKeStepWizard(1);
          document.getElementById('f-pemohon')?.focus();
          return;
        }
        if (!nikPemohon) {
          alert('⚠️ INPUT MANDATORY: NIK / ID Personel Pemohon wajib diisi secara manual.');
          navigasiKeStepWizard(1);
          document.getElementById('f-nik-pemohon')?.focus();
          return;
        }
        if (!jabatan) {
          alert('⚠️ INPUT MANDATORY: Jabatan Pemohon wajib diisi secara manual.');
          navigasiKeStepWizard(1);
          document.getElementById('f-jabatan')?.focus();
          return;
        }
        if (!emailPemohon || !emailPemohon.includes('@') || !emailPemohon.includes('.')) {
          alert('⚠️ INPUT MANDATORY: Email Pemohon wajib diisi dengan format email yang valid.');
          navigasiKeStepWizard(1);
          document.getElementById('f-email-pemohon')?.focus();
          return;
        }
        if (!waPemohon || waPemohon.replace(/\D/g, '').length < 8) {
          alert('⚠️ INPUT MANDATORY: WhatsApp Pemohon wajib diisi dengan nomor yang valid (minimal 8 digit).');
          navigasiKeStepWizard(1);
          document.getElementById('f-wa-pemohon')?.focus();
          return;
        }

        // Validasi Wajib Sektor Industri Master 01-12 (Anti-Fallback Diam-Diam)
        const rawIndSubmit = (document.getElementById('f-industri')?.value || '').trim();
        const numIndSubmit = parseInt(rawIndSubmit, 10);
        if (!rawIndSubmit || isNaN(numIndSubmit) || numIndSubmit < 1 || numIndSubmit > 12) {
          alert('⚠️ INPUT MANDATORY: Sektor Industri Kemenkeu (01–12) wajib dipilih sesuai master klasifikasi resmi.');
          navigasiKeStepWizard(1);
          document.getElementById('f-industri')?.focus();
          return;
        }
      }

      if (btn) {
        btn.disabled = true;
        btn.innerText = isDraft ? 'Menyimpan Draf Terpadu...' : 'Memproses Pengajuan ke Kepala SPM...';
      }`;

content = safeReplace(content, ajukanTarget, ajukanReplacement);

// 3. UPDATE link validation & mitigasi validation in ajukanPermohonanNoLap
const valLinkTarget = `      // Validasi 3 Tautan Dokumen jika Mode Reguler
      if (!isBookingMode && (!linkLaporan || !linkPembanding || !linkBai)) {
        alert('⚠️ VALIDASI BERKAS GAGAL: Mode Reguler mewajibkan seluruh 3 tautan berkas penilaian (Link File Laporan, Data Pembanding, dan Berita Acara Inspeksi/BAI) diisi lengkap.');
        if (!linkLaporan) document.getElementById('input_link_laporan')?.focus();
        else if (!linkPembanding) document.getElementById('input_link_pembanding')?.focus();
        else document.getElementById('input_link_bai')?.focus();
        if (btn) { btn.disabled = false; btn.innerHTML = textOriginal; }
        return;
      }

      // Kompilasi Checklist & Deklarasi Smart Mitigasi (Gerbang 2 Terpadu)
      const c1Val = document.getElementById('chk_mitigasi_pembanding')?.checked === true;
      const c2Val = document.getElementById('chk_mitigasi_konflik')?.checked === true;
      const c3Val = document.getElementById('chk_mitigasi_legalitas')?.checked === true;
      const c4Val = document.getElementById('chk_mitigasi_deviasi')?.checked === true;

      if (!c1Val || !c2Val || !c3Val || !c4Val) {
        alert('⚠️ SMART MITIGASI GAGAL: Seluruh 4 pernyataan checklist Smart Mitigasi (Gerbang 2) wajib diverifikasi sebelum mengajukan NoLap.');
        if (btn) { btn.disabled = false; btn.innerHTML = textOriginal; }
        return;
      }`;

const valLinkReplacement = `      // Validasi 3 Tautan Dokumen jika Mode Reguler (Draf Dikecualikan)
      if (!isDraft && !isBookingMode && (!linkLaporan || !linkPembanding || !linkBai)) {
        alert('⚠️ VALIDASI BERKAS GAGAL: Mode Reguler mewajibkan seluruh 3 tautan berkas penilaian (Link File Laporan, Data Pembanding, dan Berita Acara Inspeksi/BAI) diisi lengkap.');
        navigasiKeStepWizard(1);
        if (!linkLaporan) document.getElementById('input_link_laporan')?.focus();
        else if (!linkPembanding) document.getElementById('input_link_pembanding')?.focus();
        else document.getElementById('input_link_bai')?.focus();
        if (btn) { btn.disabled = false; btn.innerHTML = textOriginal; }
        return;
      }

      // Kompilasi Checklist & Deklarasi Smart Mitigasi (Gerbang 2 Terpadu)
      const c1Val = document.getElementById('chk_mitigasi_pembanding')?.checked === true;
      const c2Val = document.getElementById('chk_mitigasi_konflik')?.checked === true;
      const c3Val = document.getElementById('chk_mitigasi_legalitas')?.checked === true;
      const c4Val = document.getElementById('chk_mitigasi_deviasi')?.checked === true;

      if (!isDraft && (!c1Val || !c2Val || !c3Val || !c4Val)) {
        alert('⚠️ SMART MITIGASI GAGAL: Seluruh 4 pernyataan checklist Smart Mitigasi (Gerbang 2) wajib diverifikasi sebelum mengajukan NoLap ke Kepala SPM.');
        navigasiKeStepWizard(2);
        if (btn) { btn.disabled = false; btn.innerHTML = textOriginal; }
        return;
      }`;

content = safeReplace(content, valLinkTarget, valLinkReplacement);

// 4. UPDATE payload status in ajukanPermohonanNoLap
const payloadStatusTarget = `        request_status: isBookingMode ? "BOOKING DIAJUKAN" : "DIAJUKAN",
        kewenanganTtd: requestedSigningOffice,
        kodeKantorTtd: signingOfficeCode,
        catatanPemohon: catatanPemohon,
        status: isBookingMode ? "BOOKING DIAJUKAN" : "DIAJUKAN",`;

const payloadStatusReplacement = `        isDraft: isDraft,
        request_status: isDraft ? "DRAFT" : (isBookingMode ? "BOOKING DIAJUKAN" : "MENUNGGU_SPM_AKHIR"),
        kewenanganTtd: requestedSigningOffice,
        kodeKantorTtd: signingOfficeCode,
        catatanPemohon: catatanPemohon,
        status: isDraft ? "DRAFT" : (isBookingMode ? "BOOKING DIAJUKAN" : "MENUNGGU_SPM_AKHIR"),`;

content = safeReplace(content, payloadStatusTarget, payloadStatusReplacement);

// 5. UPDATE Dual Output buttons in bukaModalSuksesPengajuan
const modalActionTarget = `      action.innerHTML = \`
        <a href="\${linkWaAdmin}" target="_blank" rel="noopener noreferrer" class="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow">
          <span>💬 Kirim Notifikasi ke WA Admin Resmi (085110513157)</span>
        </a>
        <button onclick="tutupModalDetail()" class="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs">
          Tutup
        </button>
      \`;`;

const modalActionReplacement = `      action.innerHTML = \`
        <div class="flex flex-wrap items-center gap-2.5">
          <a href="/api/nolap-data-proxy?action=renderDocumentTemplate&templateName=TANDA_TERIMA&noReq=\${encodeURIComponent(data.noPermintaan)}" target="_blank" class="px-4 py-2.5 rounded-xl bg-blue-600/40 hover:bg-blue-600/60 text-sky-200 border border-sky-400/50 font-bold text-xs flex items-center gap-1.5 transition">
            <span>📄 Cetak Tanda Terima NoLap</span>
          </a>
          <a href="/api/nolap-data-proxy?action=renderDocumentTemplate&templateName=QA_CHECKLIST&noReq=\${encodeURIComponent(data.noPermintaan)}" target="_blank" class="px-4 py-2.5 rounded-xl bg-teal-600/40 hover:bg-teal-600/60 text-teal-200 border border-teal-400/50 font-bold text-xs flex items-center gap-1.5 transition">
            <span>🛡️ Cetak Kertas Kerja SPM (A4)</span>
          </a>
          <a href="\${linkWaAdmin}" target="_blank" rel="noopener noreferrer" class="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow">
            <span>💬 Notifikasi WA Admin</span>
          </a>
          <button onclick="tutupModalDetail()" class="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs">
            Tutup
          </button>
        </div>
      \`;`;

content = safeReplace(content, modalActionTarget, modalActionReplacement);

fs.writeFileSync('portal-nolap.html', content, 'utf8');
console.log('✔ Successfully patched JS functions in portal-nolap.html.');
