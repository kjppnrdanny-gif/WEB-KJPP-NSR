import fs from 'fs';

const filePath = 'portal-penugasan-jo.html';
let content = fs.readFileSync(filePath, 'utf8');

function safeReplace(str, search, replacement) {
  const normStr = str.replace(/\r\n/g, '\n');
  const normSearch = search.replace(/\r\n/g, '\n');
  const normRepl = replacement.replace(/\r\n/g, '\n');
  if (!normStr.includes(normSearch)) {
    throw new Error('Search target not found in file: ' + normSearch.substring(0, 80));
  }
  const result = normStr.replace(normSearch, normRepl);
  return result.replace(/\n/g, '\r\n');
}

// 1. UPDATE pilihModeAlur
const searchPilihMode = `      if (mode === 'PRIVATE_CABANG') {
        if (radioPrivate) radioPrivate.checked = true;
        if (radioCentral) radioCentral.checked = false;
        if (labelPrivate) {
          labelPrivate.className = "flex items-start gap-3 p-3.5 rounded-xl border-2 border-emerald-400 bg-emerald-950/30 cursor-pointer transition shadow";
        }
        if (labelCentral) {
          labelCentral.className = "flex items-start gap-3 p-3.5 rounded-xl border border-slate-700 bg-slate-950/60 hover:border-slate-600 cursor-pointer transition opacity-70";
        }

        // Buka kunci input nomor SPK dan JO agar bebas diisi manual / counter cabang
        if (noLpInput) {
          noLpInput.readOnly = false;
          noLpInput.disabled = false;
          noLpInput.classList.remove('pointer-events-none', 'cursor-not-allowed', 'bg-slate-950/80');
          noLpInput.classList.add('bg-slate-950');
        }
        if (noAdmInput) {
          noAdmInput.readOnly = false;
          noAdmInput.disabled = false;
          noAdmInput.classList.remove('pointer-events-none', 'cursor-not-allowed', 'bg-slate-950/80');
          noAdmInput.classList.add('bg-slate-950');
        }

        const code = getKodeCabang(userSession.wilayah);
        const localList = ambilDataPrivatCabang(userSession.wilayah);
        const seq = (localList.length + 1).toString().padStart(4, '0');
        const dSurat = new Date(document.getElementById('tanggal_surat')?.value || new Date());
        const romawi = getBulanRomawi(dSurat);
        const thn = dSurat.getFullYear() || 2026;
        const jenisLap = document.getElementById('jenis_laporan')?.value || 'APP';
        const kodeLap = (jenisLap === 'RTL') ? 'PN-RTL' : 'PN-APP';

        const autoLp = \`\${seq}/NSR-\${code}/\${kodeLap}/\${romawi}/\${thn}\`;
        const autoAdm = \`\${code}-\${seq}\`;

        if (noLpInput) {
          noLpInput.placeholder = \`Bebas / Auto: \${autoLp}\`;
          if (noLpInput.dataset.manualEdited !== "true" || !noLpInput.value || noLpInput.value.includes('Menunggu')) {
            noLpInput.value = autoLp;
          }
        }
        if (noAdmInput) {
          noAdmInput.placeholder = \`Bebas / Auto: \${autoAdm}\`;
          if (noAdmInput.dataset.manualEdited !== "true" || !noAdmInput.value || noAdmInput.value.includes('Menunggu')) {
            noAdmInput.value = autoAdm;
          }
        }

        if (banner) {
          banner.className = "p-4 rounded-2xl bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-900 border border-emerald-500/40 flex flex-wrap items-center justify-between gap-4 shadow-xl";
        }
        const wil = (userSession && userSession.wilayah) || 'Kantor Cabang';
        const wilNama = wil.replace('Kantor ', '').replace('Cabang ', '');
        if (modeTitle) {
          modeTitle.innerHTML = \`<span class="flex items-center gap-1.5 text-emerald-300 font-extrabold text-sm">⚡ Mode Akses: Mandiri Cabang \${wilNama}</span>\`;
        }
        if (modeDesc) {
          modeDesc.innerHTML = \`<span class="text-emerald-200 text-xs font-medium">Penerbitan SPK &amp; JO Mandiri Kewenangan Rekan Pemimpin Cabang &mdash; Terbit Instan &amp; Tersinkronisasi ke Database Cabang.</span>\`;
        }

        if (btnSubmit) {
          btnSubmit.textContent = (userSession && userSession.role === 'ADMIN_CABANG')
            ? "Simpan & Cetak Instan (Mandiri Cabang)"
            : "Simpan Draft Mandiri Cabang (Verifikasi Admin Cabang)";
        }

        // Kunci Penandatangan ke Rekan Pemimpin Cabang Aktif
        const selRekan = document.getElementById('rekan_nama');
        if (selRekan) {
          const partner = getRekanByWilayah(wil);
          populateDropdownRekan(partner?.nama);
        }
      } else {
        // CENTRAL_APPROVAL
        if (radioCentral) radioCentral.checked = true;
        if (radioPrivate) radioPrivate.checked = false;
        if (labelCentral) {
          labelCentral.className = "flex items-start gap-3 p-3.5 rounded-xl border-2 border-amber-400 bg-amber-950/30 cursor-pointer transition shadow";
        }
        if (labelPrivate) {
          labelPrivate.className = "flex items-start gap-3 p-3.5 rounded-xl border border-slate-700 bg-slate-950/60 hover:border-slate-600 cursor-pointer transition opacity-70";
        }

        if (noLpInput) {
          noLpInput.readOnly = true;
          noLpInput.disabled = false;
          noLpInput.classList.add('bg-slate-950/80');
          noLpInput.classList.remove('bg-slate-950');
          noLpInput.value = "Menunggu Input & Otorisasi Admin Pusat";
          noLpInput.placeholder = "Otomatis dari Otorisasi Pusat";
          delete noLpInput.dataset.manualEdited;
        }
        if (noAdmInput) {
          noAdmInput.readOnly = true;
          noAdmInput.disabled = false;
          noAdmInput.classList.add('bg-slate-950/80');
          noAdmInput.classList.remove('bg-slate-950');
          noAdmInput.value = "Menunggu Input & Otorisasi Admin Pusat";
          noAdmInput.placeholder = "Otomatis dari Otorisasi Pusat";
          delete noAdmInput.dataset.manualEdited;
        }

        if (banner) {
          banner.className = "p-4 rounded-2xl bg-gradient-to-r from-amber-950/60 via-slate-900 to-indigo-950 border border-amber-500/40 flex flex-wrap items-center justify-between gap-4 shadow-lg";
        }
        if (modeTitle) {
          modeTitle.innerHTML = \`<span class="text-amber-300 font-extrabold text-sm">Mode Akses: Verifikasi &amp; Otorisasi Kantor Pusat</span>\`;
        }
        if (modeDesc) {
          modeDesc.innerHTML = \`<span class="text-slate-300 text-xs">Pengajuan baru dari cabang akan masuk ke antrean verifikasi Kantor Pusat dengan status <strong class="text-amber-400 font-bold">WAITING_APPROVAL</strong> hingga diverifikasi dan diterbitkan nomor oleh Kantor Pusat.</span>\`;
        }

        if (btnSubmit) {
          btnSubmit.textContent = "Ajukan Verifikasi & Approval ke Kantor Pusat";
        }

        // Buka pilihan rekan untuk verifikasi pusat
        const selRekan = document.getElementById('rekan_nama');
        if (selRekan) {
          selRekan.disabled = false;
          selRekan.innerHTML = DATABASE_REKAN.map(r => \`<option value="\${r.nama}">\${r.nama} (\${r.jabatan})</option>\`).join('');
          const nanang = DATABASE_REKAN.find(r => r.nama.includes("Nanang Rahayu"))?.nama || DATABASE_REKAN[0].nama;
          selRekan.value = nanang;
          vlookupRekan();
        }
      }`;

