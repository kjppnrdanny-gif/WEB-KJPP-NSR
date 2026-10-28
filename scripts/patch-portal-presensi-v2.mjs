import fs from 'fs';

const filePath = 'portal-presensi.html';
let html = fs.readFileSync(filePath, 'utf8');

// 1. Update KANTOR_REF coordinates
const oldKantorRef = /const KANTOR_REF = \[[\s\S]*?\];/;
const newKantorRef = `const KANTOR_REF = [
      { nama: "Pusat Jakarta", lat: -6.287972658138783, lng: 106.82477864308436, radius: 150, timezone: "Asia/Jakarta", tz: "WIB", alamat: "Jl. Ragunan Raya No. 8, Pasar Minggu, Jakarta Selatan" },
      { nama: "Cabang Bandung", lat: -6.8597817, lng: 107.5604289, radius: 150, timezone: "Asia/Jakarta", tz: "WIB", alamat: "Bandung, Jawa Barat" },
      { nama: "Cabang Padang", lat: -0.94932, lng: 100.376055, radius: 150, timezone: "Asia/Jakarta", tz: "WIB", alamat: "Padang, Sumatera Barat" },
      { nama: "Cabang Makassar", lat: -5.1565, lng: 119.4120, radius: 200, timezone: "Asia/Makassar", tz: "WITA", alamat: "Jl. Nuri Lr. 301 No. 7, Mariso, Makassar, Sulawesi Selatan" },
      { nama: "Cabang Palembang", lat: -2.929044, lng: 104.695981, radius: 150, timezone: "Asia/Jakarta", tz: "WIB", alamat: "Palembang, Sumatera Selatan" }
    ];`;
html = html.replace(oldKantorRef, newKantorRef);

