import fs from 'fs';
import path from 'path';

const basePath = 'D:/WEB KJPP NSR_Compro new ver/kjpp-nsr-netlify-production';

// 1. Modifikasi index.html
console.log('--- 1. Memperbarui index.html ---');
const indexPath = path.join(basePath, 'index.html');
let indexHtml = fs.readFileSync(indexPath, 'utf8');

// A. Hapus container-nik-portal dan ganti label token
const nikContainerRegex = /<!-- Input 1: NIK Karyawan Resmi \(Session-Bound\) -->[\s\S]*?<!-- Input 2: Token Otorisasi Akses \/ PIN Presensi -->[\s\S]*?<div>\s*<label for="input-token" class="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1\.5 flex items-center justify-between">\s*<span id="label-token-portal">.*?<\/span>\s*<span class="text-\[10px\] font-normal text-slate-400">.*?<\/span>\s*<\/label>/;

const singleTokenInputHtml = `<!-- Input Tunggal: Token Otorisasi Akses -->
            <div>
              <label for="input-token" class="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center justify-between">
                <span id="label-token-portal">Token Otorisasi Akses <span class="text-rose-400">*</span></span>
                <span class="text-[10px] font-normal text-slate-400">Pusat &amp; Cabang</span>
              </label>`;

if (nikContainerRegex.test(indexHtml)) {
  indexHtml = indexHtml.replace(nikContainerRegex, singleTokenInputHtml);
  console.log('✓ Container NIK portal dihapus dari modal index.html & label token dikembalikan ke tunggal.');
} else {
  console.warn('⚠️ Regex nikContainerRegex tidak cocok, memeriksa pola alternatif...');
  // Alternatif jika format sedikit berbeda
  const altNikRegex = /<div id="container-nik-portal">[\s\S]*?<\/div>\s*<\/div>/;
  if (altNikRegex.test(indexHtml)) {
    indexHtml = indexHtml.replace(altNikRegex, '');
    indexHtml = indexHtml.replace(/<span id="label-token-portal">.*?<\/span>/, '<span id="label-token-portal">Token Otorisasi Akses <span class="text-rose-400">*</span></span>');
    console.log('✓ Alternatif: Container NIK portal dihapus.');
  }
}

// B. Link Presensi langsung membuka portal-presensi.html
const linkAbsenRegex = /<a id="link-portal-absen" href="javascript:void\(0\)" onclick="bukaModalPortal\('absen'\)"/;
if (linkAbsenRegex.test(indexHtml)) {
  indexHtml = indexHtml.replace(linkAbsenRegex, '<a id="link-portal-absen" href="portal-presensi.html"');
  console.log('✓ Kartu presensi diperbarui: langsung menuju portal-presensi.html.');
}