const replPilihMode = `      const auth = window.CURRENT_AUTH_SESSION || dapatkanSesiLogin() || userSession;
      const isSuper = Boolean(auth && (auth.isSuperAdmin || auth.role === 'SUPER_ADMIN' || auth.role === 'ADMIN_PUSAT' || auth.isKing));

      const helperBox = document.getElementById('helper-nomor-terakhir');
      const subWil = document.getElementById('sub-wilayah-info');
      const subTgl = document.getElementById('sub-tanggal-info');
      const selWil = document.getElementById('kantor_wilayah');

      if (mode === 'PRIVATE_CABANG') {
        if (radioPrivate) radioPrivate.checked = true;
        if (radioCentral) radioCentral.checked = false;
        if (labelPrivate) {
          labelPrivate.className = "flex items-start gap-3 p-3.5 rounded-xl border-2 border-emerald-400 bg-emerald-950/30 cursor-pointer transition shadow";
        }
        if (labelCentral) {
          labelCentral.className = "flex items-start gap-3 p-3.5 rounded-xl border border-slate-700 bg-slate-950/60 hover:border-slate-600 cursor-pointer transition opacity-70";
        }

        if (helperBox) helperBox.classList.remove('hidden');
        if (subWil) subWil.classList.add('hidden');
        if (subTgl) subTgl.classList.add('hidden');
        if (selWil) selWil.disabled = false;

        // Buka kunci input nomor SPK dan JO agar bebas diisi manual / counter cabang mandiri
        if (noLpInput) {
          noLpInput.readOnly = false;
          noLpInput.disabled = false;
          noLpInput.classList.remove('pointer-events-none', 'cursor-not-allowed', 'bg-slate-950/80');
          noLpInput.classList.add('bg-slate-950');
        }
        if (noAdmInput) {
          noAdmInput.readOnly = false;
          noAdmInput.disabled = false;
          noAdmInput.classList.remove('pointer-events-none', 'cursor-not-allowed', 'bg-slate-950/80');
          noAdmInput.classList.add('bg-slate-950');
        }

        const code = getKodeCabang(userSession.wilayah);
        const localList = ambilDataPrivatCabang(userSession.wilayah);
        const seq = (localList.length + 1).toString().padStart(4, '0');
        const dSurat = new Date(document.getElementById('tanggal_surat')?.value || new Date());
        const romawi = getBulanRomawi(dSurat);
        const thn = dSurat.getFullYear() || 2026;
        const jenisLap = document.getElementById('jenis_laporan')?.value || 'APP';
        const kodeLap = (jenisLap === 'RTL') ? 'PN-RTL' : 'PN-APP';

        const autoLp = \`\${seq}/NSR-\${code}/\${kodeLap}/\${romawi}/\${thn}\`;
        const autoAdm = \`\${code}-\${seq}\`;

        if (noLpInput) {
          noLpInput.placeholder = \`Bebas / Auto: \${autoLp}\`;
          if (noLpInput.dataset.manualEdited !== "true" || !noLpInput.value || noLpInput.value.includes('Menunggu') || noLpInput.value.includes('[Ditetapkan')) {
            noLpInput.value = autoLp;
          }
        }
        if (noAdmInput) {
          noAdmInput.placeholder = \`Bebas / Auto: \${autoAdm}\`;
          if (noAdmInput.dataset.manualEdited !== "true" || !noAdmInput.value || noAdmInput.value.includes('Menunggu') || noAdmInput.value.includes('[Ditetapkan')) {
            noAdmInput.value = autoAdm;
          }
        }

        if (banner) {
          banner.className = "p-4 rounded-2xl bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-900 border border-emerald-500/40 flex flex-wrap items-center justify-between gap-4 shadow-xl";
        }
        const wil = (userSession && userSession.wilayah) || 'Kantor Cabang';
        const wilNama = wil.replace('Kantor ', '').replace('Cabang ', '');
        if (modeTitle) {
          modeTitle.innerHTML = \`<span class="flex items-center gap-1.5 text-emerald-300 font-extrabold text-sm">⚡ Mode Akses: Mandiri Cabang \${wilNama}</span>\`;
        }
        if (modeDesc) {
          modeDesc.innerHTML = \`<span class="text-emerald-200 text-xs font-medium">Penerbitan SPK &amp; JO Mandiri Kewenangan Rekan Pemimpin Cabang &mdash; Terbit Instan &amp; Tersinkronisasi ke Database Cabang.</span>\`;
        }

        if (btnSubmit) {
          btnSubmit.textContent = (userSession && userSession.role === 'ADMIN_CABANG')
            ? "Simpan & Cetak Instan (Mandiri Cabang)"
            : "Simpan Draft Mandiri Cabang (Verifikasi Admin Cabang)";
        }

        // Kunci Penandatangan ke Rekan Pemimpin Cabang Aktif
        const selRekan = document.getElementById('rekan_nama');
        if (selRekan) {
          const partner = getRekanByWilayah(wil);
          populateDropdownRekan(partner?.nama);
        }
      } else {
        // CENTRAL_APPROVAL
        if (radioCentral) radioCentral.checked = true;
        if (radioPrivate) radioPrivate.checked = false;
        if (labelCentral) {
          labelCentral.className = "flex items-start gap-3 p-3.5 rounded-xl border-2 border-amber-400 bg-amber-950/30 cursor-pointer transition shadow";
        }
        if (labelPrivate) {
          labelPrivate.className = "flex items-start gap-3 p-3.5 rounded-xl border border-slate-700 bg-slate-950/60 hover:border-slate-600 cursor-pointer transition opacity-70";
        }

        if (!isSuper) {
          // ALUR PENGAJU CABANG KE PUSAT: Sembunyikan counter, nomor terakhir, saran, dan kunci nomor SPK/JO
          if (helperBox) helperBox.classList.add('hidden');
          if (subWil) subWil.classList.remove('hidden');
          if (subTgl) subTgl.classList.remove('hidden');
          if (selWil) selWil.disabled = true;

          if (noLpInput) {
            noLpInput.readOnly = true;
            noLpInput.disabled = false;
            noLpInput.classList.add('bg-slate-950/80', 'cursor-not-allowed');
            noLpInput.classList.remove('bg-slate-950');
            noLpInput.value = "";
            noLpInput.placeholder = "[Ditetapkan oleh Admin Pusat saat Approval]";
            delete noLpInput.dataset.manualEdited;
          }
          if (noAdmInput) {
            noAdmInput.readOnly = true;
            noAdmInput.disabled = false;
            noAdmInput.classList.add('bg-slate-950/80', 'cursor-not-allowed');
            noAdmInput.classList.remove('bg-slate-950');
            noAdmInput.value = "";
            noAdmInput.placeholder = "[Ditetapkan oleh Admin Pusat saat Approval]";
            delete noAdmInput.dataset.manualEdited;
          }
        } else {
          // Admin Pusat / SUPER ADMIN KING: Tampilkan kontrol lengkap
          if (helperBox) helperBox.classList.remove('hidden');
          if (subWil) subWil.classList.add('hidden');
          if (subTgl) subTgl.classList.add('hidden');
          if (selWil) selWil.disabled = false;
        }

        if (banner) {
          banner.className = "p-4 rounded-2xl bg-gradient-to-r from-amber-950/60 via-slate-900 to-indigo-950 border border-amber-500/40 flex flex-wrap items-center justify-between gap-4 shadow-lg";
        }
        if (modeTitle) {
          modeTitle.innerHTML = \`<span class="text-amber-300 font-extrabold text-sm">Mode Akses: Verifikasi &amp; Otorisasi Kantor Pusat</span>\`;
        }
        if (modeDesc) {
          modeDesc.innerHTML = \`<span class="text-slate-300 text-xs">Pengajuan baru dari cabang akan masuk ke antrean verifikasi Kantor Pusat dengan status <strong class="text-amber-400 font-bold">WAITING_APPROVAL</strong> hingga diverifikasi dan diterbitkan nomor oleh Kantor Pusat.</span>\`;
        }

        if (btnSubmit) {
          btnSubmit.textContent = "Ajukan Verifikasi & Approval ke Kantor Pusat";
        }

        // Buka pilihan rekan untuk verifikasi pusat
        const selRekan = document.getElementById('rekan_nama');
        if (selRekan) {
          selRekan.disabled = false;
          selRekan.innerHTML = DATABASE_REKAN.map(r => \`<option value="\${r.nama}">\${r.nama} (\${r.jabatan})</option>\`).join('');
          const nanang = DATABASE_REKAN.find(r => r.nama.includes("Nanang Rahayu"))?.nama || DATABASE_REKAN[0].nama;
          selRekan.value = nanang;
          vlookupRekan();
        }
      }`;

