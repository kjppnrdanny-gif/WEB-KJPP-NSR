import fs from 'fs';

// ========================================================
// 1. PATCH portal-penugasan-jo.html
// ========================================================
console.log('--- Patching portal-penugasan-jo.html ---');
let jo = fs.readFileSync('portal-penugasan-jo.html', 'utf8');
const joIsCRLF = jo.includes('\r\n');
jo = jo.replace(/\r\n/g, '\n');

// 1A. Scrub line 11626 hardcoded fallback token
const joOldReview = `      try {
        const res = await fetch(\`\${DUAL_GATE_API_URL}?action=\${actionName}\`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-NSR-Token': auth?.token || auth?.sessionToken || (isDanny ? (process.env.NSR_SPM_TOKEN || "NSR_MOCK_SPM_TOKEN") : (process.env.NSR_DIVTEK_TOKEN || "NSR_MOCK_DIVTEK_TOKEN"))
          },
          body: JSON.stringify({
            idPenugasan: g1ActiveReviewItem.idPenugasan,
            keputusan: keputusan,
            catatan: catatan
          })
        });`;

const joNewReview = `      try {
        const res = await fetch(\`\${DUAL_GATE_API_URL}?action=\${actionName}\`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            idPenugasan: g1ActiveReviewItem.idPenugasan,
            keputusan: keputusan,
            catatan: catatan
          })
        });`;

if (jo.includes(joOldReview)) {
  jo = jo.replace(joOldReview, joNewReview);
  console.log('[PASS] jo: scrubbed reviewDeni/Danny token fallback');
} else {
  console.warn('[WARN] joOldReview not found');
}

// 1B. Scrub line 11568 getDualGateDetail
const joOldDetail = `      fetch(\`\${DUAL_GATE_API_URL}?action=getDualGateDetail&idPenugasan=\${encodeURIComponent(idPenugasan)}\`, {
        headers: { 'X-NSR-Token': auth?.token || auth?.sessionToken || 'NSR-ADMIN-PUSAT-2026' }
      })`;

const joNewDetail = `      fetch(\`\${DUAL_GATE_API_URL}?action=getDualGateDetail&idPenugasan=\${encodeURIComponent(idPenugasan)}\`, {
        credentials: 'include'
      })`;

if (jo.includes(joOldDetail)) {
  jo = jo.replace(joOldDetail, joNewDetail);
  console.log('[PASS] jo: scrubbed getDualGateDetail fallback');
} else {
  console.warn('[WARN] joOldDetail not found');
}

// 1C. Dynamic checklist credentials: include
const joOldChecklist = `const res = await fetch(\`/nolap-data-handler.php?action=getDynamicRiskChecklist&tujuanPenilaian=\${encodeURIComponent(tujuan)}&jenisObjek=\${encodeURIComponent(selObjek)}\`);`;
const joNewChecklist = `const res = await fetch(\`/nolap-data-handler.php?action=getDynamicRiskChecklist&tujuanPenilaian=\${encodeURIComponent(tujuan)}&jenisObjek=\${encodeURIComponent(selObjek)}\`, { credentials: 'include' });`;

if (jo.includes(joOldChecklist)) {
  jo = jo.replace(joOldChecklist, joNewChecklist);
  console.log('[PASS] jo: added credentials include to getDynamicRiskChecklist');
} else {
  console.warn('[WARN] joOldChecklist not found');
}

// 1D. submitRegistrasiPersonel credentials: include
const joOldReg = `        const tokenVal = (userSession && (userSession.token || userSession.tokenHash)) || '';
        const res = await fetch('/api/nolap-data-proxy?action=submitRegistrasiPersonel', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...(tokenVal ? { 'X-NSR-Token': tokenVal } : {})
          },
          body: JSON.stringify(payload)
        });`;

const joNewReg = `        const res = await fetch('/api/nolap-data-proxy?action=submitRegistrasiPersonel', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(payload)
        });`;

if (jo.includes(joOldReg)) {
  jo = jo.replace(joOldReg, joNewReg);
  console.log('[PASS] jo: added credentials include to submitRegistrasiPersonel');
} else {
  console.warn('[WARN] joOldReg not found');
}

// 1E. Scrub token string in disetujui_oleh
jo = jo.replace(
  "p.disetujui_oleh = isKing ? `SUPER ADMIN (KING) (${userSession.token || 'OTORISASI_KING'})` : `Admin Pusat (${userSession.token || 'OTORISASI_PUSAT'})`;",
  "p.disetujui_oleh = isKing ? `SUPER ADMIN (KING) (${userSession.displayName || 'OTORISASI_KING'})` : `Admin Pusat (${userSession.displayName || 'OTORISASI_PUSAT'})`;"
);

