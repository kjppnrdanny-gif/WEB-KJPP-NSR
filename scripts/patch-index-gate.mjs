import fs from 'fs';

const path = 'index.html';
let content = fs.readFileSync(path, 'utf8').replace(/\r\n/g, '\n');

// 1. Tambahkan field NIK Karyawan ke form-token-portal
const oldTokenField = `          <!-- Input Field Token & Validation -->
          <div class="space-y-4">
            <div>
              <label for="input-token" class="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2 flex items-center justify-between">
                <span>Token Otorisasi Akses <span class="text-rose-400">*</span></span>
                <span class="text-[10px] font-normal text-slate-400">Rahasia &bull; Sesuai Peran</span>
              </label>`;

const newTokenField = `          <!-- Input Field Token & Validation -->
          <div class="space-y-3.5">
            <!-- Input 1: NIK Karyawan Resmi (Session-Bound) -->
            <div id="container-nik-portal">
              <label for="input-nik-portal" class="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center justify-between">
                <span>NIK Karyawan Resmi <span class="text-rose-400">*</span></span>
                <span class="text-[10px] font-normal text-slate-400">Pusat &amp; 4 Cabang</span>
              </label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <svg class="w-4 h-4 text-sky-400/80" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                </div>
                <input type="text"
                       id="input-nik-portal"
                       placeholder="Ketik NIK Karyawan (cth: NSR-...)"
                       class="input-basic flex h-11 w-full rounded-xl border border-slate-700 bg-slate-900/90 pl-10 pr-3.5 py-2 text-sm text-white font-mono font-bold uppercase placeholder:text-slate-500 placeholder:font-sans placeholder:font-normal shadow-inner transition-colors tracking-wider focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/50 focus-visible:border-sky-400/70"
                       autocomplete="username">
              </div>
            </div>

            <!-- Input 2: Token Otorisasi Akses / PIN Presensi -->
            <div>
              <label for="input-token" class="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center justify-between">
                <span id="label-token-portal">Token Otorisasi / PIN <span class="text-rose-400">*</span></span>
                <span class="text-[10px] font-normal text-slate-400">Kredensial Sesi</span>
              </label>`;

if (!content.includes(oldTokenField)) {
  console.error('oldTokenField not found!');
  process.exit(1);
}
content = content.replace(oldTokenField, newTokenField);
console.log('✓ Added NIK input to modal-portal in index.html');

// 2. Update link-portal-absen agar memicu modal gerbang jika belum login
const oldLinkAbsen = `              <a id="link-portal-absen" href="portal-presensi.html" class="px-3.5 py-1.5 text-xs font-bold text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition shrink-0 inline-flex items-center gap-1 shadow-sm">
                <span>Buka Form &nearr;</span>
              </a>`;

const newLinkAbsen = `              <a id="link-portal-absen" href="javascript:void(0)" onclick="bukaModalPortal('absen')" class="px-3.5 py-1.5 text-xs font-bold text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition shrink-0 inline-flex items-center gap-1 shadow-sm cursor-pointer">
                <span>Buka Form &nearr;</span>
              </a>`;

if (!content.includes(oldLinkAbsen)) {
  console.error('oldLinkAbsen not found!');
  process.exit(1);
}
content = content.replace(oldLinkAbsen, newLinkAbsen);
console.log('✓ Updated link-portal-absen to trigger gate modal');

// 3. Update verifikasiTokenPortal pada index.html
const oldVerifCode = `      // 0. DETEKSI CEPAT: INPUT FORMAT NIK KARYAWAN (Contoh: NSR-2019-005)
      // Mengarahkan karyawan langsung ke Portal Presensi via Backend Proxy
      const cleanInputNik = input.toUpperCase().replace(/\\s+/g, '').replace(/_/g, '-');
      const isNikPattern = /^NSR[-_]?\\d{4}[-_]?\\d{3}$/i.test(cleanInputNik) || /^NSR-\\d{4}-\\d{3}$/i.test(cleanInputNik);

      if (isNikPattern) {
        if (errEl) errEl.classList.add('hidden');
        if (btnSubmit) {
          btnSubmit.disabled = true;
          btnSubmit.innerHTML = '<span>Memverifikasi NIK Karyawan...</span>';
        }

        try {
          let resNik = null;
          try {
            const resp = await fetch('/api/auth-nik-presensi', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
              body: JSON.stringify({ nik: cleanInputNik })
            });
            resNik = await resp.json().catch(() => null);
          } catch (_) {}

          // Fallback direct path jika rewrite engine belum aktif
          if (!resNik) {
            try {
              const respFallback = await fetch('backend/auth-nik-presensi.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify({ nik: cleanInputNik })
              });
              resNik = await respFallback.json().catch(() => null);
            } catch (_) {}
          }

          if (resNik && resNik.success && resNik.data && resNik.data.nik) {
            sessionStorage.setItem('nsr_presensi_active_nik', resNik.data.nik);
            sessionStorage.setItem('nsr_presensi_active_user', JSON.stringify(resNik.data));
            if (btnSubmit) {
              btnSubmit.innerHTML = '<span>Mengalihkan ke Portal Presensi... 🚀</span>';
            }
            window.location.href = 'portal-presensi.html?login=nik_direct';
            return;
          } else {
            if (btnSubmit) {
              btnSubmit.disabled = false;
              btnSubmit.innerHTML = '<span id="btn-submit-text">Verifikasi &amp; Masuk</span> <svg class="w-4 h-4 text-blue-200" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>';
            }
            if (errEl) errEl.classList.remove('hidden');
            if (errText) {
              errText.innerText = (resNik && resNik.message) || \`NIK [\${cleanInputNik}] tidak terdaftar dalam database master resmi KJPP NSR.\`;
            }
            inputEl.select();
            return;
          }
        } catch (errNik) {
          if (btnSubmit) {
            btnSubmit.disabled = false;
            btnSubmit.innerHTML = '<span id="btn-submit-text">Verifikasi &amp; Masuk</span> <svg class="w-4 h-4 text-blue-200" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>';
          }
          if (errEl) errEl.classList.remove('hidden');
          if (errText) errText.innerText = 'Kendala verifikasi NIK ke server. Silakan coba kembali.';
          inputEl.select();
          return;
        }
      }`;

