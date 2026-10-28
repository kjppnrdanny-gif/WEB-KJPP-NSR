import fs from 'fs';
import path from 'path';

const basePath = 'D:/WEB KJPP NSR_Compro new ver/kjpp-nsr-netlify-production';
const indexPath = path.join(basePath, 'index.html');
let indexHtml = fs.readFileSync(indexPath, 'utf8');

// 1. Tambahkan alias token ke resolveUnifiedToken
const resolveTokenHead = 'const clean = rawToken.trim().toUpperCase();';
const newResolveTokenHead = `let clean = rawToken.trim().toUpperCase();

      // Daftar Alias Token Resmi (Mendukung Frasa Teks & Kode Token)
      const TOKEN_ALIASES = {
        'TOKEN CABANG MAKASSAR': 'NSR-MKS-2026',
        'TOKEN MAKASSAR': 'NSR-MKS-2026',
        'TOKEN CABANG BANDUNG': 'NSR-BDG-2026',
        'TOKEN BANDUNG': 'NSR-BDG-2026',
        'TOKEN CABANG PADANG': 'NSR-PDG-2026',
        'TOKEN PADANG': 'NSR-PDG-2026',
        'TOKEN CABANG PALEMBANG': 'NSR-PLB-2026',
        'TOKEN PALEMBANG': 'NSR-PLB-2026',
        'TOKEN ADMIN PUSAT': 'NSR-PST-2026',
        'TOKEN PUSAT': 'NSR-PST-2026',
        'TOKEN MANAJEMEN': 'NSR-PST-2026',
        'TOKEN REKAN': 'NSR8899'
      };
      if (TOKEN_ALIASES[clean]) {
        clean = TOKEN_ALIASES[clean];
      }`;

if (indexHtml.includes(resolveTokenHead)) {
  indexHtml = indexHtml.replace(resolveTokenHead, newResolveTokenHead);
  console.log('✓ Token aliases berhasil disematkan ke resolveUnifiedToken.');
} else {
  console.warn('⚠️ Pola resolveTokenHead tidak ditemukan.');
}

// 2. Refaktorisasi verifikasiTokenPortal & arahkanKePortalTujuan
const oldVerifikasiRegex = /async function verifikasiTokenPortal\(e\) \{[\s\S]*?inputEl\.value = '';\s*\}\s*window\.verifikasiTokenPortal = verifikasiTokenPortal;/;