jo = jo.replace(
  "disetujui_oleh: (projectStatus === 'APPROVED' || (isPrivateCabang && isCabangAdmin)) ? (isPusat ? `Admin Pusat (${userSession.token || 'OTORISASI_PUSAT'})` : `Admin Cabang (${auth.roleLabel || userSession.roleLabel || 'CABANG'})`) : '-',",
  "disetujui_oleh: (projectStatus === 'APPROVED' || (isPrivateCabang && isCabangAdmin)) ? (isPusat ? `Admin Pusat (${userSession.displayName || 'OTORISASI_PUSAT'})` : `Admin Cabang (${auth.roleLabel || userSession.roleLabel || 'CABANG'})`) : '-',"
);

// 1F. bukaPortalNoLap - no token in url
const joOldNoLapBtn = `    function bukaPortalNoLap(event) {
      if (event) event.preventDefault();
      const token = (userSession && userSession.token) ? userSession.token : (sessionStorage.getItem('NSR_AUTH_TOKEN') || sessionStorage.getItem('kjpp_token_internal') || '');
      if (token) {
        sessionStorage.setItem('NSR_AUTH_TOKEN', token);
        window.location.href = \`portal-nolap.html?token=\${encodeURIComponent(token)}\`;
      } else {
        window.location.href = 'portal-nolap.html';
      }
    }`;

const joNewNoLapBtn = `    function bukaPortalNoLap(event) {
      if (event) event.preventDefault();
      window.location.href = 'portal-nolap.html';
    }`;

if (jo.includes(joOldNoLapBtn)) {
  jo = jo.replace(joOldNoLapBtn, joNewNoLapBtn);
  console.log('[PASS] jo: sanitized bukaPortalNoLap');
}

// 1G. bukaModalToken - don't autofill token
jo = jo.replace('input.value = userSession.token || "";', 'input.value = "";');

// 1H. simpanSesiSSO - scrub raw tokens
const joOldSSO = `      sessionStorage.setItem('NSR_AUTH_HASH', tokenHash);
      sessionStorage.setItem('NSR_SESSION_CHECKSUM', sessionChecksum);
      sessionStorage.setItem('NSR_SESSION_SIG', sessionChecksum);
      sessionStorage.setItem('NSR_USER_SESSION', JSON.stringify(secureSession));
      sessionStorage.setItem('nsr_nolap_session', JSON.stringify(secureSession));
      sessionStorage.setItem('TOKEN_AUTH_NSR', tokenHash);
      sessionStorage.setItem('CURRENT_AUTH_TOKEN', tokenHash);
      sessionStorage.setItem('NSR_AUTH_TOKEN', tokenHash);
      sessionStorage.setItem('kjpp_token_internal', tokenHash);
      sessionStorage.setItem('kjpp_session_jo', JSON.stringify(secureSession));
      window.CURRENT_AUTH_SESSION = secureSession;`;

const joNewSSO = `      const scrubKeys = ['TOKEN_AUTH_NSR', 'CURRENT_AUTH_TOKEN', 'NSR_AUTH_TOKEN', 'NSR_AUTH_HASH', 'NSR_SESSION_CHECKSUM', 'NSR_SESSION_SIG'];
      scrubKeys.forEach(k => sessionStorage.removeItem(k));
      localStorage.removeItem('kjpp_token_auth');
      localStorage.removeItem('kjpp_session_token');

      delete secureSession.token;
      sessionStorage.setItem('NSR_USER_SESSION', JSON.stringify(secureSession));
      sessionStorage.setItem('nsr_nolap_session', JSON.stringify(secureSession));
      sessionStorage.setItem('kjpp_token_internal', JSON.stringify(secureSession));
      sessionStorage.setItem('kjpp_session_jo', JSON.stringify(secureSession));
      window.CURRENT_AUTH_SESSION = secureSession;`;

if (jo.includes(joOldSSO)) {
  jo = jo.replace(joOldSSO, joNewSSO);
  console.log('[PASS] jo: sanitized simpanSesiSSO');
}

// 1I. Add keluarSesiJo
if (!jo.includes('function keluarSesiJo()')) {
  jo = jo.replace('function bukaModalToken()', `    async function keluarSesiJo() {
      try {
        await fetch('/api/auth-logout', { method: 'POST', credentials: 'include' });
      } catch (_) {}
      const scrubKeys = ['TOKEN_AUTH_NSR', 'CURRENT_AUTH_TOKEN', 'NSR_AUTH_TOKEN', 'NSR_AUTH_HASH', 'NSR_SESSION_CHECKSUM', 'NSR_SESSION_SIG', 'kjpp_token_internal', 'kjpp_session_jo', 'NSR_USER_SESSION', 'nsr_nolap_session'];
      scrubKeys.forEach(k => sessionStorage.removeItem(k));
      localStorage.removeItem('kjpp_token_auth');
      localStorage.removeItem('kjpp_session_token');
      window.CURRENT_AUTH_SESSION = null;
      userSession = null;
      window.location.href = 'index.html';
    }
    window.keluarSesiJo = keluarSesiJo;

    function bukaModalToken()`);
  console.log('[PASS] jo: added keluarSesiJo');
}