// 2. Replace Auth Card HTML
const oldAuthCard = /<!-- ========================================================\s*KARTU AUTENTIKASI[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/;
const newAuthCard = `<!-- ========================================================
         KARTU AUTENTIKASI NIK & PIN PRESENSI 6 DIGIT
         ======================================================== -->
    <div id="auth-card" class="rounded-2xl p-4 border transition bg-slate-900 border-slate-800 shadow-lg space-y-3">
      <div class="flex items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
        <div class="flex items-center gap-2 min-w-0">
          <span class="text-base shrink-0">🔐</span>
          <div class="min-w-0">
            <h2 class="text-xs font-bold text-white uppercase tracking-wide truncate">Autentikasi NIK &amp; PIN Presensi</h2>
            <p class="text-[10px] text-slate-400 truncate">Sistem Presensi Multi-Cabang KJPP Nanang Rahayu Sigit Paryanto &amp; Rekan</p>
          </div>
        </div>
        <span id="auth-status-pill" data-badge="badge-status-autentikasi" class="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-500/10 text-amber-300 border border-amber-500/30 shrink-0">Belum Masuk</span>
      </div>

      <!-- FORM LOGIN NIK & PIN (JIKA BELUM TERVERIFIKASI) -->
      <div id="auth-box-unverified" class="space-y-3">
        <!-- Input NIK -->
        <div>
          <label for="auth-nik-input" class="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
            <span>1. NIK Karyawan <span class="text-rose-400">*</span></span>
            <span class="text-slate-400 font-mono text-[10px] font-normal normal-case">Contoh: NSR-2019-005, NSR-MKS-2019-30</span>
          </label>
          <div class="relative">
            <input type="text" id="auth-nik-input" oninput="onNikInputChange()" placeholder="Ketik NIK Karyawan" autocomplete="username" class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-xs font-semibold focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/20 transition uppercase">
          </div>
        </div>

        <!-- Preview Info Karyawan / Cabang Penempatan (Real-time badge) -->
        <div id="auth-nik-preview" class="hidden p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px]"></div>

        <!-- Input PIN Presensi 6-Digit -->
        <div>
          <label for="auth-pin-input" class="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
            <span>2. PIN Presensi (6 Digit) <span class="text-rose-400">*</span></span>
            <span class="text-slate-400 text-[10px] font-normal normal-case">PIN Default Standar: 123456</span>
          </label>
          <div class="relative">
            <input type="password" id="auth-pin-input" maxlength="6" inputmode="numeric" placeholder="Masukkan 6 Digit PIN" autocomplete="current-password" class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-center text-sm font-mono font-bold tracking-widest focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 transition" required>
          </div>
        </div>

        <!-- Checkbox Ingat Perangkat Ini & Link Lupa PIN -->
        <div class="flex items-center justify-between pt-1 text-xs">
          <label class="inline-flex items-center gap-2 cursor-pointer select-none text-slate-300 hover:text-white">
            <input type="checkbox" id="remember-device-checkbox" checked class="w-4 h-4 rounded border-slate-700 bg-slate-950 text-amber-500 focus:ring-amber-500/30">
            <span class="text-[11px] font-medium">Ingat Perangkat Ini (30 Hari)</span>
          </label>
          <button type="button" id="btn-link-lupa-pin" onclick="bukaModalResetPin()" class="text-[11px] text-amber-400 hover:text-amber-300 hover:underline cursor-pointer">
            Lupa atau Ingin Ganti PIN?
          </button>
        </div>

        <!-- Tombol Masuk Presensi -->
        <div class="pt-1">
          <button type="button" id="btn-masuk-presensi" onclick="eksekusiMasukPresensi()" class="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 transition active:scale-[0.98] btn-tactile cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2">
            <span>🔐</span>
            <span>Masuk Presensi</span>
          </button>
        </div>
      </div>

      <!-- TAMPILAN SESI AKTIF SETELAH PIN TERVERIFIKASI -->
      <div id="auth-box-verified" class="hidden p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 space-y-2">
        <div class="flex items-center justify-between gap-3">
          <div class="flex items-center gap-2.5 min-w-0">
            <div class="w-9 h-9 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-300 font-bold shrink-0 text-sm">
              ✓
            </div>
            <div class="min-w-0">
              <h3 id="verified-karyawan-nama" class="text-xs font-bold text-white truncate">Nama Karyawan</h3>
              <p id="verified-karyawan-sub" class="text-[10.5px] text-emerald-400 truncate">NIK • Jabatan • Divisi</p>
              <p id="verified-karyawan-email" class="text-[10px] text-slate-400 truncate">Kantor: Pusat Jakarta</p>
            </div>
          </div>
          <button type="button" onclick="logoutSesi()" class="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[10.5px] font-semibold border border-slate-700 transition shrink-0 btn-tactile cursor-pointer">
            Keluar
          </button>
        </div>
      </div>
    </div>`;
html = html.replace(oldAuthCard, newAuthCard);

// 3. Add Modals: #modal-lengkapi-email & #modal-reset-pin before #modal-notif
const modalsTarget = '<div id="modal-notif"';
const modalsCode = `<!-- ========================================================
       MODAL AUTO-PROMPT: LENGKAPI ALAMAT EMAIL RESMI
       ======================================================== -->
  <div id="modal-lengkapi-email" class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm hidden flex items-center justify-center p-4">
    <div class="bg-slate-900 border border-amber-500/30 rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4">
      <div class="flex items-center gap-3 border-b border-slate-800 pb-3">
        <div class="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 text-lg">
          📧
        </div>
        <div>
          <h3 class="text-sm font-bold text-white uppercase tracking-wide">Lengkapi Alamat Email Resmi</h3>
          <p class="text-[11px] text-slate-400">Verifikasi email kepegawaian untuk pemulihan akses &amp; notifikasi</p>
        </div>
      </div>

      <div class="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs space-y-1">
        <p class="text-slate-300">Halo <strong id="modal-email-nama" class="text-amber-300">-</strong> (<span id="modal-email-nik" class="font-mono text-slate-400">-</span>),</p>
        <p class="text-[11px] text-slate-400 leading-relaxed">Database kepegawaian Anda belum memiliki alamat email aktif terdaftar. Silakan masukkan alamat email resmi/pribadi aktif Anda di bawah ini untuk mengaktifkan presensi:</p>
      </div>

      <div class="space-y-1.5">
        <label for="input-email-mandiri" class="block text-[11px] font-bold text-slate-300 uppercase">
          Alamat Email Aktif <span class="text-rose-400">*</span>
        </label>
        <input type="email" id="input-email-mandiri" placeholder="contoh: nama.karyawan@gmail.com" class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/20 transition">
      </div>

      <div class="flex items-center justify-end gap-2 pt-2">
        <button type="button" id="btn-simpan-email-mandiri" onclick="eksekusiSimpanEmailMandiri()" class="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs uppercase tracking-wider transition shadow-lg shadow-amber-500/20 btn-tactile cursor-pointer">
          💾 Simpan &amp; Lanjutkan Presensi
        </button>
      </div>
    </div>
  </div>

  <!-- ========================================================
       MODAL RESET / GANTI PIN MANDIRI VIA EMAIL
       ======================================================== -->
  <div id="modal-reset-pin" class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm hidden flex items-center justify-center p-4">
    <div class="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4">
      <div class="flex items-center justify-between border-b border-slate-800 pb-3">
        <div class="flex items-center gap-2.5">
          <span class="text-lg">🔑</span>
          <div>
            <h3 class="text-sm font-bold text-white uppercase tracking-wide">Reset / Ganti PIN Presensi</h3>
            <p class="text-[11px] text-slate-400">Verifikasi kode keamanan melalui email resmi terdaftar</p>
          </div>
        </div>
        <button type="button" onclick="tutupModalResetPin()" class="text-slate-400 hover:text-white text-lg font-bold p-1 cursor-pointer">&times;</button>
      </div>

      <!-- Langkah 1: Input NIK & Minta Kode Konfirmasi -->
      <div id="reset-pin-step-1" class="space-y-3">
        <div>
          <label for="reset-nik-input" class="block text-[11px] font-bold text-slate-300 uppercase mb-1">
            Masukkan NIK Anda <span class="text-rose-400">*</span>
          </label>
          <input type="text" id="reset-nik-input" placeholder="Contoh: NSR-2019-012" class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-xs font-semibold focus:outline-none focus:border-amber-400 transition uppercase">
        </div>
        <p class="text-[11px] text-slate-400 leading-relaxed">
          Sistem akan mengirimkan kode konfirmasi 6-digit ke alamat email resmi Anda yang terdaftar di database HR KJPP NSR.
        </p>
        <button type="button" id="btn-minta-kode-reset" onclick="eksekusiMintaKodeResetPin()" class="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs uppercase tracking-wider transition btn-tactile cursor-pointer">
          📨 Kirim Kode Konfirmasi ke Email
        </button>
      </div>

      <!-- Langkah 2: Input Token Konfirmasi & PIN Baru -->
      <div id="reset-pin-step-2" class="hidden space-y-3">
        <div class="p-2.5 rounded-xl bg-sky-950/40 border border-sky-500/30 text-[11px] text-sky-200">
          Kode konfirmasi telah dikirim ke: <strong id="reset-target-email" class="text-amber-300 font-mono">email</strong>. Berlaku 15 menit.
        </div>
        <div>
          <label for="reset-token-input" class="block text-[11px] font-bold text-slate-300 uppercase mb-1">
            Kode Konfirmasi dari Email (6 Digit) <span class="text-rose-400">*</span>
          </label>
          <input type="text" id="reset-token-input" maxlength="6" inputmode="numeric" placeholder="6 Digit Kode" class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-center text-sm font-mono font-bold tracking-widest focus:outline-none focus:border-amber-400 transition">
        </div>
        <div>
          <label for="reset-new-pin" class="block text-[11px] font-bold text-slate-300 uppercase mb-1">
            PIN Baru (6 Digit Angka) <span class="text-rose-400">*</span>
          </label>
          <input type="password" id="reset-new-pin" maxlength="6" inputmode="numeric" placeholder="Contoh: 889900" class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-center text-sm font-mono font-bold tracking-widest focus:outline-none focus:border-amber-400 transition">
        </div>
        <div>
          <label for="reset-new-pin-confirm" class="block text-[11px] font-bold text-slate-300 uppercase mb-1">
            Konfirmasi PIN Baru <span class="text-rose-400">*</span>
          </label>
          <input type="password" id="reset-new-pin-confirm" maxlength="6" inputmode="numeric" placeholder="Ulangi 6 Digit PIN Baru" class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-center text-sm font-mono font-bold tracking-widest focus:outline-none focus:border-amber-400 transition">
        </div>
        <button type="button" id="btn-submit-new-pin" onclick="eksekusiSubmitNewPin()" class="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider transition shadow-lg shadow-amber-500/20 btn-tactile cursor-pointer">
          💾 Simpan PIN Baru
        </button>
      </div>
    </div>
  </div>\n\n  ` + modalsTarget;

if (!html.includes('id="modal-lengkapi-email"')) {
  html = html.replace(modalsTarget, modalsCode);
}

// 4. Update actionsSupportedByGAS in callBackend
const oldGasActions = "const actionsSupportedByGAS = ['cekKaryawan', 'mintaOTP', 'verifikasiOTP', 'simpanAbsensi', 'simpanWFH', 'simpanPengajuanCuti', 'getRiwayatPresensi', 'getMasterKaryawanFull'];";
const newGasActions = "const actionsSupportedByGAS = ['cekKaryawan', 'verify_pin', 'verifyPin', 'request_reset_pin', 'submit_new_pin', 'update_employee_email', 'updateEmailKaryawan', 'mintaOTP', 'verifikasiOTP', 'simpanAbsensi', 'simpanWFH', 'simpanPengajuanCuti', 'getRiwayatPresensi', 'getMasterKaryawanFull'];";
html = html.replace(oldGasActions, newGasActions);

// 5. Replace Old Auth Functions with Clean PIN Auth Functions
const authAnchorStart = '// 8. MINTA KODE OTP GMAIL (send_otp)';
const authAnchorEnd = '// =========================================================================\n    // ENHANCEMENT: DIRECT ROLE ACCESS ADMIN HR (NSR-2019-005)';
const authAnchorEndCRLF = '// =========================================================================\r\n    // ENHANCEMENT: DIRECT ROLE ACCESS ADMIN HR (NSR-2019-005)';

const newAuthJsBlock = `// 8. AUTENTIKASI PIN PRESENSI 6 DIGIT & MANAJEMEN SESI 30 HARI
    let nikDebounceTimer = null;
    function onNikInputChange() {
      const input = document.getElementById('auth-nik-input');
      const preview = document.getElementById('auth-nik-preview');
      if (!input || !preview) return;

      const val = input.value.trim().toUpperCase();
      input.value = val;

      if (!val) {
        preview.classList.add('hidden');
        preview.innerHTML = '';
        return;
      }

      if (sessionToken && val !== sessionNik) {
        logoutSesi();
      }

      if (nikDebounceTimer) clearTimeout(nikDebounceTimer);
      nikDebounceTimer = setTimeout(async () => {
        if (val.length < 5) return;
        preview.classList.remove('hidden');
        preview.innerHTML = \`
          <div class="flex items-center gap-2 text-slate-400 text-xs">
            <svg class="animate-spin h-3.5 w-3.5 text-amber-400 shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path></svg>
            <span>Memverifikasi data karyawan...</span>
          </div>
        \`;
        try {
          const res = await callBackend('cekKaryawan', { nik: val });
          const data = (res && res.data) ? res.data : res;
          if (data && (res.status === 'success' || res.success || data.nama)) {
            const cabang = data.cabang || (val.includes('MKS') ? 'Cabang Makassar' : (val.includes('BDG') ? 'Cabang Bandung' : (val.includes('PDG') ? 'Cabang Padang' : (val.includes('PLB') ? 'Cabang Palembang' : 'Pusat Jakarta'))));
            preview.innerHTML = \`
              <div class="flex items-center gap-2">
                <span class="text-emerald-400 font-bold">✓</span>
                <div class="leading-tight min-w-0">
                  <strong class="text-white block truncate">\${data.nama} &bull; \${data.jabatan || data.divisi || '-'}</strong>
                  <span class="text-amber-300 text-[10.5px] block truncate font-medium">Kantor Penempatan: \${cabang}</span>
                </div>
              </div>
            \`;
          } else {
            preview.innerHTML = \`<span class="text-rose-400 text-xs">\${res.message || 'NIK tidak terdaftar dalam database master.'}</span>\`;
          }
        } catch (err) {
          let cabang = 'Pusat Jakarta';
          if (val.includes('MKS')) cabang = 'Cabang Makassar';
          else if (val.includes('BDG')) cabang = 'Cabang Bandung';
          else if (val.includes('PDG')) cabang = 'Cabang Padang';
          else if (val.includes('PLB')) cabang = 'Cabang Palembang';
          preview.innerHTML = \`<span class="text-slate-300 text-xs font-medium">NIK: \${val} &bull; Kantor Penempatan: \${cabang}</span>\`;
        }
      }, 350);
    }

    let pendingNikForEmailUpdate = '';
    let pendingUserForEmailUpdate = null;

    async function eksekusiMasukPresensi() {
      const elNik = document.getElementById('auth-nik-input');
      const elPin = document.getElementById('auth-pin-input');
      const btn = document.getElementById('btn-masuk-presensi');
      const chkRemember = document.getElementById('remember-device-checkbox');

      const cleanNik = (elNik?.value || '').trim().toUpperCase();
      const cleanPin = (elPin?.value || '').trim();
      const rememberDevice = chkRemember ? chkRemember.checked : true;

      if (!cleanNik) {
        bukaModalNotif('Perhatian ⚠️', 'Harap masukkan NIK Karyawan terlebih dahulu!', false);
        if (elNik) elNik.focus();
        return;
      }

      if (!cleanPin || cleanPin.length !== 6) {
        bukaModalNotif('Perhatian ⚠️', 'Harap masukkan 6 Digit PIN Presensi Anda! (Default: 123456)', false);
        if (elPin) elPin.focus();
        return;
      }

      if (btn) {
        btn.disabled = true;
        btn.innerHTML = \`<span>⏳</span><span>Memverifikasi...</span>\`;
      }

      try {
        let res = null;
        const payload = new FormData();
        payload.append('action', 'verify_pin');
        payload.append('nik', cleanNik);
        payload.append('pin', cleanPin);
        if (rememberDevice) payload.append('remember_device', '1');

        try {
          const response = await fetch('backend/absensi-data-handler.php', {
            method: 'POST',
            body: payload,
            credentials: 'include'
          });
          if (response.ok) {
            res = await response.json();
          } else {
            const errJson = await response.json().catch(() => null);
            if (errJson) res = errJson;
          }
        } catch (e) {
          console.warn('[Direct backend/ fetch fallback]:', e.message);
        }

        if (!res) {
          res = await callBackend('verify_pin', { nik: cleanNik, pin: cleanPin, remember_device: rememberDevice });
        }

        if (btn) {
          btn.disabled = false;
          btn.innerHTML = \`<span>🔐</span><span>Masuk Presensi</span>\`;
        }

        if (!res || res.status === 'error' || res.success === false) {
          bukaModalNotif('Akses Ditolak ❌', (res && res.message) || 'PIN Presensi salah. Silakan periksa kembali atau gunakan menu ganti PIN.', false);
          if (elPin) {
            elPin.value = '';
            elPin.focus();
          }
          return;
        }

        // Periksa apakah karyawan belum memiliki email di database (Auto-Prompt Mandiri)
        if (res.needs_email_update) {
          pendingNikForEmailUpdate = cleanNik;
          pendingUserForEmailUpdate = res;
          bukaModalLengkapiEmail(res.nama || cleanNik, cleanNik);
          return;
        }

        // Autentikasi Sukses!
        const data = res.data || res;
        sessionToken = res.sessionToken || data.sessionToken || ('NSR_PIN_' + Date.now());
        sessionNik = cleanNik;
        sessionUser = {
          nama: data.nama || res.nama || 'Karyawan',
          jabatan: data.jabatan || res.jabatan || '',
          divisi: data.divisi || res.divisi || '',
          cabang: data.cabang || res.cabang || 'Pusat Jakarta',
          isAdminHR: !!(data.isAdminHR || res.isAdminHR || cleanNik === 'NSR-2019-005')
        };

        // Simpan sesi ke sessionStorage
        try {
          sessionStorage.setItem('nsr_presensi_session_token', sessionToken);
          sessionStorage.setItem('nsr_presensi_session_nik', sessionNik);
          sessionStorage.setItem('nsr_presensi_session_user', JSON.stringify(sessionUser));
          if (sessionUser.isAdminHR) {
            sessionStorage.setItem('nsr_hr_unlocked', 'true');
          }
        } catch (e) {}

        // Simpan sesi 30 hari ke localStorage jika checkbox Ingat Perangkat dicentang
        if (rememberDevice) {
          try {
            localStorage.setItem('nsr_presensi_token', sessionToken);
            localStorage.setItem('nsr_presensi_nik', sessionNik);
            localStorage.setItem('nsr_presensi_user', JSON.stringify(sessionUser));
            localStorage.setItem('nsr_presensi_remember_ts', String(Date.now()));
          } catch (e) {}
        }

        pasangStateTerverifikasi();
        bukaModalNotif('Masuk Berhasil ✅', \`Selamat datang, \${sessionUser.nama}! Presensi Anda telah aktif.\`);
      } catch (err) {
        if (btn) {
          btn.disabled = false;
          btn.innerHTML = \`<span>🔐</span><span>Masuk Presensi</span>\`;
        }
        bukaModalNotif('Gangguan Jaringan ⚠️', err.message || 'Terjadi gangguan jaringan saat memverifikasi PIN. Silakan coba kembali.', false);
      }
    }

    function bukaModalLengkapiEmail(nama, nik) {
      const modal = document.getElementById('modal-lengkapi-email');
      const elNama = document.getElementById('modal-email-nama');
      const elNik = document.getElementById('modal-email-nik');
      const inpEmail = document.getElementById('input-email-mandiri');

      if (elNama) elNama.textContent = nama;
      if (elNik) elNik.textContent = nik;
      if (inpEmail) {
        inpEmail.value = '';
        setTimeout(() => inpEmail.focus(), 200);
      }
      if (modal) modal.classList.remove('hidden');
    }

    function tutupModalLengkapiEmail() {
      const modal = document.getElementById('modal-lengkapi-email');
      if (modal) modal.classList.add('hidden');
    }

    async function eksekusiSimpanEmailMandiri() {
      const inpEmail = document.getElementById('input-email-mandiri');
      const btn = document.getElementById('btn-simpan-email-mandiri');
      const emailVal = (inpEmail?.value || '').trim();

      if (!emailVal || !emailVal.includes('@') || !emailVal.includes('.')) {
        bukaModalNotif('Perhatian ⚠️', 'Harap masukkan alamat email yang valid! (Contoh: nama@gmail.com)', false);
        if (inpEmail) inpEmail.focus();
        return;
      }

      if (btn) {
        btn.disabled = true;
        btn.textContent = 'Menyimpan & Memverifikasi...';
      }

      try {
        const payload = new FormData();
        payload.append('action', 'update_employee_email');
        payload.append('nik', pendingNikForEmailUpdate);
        payload.append('email', emailVal);

        let res = null;
        try {
          const response = await fetch('backend/absensi-data-handler.php', {
            method: 'POST',
            body: payload,
            credentials: 'include'
          });
          if (response.ok) {
            res = await response.json();
          } else {
            res = await response.json().catch(() => null);
          }
        } catch (e) {
          console.warn('[Direct update_employee_email fetch fallback]:', e.message);
        }

        if (!res) {
          res = await callBackend('update_employee_email', { nik: pendingNikForEmailUpdate, email: emailVal });
        }

        if (btn) {
          btn.disabled = false;
          btn.textContent = '💾 Simpan & Lanjutkan Presensi';
        }

        if (!res || res.status === 'error' || res.success === false) {
          bukaModalNotif('Pendaftaran Gagal ❌', (res && res.message) || 'Gagal menyimpan email. Silakan coba kembali.', false);
          return;
        }

        // Sukses!
        tutupModalLengkapiEmail();
        const data = res.data || res;
        sessionToken = res.sessionToken || data.sessionToken || ('NSR_PIN_' + Date.now());
        sessionNik = pendingNikForEmailUpdate;
        sessionUser = {
          nama: data.nama || pendingUserForEmailUpdate?.nama || 'Karyawan',
          jabatan: data.jabatan || pendingUserForEmailUpdate?.jabatan || '',
          divisi: data.divisi || pendingUserForEmailUpdate?.divisi || '',
          cabang: data.cabang || pendingUserForEmailUpdate?.cabang || 'Pusat Jakarta',
          isAdminHR: !!(data.isAdminHR || sessionNik === 'NSR-2019-005')
        };

        // Simpan sesi
        try {
          sessionStorage.setItem('nsr_presensi_session_token', sessionToken);
          sessionStorage.setItem('nsr_presensi_session_nik', sessionNik);
          sessionStorage.setItem('nsr_presensi_session_user', JSON.stringify(sessionUser));
          localStorage.setItem('nsr_presensi_token', sessionToken);
          localStorage.setItem('nsr_presensi_nik', sessionNik);
          localStorage.setItem('nsr_presensi_user', JSON.stringify(sessionUser));
          localStorage.setItem('nsr_presensi_remember_ts', String(Date.now()));
        } catch (e) {}

        pasangStateTerverifikasi();
        bukaModalNotif('Email Berhasil Terdaftar! 🎉', 'Alamat email resmi Anda telah tercatat. Akses presensi kini aktif.');
      } catch (err) {
        if (btn) {
          btn.disabled = false;
          btn.textContent = '💾 Simpan & Lanjutkan Presensi';
        }
        bukaModalNotif('Gangguan Jaringan ⚠️', err.message || 'Terjadi gangguan jaringan saat menyimpan email.', false);
      }
    }

    function bukaModalResetPin() {
      const modal = document.getElementById('modal-reset-pin');
      const step1 = document.getElementById('reset-pin-step-1');
      const step2 = document.getElementById('reset-pin-step-2');
      const inpNik = document.getElementById('reset-nik-input');
      const curNik = (document.getElementById('auth-nik-input')?.value || '').trim();

      if (inpNik && curNik) inpNik.value = curNik;
      if (step1) step1.classList.remove('hidden');
      if (step2) step2.classList.add('hidden');
      if (modal) modal.classList.remove('hidden');
    }

    function tutupModalResetPin() {
      const modal = document.getElementById('modal-reset-pin');
      if (modal) modal.classList.add('hidden');
    }

    let resetPinTargetNik = '';
    async function eksekusiMintaKodeResetPin() {
      const inpNik = document.getElementById('reset-nik-input');
      const btn = document.getElementById('btn-minta-kode-reset');
      const nikVal = (inpNik?.value || '').trim().toUpperCase();

      if (!nikVal) {
        bukaModalNotif('Perhatian ⚠️', 'Harap masukkan NIK Anda!', false);
        if (inpNik) inpNik.focus();
        return;
      }

      if (btn) {
        btn.disabled = true;
        btn.textContent = 'Mengirim Kode ke Email...';
      }

      try {
        let res = null;
        const payload = new FormData();
        payload.append('action', 'request_reset_pin');
        payload.append('nik', nikVal);

        try {
          const response = await fetch('backend/absensi-data-handler.php', {
            method: 'POST',
            body: payload,
            credentials: 'include'
          });
          if (response.ok) {
            res = await response.json();
          } else {
            res = await response.json().catch(() => null);
          }
        } catch (e) {}

        if (!res) {
          res = await callBackend('request_reset_pin', { nik: nikVal });
        }

        if (btn) {
          btn.disabled = false;
          btn.textContent = '📨 Kirim Kode Konfirmasi ke Email';
        }

        if (!res || res.status === 'error' || res.success === false) {
          bukaModalNotif('Gagal Mengirim Kode ❌', (res && res.message) || 'Alamat email belum terdaftar di database HR, hubungi Admin Pusat untuk bantuan reset PIN.', false);
          return;
        }

        resetPinTargetNik = nikVal;
        const step1 = document.getElementById('reset-pin-step-1');
        const step2 = document.getElementById('reset-pin-step-2');
        const targetEmail = document.getElementById('reset-target-email');
        if (targetEmail) targetEmail.textContent = res.maskedEmail || 'Email resmi terdaftar';
        if (step1) step1.classList.add('hidden');
        if (step2) step2.classList.remove('hidden');

        bukaModalNotif('Kode Konfirmasi Terkirim 📩', res.message || 'Kode 6-digit konfirmasi telah dikirimkan ke email Anda. Berlaku 15 menit.');
      } catch (err) {
        if (btn) {
          btn.disabled = false;
          btn.textContent = '📨 Kirim Kode Konfirmasi ke Email';
        }
        bukaModalNotif('Gangguan Jaringan ⚠️', err.message || 'Gagal menghubungi server untuk reset PIN.', false);
      }
    }

    async function eksekusiSubmitNewPin() {
      const inpToken = document.getElementById('reset-token-input');
      const inpNewPin = document.getElementById('reset-new-pin');
      const inpConfirm = document.getElementById('reset-new-pin-confirm');
      const btn = document.getElementById('btn-submit-new-pin');

      const tokenVal = (inpToken?.value || '').trim();
      const newPinVal = (inpNewPin?.value || '').trim();
      const confirmVal = (inpConfirm?.value || '').trim();

      if (!tokenVal || tokenVal.length !== 6) {
        bukaModalNotif('Perhatian ⚠️', 'Harap masukkan 6 digit kode konfirmasi dari email!', false);
        if (inpToken) inpToken.focus();
        return;
      }

      if (!newPinVal || !/^\\d{6}$/.test(newPinVal)) {
        bukaModalNotif('Perhatian ⚠️', 'PIN Baru harus berupa 6 digit angka!', false);
        if (inpNewPin) inpNewPin.focus();
        return;
      }

      if (newPinVal !== confirmVal) {
        bukaModalNotif('Perhatian ⚠️', 'Konfirmasi PIN Baru tidak cocok dengan PIN Baru!', false);
        if (inpConfirm) inpConfirm.focus();
        return;
      }

      if (btn) {
        btn.disabled = true;
        btn.textContent = 'Menyimpan PIN Baru...';
      }

      try {
        let res = null;
        const payload = new FormData();
        payload.append('action', 'submit_new_pin');
        payload.append('nik', resetPinTargetNik);
        payload.append('token', tokenVal);
        payload.append('new_pin', newPinVal);

        try {
          const response = await fetch('backend/absensi-data-handler.php', {
            method: 'POST',
            body: payload,
            credentials: 'include'
          });
          if (response.ok) {
            res = await response.json();
          } else {
            res = await response.json().catch(() => null);
          }
        } catch (e) {}

        if (!res) {
          res = await callBackend('submit_new_pin', { nik: resetPinTargetNik, token: tokenVal, new_pin: newPinVal });
        }

        if (btn) {
          btn.disabled = false;
          btn.textContent = '💾 Simpan PIN Baru';
        }

        if (!res || res.status === 'error' || res.success === false) {
          bukaModalNotif('Reset PIN Gagal ❌', (res && res.message) || 'Kode konfirmasi tidak valid atau kedaluwarsa.', false);
          return;
        }

        tutupModalResetPin();
        bukaModalNotif('PIN Berhasil Diperbarui! 🎉', 'PIN Presensi Anda telah berhasil diubah. Silakan masuk menggunakan PIN baru Anda.');

        const authNik = document.getElementById('auth-nik-input');
        const authPin = document.getElementById('auth-pin-input');
        if (authNik) authNik.value = resetPinTargetNik;
        if (authPin) {
          authPin.value = '';
          authPin.focus();
        }
      } catch (err) {
        if (btn) {
          btn.disabled = false;
          btn.textContent = '💾 Simpan PIN Baru';
        }
        bukaModalNotif('Gangguan Jaringan ⚠️', err.message || 'Gagal memperbarui PIN Presensi.', false);
      }
    }

    // Expose handlers to window for inline HTML onclick calls
    window.onNikInputChange = onNikInputChange;
    window.eksekusiMasukPresensi = eksekusiMasukPresensi;
    window.bukaModalResetPin = bukaModalResetPin;
    window.tutupModalResetPin = tutupModalResetPin;
    window.eksekusiMintaKodeResetPin = eksekusiMintaKodeResetPin;
    window.eksekusiSubmitNewPin = eksekusiSubmitNewPin;
    window.bukaModalLengkapiEmail = bukaModalLengkapiEmail;
    window.tutupModalLengkapiEmail = tutupModalLengkapiEmail;
    window.eksekusiSimpanEmailMandiri = eksekusiSimpanEmailMandiri;
    window.logoutSesi = logoutSesi;

    `;

const pStart = html.indexOf(authAnchorStart);
const pEnd = html.indexOf(authAnchorEnd) !== -1 ? html.indexOf(authAnchorEnd) : html.indexOf(authAnchorEndCRLF);

if (pStart !== -1 && pEnd !== -1) {
  html = html.substring(0, pStart) + newAuthJsBlock + html.substring(pEnd);
} else {
  console.warn('Could not find auth anchors', { pStart, pEnd });
}

// 6. Update pulihkanSesiPresensiTersimpan to check 30-day localStorage
const pulihkanTarget = `function pulihkanSesiPresensiTersimpan() {
      try {
        const savedToken = sessionStorage.getItem('nsr_presensi_session_token');
        const savedNik = sessionStorage.getItem('nsr_presensi_session_nik');
        const savedUserStr = sessionStorage.getItem('nsr_presensi_session_user');

        if (savedToken && savedNik && savedUserStr) {
          sessionToken = savedToken;
          sessionNik = savedNik;
          sessionUser = JSON.parse(savedUserStr);
          pasangStateTerverifikasi();
        }
      } catch (e) {}
    }`;

const pulihkanReplacement = `function pulihkanSesiPresensiTersimpan() {
      try {
        // 1. Cek sesi 30 hari dari localStorage (Remember Device)
        const remTs = localStorage.getItem('nsr_presensi_remember_ts');
        const remToken = localStorage.getItem('nsr_presensi_token');
        const remNik = localStorage.getItem('nsr_presensi_nik');
        const remUserStr = localStorage.getItem('nsr_presensi_user');

        if (remTs && remToken && remNik && remUserStr) {
          const elapsed = Date.now() - parseInt(remTs, 10);
          const maxAge = 30 * 86400 * 1000; // 30 hari
          if (elapsed < maxAge) {
            sessionToken = remToken;
            sessionNik = remNik;
            sessionUser = JSON.parse(remUserStr);
            pasangStateTerverifikasi();
            return;
          } else {
            localStorage.removeItem('nsr_presensi_remember_ts');
            localStorage.removeItem('nsr_presensi_token');
            localStorage.removeItem('nsr_presensi_nik');
            localStorage.removeItem('nsr_presensi_user');
          }
        }

        // 2. Cek sesi aktif tab dari sessionStorage
        const savedToken = sessionStorage.getItem('nsr_presensi_session_token');
        const savedNik = sessionStorage.getItem('nsr_presensi_session_nik');
        const savedUserStr = sessionStorage.getItem('nsr_presensi_session_user');

        if (savedToken && savedNik && savedUserStr) {
          sessionToken = savedToken;
          sessionNik = savedNik;
          sessionUser = JSON.parse(savedUserStr);
          pasangStateTerverifikasi();
        }
      } catch (e) {}
    }`;

// Match CRLF or LF for pulihkanTarget
if (html.includes(pulihkanTarget)) {
  html = html.replace(pulihkanTarget, pulihkanReplacement);
} else {
  const pTargetCRLF = pulihkanTarget.replace(/\n/g, '\r\n');
  const pReplacementCRLF = pulihkanReplacement.replace(/\n/g, '\r\n');
  html = html.replace(pTargetCRLF, pReplacementCRLF);
}

// 7. Update logoutSesi to clear 30-day localStorage
const logoutTarget = `function logoutSesi() {
      try {
        callBackend('logoutPresensi', { sessionToken }).catch(() => {});
        sessionStorage.removeItem('nsr_presensi_session_token');
        sessionStorage.removeItem('nsr_presensi_session_nik');
        sessionStorage.removeItem('nsr_presensi_session_user');
      } catch (e) {}
    
      sessionToken = "";
      sessionNik = "";
      sessionUser = null;

      if (cooldownTimerId) clearInterval(cooldownTimerId);

      document.getElementById('auth-box-unverified').classList.remove('hidden');
      document.getElementById('auth-box-verified').classList.add('hidden');
      document.getElementById('auth-box-otp-input').classList.add('hidden');

      const otpInput = document.getElementById('auth-otp-input');
      if (otpInput) otpInput.value = "";

      const pill = document.getElementById('auth-status-pill');
      pill.textContent = 'Belum Terverifikasi';
      pill.className = 'px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-500/10 text-amber-300 border border-amber-500/30 shrink-0';

      updateIdentitasBadges();
    }`;

const logoutReplacement = `function logoutSesi() {
      try {
        callBackend('logoutPresensi', { sessionToken }).catch(() => {});
        sessionStorage.removeItem('nsr_presensi_session_token');
        sessionStorage.removeItem('nsr_presensi_session_nik');
        sessionStorage.removeItem('nsr_presensi_session_user');
        sessionStorage.removeItem('nsr_hr_unlocked');
        localStorage.removeItem('nsr_presensi_token');
        localStorage.removeItem('nsr_presensi_nik');
        localStorage.removeItem('nsr_presensi_user');
        localStorage.removeItem('nsr_presensi_remember_ts');
      } catch (e) {}
    
      sessionToken = "";
      sessionNik = "";
      sessionUser = null;

      const boxUnv = document.getElementById('auth-box-unverified');
      const boxVer = document.getElementById('auth-box-verified');
      if (boxUnv) boxUnv.classList.remove('hidden');
      if (boxVer) boxVer.classList.add('hidden');

      const pinInput = document.getElementById('auth-pin-input');
      if (pinInput) pinInput.value = "";

      const pill = document.getElementById('auth-status-pill');
      if (pill) {
        pill.textContent = 'Belum Masuk';
        pill.className = 'px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-500/10 text-amber-300 border border-amber-500/30 shrink-0';
      }

      const bDash = document.getElementById('tab-btn-dashboard');
      if (bDash) bDash.classList.add('hidden');

      updateIdentitasBadges();
    }`;

if (html.includes(logoutTarget)) {
  html = html.replace(logoutTarget, logoutReplacement);
} else {
  const lTargetCRLF = logoutTarget.replace(/\n/g, '\r\n');
  const lReplacementCRLF = logoutReplacement.replace(/\n/g, '\r\n');
  html = html.replace(lTargetCRLF, lReplacementCRLF);
}

// 8. Update inisialisasiPresensiPortal: PIN Sanitizer
const sanitizeTarget = `const elOtpInput = document.getElementById('auth-otp-input');
      if (elOtpInput) {
        elOtpInput.addEventListener('input', function() {
          this.value = this.value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);
        });
      }`;

const sanitizeReplacement = `const elPinInput = document.getElementById('auth-pin-input');
      if (elPinInput) {
        elPinInput.addEventListener('input', function() {
          this.value = this.value.replace(/\\D/g, '').slice(0, 6);
        });
      }`;

if (html.includes(sanitizeTarget)) {
  html = html.replace(sanitizeTarget, sanitizeReplacement);
} else {
  const sTargetCRLF = sanitizeTarget.replace(/\n/g, '\r\n');
  const sReplacementCRLF = sanitizeReplacement.replace(/\n/g, '\r\n');
  html = html.replace(sTargetCRLF, sReplacementCRLF);
}

// 9. Update wording in notifications
html = html.replace(/verifikasi NIK dan OTP Gmail sebelum mendaftarkan lokasi WFH/g, 'masuk dengan NIK dan PIN Presensi terlebih dahulu');
html = html.replace(/verifikasi NIK dan OTP Gmail sebelum mengajukan cuti\/izin/g, 'masuk dengan NIK dan PIN Presensi terlebih dahulu');
html = html.replace(/Silakan masukkan NIK dan verifikasi kode OTP yang dikirim ke Gmail Anda terlebih dahulu/g, 'Silakan masukkan NIK dan PIN Presensi Anda terlebih dahulu');

fs.writeFileSync(filePath, html, 'utf8');
console.log('✓ portal-presensi.html successfully updated with PIN Auth & Multi-Branch');

// Sync to presensi.html and portal-absensi.html
fs.writeFileSync('presensi.html', html, 'utf8');
fs.writeFileSync('portal-absensi.html', html, 'utf8');
console.log('✓ Synced to presensi.html and portal-absensi.html');