const newVerifikasiImplementation = `// Master 48 NIK Karyawan Resmi KJPP NSR (Pusat & 4 Cabang)
    const MASTER_48_NIKS = [
      "NSR-2019-001", "NSR-2019-002", "NSR-2019-003", "NSR-2019-004", "NSR-2019-005",
      "NSR-2019-006", "NSR-2019-007", "NSR-2019-008", "NSR-2019-009", "NSR-2019-010",
      "NSR-2019-011", "NSR-2019-012", "NSR-2019-013", "NSR-2019-014", "NSR-2019-015",
      "NSR-2019-016", "NSR-2019-017", "NSR-2019-018", "NSR-2019-019", "NSR-2019-020",
      "NSR-2025-021", "NSR-2026-022", "NSR-PDG-2019-23", "NSR-PDG-2019-24", "NSR-PDG-2019-25",
      "NSR-PDG-2019-26", "NSR-PDG-2019-27", "NSR-PDG-2019-28", "NSR-PDG-2019-29", "NSR-MKS-2019-30",
      "NSR-MKS-2019-31", "NSR-MKS-2019-32", "NSR-MKS-2020-33", "NSR-MKS-2021-34", "NSR-MKS-2020-35",
      "NSR-MKS-2019-36", "NSR-MKS-2019-37", "NSR-BDG-2020-38", "NSR-BDG-2020-39", "NSR-BDG-2020-40",
      "NSR-BDG-2020-41", "NSR-BDG-2020-42", "NSR-BDG-2020-43", "NSR-PLB-2022-44", "NSR-PLB-2022-45",
      "NSR-PLB-2022-46", "NSR-PLB-2022-47", "NSR-PLB-2022-48"
    ];

    function tampilkanPesanErrorModal(pesan) {
      const errEl = document.getElementById('pesan-error');
      const errText = document.getElementById('pesan-error-text');
      const btnSubmit = document.getElementById('btn-submit-token');
      const inputEl = document.getElementById('input-token');

      if (btnSubmit) {
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = '<span id="btn-submit-text">Verifikasi &amp; Masuk</span> <svg class="w-4 h-4 text-blue-200" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>';
      }
      if (errEl) errEl.classList.remove('hidden');
      if (errText) errText.innerText = pesan;
      if (inputEl) inputEl.select();
    }

    function arahkanKePortalTujuan(auth) {
      if (!auth) return;
      const inputEl = document.getElementById('input-token');
      const errEl = document.getElementById('pesan-error');
      const errText = document.getElementById('pesan-error-text');

      // Pemblokiran akses kwitansi bagi Penilai, Reviewer & Marketing
      if (window._targetPortal === 'kwitansi' && !auth.canAccessKwitansi) {
        if (errEl) errEl.classList.remove('hidden');
        if (errText) {
          errText.innerHTML = \`Akses Ditolak: Modul Permintaan Kwitansi &amp; Penagihan hanya dapat diakses oleh Admin Pusat dan Admin Cabang. Token Anda terdaftar sebagai \${auth.roleLabel || auth.role}.\`;
        }
        if (inputEl) inputEl.select();
        return;
      }

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

      // Simpan sesi bersih steril
      sessionStorage.setItem('NSR_USER_SESSION', JSON.stringify(safeProfile));
      sessionStorage.setItem('nsr_nolap_session', JSON.stringify(safeProfile));
      sessionStorage.setItem('kjpp_token_internal', JSON.stringify(safeProfile));
      sessionStorage.setItem('kjpp_user_branch', safeProfile.wilayah);
      sessionStorage.setItem('kjpp_user_role', safeProfile.role);
      localStorage.setItem('NSR_USER_SESSION', JSON.stringify(safeProfile));
      localStorage.setItem('nsr_nolap_session', JSON.stringify(safeProfile));
      localStorage.setItem('kjpp_token_internal', JSON.stringify(safeProfile));
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
      }));

      // Rute langsung sesuai target kartu
      if (window._targetPortal === 'kwitansi') {
        window.location.href = (auth.mode === 'CABANG') ? 'portal-kwitansi.html?mode=mandiri' : 'portal-kwitansi.html';
        return;
      }
      if (window._targetPortal === 'operasional') {
        const bCode = (auth.wilayahCode || auth.branchCode || '').toUpperCase();
        window.location.href = (auth.isCabang || auth.mode === 'CABANG') && bCode
          ? \`portal-operasional.html?branch=\${encodeURIComponent(bCode)}\`
          : 'portal-operasional.html';
        return;
      }
      if (window._targetPortal === 'penugasan') {
        window.location.href = (auth.mode === 'CABANG') ? 'portal-penugasan-jo.html?mode=mandiri' : 'portal-penugasan-jo.html';
        return;
      }
      if (window._targetPortal === 'nolap') {
        window.location.href = (auth.mode === 'CABANG') ? 'portal-nolap-cabang.html' : 'portal-nolap.html';
        return;
      }
      if (window._targetPortal === 'sop') {
        tutupModalPortal();
        if (auth.isCabang || auth.mode === 'CABANG') {
          bukaModalRequestDokumenSOP();
          return;
        }
        if (auth.isSuperAdmin) {
          const url = _dekripsiUrlAman(_ENC_URL_SOP_DRIVE);
          if (url) window.open(url, '_blank', 'noopener,noreferrer');
          return;
        }
        bukaModalRequestDokumenSOP();
        return;
      }
      if (window._targetPortal === 'absen') {
        tutupModalPortal();
        window.location.href = 'portal-presensi.html';
        return;
      }

      // Tampilkan panel layanan operasional (GRID 2-KOLOM 6 MODUL LENGKAP)
      const formToken = document.getElementById('form-token-portal');
      const panelLayanan = document.getElementById('panel-layanan');
      const labelLokasi = document.getElementById('label-lokasi');

      if (labelLokasi) {
        labelLokasi.innerHTML = \`Terverifikasi: <strong>\${auth.wilayah}</strong> &bull; <span class="uppercase text-emerald-800 font-extrabold">\${auth.roleLabel || auth.role}</span>\`;
      }
      if (formToken) formToken.classList.add('hidden');
      if (panelLayanan) {
        panelLayanan.classList.remove('hidden');
        window.updateDynamicSmartCards(auth);
        if (typeof setupPanelKwitansiLink === 'function') {
          setupPanelKwitansiLink(auth.canAccessKwitansi !== false, auth.roleLabel || auth.role);
        }
      }
      if (inputEl) inputEl.value = '';
    }

    async function verifikasiTokenPortal(e) {
      if (e) e.preventDefault();
      const inputEl = document.getElementById('input-token');
      const btnSubmit = document.getElementById('btn-submit-token');
      const errEl = document.getElementById('pesan-error');
      if (!inputEl) return;

      const rawInput = (inputEl.value || '').trim();
      const cleanInput = rawInput.toUpperCase();
      window._currentAuthToken = rawInput;

      if (!rawInput) {
        tampilkanPesanErrorModal('Silakan masukkan Token Akses resmi atau NIK Karyawan terlebih dahulu.');
        return;
      }

      // ==========================================
      // JALUR 1: DETEKSI NIK KARYAWAN (PRESENSI)
      // ==========================================
      // Format NIK resmi KJPP NSR berakhiran nomor urut karyawan (-005, -30, -38, dsb)
      // Contoh: NSR-2019-005, NSR-MKS-2019-30, NSR-BDG-2020-38
      const isNikPattern = /^NSR(-\\w+)?-\\d{4}-\\d{2,3}$/i.test(cleanInput);
      const isKnownNik = MASTER_48_NIKS.includes(cleanInput);

      if (isKnownNik || isNikPattern) {
        if (errEl) errEl.classList.add('hidden');
        if (btnSubmit) {
          btnSubmit.disabled = true;
          btnSubmit.innerHTML = '<span>Memverifikasi NIK Karyawan...</span>';
        }

        let isNikValid = isKnownNik;
        let employeeData = null;

        // Validasi ke endpoint backend jika server web aktif
        try {
          const resp = await fetch('backend/absensi-data-handler.php?action=cekKaryawan&nik=' + encodeURIComponent(cleanInput), {
            method: 'GET',
            headers: { 'Accept': 'application/json' },
            credentials: 'include'
          });
          const resJson = await resp.json().catch(() => null);
          if (resJson && (resJson.status === 'success' || resJson.success)) {
            isNikValid = true;
            employeeData = resJson;
          } else if (resJson && resJson.status === 'error' && resp.status === 404) {
            isNikValid = false;
          }
        } catch (_) {
          try {
            const respFallback = await fetch('absensi-data-handler.php?action=cekKaryawan&nik=' + encodeURIComponent(cleanInput), {
              method: 'GET',
              headers: { 'Accept': 'application/json' },
              credentials: 'include'
            });
            const resFallback = await respFallback.json().catch(() => null);
            if (resFallback && (resFallback.status === 'success' || resFallback.success)) {
              isNikValid = true;
              employeeData = resFallback;
            } else if (resFallback && resFallback.status === 'error' && respFallback.status === 404) {
              isNikValid = false;
            }
          } catch (_) {}
        }

        if (isNikValid) {
          sessionStorage.setItem('auth_nik', cleanInput);
          sessionStorage.setItem('nsr_presensi_active_nik', cleanInput);
          sessionStorage.setItem('nsr_presensi_session_nik', cleanInput);
          if (employeeData) {
            sessionStorage.setItem('nsr_presensi_session_user', JSON.stringify(employeeData));
            sessionStorage.setItem('nsr_presensi_active_user', JSON.stringify(employeeData));
          }

          if (btnSubmit) {
            btnSubmit.innerHTML = '<span>NIK Terverifikasi! Mengalihkan ke Presensi... 🚀</span>';
          }
          window.location.href = 'portal-presensi.html';
          return;
        } else {
          tampilkanPesanErrorModal('NIK Karyawan tidak terdaftar dalam database resmi KJPP NSR.');
          return;
        }
      }

      // ==========================================
      // JALUR 2: EVALUASI TOKEN AKSES RESMI (PORTAL INTERNAL)
      // ==========================================
      if (errEl) errEl.classList.add('hidden');
      if (btnSubmit) {
        btnSubmit.disabled = true;
        btnSubmit.innerHTML = '<span>Memverifikasi Token Akses...</span>';
      }

      // 1. Evaluasi Kamus Token Akses Resmi Lokal (resolveUnifiedToken)
      let auth = typeof window.resolveUnifiedToken === 'function' ? window.resolveUnifiedToken(rawInput) : null;
      if (!auth && cleanInput !== rawInput) {
        auth = typeof window.resolveUnifiedToken === 'function' ? window.resolveUnifiedToken(cleanInput) : null;
      }

      // 2. Jika resolver lokal belum cocok, verifikasi ke endpoint backend /api/auth-login
      if (!auth) {
        try {
          const resp = await fetch('/api/auth-login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({ token: rawInput }),
            credentials: 'include'
          });
          const srv = await resp.json().catch(() => null);
          if (resp.ok && srv && srv.authenticated && srv.user) {
            auth = {
              ...srv.user,
              valid: true,
              authenticated: true,
              expiresAt: srv.expiresAt || (Date.now() + (8 * 3600 * 1000))
            };
            delete auth.token;
          }
        } catch (_) {}
      }

      if (btnSubmit) {
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = '<span id="btn-submit-text">Verifikasi &amp; Masuk</span> <svg class="w-4 h-4 text-blue-200" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>';
      }

      if (auth && auth.valid) {
        arahkanKePortalTujuan(auth);
        return;
      } else {
        tampilkanPesanErrorModal('Token tidak valid. Pastikan memasukkan token resmi KJPP NSR (Admin Pusat, Admin Cabang, Reviewer, Penilai, Surveyor, Marketing, atau Keuangan).');
        return;
      }
    }
    window.verifikasiTokenPortal = verifikasiTokenPortal;`;

if (oldVerifikasiRegex.test(indexHtml)) {
  indexHtml = indexHtml.replace(oldVerifikasiRegex, newVerifikasiImplementation);
  console.log('✓ verifikasiTokenPortal berhasil direfaktorisasi dengan Dual-Path Evaluation.');
} else {
  console.warn('⚠️ Regex oldVerifikasiRegex tidak cocok.');
}

fs.writeFileSync(indexPath, indexHtml, 'utf8');
console.log('✓ index.html selesai disimpan.');
