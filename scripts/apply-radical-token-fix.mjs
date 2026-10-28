import fs from 'fs';

console.log('=== APPLYING RADICAL TOKEN MODAL & URL AUTO-BYPASS ===');

let nolap = fs.readFileSync('portal-nolap.html', 'utf8');
let lines = nolap.split('\n');

// 1. TAMBAHKAN META CACHE & SCRIPT FAILSAFE MILIDETIK PERTAMA DI <HEAD>
let headIdx = -1;
for (let i = 0; i < 50; i++) {
  if (lines[i].includes('<link rel="canonical"')) {
    headIdx = i;
    break;
  }
}

if (headIdx !== -1) {
  const failsafeHead = `  <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">
  <meta http-equiv="Pragma" content="no-cache">
  <meta http-equiv="Expires" content="0">
  <meta name="app-version" content="2026.10.25-SINGLE-TOKEN-V2">

  <script>
    /* Failsafe Milidetik Pertama: Jika URL memuat ?token=... atau sesi aktif sudah tersimpan di browser, sembunyikan modal seketika */
    (function() {
      try {
        var params = new URLSearchParams(window.location.search);
        var urlTok = params.get('token');
        var s = localStorage.getItem('NSR_USER_SESSION') || 
                sessionStorage.getItem('NSR_USER_SESSION') || 
                localStorage.getItem('nsr_nolap_session') || 
                sessionStorage.getItem('nsr_nolap_session') ||
                localStorage.getItem('NSR_AUTH_TOKEN');
        if (urlTok || s) {
          document.documentElement.classList.add('nsr-auth-passed');
        }
      } catch(e) {}
    })();
  </script>
  <style>
    html.nsr-auth-passed #box-auth-token,
    html.nsr-auth-passed [data-modal="modal-auth"],
    html.nsr-auth-passed #modal-auth {
      display: none !important;
    }
    html.nsr-auth-passed #panel-aplikasi-utama {
      display: block !important;
    }
  </style>`;
  lines.splice(headIdx + 1, 0, failsafeHead);
  console.log('✓ Head cache-busting & failsafe injected at line', headIdx + 2);
}

// Re-split lines after head injection
nolap = lines.join('\n');
lines = nolap.split('\n');

// 2. GANTI FORM 2-KOLOM LAMA MENJADI SINGLE-TOKEN INPUT FORM
let modalStart = -1;
let modalEnd = -1;
for (let i = 0; i < 200; i++) {
  if (lines[i].includes('id="box-auth-token"')) {
    modalStart = i;
  }
  if (modalStart !== -1 && lines[i].includes('<!-- AREA APLIKASI (TERBUKA SETELAH TOKEN TERVERIFIKASI) -->')) {
    modalEnd = i;
    break;
  }
}

if (modalStart !== -1 && modalEnd !== -1) {
  const newModalLines = [
    `    <!-- BOX OTENTIKASI TOKEN (JIKA BELUM LOGIN) -->`,
    `    <div id="box-auth-token" data-modal="modal-auth" class="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 max-w-lg mx-auto text-center space-y-5 shadow-2xl mb-8">`,
    `      <div class="w-14 h-14 rounded-2xl bg-amber-400/10 text-amber-400 mx-auto flex items-center justify-center border border-amber-400/20 shadow-inner">`,
    `        <svg class="w-7 h-7" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">`,
    `          <path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>`,
    `        </svg>`,
    `      </div>`,
    `      <div>`,
    `        <h2 class="text-xl font-bold text-white tracking-tight">Akses Terproteksi Sistem NoLap</h2>`,
    `        <p class="text-xs text-slate-400 mt-1">Masukkan Token Akses Resmi KJPP Nanang Rahayu Sigit Paryanto &amp; Rekan untuk membuka portal.</p>`,
    `      </div>`,
    `      <form onsubmit="loginKeServer(event)" class="space-y-4 text-left">`,
    `        <div>`,
    `          <label class="block text-xs font-bold text-slate-200 mb-1.5 uppercase tracking-wider">Masukkan Token Akses NSR</label>`,
    `          <div class="relative">`,
    `            <input type="text" id="input-token-nolap" name="token" placeholder="Contoh: NSR8899 atau NSR-KING-..." class="w-full h-12 px-4 rounded-xl bg-slate-950 border-2 border-slate-700 font-mono text-amber-400 placeholder:text-slate-600 focus:outline-none focus:border-amber-400 text-sm tracking-widest uppercase font-bold transition shadow-inner" required autocomplete="off" autofocus>`,
    `            <!-- Hidden inputs untuk kompatibilitas fallback skrip lama -->`,
    `            <input type="hidden" id="input-auth-id" value="">`,
    `            <input type="hidden" id="input-auth-pass" value="">`,
    `          </div>`,
    `        </div>`,
    `        <button type="submit" id="btn-buka-nolap" class="w-full py-3 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider transition shadow-lg shadow-amber-500/20 cursor-pointer flex items-center justify-center gap-2">`,
    `          <span id="btn-login-submit">Buka Portal NoLap &rarr;</span>`,
    `        </button>`,
    `        <p id="pesan-auth-error" class="text-xs text-rose-400 hidden font-semibold text-center"></p>`,
    `      </form>`,
    `    </div>`,
    ``
  ];
  // Replace the modal range
  lines.splice(modalStart - 1, (modalEnd - modalStart) + 1, ...newModalLines);
  console.log('✓ Modal replaced with Single-Token input form (lines', modalStart, 'to', modalEnd, ')');
}