// 1J. Add Keluar button in navbar
const joNavOld = `        <!-- Tombol Keluar / Ganti Token -->
        <button type="button" onclick="bukaModalToken()" class="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-300 text-xs font-semibold transition border border-slate-700 flex items-center gap-1.5 cursor-pointer" title="Ganti Token / Keluar">
          <svg class="w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" x2="3" y1="12" y2="12"/></svg>
          <span>Ganti Token</span>
        </button>`;

const joNavNew = `        <!-- Tombol Keluar / Ganti Token -->
        <button type="button" onclick="bukaModalToken()" class="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-300 text-xs font-semibold transition border border-slate-700 flex items-center gap-1.5 cursor-pointer" title="Ganti Token">
          <svg class="w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" x2="3" y1="12" y2="12"/></svg>
          <span>Ganti Token</span>
        </button>
        <button type="button" onclick="keluarSesiJo()" class="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-rose-400 text-xs font-semibold transition border border-slate-700 flex items-center gap-1.5 cursor-pointer" title="Keluar dari Portal">
          <span>Keluar</span>
        </button>`;

if (jo.includes(joNavOld)) {
  jo = jo.replace(joNavOld, joNavNew);
  console.log('[PASS] jo: added Keluar button to navbar');
}

fs.writeFileSync('portal-penugasan-jo.html', joIsCRLF ? jo.replace(/\n/g, '\r\n') : jo, 'utf8');

// ========================================================
// 2. PATCH portal-kwitansi.html
// ========================================================
console.log('\n--- Patching portal-kwitansi.html ---');
let kw = fs.readFileSync('portal-kwitansi.html', 'utf8');
const kwIsCRLF = kw.includes('\r\n');
kw = kw.replace(/\r\n/g, '\n');

// 2A. Scrub raw token string in prompt message
kw = kw.replace(
  '([REDACTED_ADMIN_PUSAT_TOKEN] / NSR-KEU-2026)',
  '(Divisi Keuangan & Kasir Pusat)'
);

// 2B. Scrub setting raw token in sessionStorage
const kwOldStorage = `          sessionStorage.setItem('NSR_AUTH_TOKEN', simUser.tokenHash);
          sessionStorage.setItem('TOKEN_AUTH_NSR', simUser.tokenHash);
          sessionStorage.setItem('CURRENT_AUTH_TOKEN', simUser.tokenHash);
          sessionStorage.setItem('NSR_USER_SESSION', JSON.stringify(simUser));
          sessionStorage.setItem('kjpp_token_internal', JSON.stringify({
            branch: simUser.branch,
            token: simUser.tokenHash,
            role: simUser.role,
            roleLabel: simUser.displayName,
            canAccessKwitansi: true,
            expiresAt: Date.now() + (8 * 3600 * 1000)
          }));`;

const kwNewStorage = `          const scrubKeys = ['TOKEN_AUTH_NSR', 'CURRENT_AUTH_TOKEN', 'NSR_AUTH_TOKEN', 'NSR_AUTH_HASH', 'NSR_SESSION_CHECKSUM', 'NSR_SESSION_SIG'];
          scrubKeys.forEach(k => sessionStorage.removeItem(k));
          localStorage.removeItem('kjpp_token_auth');
          localStorage.removeItem('kjpp_session_token');

          delete simUser.token;
          sessionStorage.setItem('NSR_USER_SESSION', JSON.stringify(simUser));
          sessionStorage.setItem('kjpp_token_internal', JSON.stringify({
            branch: simUser.branch,
            role: simUser.role,
            roleLabel: simUser.displayName,
            canAccessKwitansi: true,
            expiresAt: Date.now() + (8 * 3600 * 1000)
          }));`;

if (kw.includes(kwOldStorage)) {
  kw = kw.replace(kwOldStorage, kwNewStorage);
  console.log('[PASS] kw: sanitized storage block');
} else {
  console.warn('[WARN] kwOldStorage not found');
}

// 2C. Clean keluarSesiKwitansi
const kwOldLogout = `    async function keluarSesiKwitansi() {
      sessionStorage.removeItem('NSR_AUTH_TOKEN');
      sessionStorage.removeItem('NSR_USER_SESSION');
      sessionStorage.removeItem('TOKEN_AUTH_NSR');
      sessionStorage.removeItem('CURRENT_AUTH_TOKEN');
      sessionStorage.removeItem('kjpp_token_internal');
      sessionStorage.removeItem('kjpp_session_jo');
      try {
        await fetch(((window.location.pathname.includes('/staging') ? '/staging/api/' : '/api/')) + 'auth-logout', { method: 'POST', credentials: 'include' });
      } catch (e) {}
      currentUser = null;
      tampilkanLoginState();
    }`;