content = safeReplace(content, searchPilihMode, replPilihMode);
console.log('Step 3: pilihModeAlur updated.');

// 2. UPDATE updateNomorOtomatisPreview
const searchUpdatePreview = `    function updateNomorOtomatisPreview() {
      const tglStr = document.getElementById('tanggal_surat').value || new Date().toISOString().split('T')[0];
      const d = new Date(tglStr);
      const romawi = getBulanRomawi(d);
      const thn = d.getFullYear() || 2026;

      const elLp = getElLp();
      const elAdm = getElAdm();

      const auth = window.CURRENT_AUTH_SESSION || dapatkanSesiLogin() || userSession;
      const isCabang = Boolean(auth && (auth.isCabang || auth.role === 'ADMIN_CABANG'));
      const isCabangMandiri = isCabang || (currentModeAlur === 'PRIVATE_CABANG' || currentModeAlur === 'MANDIRI');`;

const replUpdatePreview = `    function updateNomorOtomatisPreview() {
      const tglStr = document.getElementById('tanggal_surat').value || new Date().toISOString().split('T')[0];
      const d = new Date(tglStr);
      const romawi = getBulanRomawi(d);
      const thn = d.getFullYear() || 2026;

      const elLp = getElLp();
      const elAdm = getElAdm();

      const auth = window.CURRENT_AUTH_SESSION || dapatkanSesiLogin() || userSession;
      const isSuper = Boolean(auth && (auth.isSuperAdmin || auth.role === 'SUPER_ADMIN' || auth.role === 'ADMIN_PUSAT' || auth.isKing));
      const isCabangMandiri = (currentModeAlur === 'PRIVATE_CABANG' || currentModeAlur === 'MANDIRI');
      const isBranchSubmittingPusat = (!isSuper && (currentModeAlur === 'CENTRAL_APPROVAL' || currentModeAlur === 'PUSAT'));

      const helperBox = document.getElementById('helper-nomor-terakhir');
      const subWil = document.getElementById('sub-wilayah-info');
      const subTgl = document.getElementById('sub-tanggal-info');
      const selWil = document.getElementById('kantor_wilayah');

      if (isBranchSubmittingPusat) {
        if (helperBox) helperBox.classList.add('hidden');
        if (subWil) subWil.classList.remove('hidden');
        if (subTgl) subTgl.classList.remove('hidden');
        if (selWil) selWil.disabled = true;

        if (elLp) {
          elLp.readOnly = true;
          elLp.disabled = false;
          elLp.classList.add('bg-slate-950/80', 'cursor-not-allowed');
          elLp.classList.remove('bg-slate-950');
          elLp.value = "";
          elLp.placeholder = "[Ditetapkan oleh Admin Pusat saat Approval]";
          delete elLp.dataset.manualEdited;
        }
        if (elAdm) {
          elAdm.readOnly = true;
          elAdm.disabled = false;
          elAdm.classList.add('bg-slate-950/80', 'cursor-not-allowed');
          elAdm.classList.remove('bg-slate-950');
          elAdm.value = "";
          elAdm.placeholder = "[Ditetapkan oleh Admin Pusat saat Approval]";
          delete elAdm.dataset.manualEdited;
        }
        validasiDuplikatLive();
        return;
      }`;