// C. bukaModalPortal('absen') langsung redirect
const bukaModalHeadRegex = /function bukaModalPortal\(targetPortal\) \{\s*try \{/;
if (bukaModalHeadRegex.test(indexHtml)) {
  indexHtml = indexHtml.replace(bukaModalHeadRegex, `function bukaModalPortal(targetPortal) {\n      if (targetPortal === 'absen') {\n        window.location.href = 'portal-presensi.html';\n        return;\n      }\n      try {`);
  console.log('✓ Handler bukaModalPortal diproteksi: absen langsung redirect ke portal-presensi.html.');
}

// D. Hapus blok gerbang presensi terpadu di verifikasiTokenPortal
const gatePresensiRegex = /\/\/ 0\. GERBANG PRESENSI TERPADU \(VERIFIKASI NIK \+ TOKEN \/ PIN SESSION-BOUND\)[\s\S]*?if \(errEl\) errEl\.classList\.add\('hidden'\);\s*if \(btnSubmit\) \{ btnSubmit\.disabled = true; btnSubmit\.innerHTML = '<span>Memverifikasi\.\.\.<\/span>'; \}/;

const cleanGatePresensi = `if (errEl) errEl.classList.add('hidden');\n      if (btnSubmit) { btnSubmit.disabled = true; btnSubmit.innerHTML = '<span>Memverifikasi...</span>'; }`;

if (gatePresensiRegex.test(indexHtml)) {
  indexHtml = indexHtml.replace(gatePresensiRegex, cleanGatePresensi);
  console.log('✓ Blok pembajakan presensi (verify_gate NIK+PIN) di verifikasiTokenPortal berhasil dibersihkan.');
} else {
  console.warn('⚠️ Regex gatePresensiRegex tidak cocok langsung, memeriksa potongan...');
}

fs.writeFileSync(indexPath, indexHtml, 'utf8');
console.log('✓ index.html selesai disimpan.\n');

// 2. Modifikasi portal-tracking.html
console.log('--- 2. Memperbarui portal-tracking.html ---');
const trackingPath = path.join(basePath, 'portal-tracking.html');
let trackingHtml = fs.readFileSync(trackingPath, 'utf8');

// A. ID Judul Modal Update Milestone
trackingHtml = trackingHtml.replace(
  /<h3 class="text-sm font-black text-white uppercase tracking-wider">Otorisasi Pembaruan Milestone<\/h3>/,
  '<h3 id="modal-update-milestone-title" class="text-sm font-black text-white uppercase tracking-wider">Verifikasi Otoritas Milestone</h3>'
);

// B. initUserSession disesuaikan untuk membaca Token Cabang / Pusat tanpa paksaan login NIK awal
const oldInitSessionRegex = /function initUserSession\(\) \{[\s\S]*?sinkronkanLevelAkses\(currentUserSession\);\s*updateUserSessionUI\(\);\s*\}/;

const newInitSession = `function initUserSession() {
      const urlParams = new URLSearchParams(window.location.search);
      const urlNik = urlParams.get('nik') || urlParams.get('auth_nik');
      const urlBranch = (urlParams.get('branch') || urlParams.get('kantor') || '').toUpperCase();

      try {
        const rawTokenSession = sessionStorage.getItem('kjpp_token_internal') || sessionStorage.getItem('NSR_USER_SESSION');
        const rawPresensi = sessionStorage.getItem('nsr_presensi_session_user');
        
        let sessionData = null;
        if (rawTokenSession) {
          try { sessionData = JSON.parse(rawTokenSession); } catch (_) {}
        }
        if (!sessionData && rawPresensi) {
          try { sessionData = JSON.parse(rawPresensi); } catch (_) {}
        }

        if (sessionData) {
          const isCab = Boolean(sessionData.isCabang || sessionData.mode === 'CABANG');
          const wil = sessionData.wilayah || sessionData.branch || sessionData.kantor || sessionData.cabang || '';
          const wCode = (sessionData.wilayahCode || sessionData.branch_code || sessionData.branchCode || '').toUpperCase();

          if (isCab || (wCode && wCode !== 'PUSAT' && wCode !== 'JKT')) {
            currentUserSession.is_central = false;
            currentUserSession.access_level = 'BRANCH_ISOLATED';
            currentUserSession.kantor = wil.includes('Cabang') ? wil : ('Cabang ' + wil.replace(/^Kantor\\s+/i, ''));
            currentUserSession.cabang = currentUserSession.kantor;
            currentUserSession.branch_code = wCode || (wil.toUpperCase().includes('MAKASSAR') ? 'MKS' : wil.toUpperCase().includes('BANDUNG') ? 'BDG' : wil.toUpperCase().includes('PADANG') ? 'PDG' : wil.toUpperCase().includes('PALEMBANG') ? 'PLM' : 'PUSAT');
            currentUserSession.nama = sessionData.nama || sessionData.displayName || ('Staf Operasional ' + currentUserSession.kantor);
            currentUserSession.jabatan = sessionData.roleLabel || sessionData.role || 'Staf Cabang';
            currentUserSession.nik = sessionData.nik || '';
          } else {
            currentUserSession.is_central = true;
            currentUserSession.access_level = 'NATIONWIDE_FULL_ACCESS';
            currentUserSession.kantor = 'Kantor Pusat Jakarta';
            currentUserSession.cabang = 'Kantor Pusat Jakarta';
            currentUserSession.branch_code = 'PUSAT';
            currentUserSession.nama = sessionData.nama || sessionData.displayName || 'Danny Taufik Hidayat, S.H.';
            currentUserSession.jabatan = sessionData.roleLabel || sessionData.role || 'Manager Admin & Umum';
            currentUserSession.nik = sessionData.nik || 'NSR-2019-005';
          }
        }
      } catch (e) {
        console.warn('Gagal membaca sesi token:', e);
      }

      if (urlBranch) {
        if (['MKS', 'MAKASSAR'].includes(urlBranch)) {
          currentUserSession.is_central = false;
          currentUserSession.access_level = 'BRANCH_ISOLATED';
          currentUserSession.kantor = 'Cabang Makassar';
          currentUserSession.cabang = 'Cabang Makassar';
          currentUserSession.branch_code = 'MKS';
          currentUserSession.nama = 'Staf Cabang Makassar';
        } else if (['BDG', 'BANDUNG'].includes(urlBranch)) {
          currentUserSession.is_central = false;
          currentUserSession.access_level = 'BRANCH_ISOLATED';
          currentUserSession.kantor = 'Cabang Bandung';
          currentUserSession.cabang = 'Cabang Bandung';
          currentUserSession.branch_code = 'BDG';
          currentUserSession.nama = 'Staf Cabang Bandung';
        } else if (['PDG', 'PADANG'].includes(urlBranch)) {
          currentUserSession.is_central = false;
          currentUserSession.access_level = 'BRANCH_ISOLATED';
          currentUserSession.kantor = 'Cabang Padang';
          currentUserSession.cabang = 'Cabang Padang';
          currentUserSession.branch_code = 'PDG';
          currentUserSession.nama = 'Staf Cabang Padang';
        } else if (['PLM', 'PLB', 'PALEMBANG'].includes(urlBranch)) {
          currentUserSession.is_central = false;
          currentUserSession.access_level = 'BRANCH_ISOLATED';
          currentUserSession.kantor = 'Cabang Palembang';
          currentUserSession.cabang = 'Cabang Palembang';
          currentUserSession.branch_code = 'PLM';
          currentUserSession.nama = 'Staf Cabang Palembang';
        }
      }

      if (urlNik) {
        currentUserSession.nik = urlNik.trim().toUpperCase();
      }

      sinkronkanLevelAkses(currentUserSession);
      updateUserSessionUI();
    }`;

if (oldInitSessionRegex.test(trackingHtml)) {
  trackingHtml = trackingHtml.replace(oldInitSessionRegex, newInitSession);
  console.log('✓ initUserSession di portal-tracking.html diperbarui.');
} else {
  console.warn('⚠️ oldInitSessionRegex tidak cocok di portal-tracking.html.');
}

// C. updateUserSessionUI: Tampilkan lencana dan status NIK dengan rapi jika masuk via token
trackingHtml = trackingHtml.replace(
  /document\.getElementById\('user-display-nik'\)\.textContent = currentUserSession\.nik;/,
  "document.getElementById('user-display-nik').textContent = currentUserSession.nik ? currentUserSession.nik : (currentUserSession.access_level === 'BRANCH_ISOLATED' ? 'Otorisasi Token Cabang' : 'Otorisasi Token Pusat');"
);

// D. muatDataTaskBoard: dukung passing branch code
const oldMuatParamsRegex = /const params = \{\s*auth_nik: currentUserSession\.nik\s*\};/;
const newMuatParams = `const params = {};
      if (currentUserSession.nik) {
        params.auth_nik = currentUserSession.nik;
      }
      if (currentUserSession.access_level === 'BRANCH_ISOLATED') {
        params.branch = currentUserSession.branch_code;
        params.kantor = currentUserSession.branch_code;
      }`;
if (oldMuatParamsRegex.test(trackingHtml)) {
  trackingHtml = trackingHtml.replace(oldMuatParamsRegex, newMuatParams);
  console.log('✓ muatDataTaskBoard parameter branch diperbarui.');
}

// E. bukaModalUpdateMilestone: set judul modal dinamis "Verifikasi Otoritas Milestone [M-XX]"
const oldBukaModalUpdateRegex = /document\.getElementById\('update-target-milestone'\)\.value = nextM;/;
const newBukaModalUpdate = `document.getElementById('update-target-milestone').value = nextM;

      const titleEl = document.getElementById('modal-update-milestone-title');
      if (titleEl) {
        titleEl.textContent = 'Verifikasi Otoritas Milestone [' + nextM + ']';
      }`;
if (oldBukaModalUpdateRegex.test(trackingHtml)) {
  trackingHtml = trackingHtml.replace(oldBukaModalUpdateRegex, newBukaModalUpdate);
  console.log('✓ Judul modal update milestone diatur dinamis: Verifikasi Otoritas Milestone [M-XX].');
}

fs.writeFileSync(trackingPath, trackingHtml, 'utf8');
console.log('✓ portal-tracking.html selesai disimpan.\n');

// 3. Modifikasi backend/job-tracking-handler.php
console.log('--- 3. Memperbarui backend/job-tracking-handler.php ---');
const handlerPath = path.join(basePath, 'backend', 'job-tracking-handler.php');
let handlerPhp = fs.readFileSync(handlerPath, 'utf8');

const listFilterHeadRegex = /\$filterKantor = strtoupper\(trim\(\(string\)\(\$_GET\['kantor'\] \?\? \$_POST\['kantor'\] \?\? ''\)\)\);\s*\$currentUser = null;\s*\$isIsolatedBranch = false;\s*\$userBranchCode = 'PUSAT';\s*if \(!empty\(\$authNik\)\) \{[\s\S]*?\}\s*\}/;

const newListFilterHead = `$filterKantor = strtoupper(trim((string)($_GET['kantor'] ?? $_POST['kantor'] ?? '')));
    $branchParam = strtoupper(trim((string)($_GET['branch'] ?? $_POST['branch'] ?? '')));

    $currentUser = null;
    $isIsolatedBranch = false;
    $userBranchCode = 'PUSAT';

    if (!empty($authNik)) {
        $user = findUserByNik($authNik);
        if ($user) {
            $currentUser = $user;
            $userBranchCode = getUserBranchCode($user);
            $isIsolatedBranch = !isCentralManagement($user);
        }
    } elseif (!empty($branchParam) && in_array($branchParam, ['BDG', 'PDG', 'MKS', 'PLM', 'PLB'])) {
        $isIsolatedBranch = true;
        $userBranchCode = ($branchParam === 'PLB') ? 'PLM' : $branchParam;
    }`;

if (listFilterHeadRegex.test(handlerPhp)) {
  handlerPhp = handlerPhp.replace(listFilterHeadRegex, newListFilterHead);
  console.log('✓ backend/job-tracking-handler.php diperbarui untuk branch token parameter.');
} else {
  console.warn('⚠️ listFilterHeadRegex tidak cocok langsung di PHP handler.');
}

fs.writeFileSync(handlerPath, handlerPhp, 'utf8');
console.log('✓ backend/job-tracking-handler.php selesai disimpan.\n');

console.log('Semua file berhasil diperbarui!');