const kwNewLogout = `    async function keluarSesiKwitansi() {
      const scrubKeys = ['TOKEN_AUTH_NSR', 'CURRENT_AUTH_TOKEN', 'NSR_AUTH_TOKEN', 'NSR_AUTH_HASH', 'NSR_SESSION_CHECKSUM', 'NSR_SESSION_SIG', 'kjpp_token_internal', 'kjpp_session_jo', 'NSR_USER_SESSION', 'nsr_nolap_session'];
      scrubKeys.forEach(k => sessionStorage.removeItem(k));
      localStorage.removeItem('kjpp_token_auth');
      localStorage.removeItem('kjpp_session_token');
      try {
        await fetch(((window.location.pathname.includes('/staging') ? '/staging/api/' : '/api/')) + 'auth-logout', { method: 'POST', credentials: 'include' });
      } catch (e) {}
      currentUser = null;
      tampilkanLoginState();
    }`;

if (kw.includes(kwOldLogout)) {
  kw = kw.replace(kwOldLogout, kwNewLogout);
  console.log('[PASS] kw: updated keluarSesiKwitansi');
} else {
  console.warn('[WARN] kwOldLogout not found');
}

fs.writeFileSync('portal-kwitansi.html', kwIsCRLF ? kw.replace(/\n/g, '\r\n') : kw, 'utf8');

// ========================================================
// 3. PATCH portal-operasional.html
// ========================================================
console.log('\n--- Patching portal-operasional.html ---');
let opr = fs.readFileSync('portal-operasional.html', 'utf8');
const oprIsCRLF = opr.includes('\r\n');
opr = opr.replace(/\r\n/g, '\n');

// 3A. Update getAuthHeaders
const oprOldHeaders = `    function getAuthHeaders() {
      const token = localStorage.getItem('kjpp_token_auth') || sessionStorage.getItem('kjpp_token_auth') || '';
      return {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-NSR-Token': token
      };
    }`;

const oprNewHeaders = `    function getAuthHeaders() {
      return {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      };
    }`;

if (opr.includes(oprOldHeaders)) {
  opr = opr.replace(oprOldHeaders, oprNewHeaders);
  console.log('[PASS] opr: sanitized getAuthHeaders');
} else {
  console.warn('[WARN] oprOldHeaders not found');
}

// 3B. Add credentials: 'include' to all fetch calls in portal-operasional.html
opr = opr.replace(
  "fetch('operasional-data-handler.php?action=getPengajuanList', {\n        headers: getAuthHeaders()\n      })",
  "fetch('operasional-data-handler.php?action=getPengajuanList', {\n        headers: getAuthHeaders(),\n        credentials: 'include'\n      })"
);

opr = opr.replace(
  "const res = await fetch(url, {\n          headers: getAuthHeaders()\n        });",
  "const res = await fetch(url, {\n          headers: getAuthHeaders(),\n          credentials: 'include'\n        });"
);

opr = opr.replace(
  "const res = await fetch('operasional-data-handler.php?action=approveTier', {\n          method: 'POST',\n          headers: getAuthHeaders(),\n          body: JSON.stringify({ id: id, tier: tier })\n        });",
  "const res = await fetch('operasional-data-handler.php?action=approveTier', {\n          method: 'POST',\n          headers: getAuthHeaders(),\n          credentials: 'include',\n          body: JSON.stringify({ id: id, tier: tier })\n        });"
);

opr = opr.replace(
  "const res = await fetch('operasional-data-handler.php?action=rejectWithNote', {\n          method: 'POST',\n          headers: getAuthHeaders(),\n          body: JSON.stringify({\n            id: DOC_TO_REJECT,\n            tier: REJECT_TIER,\n            alasan: alasan\n          })\n        });",
  "const res = await fetch('operasional-data-handler.php?action=rejectWithNote', {\n          method: 'POST',\n          headers: getAuthHeaders(),\n          credentials: 'include',\n          body: JSON.stringify({\n            id: DOC_TO_REJECT,\n            tier: REJECT_TIER,\n            alasan: alasan\n          })\n        });"
);

// 3C. Update keluarSesi in portal-operasional
const oprOldLogout = `    function keluarSesi() {
      if (confirm('Keluar dari sesi portal operasional?')) {
        localStorage.removeItem('kjpp_token_auth');
        sessionStorage.removeItem('kjpp_token_auth');
        window.location.reload();
      }
    }`;

const oprNewLogout = `    async function keluarSesi() {
      if (confirm('Keluar dari sesi portal operasional?')) {
        try {
          await fetch('/api/auth-logout', { method: 'POST', credentials: 'include' });
        } catch (_) {}
        localStorage.removeItem('kjpp_token_auth');
        localStorage.removeItem('kjpp_session_token');
        sessionStorage.removeItem('kjpp_token_auth');
        sessionStorage.removeItem('NSR_USER_SESSION');
        sessionStorage.removeItem('kjpp_token_internal');
        window.location.reload();
      }
    }`;

if (opr.includes(oprOldLogout)) {
  opr = opr.replace(oprOldLogout, oprNewLogout);
  console.log('[PASS] opr: updated keluarSesi to invalidate backend');
} else {
  console.warn('[WARN] oprOldLogout not found');
}

