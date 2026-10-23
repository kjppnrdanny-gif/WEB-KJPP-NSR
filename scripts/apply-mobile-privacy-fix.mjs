import fs from 'node:fs';
import path from 'node:path';

function applyMobilePrivacyFix(relPath) {
  const filePath = path.join(process.cwd(), relPath);
  if (!fs.existsSync(filePath)) {
    console.log(`Skipping: ${relPath}`);
    return;
  }
  let content = fs.readFileSync(filePath, 'utf8');

  // 1. Ganti Markup Modal Kontainer dengan Sticky Footer Khusus Mobile
  const oldModalStart = '<!-- ========================================================\n       MODAL PEMBERITAHUAN PRIVASI KARYAWAN';
  const oldModalStartCRLF = '<!-- ========================================================\r\n       MODAL PEMBERITAHUAN PRIVASI KARYAWAN';
  const oldModalEnd = '<!-- ========================================================\n       FOOTER HUKUM & DISCLAIMER';
  const oldModalEndCRLF = '<!-- ========================================================\r\n       FOOTER HUKUM & DISCLAIMER';

  let sIdx = content.indexOf('MODAL PEMBERITAHUAN PRIVASI KARYAWAN');
  if (sIdx !== -1) {
    sIdx = content.lastIndexOf('<!--', sIdx);
  }
  let eIdx = content.indexOf('FOOTER HUKUM & DISCLAIMER');
  if (eIdx !== -1) {
    eIdx = content.lastIndexOf('<!--', eIdx);
  }

  if (sIdx === -1 || eIdx === -1) {
    console.error(`ERROR: Modal block tidak ditemukan di ${relPath}`);
    return;
  }

  const newModalMarkup = `<!-- ========================================================
       MODAL PEMBERITAHUAN PRIVASI KARYAWAN (UU PDP NO. 27/2022)
       MOBILE RESPONSIVE & STICKY FOOTER
       ======================================================== -->
  <div id="modal-privasi-karyawan" 
       role="dialog"
       aria-modal="true"
       aria-labelledby="modal-privasi-title"
       class="fixed inset-0 z-[99999] hidden flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/85 backdrop-blur-md">
    <div class="w-full sm:max-w-xl max-h-[92dvh] sm:max-h-[85vh] flex flex-col bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
      
      <!-- Header Modal (Tetap di Atas) -->
      <div class="px-5 py-4 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-900/90">
        <div>
          <h3 id="modal-privasi-title" class="text-sm sm:text-base font-black text-white flex items-center gap-2">
            <span>🛡️ Pemberitahuan Privasi Karyawan</span>
          </h3>
          <p class="text-[10px] sm:text-xs text-amber-400 font-semibold mt-0.5">KJPP Nanang Rahayu Sigit Paryanto dan Rekan</p>
        </div>
        <div class="flex items-center gap-2">
          <span id="badge-gate-wajib" class="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-md">
            Wajib
          </span>
          <button type="button"
                  id="btn-tutup-privasi-x"
                  onclick="tutupModalPrivasiKaryawan()"
                  class="hidden p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-400 text-lg leading-none cursor-pointer"
                  aria-label="Tutup dialog privasi">
            &times;
          </button>
        </div>
      </div>

      <!-- Body Teks (Scrollable Area) -->
      <div class="p-5 overflow-y-auto space-y-4 text-xs text-slate-300 leading-relaxed custom-scrollbar overscroll-contain">
        <!-- 5 Poin Privasi Karyawan -->
        <div class="p-3 rounded-xl bg-slate-950/50 border border-slate-800/80">
          <h4 class="font-bold text-amber-400 mb-1">1. Pemrosesan Data Karyawan</h4>
          <p class="text-[11px] text-slate-400">Data pribadi mencakup NIK, nama lengkap, dan penugasan diproses semata-mata untuk pencatatan kehadiran resmi.</p>
        </div>
        <div class="p-3 rounded-xl bg-slate-950/50 border border-slate-800/80">
          <h4 class="font-bold text-amber-400 mb-1">2. Perekaman Geolocation (GPS) Sesaat</h4>
          <p class="text-[11px] text-slate-400">Koordinat satelit GPS diambil sesaat (point-in-time) saat tombol presensi ditekan. Sistem tidak melakukan pelacakan terus-menerus.</p>
        </div>
        <div class="p-3 rounded-xl bg-slate-950/50 border border-slate-800/80">
          <h4 class="font-bold text-amber-400 mb-1">3. Keamanan Kode OTP Gmail Pribadi</h4>
          <p class="text-[11px] text-slate-400">Autentikasi dua langkah (2FA) menggunakan kode OTP 6-digit ke email Gmail terdaftar masing-masing karyawan.</p>
        </div>
        <div class="p-3 rounded-xl bg-slate-950/50 border border-slate-800/80">
          <h4 class="font-bold text-amber-400 mb-1">4. Penyimpanan &amp; Integritas Data</h4>
          <p class="text-[11px] text-slate-400">Seluruh transaksi presensi disimpan terenkripsi pada backend resmi Google Apps Script dan Google Spreadsheet KJPP NSR.</p>
        </div>
        <div class="p-3 rounded-xl bg-slate-950/50 border border-slate-800/80">
          <h4 class="font-bold text-amber-400 mb-1">5. Hak Subjek Data Pribadi</h4>
          <p class="text-[11px] text-slate-400">Sesuai UU No. 27 Tahun 2022, karyawan berhak atas transparansi data presensi pribadi.</p>
        </div>
      </div>

      <!-- Footer Modal (STICKY DI BAWAH, TIDAK AKAN HILANG DI HP) -->
      <div class="p-4 border-t border-slate-800 bg-slate-950/95 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
        <span class="text-[10px] text-slate-400 text-center sm:text-left">
          Persetujuan ini mengikat sesuai UU PDP No. 27/2022
        </span>
        <button type="button" 
                id="btn-setuju-privasi-presensi" 
                onclick="konfirmasiSetujuPrivasi(event)" 
                ontouchend="konfirmasiSetujuPrivasi(event)"
                class="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3.5 min-h-[44px] rounded-xl font-black text-xs sm:text-sm bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 shadow-lg shadow-amber-500/20 active:scale-95 transition cursor-pointer select-none touch-manipulation">
          Saya Menyetujui & Lanjutkan
        </button>
      </div>

    </div>
  </div>

  `;

  content = content.slice(0, sIdx) + newModalMarkup + content.slice(eIdx);

  // 2. Ganti Logika JavaScript konfirmasiSetujuPrivasi & Modal Functions
  const jsStart = 'function tampilkanModalPrivasiGate() {';
  const jsEnd = '// Inisialisasi awal saat dokumen siap';

  const jsSIdx = content.indexOf(jsStart);
  const jsEIdx = content.indexOf(jsEnd, jsSIdx);

  if (jsSIdx !== -1 && jsEIdx !== -1) {
    const newJsLogic = `function tampilkanModalPrivasiGate() {
      isGateMode = true;
      const modal = document.getElementById('modal-privasi-karyawan') || document.getElementById('modal-privacy-karyawan');
      const btnX = document.getElementById('btn-tutup-privasi-x');
      const badgeWajib = document.getElementById('badge-gate-wajib');
      const btnKonfirmasi = document.getElementById('btn-setuju-privasi-presensi') || document.getElementById('btn-konfirmasi-privasi');

      if (btnX) btnX.style.display = 'none';
      if (badgeWajib) badgeWajib.style.display = 'inline-flex';
      if (btnKonfirmasi) {
        btnKonfirmasi.textContent = 'Saya Menyetujui & Lanjutkan';
        btnKonfirmasi.onclick = konfirmasiSetujuPrivasi;
      }

      if (modal) {
        modal.classList.remove('hidden');
        modal.style.removeProperty('display');
        document.body.style.overflow = 'hidden';
      }
    }

    window.konfirmasiSetujuPrivasi = function(e) {
      if (e) {
        if (e.cancelable) e.preventDefault();
        e.stopPropagation();
      }

      try {
        // 1. Simpan tanda persetujuan ke storage
        sessionStorage.setItem('nsr_privasi_confirmed_version', 'PDP-2026-V1');
        sessionStorage.setItem('nsr_privasi_confirmed_at', new Date().toISOString());
        localStorage.setItem('nsr_presensi_privacy_ack', 'true');
        localStorage.setItem('nsr_presensi_privacy_accepted', 'true');

        // 2. Tutup paksa modal
        const targetModal = document.getElementById('modal-privasi-karyawan') || 
                            document.getElementById('modal-privacy-karyawan');
        if (targetModal) {
          targetModal.classList.add('hidden');
          targetModal.style.setProperty('display', 'none', 'important');
        }

        // 3. Pulihkan overflow layar
        document.body.style.overflow = '';
        document.documentElement.style.overflow = '';

        // 4. Picu GPS & Fokus NIK dengan aman (Isolasi Error)
        try {
          if (typeof ambilGPS === 'function') {
            ambilGPS();
          }
        } catch (gpsErr) {
          console.warn("GPS belum aktif atau ditolak di HP:", gpsErr);
        }

        setTimeout(() => {
          const inputNik = document.getElementById('auth-nik-input') || document.querySelector('input[name="nik"]');
          if (inputNik) {
            inputNik.focus();
          }
        }, 150);

      } catch (err) {
        console.error("Gagal menutup modal di HP:", err);
        // Jalur darurat mutlak
        document.querySelectorAll('[id*="privasi"]').forEach(el => {
          el.style.setProperty('display', 'none', 'important');
        });
        document.body.style.overflow = '';
      }
    };
    window.konfirmasiPrivasiKaryawan = window.konfirmasiSetujuPrivasi;

    function bukaModalPrivasiKaryawan() {
      isGateMode = false;
      const modal = document.getElementById('modal-privasi-karyawan') || document.getElementById('modal-privacy-karyawan');
      const btnX = document.getElementById('btn-tutup-privasi-x');
      const badgeWajib = document.getElementById('badge-gate-wajib');
      const btnKonfirmasi = document.getElementById('btn-setuju-privasi-presensi') || document.getElementById('btn-konfirmasi-privasi');

      if (btnX) btnX.style.display = '';
      if (badgeWajib) badgeWajib.style.display = 'none';
      if (btnKonfirmasi) {
        btnKonfirmasi.textContent = 'Saya Mengerti';
        btnKonfirmasi.onclick = tutupModalPrivasiKaryawan;
      }

      if (modal) {
        modal.classList.remove('hidden');
        modal.style.removeProperty('display');
        document.body.style.overflow = 'hidden';
      }
    }
    window.bukaModalPrivasiKaryawan = bukaModalPrivasiKaryawan;

    function tutupModalPrivasiKaryawan() {
      if (isGateMode && !privasiConfirmed) return;
      const modal = document.getElementById('modal-privasi-karyawan') || document.getElementById('modal-privacy-karyawan');
      if (modal) {
        modal.classList.add('hidden');
        modal.style.setProperty('display', 'none', 'important');
        document.body.style.overflow = '';
      }
    }
    window.tutupModalPrivasiKaryawan = tutupModalPrivasiKaryawan;

    `;

    content = content.slice(0, jsSIdx) + newJsLogic + content.slice(jsEIdx);
  }

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`✓ Berhasil memperbarui mobile responsive & event sentuh di ${relPath}`);
}

applyMobilePrivacyFix('portal-presensi.html');
applyMobilePrivacyFix('portal-absensi.html');