const newVerifCode = `      // 0. GERBANG PRESENSI TERPADU (VERIFIKASI NIK + TOKEN / PIN SESSION-BOUND)
      const inputNikEl = document.getElementById('input-nik-portal');
      const inputNikVal = inputNikEl ? inputNikEl.value.trim() : '';
      const cleanInputNik = (inputNikVal || '').toUpperCase().replace(/\\s+/g, '').replace(/_/g, '-');

      if (window._targetPortal === 'absen' || cleanInputNik) {
        if (!cleanInputNik) {
          if (errEl) errEl.classList.remove('hidden');
          if (errText) errText.innerText = 'Silakan masukkan NIK Karyawan resmi Anda.';
          if (inputNikEl) inputNikEl.focus();
          return;
        }

        if (!input) {
          if (errEl) errEl.classList.remove('hidden');
          if (errText) errText.innerText = 'Silakan masukkan Token Otorisasi atau PIN Presensi Anda.';
          inputEl.focus();
          return;
        }

        if (errEl) errEl.classList.add('hidden');
        if (btnSubmit) {
          btnSubmit.disabled = true;
          btnSubmit.innerHTML = '<span>Memverifikasi Identitas &amp; Sesi Presensi...</span>';
        }

        try {
          let resGate = null;
          try {
            const resp = await fetch('backend/absensi-data-handler.php', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
              body: JSON.stringify({ action: 'verify_gate', nik: cleanInputNik, token: input }),
              credentials: 'include'
            });
            resGate = await resp.json().catch(() => null);
          } catch (_) {}

          if (!resGate) {
            try {
              const respFallback = await fetch('absensi-data-handler.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify({ action: 'verify_gate', nik: cleanInputNik, token: input }),
                credentials: 'include'
              });
              resGate = await respFallback.json().catch(() => null);
            } catch (_) {}
          }

          if (resGate && (resGate.status === 'success' || resGate.success)) {
            // Kunci NIK secara mutlak di peramban
            sessionStorage.setItem('auth_nik', resGate.nik);
            sessionStorage.setItem('nsr_presensi_active_nik', resGate.nik);
            sessionStorage.setItem('nsr_presensi_session_token', resGate.sessionToken);
            sessionStorage.setItem('NSR_AUTH_TOKEN', resGate.sessionToken);
            sessionStorage.setItem('nsr_presensi_session_nik', resGate.nik);
            sessionStorage.setItem('nsr_presensi_session_user', JSON.stringify(resGate));
            sessionStorage.setItem('nsr_presensi_active_user', JSON.stringify(resGate));

            if (btnSubmit) {
              btnSubmit.innerHTML = '<span>Identitas Terverifikasi! Mengalihkan ke Presensi... 🚀</span>';
            }
            window.location.href = 'portal-presensi.html';
            return;
          } else {
            if (btnSubmit) {
              btnSubmit.disabled = false;
              btnSubmit.innerHTML = '<span id="btn-submit-text">Verifikasi &amp; Masuk</span> <svg class="w-4 h-4 text-blue-200" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>';
            }
            if (errEl) errEl.classList.remove('hidden');
            if (errText) {
              errText.innerText = (resGate && resGate.message) || \`Kredensial atau NIK [\${cleanInputNik}] tidak cocok dengan database kepegawaian resmi KJPP NSR.\`;
            }
            inputEl.select();
            return;
          }
        } catch (errG) {
          if (btnSubmit) {
            btnSubmit.disabled = false;
            btnSubmit.innerHTML = '<span id="btn-submit-text">Verifikasi &amp; Masuk</span> <svg class="w-4 h-4 text-blue-200" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>';
          }
          if (errEl) errEl.classList.remove('hidden');
          if (errText) errText.innerText = 'Kendala verifikasi ke server presensi. Silakan coba kembali.';
          inputEl.select();
          return;
        }
      }`;

if (!content.includes(oldVerifCode)) {
  console.error('oldVerifCode not found!');
  process.exit(1);
}
content = content.replace(oldVerifCode, newVerifCode);
console.log('✓ Updated verifikasiTokenPortal in index.html to bind NIK session');

fs.writeFileSync(path, content.replace(/\n/g, '\r\n'), 'utf8');
console.log('✓ index.html successfully updated with unified gate!');