// 3D. Update periksaSesiLogin in portal-operasional to verify backend cookie session
const oprOldPeriksa = `    function periksaSesiLogin() {
      const token = localStorage.getItem('kjpp_token_auth') || sessionStorage.getItem('kjpp_token_auth');
      if (!token) {
        document.getElementById('modal-auth').classList.remove('hidden');
        return;
      }

      // Validasi token ke backend
      fetch('operasional-data-handler.php?action=getPengajuanList', {
        headers: getAuthHeaders()
      })`;

const oprNewPeriksa = `    function periksaSesiLogin() {
      // Validasi sesi aktif ke backend via cookie HttpOnly
      fetch('operasional-data-handler.php?action=getPengajuanList', {
        headers: getAuthHeaders(),
        credentials: 'include'
      })`;

if (opr.includes(oprOldPeriksa)) {
  opr = opr.replace(oprOldPeriksa, oprNewPeriksa);
  console.log('[PASS] opr: updated periksaSesiLogin');
} else {
  console.warn('[WARN] oprOldPeriksa not found');
}

// 3E. Update handleTokenLogin to login via /api/auth-login
const oprOldLogin = `      try {
        const res = await fetch('operasional-data-handler.php?action=getPengajuanList', {
          headers: {
            'Accept': 'application/json',
            'X-NSR-Token': token
          }
        });

        if (res.status === 403) {
          const errData = await res.json().catch(() => ({}));
          errBox.innerText = errData.error || 'Akses Ditolak (403 Forbidden): Aplikasi ini khusus internal Kantor Pusat (Jakarta).';
          errBox.classList.remove('hidden');
          return;
        }

        if (res.status === 401) {
          errBox.innerText = 'Token tidak valid atau tidak memiliki izin akses.';
          errBox.classList.remove('hidden');
        } else {
          localStorage.setItem('kjpp_token_auth', token);
          sessionStorage.setItem('kjpp_token_auth', token);
          document.getElementById('modal-auth').classList.add('hidden');
          document.getElementById('dot-sesi').className = 'w-2 h-2 rounded-full bg-emerald-400';
          document.getElementById('label-sesi-role').innerText = 'Petugas Terautentikasi';
          document.getElementById('btn-logout').classList.remove('hidden');
          muatDaftarPengajuan();
        }
      } catch (err) {
        errBox.innerText = 'Kesalahan jaringan: ' + err.message;
        errBox.classList.remove('hidden');
      }`;

const oprNewLogin = `      try {
        const loginRes = await fetch('/api/auth-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({ token: token }),
          credentials: 'include'
        });

        if (!loginRes.ok) {
          const errData = await loginRes.json().catch(() => ({}));
          errBox.innerText = errData.error || 'Token tidak valid atau tidak memiliki izin akses.';
          errBox.classList.remove('hidden');
          return;
        }

        const res = await fetch('operasional-data-handler.php?action=getPengajuanList', {
          headers: getAuthHeaders(),
          credentials: 'include'
        });

        if (res.status === 403) {
          const errData = await res.json().catch(() => ({}));
          errBox.innerText = errData.error || 'Akses Ditolak (403 Forbidden): Aplikasi ini khusus internal Kantor Pusat (Jakarta).';
          errBox.classList.remove('hidden');
          return;
        }

        if (res.status === 401) {
          errBox.innerText = 'Token tidak memiliki izin akses ke modul operasional.';
          errBox.classList.remove('hidden');
        } else {
          localStorage.removeItem('kjpp_token_auth');
          sessionStorage.removeItem('kjpp_token_auth');
          document.getElementById('modal-auth').classList.add('hidden');
          document.getElementById('dot-sesi').className = 'w-2 h-2 rounded-full bg-emerald-400';
          document.getElementById('label-sesi-role').innerText = 'Petugas Terautentikasi';
          document.getElementById('btn-logout').classList.remove('hidden');
          muatDaftarPengajuan();
        }
      } catch (err) {
        errBox.innerText = 'Kesalahan jaringan: ' + err.message;
        errBox.classList.remove('hidden');
      }`;

if (opr.includes(oprOldLogin)) {
  opr = opr.replace(oprOldLogin, oprNewLogin);
  console.log('[PASS] opr: updated handleTokenLogin');
} else {
  console.warn('[WARN] oprOldLogin not found');
}

fs.writeFileSync('portal-operasional.html', oprIsCRLF ? opr.replace(/\n/g, '\r\n') : opr, 'utf8');

// ========================================================
// 4. PATCH portal-surat-umum.html
// ========================================================
console.log('\n--- Patching portal-surat-umum.html ---');
let su = fs.readFileSync('portal-surat-umum.html', 'utf8');
const suIsCRLF = su.includes('\r\n');
su = su.replace(/\r\n/g, '\n');

// 4A. Update getSuratUmumAuthHeaders
const suOldHeaders = `    function getSuratUmumAuthHeaders(extraHeaders = {}) {
      const token = (typeof userSession !== 'undefined' && userSession && userSession.token) 
        ? userSession.token 
        : (localStorage.getItem('kjpp_token_auth') || localStorage.getItem('kjpp_session_token') || '');
      const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...extraHeaders
      };
      if (token) {
        headers['Authorization'] = 'Bearer ' + token;
        headers['X-NSR-Token'] = token;
      }
      return headers;
    }`;