// Re-split lines after modal replacement
nolap = lines.join('\n');
lines = nolap.split('\n');

// 3. GANTI LOGIKA JS: periksaSesiServer() & loginKeServer()
let fnStart = -1;
let fnEnd = -1;
for (let i = 14000; i < lines.length; i++) {
  if (lines[i].includes('async function periksaSesiServer() {')) {
    fnStart = i;
  }
  if (fnStart !== -1 && lines[i].includes('function inisialisasiSesiPengguna(sesi) {')) {
    fnEnd = i;
    break;
  }
}

if (fnStart !== -1 && fnEnd !== -1) {
  const newJsFunctions = [
    `    async function periksaSesiServer() {`,
    `      // 0. Auto-Bypass via Parameter URL (?token=...)`,
    `      try {`,
    `        const urlParams = new URLSearchParams(window.location.search);`,
    `        const urlToken = urlParams.get('token');`,
    `        if (urlToken && urlToken.trim()) {`,
    `          const cleanTok = urlToken.trim().toUpperCase();`,
    `          const authUrl = resolveUnifiedTokenNoLap(cleanTok);`,
    `          if (authUrl) {`,
    `            sesiAktif = {`,
    `              ...authUrl,`,
    `              sub: authUrl.token || authUrl.tokenHash,`,
    `              username: authUrl.token || authUrl.tokenHash,`,
    `              role: authUrl.role,`,
    `              cabang: authUrl.cabang || authUrl.wilayah || 'Pusat',`,
    `              label: authUrl.label || \`\${authUrl.nama || authUrl.kantor} (\${authUrl.roleLabel || authUrl.role})\`,`,
    `              nama: authUrl.nama || authUrl.namaKantor || authUrl.kantor,`,
    `              jabatan: authUrl.jabatan || authUrl.displayRole,`,
    `              token: authUrl.token || cleanTok,`,
    `              tokenHash: authUrl.tokenHash,`,
    `              valid: true`,
    `            };`,
    `            if (sesiAktif.role === 'SUPER_ADMIN' || sesiAktif.role === 'SUPER ADMIN' || sesiAktif.isSuperAdmin || sesiAktif.isKing) {`,
    `              sesiAktif.isSuperAdmin = true;`,
    `              sesiAktif.isKing = true;`,
    `              sesiAktif.role = 'SUPER ADMIN';`,
    `              sesiAktif.mode = 'PUSAT';`,
    `              sesiAktif.cabang = 'Pusat';`,
    `            }`,
    `            window.currentUser = sesiAktif;`,
    `            currentUser = sesiAktif;`,
    `            localStorage.setItem('NSR_USER_SESSION', JSON.stringify(sesiAktif));`,
    `            localStorage.setItem('nsr_nolap_session', JSON.stringify(sesiAktif));`,
    `            localStorage.setItem('NSR_AUTH_TOKEN', cleanTok);`,
    `            sessionStorage.setItem('NSR_USER_SESSION', JSON.stringify(sesiAktif));`,
    `            sessionStorage.setItem('nsr_nolap_session', JSON.stringify(sesiAktif));`,
    `            sessionStorage.setItem('NSR_AUTH_TOKEN', cleanTok);`,
    ``,
    `            document.documentElement.classList.add('nsr-auth-passed');`,
    `            const box = document.getElementById('box-auth-token');`,
    `            if (box) {`,
    `              box.style.display = 'none';`,
    `              box.classList.add('hidden');`,
    `            }`,
    `            try {`,
    `              window.history.replaceState({}, document.title, window.location.pathname);`,
    `            } catch(e) {}`,
    ``,
    `            aktifkanPanelUtama();`,
    `            inisialisasiSesiPengguna(sesiAktif);`,
    `            applyRBAC(sesiAktif);`,
    `            return;`,
    `          }`,
    `        }`,
    `      } catch (e) {`,
    `        console.warn('Gagal memproses auto-bypass parameter token:', e);`,
    `      }`,
    ``,
    `      // 1. Cek session tersimpan dari sessionStorage ATAU localStorage (Failsafe Milidetik Pertama)`,
    `      try {`,
    `        const storedKeys = [`,
    `          'NSR_USER_SESSION',`,
    `          'nsr_nolap_session',`,
    `          'kjpp_token_internal',`,
    `          'kjpp_session_jo'`,
    `        ];`,
    `        let parsed = null;`,
    `        for (const k of storedKeys) {`,
    `          const raw = sessionStorage.getItem(k) || localStorage.getItem(k);`,
    `          if (raw) {`,
    `            try {`,
    `              const obj = JSON.parse(raw);`,
    `              if (obj && typeof obj === 'object' && (obj.valid || obj.role || obj.authenticated || obj.isLoggedIn || obj.isSuperAdmin)) {`,
    `                parsed = obj;`,
    `                break;`,
    `              }`,
    `            } catch (_) {}`,
    `          }`,
    `        }`,
    ``,
    `        if (parsed) {`,
    `          if (parsed.expiresAt && Number(parsed.expiresAt) < Date.now()) {`,
    `            storedKeys.forEach(k => {`,
    `              sessionStorage.removeItem(k);`,
    `              localStorage.removeItem(k);`,
    `            });`,
    `            parsed = null;`,
    `          } else {`,
    `            const tokenRef = parsed.token || parsed.tokenHash || '';`,
    `            const auth = tokenRef ? resolveUnifiedTokenNoLap(tokenRef) : null;`,
    `            sesiAktif = {`,
    `              ...(auth || {}),`,
    `              ...parsed,`,
    `              valid: true`,
    `            };`,
    `            if (sesiAktif.role === 'SUPER_ADMIN' || sesiAktif.role === 'SUPER ADMIN' || sesiAktif.isSuperAdmin || sesiAktif.isKing) {`,
    `              sesiAktif.isSuperAdmin = true;`,
    `              sesiAktif.isKing = true;`,
    `              sesiAktif.role = 'SUPER ADMIN';`,
    `              sesiAktif.mode = 'PUSAT';`,
    `              sesiAktif.cabang = 'Pusat';`,
    `            }`,
    `            window.currentUser = sesiAktif;`,
    `            currentUser = sesiAktif;`,
    `            sessionStorage.setItem('nsr_nolap_session', JSON.stringify(sesiAktif));`,
    `            sessionStorage.setItem('NSR_USER_SESSION', JSON.stringify(sesiAktif));`,
    `            localStorage.setItem('nsr_nolap_session', JSON.stringify(sesiAktif));`,
    `            localStorage.setItem('NSR_USER_SESSION', JSON.stringify(sesiAktif));`,
    ``,
    `            document.documentElement.classList.add('nsr-auth-passed');`,
    `            const box = document.getElementById('box-auth-token');`,
    `            if (box) {`,
    `              box.style.display = 'none';`,
    `              box.classList.add('hidden');`,
    `            }`,
    `            aktifkanPanelUtama();`,
    `            inisialisasiSesiPengguna(sesiAktif);`,
    `            applyRBAC(sesiAktif);`,
    `            return;`,
    `          }`,
    `        }`,
    `      } catch (e) {`,
    `        console.warn('Gagal membaca sesi lokal SSO:', e);`,
    `      }`,
    ``,
    `      // 2. Cek token langsung di localStorage / sessionStorage`,
    `      try {`,
    `        const storedToken = sessionStorage.getItem('NSR_AUTH_TOKEN') || localStorage.getItem('NSR_AUTH_TOKEN');`,
    `        if (storedToken) {`,
    `          let cleanToken = storedToken;`,
    `          if (cleanToken.startsWith('{')) {`,
    `            try {`,
    `              const parsedT = JSON.parse(cleanToken);`,
    `              cleanToken = parsedT.token || parsedT.tokenHash || '';`,
    `            } catch(e) {}`,
    `          }`,
    `          const auth = resolveUnifiedTokenNoLap(cleanToken);`,
    `          if (auth) {`,
    `            sesiAktif = {`,
    `              ...auth,`,
    `              sub: auth.token || auth.tokenHash,`,
    `              username: auth.token || auth.tokenHash,`,
    `              role: auth.role,`,
    `              cabang: auth.cabang || auth.wilayah || 'Pusat',`,
    `              label: auth.label || \`\${auth.nama || auth.kantor} (\${auth.roleLabel || auth.role})\`,`,
    `              nama: auth.nama || auth.namaKantor || auth.kantor,`,
    `              jabatan: auth.jabatan || auth.displayRole,`,
    `              token: auth.token || auth.tokenHash,`,
    `              tokenHash: auth.tokenHash,`,
    `              valid: true`,
    `            };`,
    `            if (sesiAktif.role === 'SUPER_ADMIN' || sesiAktif.role === 'SUPER ADMIN' || sesiAktif.isSuperAdmin || sesiAktif.isKing) {`,
    `              sesiAktif.isSuperAdmin = true;`,
    `              sesiAktif.isKing = true;`,
    `              sesiAktif.role = 'SUPER ADMIN';`,
    `              sesiAktif.mode = 'PUSAT';`,
    `              sesiAktif.cabang = 'Pusat';`,
    `            }`,
    `            sessionStorage.setItem('nsr_nolap_session', JSON.stringify(sesiAktif));`,
    `            sessionStorage.setItem('NSR_USER_SESSION', JSON.stringify(sesiAktif));`,
    `            localStorage.setItem('nsr_nolap_session', JSON.stringify(sesiAktif));`,
    `            localStorage.setItem('NSR_USER_SESSION', JSON.stringify(sesiAktif));`,
    ``,
    `            document.documentElement.classList.add('nsr-auth-passed');`,
    `            const box = document.getElementById('box-auth-token');`,
    `            if (box) {`,
    `              box.style.display = 'none';`,
    `              box.classList.add('hidden');`,
    `            }`,
    `            aktifkanPanelUtama();`,
    `            inisialisasiSesiPengguna(sesiAktif);`,
    `            applyRBAC(sesiAktif);`,
    `            return;`,
    `          }`,
    `        }`,
    `      } catch (e) {}`,
    ``,
    `      // Jika belum login sama sekali:`,
    `      sesiAktif = null;`,
    `      document.documentElement.classList.remove('nsr-auth-passed');`,
    `      const box = document.getElementById('box-auth-token');`,
    `      if (box) {`,
    `        box.style.display = 'block';`,
    `        box.classList.remove('hidden');`,
    `      }`,
    `      document.getElementById('panel-aplikasi-utama').classList.add('hidden');`,
    `    }`,
    ``,
    `    async function loginKeServer(event) {`,
    `      if (event) event.preventDefault();`,
    `      const inpToken = document.getElementById('input-token-nolap');`,
    `      const inpId = document.getElementById('input-auth-id');`,
    `      const inpPass = document.getElementById('input-auth-pass');`,
    `      const errorEl = document.getElementById('pesan-auth-error');`,
    `      const btnSubmit = document.getElementById('btn-buka-nolap') || document.getElementById('btn-login-submit');`,
    ``,
    `      const rawVal = (inpToken ? inpToken.value : '') || (inpId ? inpId.value : '') || (inpPass ? inpPass.value : '');`,
    `      const token = rawVal.trim().toUpperCase();`,
    ``,
    `      if (!token) {`,
    `        if (errorEl) {`,
    `          errorEl.innerText = 'Masukkan Token Akses NSR Anda.';`,
    `          errorEl.classList.remove('hidden');`,
    `        }`,
    `        return;`,
    `      }`,
    ``,
    `      if (btnSubmit) {`,
    `        btnSubmit.disabled = true;`,
    `        btnSubmit.innerHTML = '<span>Memverifikasi Token...</span>';`,
    `      }`,
    `      if (errorEl) errorEl.classList.add('hidden');`,
    ``,
    `      // 1. Verifikasi langsung dengan Unified Token Resolver`,
    `      const tokenAuth = resolveUnifiedTokenNoLap(token);`,
    `      if (tokenAuth) {`,
    `        sesiAktif = {`,
    `          ...tokenAuth,`,
    `          sub: tokenAuth.token || tokenAuth.tokenHash,`,
    `          username: tokenAuth.token || tokenAuth.tokenHash,`,
    `          role: tokenAuth.role,`,
    `          cabang: tokenAuth.cabang || tokenAuth.wilayah || 'Pusat',`,
    `          label: tokenAuth.label || \`\${tokenAuth.nama || tokenAuth.kantor} (\${tokenAuth.roleLabel || tokenAuth.role})\`,`,
    `          nama: tokenAuth.nama || tokenAuth.namaKantor || tokenAuth.kantor,`,
    `          jabatan: tokenAuth.jabatan || tokenAuth.displayRole,`,
    `          token: tokenAuth.token || token,`,
    `          tokenHash: tokenAuth.tokenHash,`,
    `          valid: true`,
    `        };`,
    `        if (sesiAktif.role === 'SUPER_ADMIN' || sesiAktif.role === 'SUPER ADMIN' || sesiAktif.isSuperAdmin || sesiAktif.isKing) {`,
    `          sesiAktif.isSuperAdmin = true;`,
    `          sesiAktif.isKing = true;`,
    `          sesiAktif.role = 'SUPER ADMIN';`,
    `          sesiAktif.mode = 'PUSAT';`,
    `          sesiAktif.cabang = 'Pusat';`,
    `        }`,
    `        window.currentUser = sesiAktif;`,
    `        currentUser = sesiAktif;`,
    ``,
    `        localStorage.setItem('NSR_USER_SESSION', JSON.stringify(sesiAktif));`,
    `        localStorage.setItem('nsr_nolap_session', JSON.stringify(sesiAktif));`,
    `        localStorage.setItem('NSR_AUTH_TOKEN', token);`,
    `        sessionStorage.setItem('NSR_USER_SESSION', JSON.stringify(sesiAktif));`,
    `        sessionStorage.setItem('nsr_nolap_session', JSON.stringify(sesiAktif));`,
    `        sessionStorage.setItem('NSR_AUTH_TOKEN', token);`,
    ``,
    `        document.documentElement.classList.add('nsr-auth-passed');`,
    `        const box = document.getElementById('box-auth-token');`,
    `        if (box) {`,
    `          box.style.display = 'none';`,
    `          box.classList.add('hidden');`,
    `        }`,
    `        aktifkanPanelUtama();`,
    `        inisialisasiSesiPengguna(sesiAktif);`,
    `        applyRBAC(sesiAktif);`,
    `        return;`,
    `      }`,
    ``,
    `      // 2. Fallback verifikasi ke backend server`,
    `      try {`,
    `        const res = await fetch('nolap-data-handler.php?action=verifyPengesahKing', {`,
    `          method: 'POST',`,
    `          headers: { 'Content-Type': 'application/json' },`,
    `          body: JSON.stringify({ credential: token, operator: 'NANANG' })`,
    `        });`,
    `        const resJson = await res.json();`,
    `        if (res.ok && resJson.success && resJson.verified) {`,
    `          const kingAuth = resolveUnifiedTokenNoLap('NSR8899');`,
    `          sesiAktif = { ...kingAuth, valid: true, isSuperAdmin: true, isKing: true };`,
    `          window.currentUser = sesiAktif;`,
    `          currentUser = sesiAktif;`,
    `          localStorage.setItem('NSR_USER_SESSION', JSON.stringify(sesiAktif));`,
    `          localStorage.setItem('nsr_nolap_session', JSON.stringify(sesiAktif));`,
    `          sessionStorage.setItem('NSR_USER_SESSION', JSON.stringify(sesiAktif));`,
    `          sessionStorage.setItem('nsr_nolap_session', JSON.stringify(sesiAktif));`,
    ``,
    `          document.documentElement.classList.add('nsr-auth-passed');`,
    `          const box = document.getElementById('box-auth-token');`,
    `          if (box) {`,
    `            box.style.display = 'none';`,
    `            box.classList.add('hidden');`,
    `          }`,
    `          aktifkanPanelUtama();`,
    `          inisialisasiSesiPengguna(sesiAktif);`,
    `          applyRBAC(sesiAktif);`,
    `          return;`,
    `        }`,
    `      } catch (err) {}`,
    ``,
    `      // Jika tidak valid`,
    `      if (btnSubmit) {`,
    `        btnSubmit.disabled = false`,
    `        btnSubmit.innerHTML = '<span>Buka Portal NoLap &rarr;</span>';`,
    `      }`,
    `      if (errorEl) {`,
    `        errorEl.innerText = 'Token tidak valid atau tidak memiliki hak akses Portal NoLap.';`,
    `        errorEl.classList.remove('hidden');`,
    `      }`,
    `    }`,
    ``
  ];

  lines.splice(fnStart, (fnEnd - fnStart), ...newJsFunctions);
  console.log('✓ Functions periksaSesiServer & loginKeServer replaced successfully at line', fnStart);
}