content = safeReplace(content, searchUpdatePreview, replUpdatePreview);
console.log('Step 4: updateNomorOtomatisPreview updated.');

// 3. UPDATE handleFormSubmit
const searchFormSubmit = `      const auth = window.CURRENT_AUTH_SESSION || dapatkanSesiLogin() || userSession;
      const isPusat = (userSession.mode === "PUSAT" || (auth && (auth.isSuperAdmin || auth.role === 'ADMIN_PUSAT')));
      const isCabangAdmin = Boolean(auth && (auth.isCabang || auth.role === 'ADMIN_CABANG'));
      const isPrivateCabang = (!isPusat && (currentModeAlur === 'PRIVATE_CABANG' || currentModeAlur === 'MANDIRI' || isCabangAdmin));
      const wilCabang = (auth && (auth.wilayahLabel || auth.wilayah)) || userSession.wilayah || 'Padang';

      let isApproved = isPusat || (isPrivateCabang && isCabangAdmin);
      let noAdm = "";
      let noLp = "";
      let projectId = "";`;

const replFormSubmit = `      const auth = window.CURRENT_AUTH_SESSION || dapatkanSesiLogin() || userSession;
      const isPusat = (userSession.mode === "PUSAT" || (auth && (auth.isSuperAdmin || auth.role === 'ADMIN_PUSAT' || auth.isKing)));
      const isCabangAdmin = Boolean(auth && (auth.isCabang || auth.role === 'ADMIN_CABANG'));
      const isPrivateCabang = (!isPusat && (currentModeAlur === 'PRIVATE_CABANG' || currentModeAlur === 'MANDIRI'));
      const wilCabang = (auth && (auth.wilayahLabel || auth.wilayah)) || userSession.wilayah || 'Padang';

      let isApproved = isPusat || (isPrivateCabang && isCabangAdmin);
      let noAdm = "";
      let noLp = "";
      let projectId = "";`;