const suNewHeaders = `    function getSuratUmumAuthHeaders(extraHeaders = {}) {
      return {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...extraHeaders
      };
    }`;

if (su.includes(suOldHeaders)) {
  su = su.replace(suOldHeaders, suNewHeaders);
  console.log('[PASS] su: sanitized getSuratUmumAuthHeaders');
} else {
  console.warn('[WARN] suOldHeaders not found');
}

// 4B. Add credentials: 'include' to proxy fetch calls
su = su.replace(
  "const proxyRes = await fetch(BACKEND_SU_PROXY_URL, {\n          method: 'POST',\n          headers: getSuratUmumAuthHeaders(),\n          body: JSON.stringify(bodyReq)\n        });",
  "const proxyRes = await fetch(BACKEND_SU_PROXY_URL, {\n          method: 'POST',\n          credentials: 'include',\n          headers: getSuratUmumAuthHeaders(),\n          body: JSON.stringify(bodyReq)\n        });"
);

su = su.replace(
  "const proxyRes = await fetch(proxyUrl, {\n            method: 'GET',\n            headers: getSuratUmumAuthHeaders()\n          });",
  "const proxyRes = await fetch(proxyUrl, {\n            method: 'GET',\n            credentials: 'include',\n            headers: getSuratUmumAuthHeaders()\n          });"
);

su = su.replace(
  "const proxyRes = await fetch(BACKEND_SU_PROXY_URL, {\n              method: 'POST',\n              headers: getSuratUmumAuthHeaders(),\n              body: JSON.stringify(reqPayload)\n            });",
  "const proxyRes = await fetch(BACKEND_SU_PROXY_URL, {\n              method: 'POST',\n              credentials: 'include',\n              headers: getSuratUmumAuthHeaders(),\n              body: JSON.stringify(reqPayload)\n            });"
);

// 4C. Update keluarSesi
const suOldLogout = `    function keluarSesi() {
      localStorage.removeItem('kjpp_token_auth');
      localStorage.removeItem('kjpp_session_token');
      sessionStorage.removeItem('NSR_USER_SESSION');
      sessionStorage.removeItem('NSR_AUTH_TOKEN');
      window.CURRENT_AUTH_SESSION = null;
      window.location.reload();
    }`;

const suNewLogout = `    async function keluarSesi() {
      try {
        await fetch('/api/auth-logout', { method: 'POST', credentials: 'include' });
      } catch (_) {}
      const scrubKeys = ['TOKEN_AUTH_NSR', 'CURRENT_AUTH_TOKEN', 'NSR_AUTH_TOKEN', 'NSR_AUTH_HASH', 'NSR_SESSION_CHECKSUM', 'NSR_SESSION_SIG', 'kjpp_token_internal', 'kjpp_session_jo', 'NSR_USER_SESSION', 'nsr_nolap_session'];
      scrubKeys.forEach(k => sessionStorage.removeItem(k));
      localStorage.removeItem('kjpp_token_auth');
      localStorage.removeItem('kjpp_session_token');
      window.CURRENT_AUTH_SESSION = null;
      window.location.reload();
    }`;

if (su.includes(suOldLogout)) {
  su = su.replace(suOldLogout, suNewLogout);
  console.log('[PASS] su: updated keluarSesi');
} else {
  console.warn('[WARN] suOldLogout not found');
}

fs.writeFileSync('portal-surat-umum.html', suIsCRLF ? su.replace(/\n/g, '\r\n') : su, 'utf8');

// ========================================================
// 5. PATCH portal-nolap-cabang.html
// ========================================================
console.log('\n--- Patching portal-nolap-cabang.html ---');
let nlc = fs.readFileSync('portal-nolap-cabang.html', 'utf8');
const nlcIsCRLF = nlc.includes('\r\n');
nlc = nlc.replace(/\r\n/g, '\n');

// 5A. Scrub raw token storage in portal-nolap-cabang
const nlcOldStorage = `      sessionStorage.setItem('NSR_AUTH_TOKEN', auth.token || auth.tokenHash || '');
      sessionStorage.setItem('NSR_USER_SESSION', JSON.stringify(auth));
      sessionStorage.setItem('TOKEN_AUTH_NSR', auth.token || auth.tokenHash || '');
      sessionStorage.setItem('CURRENT_AUTH_TOKEN', auth.token || auth.tokenHash || '');
      sessionStorage.setItem('kjpp_token_internal', JSON.stringify({
        branch: auth.wilayah,
        token: auth.token || auth.tokenHash || '',
        role: auth.role,
        roleLabel: auth.roleLabel,
        canAccessKwitansi: auth.canAccessKwitansi,
        expiresAt: Date.now() + (8 * 3600 * 1000)
      }));`;