// 4. UPDATE aktifkanPanelUtama() untuk memastikan documentElement dan style.display diatur seketika
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('document.getElementById(\'box-auth-token\').classList.add(\'hidden\');')) {
    lines.splice(i + 1, 0, 
      `      document.documentElement.classList.add('nsr-auth-passed');`,
      `      const _boxAuth = document.getElementById('box-auth-token');`,
      `      if (_boxAuth) _boxAuth.style.display = 'none';`
    );
    console.log('✓ aktifkanPanelUtama reinforced with instant hide at line', i + 1);
    break;
  }
}

// 5. UPDATE keluarSesi() untuk membersihkan seluruh storage
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('async function keluarSesi() {')) {
    // find sessionStorage.removeItem('nsr_nolap_session')
    for (let j = i; j < i + 30; j++) {
      if (lines[j].includes("sessionStorage.removeItem('nsr_nolap_session');")) {
        lines.splice(j + 1, 0,
          `      sessionStorage.removeItem('NSR_USER_SESSION');`,
          `      sessionStorage.removeItem('kjpp_token_internal');`,
          `      sessionStorage.removeItem('kjpp_session_jo');`,
          `      sessionStorage.removeItem('NSR_AUTH_TOKEN');`,
          `      localStorage.removeItem('nsr_nolap_session');`,
          `      localStorage.removeItem('NSR_USER_SESSION');`,
          `      localStorage.removeItem('kjpp_token_internal');`,
          `      localStorage.removeItem('kjpp_session_jo');`,
          `      localStorage.removeItem('NSR_AUTH_TOKEN');`,
          `      document.documentElement.classList.remove('nsr-auth-passed');`,
          `      const _boxLg = document.getElementById('box-auth-token');`,
          `      if (_boxLg) _boxLg.style.display = 'block';`
        );
        console.log('✓ keluarSesi reinforced with comprehensive storage purge at line', j + 1);
        break;
      }
    }
    break;
  }
}

fs.writeFileSync('portal-nolap.html', lines.join('\n'), 'utf8');
console.log('✓ portal-nolap.html saved with total lines:', lines.length);

// 6. UPDATE NOLAP-DATA-HANDLER.PHP
let php = fs.readFileSync('nolap-data-handler.php', 'utf8');
const actionTarget = `    if ($action === 'submitRegistrasiPersonel') {`;
const newActionCode = `    if ($action === 'verifyToken') {
        echo json_encode([
            'success'       => true,
            'authenticated' => true,
            'user'          => $currentUser,
            'role'          => $currentUser['role'] ?? '',
            'isKing'        => !empty($currentUser['isKing']),
            'isSuperAdmin'  => !empty($currentUser['isSuperAdmin'])
        ]);
        exit;
    }

    if ($action === 'submitRegistrasiPersonel') {`;

if (!php.includes("if ($action === 'verifyToken')") && php.includes(actionTarget)) {
  php = php.replace(actionTarget, newActionCode);
  fs.writeFileSync('nolap-data-handler.php', php, 'utf8');
  console.log('✓ nolap-data-handler.php verifyToken endpoint added');
}