content = safeReplace(content, searchFormSubmit, replFormSubmit);
console.log('Step 5: handleFormSubmit updated.');

// 4. UPDATE approveProyekPusat (Independent SPK & JO Counter Calculation + Populating All Section 01 Fields)
const searchApprPusat = `      // Cari counter tertinggi approved
      const cLp = parseInt(String(serverCounter.LAST_NO_LP_SPK || 415).trim(), 10);
      const cAdm = parseInt(String(serverCounter.LAST_NO_ADM_JO || 415).trim(), 10);
      let maxCounter = Math.max(isNaN(cLp) ? 415 : cLp, isNaN(cAdm) ? 415 : cAdm);
      if (maxCounter >= 100000) maxCounter = 415;

      projectDatabase.forEach(item => {
        if (item.status === "APPROVED" || item.mode_pengaju === "PUSAT") {
          const numAdm = extractSeqNumber(item.nomor_adm);
          if (numAdm > maxCounter) maxCounter = numAdm;
          const numLp = extractSeqNumber(item.nomor_lp);
          if (numLp > maxCounter) maxCounter = numLp;
          if (item.id && !item.id.includes('REQ') && !item.id.includes('BDG') && !item.id.includes('PDG') && !item.id.includes('MKS') && !item.id.includes('PLB') && !item.id.includes('PLM')) {
            const numId = extractSeqNumber(item.id);
            if (numId > maxCounter) maxCounter = numId;
          }
        }
      });

      const nextVal = maxCounter + 1;
      const nextNum = nextVal.toString().padStart(4, '0');

      let defaultJenis = 'APP';
      if (p.jenis_laporan === 'RTL' || (p.nomor_lp && p.nomor_lp.includes('PN-RTL'))) {
        defaultJenis = 'RTL';
      }
      const kodeLap = (defaultJenis === 'RTL') ? 'PN-RTL' : 'PN-APP';

      const modal = document.getElementById('modal-approval-pusat');
      if (modal) {
        document.getElementById('appr-target-project-id').value = p.id;
        document.getElementById('appr-info-id').textContent = p.id;
        document.getElementById('appr-info-debitur').textContent = p.debitur_nama || p.Nama_Debitur_Utama || '-';
        document.getElementById('appr-info-wilayah').textContent = p.kantor_wilayah || p.Kantor_Wilayah || '-';
        document.getElementById('appr-info-tanggal').textContent = formatTanggalIndo(p.tanggal_surat || p.tgl_dibuat);

        const elJenis = document.getElementById('appr-jenis-laporan');
        if (elJenis) elJenis.value = defaultJenis;

        const elSaran = document.getElementById('appr-saran-seq');
        if (elSaran) elSaran.textContent = nextNum;

        const elApprLp = document.getElementById('appr-nomor-lp');
        const elApprAdm = document.getElementById('appr-nomor-adm');
        if (elApprLp) elApprLp.value = p.nomor_lp || \`\${nextNum}/NSR/\${kodeLap}/\${romawi}/\${thn}\`;
        if (elApprAdm) elApprAdm.value = p.nomor_adm || \`\${nextNum}/JO/NSR/\${romawi}/\${thn}\`;`;

