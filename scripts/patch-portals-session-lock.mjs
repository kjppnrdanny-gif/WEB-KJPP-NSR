import fs from 'fs';

const files = ['portal-presensi.html', 'presensi.html', 'portal-absensi.html'];

files.forEach(f => {
  if (!fs.existsSync(f)) return;
  let content = fs.readFileSync(f, 'utf8').replace(/\r\n/g, '\n');

  // 1. Tambahkan lencana visual penguncian NIK di dalam Input NIK
  const oldNikInputBlock = `        <!-- Input NIK -->
        <div>
          <label for="auth-nik-input" class="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
            <span>1. NIK Karyawan <span class="text-rose-400">*</span></span>
          </label>
          <div class="relative">
            <input type="text" id="auth-nik-input" oninput="onNikInputChange()" placeholder="Ketik NIK Karyawan" autocomplete="username" class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-xs font-semibold focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/20 transition uppercase">
          </div>
        </div>

        <!-- Preview Info Karyawan / Cabang Penempatan (Real-time badge) -->
        <div id="auth-nik-preview" class="hidden p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px]"></div>`;

  const newNikInputBlock = `        <!-- Input NIK (Session-Bound Lockdown) -->
        <div>
          <label for="auth-nik-input" class="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
            <span>1. NIK Karyawan <span class="text-rose-400">*</span></span>
            <span id="badge-lock-status" class="text-[10px] text-slate-400 font-normal">Identitas Resmi</span>
          </label>
          <div class="relative">
            <input type="text" id="auth-nik-input" oninput="onNikInputChange()" placeholder="Ketik NIK Karyawan" autocomplete="username" class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-xs font-semibold focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/20 transition uppercase">
          </div>

          <!-- Lencana Visual Penguncian Sesi NIK (Session-Bound Anti-Titip Absen) -->
          <div id="nik-lockdown-badge" class="hidden mt-2 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-xs text-emerald-300">
            <div class="flex items-center gap-2 min-w-0">
              <span class="text-base shrink-0">🔒</span>
              <div class="min-w-0">
                <strong class="block font-bold text-white text-[11.5px] truncate">Identitas Terverifikasi: <span id="locked-nik-label" class="text-emerald-400 font-mono"></span></strong>
                <span id="locked-user-label" class="text-[10px] text-emerald-300/80 block truncate"></span>
              </div>
            </div>
            <button type="button" onclick="logoutSesiDanKembaliKeGerbang()" class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[10.5px] font-bold border border-slate-700 transition shrink-0 cursor-pointer">
              Keluar / Ganti Akun
            </button>
          </div>
        </div>

        <!-- Preview Info Karyawan / Cabang Penempatan (Real-time badge) -->
        <div id="auth-nik-preview" class="hidden p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px]"></div>`;

  if (content.includes(oldNikInputBlock)) {
    content = content.replace(oldNikInputBlock, newNikInputBlock);
    console.log(`✓ Added nik-lockdown-badge to ${f}`);
  }

  // 2. Bersihkan duplicate auth-box-verified jika ada
  const duplicateVerified = `      <!-- TAMPILAN SESI AKTIF SETELAH OTP TERVERIFIKASI -->
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
          <button type="button" onclick="logoutSesi()" class="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[10.5px] font-semibold border border-slate-700 transition shrink-0 btn-tactile">
            Ganti Akun
          </button>
        </div>
      </div>
    </div>`;

  if (content.includes(duplicateVerified)) {
    content = content.replace(duplicateVerified, '');
    console.log(`✓ Removed duplicate auth-box-verified from ${f}`);
  }

  // 3. Update tombol Keluar pada auth-box-verified menjadi Keluar / Ganti Akun
  content = content.replace(
    `<button type="button" onclick="logoutSesi()" class="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[10.5px] font-semibold border border-slate-700 transition shrink-0 btn-tactile cursor-pointer">\n            Keluar\n          </button>`,
    `<button type="button" onclick="logoutSesiDanKembaliKeGerbang()" class="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[10.5px] font-bold border border-slate-700 transition shrink-0 btn-tactile cursor-pointer">\n            Keluar / Ganti Akun\n          </button>`
  );

  // 4. Tambahkan fungsi penguncian NIK mutlak & logout ke gerbang awal
  const oldPasangState = `    function pasangStateTerverifikasi() {
      // Simpan Sesi ke sessionStorage
      try {
        sessionStorage.setItem('nsr_presensi_session_token', sessionToken);
        sessionStorage.setItem('nsr_presensi_session_nik', sessionNik);
        sessionStorage.setItem('nsr_presensi_session_user', JSON.stringify(sessionUser));
      } catch (e) {}`;

  const newPasangState = `    // 6. ENFORCEMENT PENGUNCIAN IDENTITAS MUTLAK (SESSION-BOUND LOCKDOWN)
    function kunciInputNikSecaraMutlak(nik, userObj = null) {
      if (!nik) return;
      const inp = document.getElementById('auth-nik-input');
      const badge = document.getElementById('nik-lockdown-badge');
      const labelNik = document.getElementById('locked-nik-label');
      const labelUser = document.getElementById('locked-user-label');
      const statusNik = document.getElementById('badge-lock-status');
      const preview = document.getElementById('auth-nik-preview');

      if (inp) {
        inp.value = nik;
        inp.setAttribute('readonly', 'true');
        inp.classList.add('bg-slate-900', 'text-emerald-300', 'border-emerald-500/50', 'cursor-not-allowed', 'select-none');
        inp.tabIndex = -1;
      }
      if (statusNik) {
        statusNik.textContent = '🔒 Terkunci Sesi';
        statusNik.className = 'text-[10px] text-emerald-400 font-bold';
      }
      if (badge && labelNik) {
        labelNik.textContent = nik;
        if (userObj) {
          labelUser.textContent = (userObj.nama || '') + ' • ' + (userObj.kantor || userObj.cabang || 'KJPP NSR') + ' • ' + (userObj.jabatan || '');
        }
        badge.classList.remove('hidden');
      }
      if (preview) preview.classList.add('hidden');
    }

    async function logoutSesiDanKembaliKeGerbang() {
      try {
        if (sessionToken) {
          await callBackend('logoutPresensi', { sessionToken }).catch(() => {});
        }
      } catch (_) {}

      try {
        sessionStorage.removeItem('auth_nik');
        sessionStorage.removeItem('nsr_presensi_active_nik');
        sessionStorage.removeItem('nsr_presensi_session_token');
        sessionStorage.removeItem('NSR_AUTH_TOKEN');
        sessionStorage.removeItem('nsr_presensi_session_nik');
        sessionStorage.removeItem('nsr_presensi_session_user');
        sessionStorage.removeItem('nsr_presensi_active_user');
        sessionStorage.removeItem('nsr_hr_unlocked');
        localStorage.removeItem('nsr_presensi_token');
        localStorage.removeItem('nsr_presensi_nik');
        localStorage.removeItem('nsr_presensi_user');
        localStorage.removeItem('nsr_presensi_remember_ts');
      } catch (_) {}

      sessionToken = "";
      sessionNik = "";
      sessionUser = null;

      // Alihkan peramban ke gerbang akses awal di beranda
      window.location.href = 'index.html#portal';
    }

    function pasangStateTerverifikasi() {
      // Simpan Sesi ke sessionStorage
      try {
        sessionStorage.setItem('auth_nik', sessionNik);
        sessionStorage.setItem('nsr_presensi_active_nik', sessionNik);
        sessionStorage.setItem('nsr_presensi_session_token', sessionToken);
        sessionStorage.setItem('NSR_AUTH_TOKEN', sessionToken);
        sessionStorage.setItem('nsr_presensi_session_nik', sessionNik);
        sessionStorage.setItem('nsr_presensi_session_user', JSON.stringify(sessionUser));
      } catch (e) {}

      // Kunci NIK secara mutlak
      kunciInputNikSecaraMutlak(sessionNik, sessionUser);`;

  if (content.includes(oldPasangState)) {
    content = content.replace(oldPasangState, newPasangState);
    console.log(`✓ Added kunciInputNikSecaraMutlak to ${f}`);
  }

  // 5. Update updateIdentitasBadges untuk menampilkan lencana terkunci
  const oldBadgeTerv = `<strong class="text-white block">\${sessionUser.nama} (\${sessionNik})</strong>
                <span class="text-[10px] text-emerald-400 block">\${sessionUser.jabatan} &bull; \${sessionUser.divisi}</span>`;

  // 6. Update pulihkanSesiPresensiTersimpan untuk memulihkan auth_nik dari Gerbang
  const oldPulihkan = `    function pulihkanSesiPresensiTersimpan() {
      try {
        // 1. Cek sesi 30 hari dari localStorage (Remember Device)`;

  const newPulihkan = `    function pulihkanSesiPresensiTersimpan() {
      try {
        // 0. Prioritas Utama: Cek Sesi Terkunci dari Gerbang Awal (Session-Bound Lockdown)
        const boundNik = sessionStorage.getItem('auth_nik') || sessionStorage.getItem('nsr_presensi_active_nik') || sessionStorage.getItem('nsr_presensi_session_nik');
        const boundToken = sessionStorage.getItem('nsr_presensi_session_token') || sessionStorage.getItem('NSR_AUTH_TOKEN');
        const boundUserStr = sessionStorage.getItem('nsr_presensi_session_user') || sessionStorage.getItem('nsr_presensi_active_user');

        let boundUser = null;
        if (boundUserStr) {
          try { boundUser = JSON.parse(boundUserStr); } catch (_) {}
        }

        if (boundNik) {
          kunciInputNikSecaraMutlak(boundNik, boundUser);
          if (boundToken) {
            sessionToken = boundToken;
            sessionNik = boundNik;
            sessionUser = boundUser || { nik: boundNik, nama: boundNik };
            pasangStateTerverifikasi();
            return;
          }
        }

        // 1. Cek sesi 30 hari dari localStorage (Remember Device)`;

  if (content.includes(oldPulihkan)) {
    content = content.replace(oldPulihkan, newPulihkan);
    console.log(`✓ Updated pulihkanSesiPresensiTersimpan with gate session-bound check in ${f}`);
  }

  // 7. Update kirimAbsensi untuk mengunci NIK dari sessionNik
  const oldKirimPayload = `      const payload = {
        nik: sessionNik,
        jenis: jenis,
        lokasi: lokasi,
        gps: gpsUser,
        catatan: catatan,
        selfieData: selfiePhotoBase64
      };`;

  const newKirimPayload = `      const lockedNik = sessionNik || sessionStorage.getItem('auth_nik') || sessionStorage.getItem('nsr_presensi_active_nik');
      const payload = {
        nik: lockedNik,
        sessionToken: sessionToken,
        jenis: jenis,
        lokasi: lokasi,
        gps: gpsUser,
        catatan: catatan,
        selfieData: selfiePhotoBase64
      };`;

  if (content.includes(oldKirimPayload)) {
    content = content.replace(oldKirimPayload, newKirimPayload);
    console.log(`✓ Updated kirimAbsensi locked payload in ${f}`);
  }

  // Window exports
  content = content.replace(
    `window.logoutSesi = logoutSesi;`,
    `window.logoutSesi = logoutSesi;\n    window.logoutSesiDanKembaliKeGerbang = logoutSesiDanKembaliKeGerbang;\n    window.kunciInputNikSecaraMutlak = kunciInputNikSecaraMutlak;`
  );

  fs.writeFileSync(f, content.replace(/\n/g, '\r\n'), 'utf8');
});
console.log('✓ All portal files successfully patched with NIK lockdown!');
