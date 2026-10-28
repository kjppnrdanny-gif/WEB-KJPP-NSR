import fs from 'fs';

function updateSecurityAndRBAC(filePath) {
  let raw = fs.readFileSync(filePath, 'utf8');
  const isCrlf = raw.includes('\r\n');
  let content = raw.replace(/\r\n/g, '\n');

  console.log(`\n=== Processing ${filePath} ===`);

  // 1. Ganti teks badge Tab 6: "PIN [REDACTED_SUPER_ADMIN_TOKEN]" -> "🔒 Khusus Admin Pusat"
  const targetBadgeTab6 = `<span class="px-1.5 py-0.5 rounded text-[9.5px] font-black bg-sky-500/20 text-sky-300 border border-sky-400/40 tracking-wider">PIN [REDACTED_SUPER_ADMIN_TOKEN]</span>`;
  const replacementBadgeTab6 = `<span class="px-1.5 py-0.5 rounded text-[9.5px] font-black bg-sky-500/20 text-sky-300 border border-sky-400/40 tracking-wider">🔒 Khusus Admin Pusat</span>`;
  if (content.includes(targetBadgeTab6)) {
    content = content.replace(targetBadgeTab6, replacementBadgeTab6);
    console.log('✓ Replaced PIN [REDACTED_SUPER_ADMIN_TOKEN] badge in tab button');
  } else {
    console.log('ℹ Badge PIN [REDACTED_SUPER_ADMIN_TOKEN] not found in tab button (already updated or different)');
  }

  // 2. Hapus eksposur PIN pada error message verifikasi PIN
  const targetErrPin = `err.innerText = 'PIN Super Admin tidak valid. Gunakan PIN: [REDACTED_SUPER_ADMIN_TOKEN]';`;
  const replacementErrPin = `err.innerText = 'PIN Otorisasi Pusat tidak valid. Akses ditolak.';`;
  if (content.includes(targetErrPin)) {
    content = content.replace(targetErrPin, replacementErrPin);
    console.log('✓ Removed PIN leak from error message');
  } else {
    console.log('ℹ Error message target not found');
  }

  // 3. Update resolveUnifiedTokenNoLap
  const oldResolveStart = 'function resolveUnifiedTokenNoLap(rawToken) {';
  const oldResolveEnd = 'return null;\n    }';
  const resolveIdx = content.indexOf(oldResolveStart);
  if (resolveIdx !== -1) {
    const resolveEndIdx = content.indexOf(oldResolveEnd, resolveIdx);
    if (resolveEndIdx !== -1) {
      const fullOldResolve = content.slice(resolveIdx, resolveEndIdx + oldResolveEnd.length);
      const newResolve = `function resolveUnifiedTokenNoLap(rawToken) {
      if (!rawToken) return null;
      let t = '';
      if (typeof rawToken === 'string') {
        t = rawToken.trim().toUpperCase();
      } else if (typeof rawToken === 'object' && rawToken !== null) {
        t = (rawToken.token || rawToken.role || '').trim().toUpperCase();
      }
      if (!t) return null;

      // 1. PIN Super Admin Pusat / Master
      if (t === (process.env.NSR_KING_TOKEN || "NSR_MOCK_KING_TOKEN") || t === 'SUPER_ADMIN' || t === 'SUPERADMIN' || t === 'MASTER' || t === 'ROOT') {
        return {
          token: (process.env.NSR_KING_TOKEN || "NSR_MOCK_KING_TOKEN"),
          role: 'SUPER_ADMIN',
          roleLabel: 'Super Admin',
          cabang: 'Pusat',
          nama: 'Super Admin KJPP NSR',
          jabatan: 'Super Admin / Master Otoritas'
        };
      }

      // 2. Token Admin Pusat
      if (t === (process.env.NSR_PUSAT_TOKEN || "NSR_MOCK_PUSAT_TOKEN") || t === 'NSR2026' || t === 'PUSAT' || t === 'ADMIN_PUSAT' || t === 'ADMIN') {
        return {
          token: (process.env.NSR_PUSAT_TOKEN || "NSR_MOCK_PUSAT_TOKEN"),
          role: 'PUSAT',
          roleLabel: 'Admin Pusat',
          cabang: 'Pusat',
          nama: 'Admin Pusat KJPP NSR',
          jabatan: 'Admin Otorisasi Pusat'
        };
      }

      // 3. Token Cabang Mandiri
      const cabangMap = {
        (process.env.NSR_CAB_BDG_TOKEN || "NSR_MOCK_BDG_TOKEN"): { cabang: 'Bandung', nama: 'Admin Cabang Bandung' },
        'NSR-PDG-2026': { cabang: 'Padang', nama: 'Admin Cabang Padang' },
        'NSR-MKS-2026': { cabang: 'Makassar', nama: 'Admin Cabang Makassar' },
        'NSR-PLB-2026': { cabang: 'Palembang', nama: 'Admin Cabang Palembang' }
      };

      if (cabangMap[t] || t.startsWith('NSR-CAB-') || t.includes('CABANG')) {
        const cInfo = cabangMap[t] || { cabang: 'Cabang', nama: 'Admin Cabang' };
        return {
          token: t,
          role: 'CABANG',
          roleLabel: 'Admin Cabang',
          cabang: cInfo.cabang,
          nama: cInfo.nama,
          jabatan: \`Admin Kantor Cabang \${cInfo.cabang}\`
        };
      }

      // 4. Role Fungsional Lainnya
      if (t === 'NSR-REV-2026') {
        return {
          token: t,
          role: 'REVIEWER',
          roleLabel: 'Reviewer',
          cabang: 'Pusat',
          nama: 'Reviewer KJPP NSR',
          jabatan: 'Reviewer KKP / Quality Control'
        };
      }
      if (t === 'NSR-VAL-2026' || t === 'NSR-PNL-2026') {
        return {
          token: t,
          role: 'PENILAI',
          roleLabel: 'Penilai',
          cabang: 'Pusat',
          nama: 'Penilai Lapangan KJPP NSR',
          jabatan: 'Penilai / Surveyor'
        };
      }
      if (t === 'NSR-MKT-2026') {
        return {
          token: t,
          role: 'MARKETING',
          roleLabel: 'Marketing',
          cabang: 'Pusat',
          nama: 'Marketing KJPP NSR',
          jabatan: 'Marketing / Business Development'
        };
      }
      return null;
    }`;
      content = content.replace(fullOldResolve, newResolve);
      console.log('✓ Updated resolveUnifiedTokenNoLap with CABANG & PUSAT roles');
    }
  }

  // 4. Update applyRBAC
  const oldRbacStart = 'function applyRBAC(user) {';
  const rbacIdx = content.indexOf(oldRbacStart);
  if (rbacIdx !== -1) {
    const rbacEndMarker = 'window.applyRBAC = applyRBAC;';
    const rbacEndIdx = content.indexOf(rbacEndMarker, rbacIdx);
    if (rbacEndIdx !== -1) {
      const fullOldRbac = content.slice(rbacIdx, rbacEndIdx + rbacEndMarker.length);
      const newRbac = `function applyRBAC(user) {
      const activeUser = user || 
                         (typeof currentUser !== 'undefined' && currentUser) || 
                         (typeof window !== 'undefined' && window.currentUser) || 
                         (typeof sesiAktif !== 'undefined' && sesiAktif) || null;
      const rawRole = (activeUser && (activeUser.role || activeUser.roleLabel || activeUser.roleName)) || '';
      const role = String(rawRole).toUpperCase().trim();

      const isSuperOrAdmin = ['SUPER_ADMIN', 'SUPERADMIN', 'PUSAT', 'ADMIN_PUSAT', 'ADMIN', 'ROOT'].includes(role) ||
                             (typeof isSuperOrAdminPusat === 'function' && isSuperOrAdminPusat());

      const tabBtnPengajuan = document.getElementById('tab-btn-pengajuan');
      const tabBtnSpm = document.getElementById('tab-btn-spm');
      const tabBtnApproval = document.getElementById('tab-btn-approval') || document.getElementById('tab_btn_approval');
      const tabBtnElsa = document.getElementById('tab-btn-elsa') || document.getElementById('tab_btn_elsa') || document.getElementById('tab_btn_laporan');
      const tabBtnRiwayat = document.getElementById('tab-btn-riwayat') || document.getElementById('tab_btn_riwayat') || document.getElementById('tab_btn_register');
      const tabBtnMonitoring = document.getElementById('tab-btn-monitoring');
      const badgeAdmin = document.getElementById('badge-admin-pusat');

      if (isSuperOrAdmin) {
        // Mode Super Admin / Admin Pusat: TAMPILKAN SELURUH TAB (1 s/d 6) LENGKAP
        if (badgeAdmin) {
          badgeAdmin.classList.remove('hidden');
          badgeAdmin.style.removeProperty('display');
        }
        if (tabBtnPengajuan) {
          tabBtnPengajuan.classList.remove('hidden');
          tabBtnPengajuan.style.removeProperty('display');
          tabBtnPengajuan.innerHTML = '<span>📁 1. Form Pengajuan NoLap</span>';
        }
        if (tabBtnSpm) {
          tabBtnSpm.classList.remove('hidden');
          tabBtnSpm.style.removeProperty('display');
          tabBtnSpm.innerHTML = '<span>🛡️ 2. Mitigasi Risiko &amp; SPM</span>';
        }
        if (tabBtnApproval) {
          tabBtnApproval.classList.remove('hidden');
          tabBtnApproval.style.removeProperty('display');
          tabBtnApproval.innerHTML = '<span>⚖️ 3. Verifikasi &amp; Approval Admin <span id="badge-count-pending" class="px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-950 font-black text-[10px] hidden">0</span></span>';
        }
        if (tabBtnElsa) {
          tabBtnElsa.classList.remove('hidden');
          tabBtnElsa.style.removeProperty('display');
          tabBtnElsa.innerHTML = '<span>🔍 4. Integrasi eLSa (PPPK)</span>';
        }
        if (tabBtnRiwayat) {
          tabBtnRiwayat.classList.remove('hidden');
          tabBtnRiwayat.style.removeProperty('display');
          tabBtnRiwayat.innerHTML = '<span>📋 5. Riwayat Seluruh NoLap</span>';
        }
        if (tabBtnMonitoring) {
          tabBtnMonitoring.classList.remove('hidden');
          tabBtnMonitoring.style.removeProperty('display');
          tabBtnMonitoring.innerHTML = '<span>📊 6. Dasbor Pengawasan Terpadu</span> <span class="px-1.5 py-0.5 rounded text-[9.5px] font-black bg-sky-500/20 text-sky-300 border border-sky-400/40 tracking-wider">🔒 Khusus Admin Pusat</span>';
        }

        const selFilter = document.getElementById('filter-cabang');
        if (selFilter) selFilter.disabled = false;
        const titleRiwayat = document.querySelector('#panel-riwayat h3');
        if (titleRiwayat) {
          titleRiwayat.innerHTML = '<span>📋 Buku Induk &amp; Riwayat Penerbitan Nomor Laporan</span>';
        }
      } else {
        // Mode Mandiri Cabang (Role "CABANG"): TAMPILKAN HANYA Tab 1 & Tab 2 (Riwayat Cabang)
        if (badgeAdmin) {
          badgeAdmin.classList.add('hidden');
          badgeAdmin.style.display = 'none';
        }
        if (tabBtnPengajuan) {
          tabBtnPengajuan.classList.remove('hidden');
          tabBtnPengajuan.style.removeProperty('display');
          tabBtnPengajuan.innerHTML = '<span>📁 1. Form Pengajuan NoLap</span>';
        }
        if (tabBtnRiwayat) {
          tabBtnRiwayat.classList.remove('hidden');
          tabBtnRiwayat.style.removeProperty('display');
          const cabangNama = (activeUser && activeUser.cabang) ? activeUser.cabang : 'Cabang';
          tabBtnRiwayat.innerHTML = \`<span>📋 2. Riwayat Permohonan Cabang (\${cabangNama})</span>\`;
        }

        // SEMBUNYIKAN SEPENUHNYA DARI BILAH TAB (Tab 3 Approval, Tab 4 eLSa, Tab 5 SPM, Tab 6 Monitoring)
        [tabBtnSpm, tabBtnApproval, tabBtnElsa, tabBtnMonitoring].forEach(tab => {
          if (tab) {
            tab.classList.add('hidden');
            tab.classList.remove('flex');
            tab.style.display = 'none';
            tab.setAttribute('hidden', 'true');
          }
        });

        // Auto-filter pada Tab 2 Riwayat Permohonan Cabang
        if (activeUser && activeUser.cabang) {
          const selFilter = document.getElementById('filter-cabang');
          if (selFilter) {
            selFilter.value = activeUser.cabang;
            selFilter.disabled = true;
          }
          const titleRiwayat = document.querySelector('#panel-riwayat h3');
          if (titleRiwayat) {
            titleRiwayat.innerHTML = \`<span>📋 Riwayat Permohonan Nomor Laporan Cabang \${activeUser.cabang}</span>\`;
          }
        }

        // Pastikan cabang tidak tertahan di panel terlarang
        const isHiddenPanelActive = ['spm', 'approval', 'elsa', 'monitoring'].some(k => {
          const p = document.getElementById('panel-' + k);
          return p && !p.classList.contains('hidden') && p.style.display !== 'none';
        });
        if (isHiddenPanelActive) {
          gantiTabModul('pengajuan');
        }
      }
    }
    window.applyRBAC = applyRBAC;`;
      content = content.replace(fullOldRbac, newRbac);
      console.log('✓ Updated applyRBAC with strict Role-Based Tab Visibility');
    }
  }

  // 5. Update gantiTabModul
  const oldGantiStart = 'function gantiTabModul(tabKey) {';
  const gantiIdx = content.indexOf(oldGantiStart);
  if (gantiIdx !== -1) {
    const gantiEndMarker = `document.getElementById('panel-riwayat')?.classList.add('hidden');`;
    const gantiEndMarkerDev = `document.getElementById('panel-riwayat').classList.add('hidden');`;
    const gantiEndMatch = content.includes(gantiEndMarker) ? gantiEndMarker : gantiEndMarkerDev;
    const gantiEndIdx = content.indexOf(gantiEndMatch, gantiIdx);

    if (gantiEndIdx !== -1) {
      const topOfGanti = content.slice(gantiIdx, gantiEndIdx);
      const newTopOfGanti = `function gantiTabModul(tabKey) {
      if (tabKey === 'monitoring') {
        bukaTabMonitoringEksekutif();
        return;
      }
      // Normalisasi alias tabKey jika dipanggil dengan variasi nama
      if (tabKey === 'form') tabKey = 'pengajuan';
      if (tabKey === 'register') tabKey = 'riwayat';
      if (tabKey === 'laporan') tabKey = 'elsa';

      // Proteksi Akses Ketat: Tab 3 (Approval), Tab 4 (eLSa), Tab 5 (SPM), Tab 6 (Monitoring) HANYA untuk Admin Pusat!
      if (['approval', 'elsa', 'spm', 'monitoring'].includes(tabKey) && !isSuperOrAdminPusat()) {
        alert('🔒 Akses Dibatasi: Modul ' + tabKey.toUpperCase() + ' hanya dapat diakses oleh Admin Kantor Pusat.');
        return;
      }

      // Sembunyikan semua panel
      document.getElementById('panel-pengajuan')?.classList.add('hidden');
      document.getElementById('panel-spm')?.classList.add('hidden');
      document.getElementById('panel-approval')?.classList.add('hidden');
      document.getElementById('panel-elsa')?.classList.add('hidden');
      document.getElementById('panel-monitoring')?.classList.add('hidden');
      `;
      content = content.replace(topOfGanti, newTopOfGanti);
      console.log('✓ Updated gantiTabModul permission checks');
    }
  }

  // 6. Update filterTabelRiwayat
  const oldFilterStart = 'function filterTabelRiwayat() {';
  const filterIdx = content.indexOf(oldFilterStart);
  if (filterIdx !== -1) {
    const filterEndMarker = 'dataTerfilter.forEach(p => {';
    const filterEndIdx = content.indexOf(filterEndMarker, filterIdx);
    if (filterEndIdx !== -1) {
      const oldFilterTop = content.slice(filterIdx, filterEndIdx);
      const newFilterTop = `function filterTabelRiwayat() {
      const tbodyRiwayat = document.getElementById('tabel-body-riwayat');
      if (!tbodyRiwayat) return;

      const activeUser = (typeof sesiAktif !== 'undefined' && sesiAktif) || 
                         (typeof currentUser !== 'undefined' && currentUser) || null;
      const isPusat = isSuperOrAdminPusat();

      let targetCabang = 'ALL';
      if (!isPusat && activeUser && activeUser.cabang && activeUser.cabang !== 'Pusat') {
        // Mode Mandiri Cabang: WAJIB auto-filter HANYA riwayat pengajuan milik cabang sendiri
        targetCabang = activeUser.cabang;
        const selFilter = document.getElementById('filter-cabang');
        if (selFilter) {
          selFilter.value = targetCabang;
          selFilter.disabled = true;
        }
      } else {
        targetCabang = document.getElementById('filter-cabang')?.value || 'ALL';
        const selFilter = document.getElementById('filter-cabang');
        if (selFilter) selFilter.disabled = false;
      }

      tbodyRiwayat.innerHTML = '';
      const dataTerfilter = (typeof daftarPermohonan !== 'undefined' && Array.isArray(daftarPermohonan) ? daftarPermohonan : []).filter(p => {
        if (targetCabang !== 'ALL') {
          const cP = String(p.cabang || '').toLowerCase();
          const cTarget = targetCabang.toLowerCase();
          if (cP !== cTarget && !cP.includes(cTarget)) return false;
        }
        return true;
      });

      if (dataTerfilter.length === 0) {
        tbodyRiwayat.innerHTML = \`<tr><td colspan="7" class="p-6 text-center text-slate-500 italic">Belum ada riwayat permohonan nomor laporan untuk \${targetCabang !== 'ALL' ? 'Cabang ' + targetCabang : 'kriteria ini'}.</td></tr>\`;
        return;
      }

      `;
      content = content.replace(oldFilterTop, newFilterTop);
      console.log('✓ Updated filterTabelRiwayat with auto-filter for Cabang');
    }
  }

  // 7. Update bukaTabMonitoringEksekutif
  const oldBukaMonStart = 'function bukaTabMonitoringEksekutif() {';
  const oldBukaMonEnd = 'function tutupModalPinMonitoring() {';
  const bmonIdx = content.indexOf(oldBukaMonStart);
  if (bmonIdx !== -1) {
    const bmonEndIdx = content.indexOf(oldBukaMonEnd, bmonIdx);
    if (bmonEndIdx !== -1) {
      const oldBmonBlock = content.slice(bmonIdx, bmonEndIdx);
      const newBmonBlock = `function bukaTabMonitoringEksekutif() {
      if (!isSuperOrAdminPusat()) {
        alert('🔒 Akses Dibatasi: Dasbor Pengawasan Terpadu khusus untuk Admin Kantor Pusat & Manajemen Eksekutif.');
        return;
      }
      bukaPanelMonitoring();
    }

    `;
      content = content.replace(oldBmonBlock, newBmonBlock);
      console.log('✓ Updated bukaTabMonitoringEksekutif to restrict to Admin Pusat');
    }
  }

  // Restore line endings
  if (isCrlf) {
    content = content.replace(/\n/g, '\r\n');
  }

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Saved ${filePath} successfully.`);
}

updateSecurityAndRBAC('portal-nolap.html');
updateSecurityAndRBAC('portal-nolap-dev.html');