const replApprPusat = `      // Pemisahan Register SPK dan Register JO Secara Mandiri (Smart Register NSR 2026)
      let maxSpk = parseInt(String(serverCounter.LAST_NO_LP_SPK || 415).trim(), 10) || 415;
      let maxJo = parseInt(String(serverCounter.LAST_NO_ADM_JO || 415).trim(), 10) || 415;
      if (maxSpk >= 100000) maxSpk = 415;
      if (maxJo >= 100000) maxJo = 415;

      projectDatabase.forEach(item => {
        if (item.status === "APPROVED" || item.mode_pengaju === "PUSAT") {
          const sLp = extractSeqNumber(item.nomor_lp);
          if (sLp > maxSpk && sLp < 100000) maxSpk = sLp;
          const sAdm = extractSeqNumber(item.nomor_adm);
          if (sAdm > maxJo && sAdm < 100000) maxJo = sAdm;
        }
      });

      const nextSpk = maxSpk + 1;
      const nextSpkNum = nextSpk.toString().padStart(4, '0');
      const nextJo = maxJo + 1;
      const nextJoNum = nextJo.toString().padStart(4, '0');

      let defaultJenis = 'APP';
      if (p.jenis_laporan === 'RTL' || (p.nomor_lp && p.nomor_lp.includes('PN-RTL'))) {
        defaultJenis = 'RTL';
      }
      const kodeLap = (defaultJenis === 'RTL') ? 'PN-RTL' : 'PN-APP';

      const modal = document.getElementById('modal-approval-pusat');
      if (modal) {
        document.getElementById('appr-target-project-id').value = p.id;
        document.getElementById('appr-info-id').textContent = p.id;
        document.getElementById('appr-info-debitur').textContent = p.debitur_nama || p.Nama_Debitur_Utama || '-';
        document.getElementById('appr-info-wilayah').textContent = p.kantor_wilayah || p.Kantor_Wilayah || 'Kantor Pusat Jakarta';
        document.getElementById('appr-info-tanggal').textContent = formatTanggalIndo(p.tanggal_surat || p.tgl_dibuat);

        // Section 01: 1. Kantor Wilayah Operasional
        const elWil = document.getElementById('appr-kantor-wilayah');
        if (elWil) elWil.value = p.kantor_wilayah || p.Kantor_Wilayah || 'Kantor Pusat Jakarta';

        // Section 01: 2. Tanggal Surat / SPK
        const elTgl = document.getElementById('appr-tanggal-surat');
        if (elTgl) {
          const tglVal = (p.tanggal_surat || p.tgl_dibuat || new Date().toISOString().split('T')[0]).split('T')[0];
          elTgl.value = tglVal;
        }

        // Section 01: 3. Jenis Laporan
        const elJenis = document.getElementById('appr-jenis-laporan');
        if (elJenis) elJenis.value = defaultJenis;

        // Section 01: 4. Smart Register SPK
        const elSpkLast = document.getElementById('appr-spk-last');
        const elSpkSaran = document.getElementById('appr-spk-saran');
        const elSpkSeq = document.getElementById('appr-spk-seq');
        const elApprLp = document.getElementById('appr-nomor-lp');
        if (elSpkLast) elSpkLast.textContent = String(maxSpk).padStart(4, '0');
        if (elSpkSaran) elSpkSaran.textContent = nextSpkNum;

        if (p.nomor_lp && !p.nomor_lp.includes('MENUNGGU') && !p.nomor_lp.includes('Menunggu')) {
          if (elApprLp) elApprLp.value = p.nomor_lp;
          if (elSpkSeq) elSpkSeq.value = extractSeqNumber(p.nomor_lp) || nextSpk;
        } else {
          if (elSpkSeq) elSpkSeq.value = nextSpk;
          if (elApprLp) elApprLp.value = \`\${nextSpkNum}/NSR/\${kodeLap}/\${romawi}/\${thn}\`;
        }

        // Section 01: 5. Smart Register JO
        const elJoLast = document.getElementById('appr-jo-last');
        const elJoSaran = document.getElementById('appr-jo-saran');
        const elJoSeq = document.getElementById('appr-jo-seq');
        const elApprAdm = document.getElementById('appr-nomor-adm');
        if (elJoLast) elJoLast.textContent = String(maxJo).padStart(4, '0');
        if (elJoSaran) elJoSaran.textContent = nextJoNum;

        if (p.nomor_adm && !p.nomor_adm.includes('MENUNGGU') && !p.nomor_adm.includes('Menunggu')) {
          if (elApprAdm) elApprAdm.value = p.nomor_adm;
          if (elJoSeq) elJoSeq.value = extractSeqNumber(p.nomor_adm) || nextJo;
        } else {
          if (elJoSeq) elJoSeq.value = nextJo;
          if (elApprAdm) elApprAdm.value = \`\${nextJoNum}/JO/NSR/\${romawi}/\${thn}\`;
        }`;