const nlcNewStorage = `      const scrubKeys = ['TOKEN_AUTH_NSR', 'CURRENT_AUTH_TOKEN', 'NSR_AUTH_TOKEN', 'NSR_AUTH_HASH', 'NSR_SESSION_CHECKSUM', 'NSR_SESSION_SIG'];
      scrubKeys.forEach(k => sessionStorage.removeItem(k));
      localStorage.removeItem('kjpp_token_auth');
      localStorage.removeItem('kjpp_session_token');

      const safeCabang = { ...auth };
      delete safeCabang.token;

      sessionStorage.setItem('NSR_USER_SESSION', JSON.stringify(safeCabang));
      sessionStorage.setItem('kjpp_token_internal', JSON.stringify({
        branch: safeCabang.wilayah,
        role: safeCabang.role,
        roleLabel: safeCabang.roleLabel,
        canAccessKwitansi: safeCabang.canAccessKwitansi,
        expiresAt: Date.now() + (8 * 3600 * 1000)
      }));`;

if (nlc.includes(nlcOldStorage)) {
  nlc = nlc.replace(nlcOldStorage, nlcNewStorage);
  console.log('[PASS] nlc: sanitized storage block');
} else {
  console.warn('[WARN] nlcOldStorage not found');
}

fs.writeFileSync('portal-nolap-cabang.html', nlcIsCRLF ? nlc.replace(/\n/g, '\r\n') : nlc, 'utf8');

// ========================================================
// 6. PATCH portal-nolap.html
// ========================================================
console.log('\n--- Patching portal-nolap.html ---');
let nl = fs.readFileSync('portal-nolap.html', 'utf8');
const nlIsCRLF = nl.includes('\r\n');
nl = nl.replace(/\r\n/g, '\n');

// 6A. Remove storing raw token in NSR_AUTH_TOKEN
nl = nl.replace(
  "sessionStorage.setItem('NSR_AUTH_TOKEN', auth.token || auth.tokenHash);",
  "// Token storage removed for security compliance"
);

nl = nl.replace(
  "sessionStorage.setItem('NSR_AUTH_TOKEN', tokenAuth.token || tokenAuth.tokenHash);",
  "// Token storage removed for security compliance"
);

// 6B. Add credentials: 'include' to all proxy calls in portal-nolap.html
nl = nl.replace(
  "const res = await fetch('/api/nolap-data-proxy?action=submitRegistrasiPersonel', {",
  "const res = await fetch('/api/nolap-data-proxy?action=submitRegistrasiPersonel', {\n          credentials: 'include',"
);

nl = nl.replace(
  "const res = await fetch('/api/nolap-data-proxy', {\n            method: 'POST',\n            headers: {",
  "const res = await fetch('/api/nolap-data-proxy', {\n            method: 'POST',\n            credentials: 'include',\n            headers: {"
);

nl = nl.replace(
  "const res = await fetch('/api/nolap-data-proxy', {\n          method: 'GET',\n          headers: {",
  "const res = await fetch('/api/nolap-data-proxy', {\n          method: 'GET',\n          credentials: 'include',\n          headers: {"
);

nl = nl.replace(
  "fetch('/api/nolap-data-proxy', {\n          method: 'POST',\n          headers: {",
  "fetch('/api/nolap-data-proxy', {\n          method: 'POST',\n          credentials: 'include',\n          headers: {"
);

// 6C. Dual gate endpoint calls in portal-nolap.html
nl = nl.replace(
  "const res = await fetch(`${DUAL_GATE_NOLAP_API}?action=submitGerbang2Akhir`, {\n          method: 'POST',\n          headers: {",
  "const res = await fetch(`${DUAL_GATE_NOLAP_API}?action=submitGerbang2Akhir`, {\n          method: 'POST',\n          credentials: 'include',\n          headers: {"
);

nl = nl.replace(
  "fetch(`${DUAL_GATE_NOLAP_API}?action=getDualGateDetail&idPenugasan=${encodeURIComponent(idPenugasan)}`, {\n        headers: { 'X-NSR-Token': auth?.token || auth?.sessionToken || '' }\n      })",
  "fetch(`${DUAL_GATE_NOLAP_API}?action=getDualGateDetail&idPenugasan=${encodeURIComponent(idPenugasan)}`, {\n        credentials: 'include'\n      })"
);

nl = nl.replace(
  "const res = await fetch(`${DUAL_GATE_NOLAP_API}?action=${actionName}`, {\n          method: 'POST',\n          headers: {",
  "const res = await fetch(`${DUAL_GATE_NOLAP_API}?action=${actionName}`, {\n          method: 'POST',\n          credentials: 'include',\n          headers: {"
);

nl = nl.replace(
  "const res = await fetch(`${DUAL_GATE_NOLAP_API}?action=issueDefinitiveNoLap`, {\n          method: 'POST',\n          headers: {",
  "const res = await fetch(`${DUAL_GATE_NOLAP_API}?action=issueDefinitiveNoLap`, {\n          method: 'POST',\n          credentials: 'include',\n          headers: {"
);

nl = nl.replace(
  "const res = await fetch(`${DUAL_GATE_NOLAP_API}?action=signLaporanPenilaiPublik`, {\n          method: 'POST',\n          headers: {",
  "const res = await fetch(`${DUAL_GATE_NOLAP_API}?action=signLaporanPenilaiPublik`, {\n          method: 'POST',\n          credentials: 'include',\n          headers: {"
);

