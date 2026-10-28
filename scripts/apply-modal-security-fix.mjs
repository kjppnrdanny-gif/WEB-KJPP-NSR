import fs from 'fs';

const targetFiles = [
  'lib/opini-nsr-modal-engine.js',
  'index.html',
  'portofolio-rekanan.html',
  'layanan.html',
  'profil-legalitas.html',
  'tim-cabang.html',
  'wawasan-regulasi.html'
];

targetFiles.forEach(file => {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');
  const isCRLF = content.includes('\r\n');
  const norm = content.replace(/\r\n/g, '\n');

  let updated = norm;

  // Pattern 1: auth success in verifikasiTokenPortal
  const p1Old = `        if (resp.ok && srv && srv.authenticated && srv.user) {
          auth = {
            ...srv.user,
            valid: true,
            token: input,
            tokenHash: srv.tokenHash || computeTokenHashSync(input),
            sessionChecksum: srv.sessionChecksum,
            expiresAt: srv.expiresAt || (Date.now() + (8 * 3600 * 1000))
          };
        }`;

  const p1New = `        if (resp.ok && srv && srv.authenticated && srv.user) {
          auth = {
            ...srv.user,
            valid: true,
            authenticated: true,
            expiresAt: srv.expiresAt || (Date.now() + (8 * 3600 * 1000))
          };
          delete auth.token;
        }`;

  if (updated.includes(p1Old)) {
    updated = updated.replace(p1Old, p1New);
    console.log(`[PASS 1] ${file}`);
  } else {
    console.warn(`[FAIL 1] ${file}`);
  }

  // Pattern 2: storage block
  const p2Old = `      // Simpan sesi terpadu dengan proteksi integritas kriptografis
      const branchName = auth.wilayah;
      const tokenHash = auth.tokenHash || (typeof computeTokenHashSync === 'function' ? computeTokenHashSync(auth.token || input) : '');
      const expiresAt = Date.now() + (8 * 3600 * 1000);
      const sessionChecksum = typeof computeSessionChecksum === 'function'
        ? computeSessionChecksum(tokenHash, auth.role, auth.wilayah, expiresAt, auth.isSuperAdmin)
        : 'sig_' + tokenHash;

      const secureAuth = {
        ...auth,
        tokenHash: tokenHash,
        sessionChecksum: sessionChecksum,
        expiresAt: expiresAt
      };

      const sessionObj = {
        ...auth,
        branch: branchName,
        wilayah: branchName,
        token: auth.token || input,
        tokenHash: tokenHash,
        role: auth.role,
        roleLabel: auth.roleLabel,
        mode: auth.mode,
        canAccessKwitansi: auth.canAccessKwitansi,
        seeFee: auth.seeFee,
        sessionChecksum: sessionChecksum,
        expiresAt: expiresAt
      };

      sessionStorage.setItem('NSR_AUTH_HASH', tokenHash);
      sessionStorage.setItem('NSR_SESSION_CHECKSUM', sessionChecksum);
      sessionStorage.setItem('NSR_SESSION_SIG', sessionChecksum);
      sessionStorage.setItem('NSR_USER_SESSION', JSON.stringify(secureAuth));
      sessionStorage.setItem('nsr_nolap_session', JSON.stringify(secureAuth));
      sessionStorage.setItem('TOKEN_AUTH_NSR', auth.token || input);
      sessionStorage.setItem('CURRENT_AUTH_TOKEN', auth.token || input);
      sessionStorage.setItem('NSR_AUTH_TOKEN', auth.token || input);
      sessionStorage.setItem('kjpp_token_internal', JSON.stringify(sessionObj));
      sessionStorage.setItem('kjpp_session_jo', JSON.stringify({
        isLoggedIn: true,
        token: auth.token || input,
        tokenHash: tokenHash,
        role: auth.role,
        roleLabel: auth.roleLabel,
        mode: auth.mode,
        wilayah: auth.wilayah,
        wilayahCode: auth.wilayahCode,
        sessionChecksum: sessionChecksum,
        expiresAt: expiresAt,
        loginAt: new Date().toISOString()
      }));`;

  const p2New = `      // Simpan HANYA metadata profil aman (DILARANG menyimpan token mentah di browser)
      const branchName = auth.wilayah || auth.branch || 'Kantor Pusat Jakarta';
      const expiresAt = auth.expiresAt || (Date.now() + (8 * 3600 * 1000));

      const safeProfile = {
        sub: auth.sub || '',
        displayName: auth.displayName || auth.nama || '',
        nama: auth.displayName || auth.nama || '',
        role: auth.role,
        roleLabel: auth.roleLabel,
        displayRole: auth.displayRole || auth.roleLabel,
        wilayah: branchName,
        wilayahLabel: auth.wilayahLabel || branchName,
        wilayahCode: auth.wilayahCode || '',
        branch: branchName,
        mode: auth.mode,
        isCabang: Boolean(auth.isCabang),
        isSuperAdmin: Boolean(auth.isSuperAdmin),
        canAccessKwitansi: Boolean(auth.canAccessKwitansi),
        seeFee: Boolean(auth.seeFee),
        canApprove: Boolean(auth.canApprove),
        canSubmit: Boolean(auth.canSubmit),
        authenticated: true,
        valid: true,
        expiresAt: expiresAt
      };

      // Bersihkan seluruh residu token mentah atau checksum client lama
      const tokenKeysToScrub = [
        'TOKEN_AUTH_NSR',
        'CURRENT_AUTH_TOKEN',
        'NSR_AUTH_TOKEN',
        'NSR_AUTH_HASH',
        'NSR_SESSION_CHECKSUM',
        'NSR_SESSION_SIG'
      ];
      tokenKeysToScrub.forEach(k => sessionStorage.removeItem(k));
      localStorage.removeItem('kjpp_token_auth');
      localStorage.removeItem('kjpp_session_token');

      // Simpan objek sesi steril tanpa atribut 'token'
      sessionStorage.setItem('NSR_USER_SESSION', JSON.stringify(safeProfile));
      sessionStorage.setItem('nsr_nolap_session', JSON.stringify(safeProfile));
      sessionStorage.setItem('kjpp_token_internal', JSON.stringify(safeProfile));
      sessionStorage.setItem('kjpp_session_jo', JSON.stringify({
        isLoggedIn: true,
        role: safeProfile.role,
        roleLabel: safeProfile.roleLabel,
        mode: safeProfile.mode,
        wilayah: safeProfile.wilayah,
        wilayahCode: safeProfile.wilayahCode,
        isCabang: safeProfile.isCabang,
        isSuperAdmin: safeProfile.isSuperAdmin,
        canAccessKwitansi: safeProfile.canAccessKwitansi,
        canApprove: safeProfile.canApprove,
        seeFee: safeProfile.seeFee,
        expiresAt: expiresAt,
        loginAt: new Date().toISOString()
      }));`;

  if (updated.includes(p2Old)) {
    updated = updated.replace(p2Old, p2New);
    console.log(`[PASS 2] ${file}`);
  } else {
    console.warn(`[FAIL 2] ${file}`);
  }

  // Pattern 3: resetTokenSesi
  const p3Old = `    // 6. Reset Sesi
    function resetTokenSesi() {
      sessionStorage.removeItem('NSR_AUTH_TOKEN');
      sessionStorage.removeItem('NSR_USER_SESSION');
      sessionStorage.removeItem('TOKEN_AUTH_NSR');
      sessionStorage.removeItem('CURRENT_AUTH_TOKEN');
      sessionStorage.removeItem('kjpp_token_internal');
      sessionStorage.removeItem('kjpp_session_jo');
      sessionStorage.removeItem('nsr_nolap_session');

      const formToken = document.getElementById('form-token-portal');
      const panelLayanan = document.getElementById('panel-layanan');
      const errEl = document.getElementById('pesan-error');
      if (errEl) errEl.classList.add('hidden');
      if (formToken) formToken.classList.remove('hidden');
      if (panelLayanan) panelLayanan.classList.add('hidden');
      const inp = document.getElementById('input-token');
      if (inp) {
        inp.value = '';
        inp.focus();
      }
    }`;

  const p3New = `    // 6. Reset Sesi (Inaktivasi Sesi Server-Side & Pembersihan Sesi Lokal)
    async function resetTokenSesi() {
      try {
        await fetch('/api/auth-logout', {
          method: 'POST',
          credentials: 'include'
        });
      } catch (err) {
        console.warn('Gagal memanggil endpoint logout server:', err);
      }

      const keysToRemove = [
        'NSR_AUTH_TOKEN',
        'NSR_USER_SESSION',
        'TOKEN_AUTH_NSR',
        'CURRENT_AUTH_TOKEN',
        'kjpp_token_internal',
        'kjpp_session_jo',
        'nsr_nolap_session',
        'NSR_AUTH_HASH',
        'NSR_SESSION_CHECKSUM',
        'NSR_SESSION_SIG'
      ];
      keysToRemove.forEach(k => sessionStorage.removeItem(k));
      localStorage.removeItem('kjpp_token_auth');
      localStorage.removeItem('kjpp_session_token');

      const formToken = document.getElementById('form-token-portal');
      const panelLayanan = document.getElementById('panel-layanan');
      const errEl = document.getElementById('pesan-error');
      if (errEl) errEl.classList.add('hidden');
      if (formToken) formToken.classList.remove('hidden');
      if (panelLayanan) panelLayanan.classList.add('hidden');
      const inp = document.getElementById('input-token');
      if (inp) {
        inp.value = '';
        inp.focus();
      }
    }`;

  if (updated.includes(p3Old)) {
    updated = updated.replace(p3Old, p3New);
    console.log(`[PASS 3] ${file}`);
  } else {
    console.warn(`[FAIL 3] ${file}`);
  }

  // Pattern 4: dapatkanSesiTervalidasi
  const p4Old = `    function dapatkanSesiTervalidasi() {
      try {
        const raw = sessionStorage.getItem('NSR_USER_SESSION');
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (parsed && typeof verifySessionChecksum === 'function' && verifySessionChecksum(parsed)) {
          return parsed;
        }
        return null;
      } catch (_) {
        return null;
      }
    }`;

  const p4New = `    function dapatkanSesiTervalidasi() {
      try {
        const raw = sessionStorage.getItem('NSR_USER_SESSION');
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (parsed && (parsed.authenticated || parsed.valid) && (!parsed.expiresAt || parsed.expiresAt > Date.now())) {
          return parsed;
        }
        return null;
      } catch (_) {
        return null;
      }
    }`;

  if (updated.includes(p4Old)) {
    updated = updated.replace(p4Old, p4New);
    console.log(`[PASS 4] ${file}`);
  } else {
    console.warn(`[FAIL 4] ${file}`);
  }

  const finalContent = isCRLF ? updated.replace(/\n/g, '\r\n') : updated;
  fs.writeFileSync(file, finalContent, 'utf8');
});
console.log('Update complete.');