content = safeReplace(content, searchApprPusat, replApprPusat);
console.log('Step 6: approveProyekPusat updated.');

// 5. UPDATE eksekusiApprovalPusatSubmit (Save Section 01 fields & update independent counters)
const searchSubmitBody = `      p.nomor_lp = finalLp;
      p.nomor_adm = finalAdm;
      p.jenis_laporan = finalJenis;

      const finalRekKode = document.getElementById('pilihan_rekening_tujuan')?.value || 'MANDIRI';
      const rekObj = DAFTAR_REKENING_NSR[finalRekKode] || DAFTAR_REKENING_NSR.MANDIRI;
      p.rekening_kode = finalRekKode;
      p.rekening_resmi = rekObj.teksCetak;

      p.status = "APPROVED";
      p.status_approval = "APPROVED";
      p.approved_at = new Date().toISOString();
      p.approved_by = 'ADMIN_PUSAT';
      p.disetujui_oleh = \`Admin Pusat (\${userSession.token || 'OTORISASI_PUSAT'})\`;
      p.nomor_spk_pusat = finalLp;`;

const replSubmitBody = `      p.nomor_lp = finalLp;
      p.nomor_adm = finalAdm;
      p.jenis_laporan = finalJenis;
      p.kantor_wilayah = document.getElementById('appr-kantor-wilayah')?.value || p.kantor_wilayah || 'Kantor Pusat Jakarta';
      p.tanggal_surat = document.getElementById('appr-tanggal-surat')?.value || p.tanggal_surat || new Date().toISOString().split('T')[0];

      const finalRekKode = document.getElementById('pilihan_rekening_tujuan')?.value || 'MANDIRI';
      const rekObj = DAFTAR_REKENING_NSR[finalRekKode] || DAFTAR_REKENING_NSR.MANDIRI;
      p.rekening_kode = finalRekKode;
      p.rekening_resmi = rekObj.teksCetak;

      p.status = "APPROVED";
      p.status_approval = "APPROVED";
      p.approved_at = new Date().toISOString();
      p.approved_by = 'ADMIN_PUSAT';
      const isKing = Boolean(auth && (auth.isKing || auth.isSuperAdmin || auth.role === 'SUPER_ADMIN'));
      p.disetujui_oleh = isKing ? \`SUPER ADMIN (KING) (\${userSession.token || 'OTORISASI_KING'})\` : \`Admin Pusat (\${userSession.token || 'OTORISASI_PUSAT'})\`;
      p.nomor_spk_pusat = finalLp;`;