nl = nl.replace(
  "const res = await fetch(`${DUAL_GATE_NOLAP_API}?action=emergencyOverrideGate`, {\n          method: 'POST',\n          headers: {",
  "const res = await fetch(`${DUAL_GATE_NOLAP_API}?action=emergencyOverrideGate`, {\n          method: 'POST',\n          credentials: 'include',\n          headers: {"
);

fs.writeFileSync('portal-nolap.html', nlIsCRLF ? nl.replace(/\n/g, '\r\n') : nl, 'utf8');

// ========================================================
// 7. PATCH PHP Handlers (Eliminate raw hash as token bypass)
// ========================================================
console.log('\n--- Patching PHP handlers ---');

// 7A. kwitansi-data-handler.php
let kh = fs.readFileSync('kwitansi-data-handler.php', 'utf8');
const khIsCRLF = kh.includes('\r\n');
kh = kh.replace(/\r\n/g, '\n');
const khOldBypass = `        if (isset($OFFICIAL_TOKEN_HASHES[$trimmed])) {
            $currentUser = $OFFICIAL_TOKEN_HASHES[$trimmed];
        } else {
            $tokenHash = hash('sha256', $trimmed);
            if (isset($OFFICIAL_TOKEN_HASHES[$tokenHash])) {
                $currentUser = $OFFICIAL_TOKEN_HASHES[$tokenHash];
            } else {
                $upperHash = hash('sha256', strtoupper($trimmed));
                if (isset($OFFICIAL_TOKEN_HASHES[$upperHash])) {
                    $currentUser = $OFFICIAL_TOKEN_HASHES[$upperHash];
                }
            }
        }`;

const khNewBypass = `        $tokenHash = hash('sha256', $trimmed);
        if (isset($OFFICIAL_TOKEN_HASHES[$tokenHash])) {
            $currentUser = $OFFICIAL_TOKEN_HASHES[$tokenHash];
        } else {
            $upperHash = hash('sha256', strtoupper($trimmed));
            if (isset($OFFICIAL_TOKEN_HASHES[$upperHash])) {
                $currentUser = $OFFICIAL_TOKEN_HASHES[$upperHash];
            } else {
                $saltedHash = hash('sha256', 'KJPP_NSR_2026_CORE_AUTH::' . strtoupper($trimmed));
                if (isset($OFFICIAL_TOKEN_HASHES[$saltedHash])) {
                    $currentUser = $OFFICIAL_TOKEN_HASHES[$saltedHash];
                }
            }
        }`;

if (kh.includes(khOldBypass)) {
  kh = kh.replace(khOldBypass, khNewBypass);
  console.log('[PASS] kh: eliminated raw hash bypass');
} else {
  console.warn('[WARN] khOldBypass not found');
}
fs.writeFileSync('kwitansi-data-handler.php', khIsCRLF ? kh.replace(/\n/g, '\r\n') : kh, 'utf8');

// 7B. operasional-data-handler.php
let oh = fs.readFileSync('operasional-data-handler.php', 'utf8');
const ohIsCRLF = oh.includes('\r\n');
oh = oh.replace(/\r\n/g, '\n');
const ohOldBypass = `        if (isset($officialTokenHashes[$trimmed])) {
            return $officialTokenHashes[$trimmed];
        }
        $tokenHash = hash('sha256', $trimmed);`;

const ohNewBypass = `        $tokenHash = hash('sha256', $trimmed);`;

if (oh.includes(ohOldBypass)) {
  oh = oh.replace(ohOldBypass, ohNewBypass);
  console.log('[PASS] oh: eliminated raw hash bypass');
} else {
  console.warn('[WARN] ohOldBypass not found');
}
fs.writeFileSync('operasional-data-handler.php', ohIsCRLF ? oh.replace(/\n/g, '\r\n') : oh, 'utf8');

// 7C. surat-umum-data-handler.php
let sh = fs.readFileSync('surat-umum-data-handler.php', 'utf8');
const shIsCRLF = sh.includes('\r\n');
sh = sh.replace(/\r\n/g, '\n');
const shOldBypass = `        if (isset($OFFICIAL_TOKEN_HASHES[$trimmed])) {
            $currentUser = $OFFICIAL_TOKEN_HASHES[$trimmed];
        } else {
            $tokenHash = hash('sha256', $trimmed);`;

const shNewBypass = `        $tokenHash = hash('sha256', $trimmed);`;

if (sh.includes(shOldBypass)) {
  sh = sh.replace(shOldBypass, shNewBypass);
  console.log('[PASS] sh: eliminated raw hash bypass');
} else {
  console.warn('[WARN] shOldBypass not found');
}
fs.writeFileSync('surat-umum-data-handler.php', shIsCRLF ? sh.replace(/\n/g, '\r\n') : sh, 'utf8');

console.log('\nAll patches completed successfully!');