content = safeReplace(content, searchSubmitBody, replSubmitBody);

const searchSubmitCounters = `      const usedSeq = extractSeqNumber(finalAdm) || extractSeqNumber(finalLp);
      if (usedSeq > 0) {
        const cLp = parseInt(String(serverCounter.LAST_NO_LP_SPK || 415).trim(), 10) || 415;
        const cAdm = parseInt(String(serverCounter.LAST_NO_ADM_JO || 415).trim(), 10) || 415;
        const maxVal = Math.max(cLp, cAdm, usedSeq);
        serverCounter.LAST_NO_ADM_JO = maxVal;
        serverCounter.LAST_NO_LP_SPK = maxVal;
        const badgeCounter = document.getElementById('counter-val-badge');
        if (badgeCounter) badgeCounter.textContent = maxVal;
      }`;

const replSubmitCounters = `      const usedSeqLp = extractSeqNumber(finalLp);
      const usedSeqAdm = extractSeqNumber(finalAdm);
      if (usedSeqLp > 0) {
        serverCounter.LAST_NO_LP_SPK = Math.max(serverCounter.LAST_NO_LP_SPK || 415, usedSeqLp);
      }
      if (usedSeqAdm > 0) {
        serverCounter.LAST_NO_ADM_JO = Math.max(serverCounter.LAST_NO_ADM_JO || 415, usedSeqAdm);
      }
      const badgeCounter = document.getElementById('counter-val-badge');
      if (badgeCounter) badgeCounter.textContent = serverCounter.LAST_NO_ADM_JO || 415;`;

content = safeReplace(content, searchSubmitCounters, replSubmitCounters);
console.log('Step 7: eksekusiApprovalPusatSubmit updated.');

fs.writeFileSync(filePath, content, 'utf8');
console.log('All patches to portal-penugasan-jo.html applied successfully!');
