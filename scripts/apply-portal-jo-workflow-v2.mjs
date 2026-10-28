import fs from 'fs';
import path from 'path';

const projectRoot = 'd:/WEB KJPP NSR_Compro new ver/kjpp-nsr-netlify-production';
const htmlPath = path.join(projectRoot, 'portal-penugasan-jo.html');

console.log('Membaca portal-penugasan-jo.html...');
let html = fs.readFileSync(htmlPath, 'utf8');

function replaceExact(source, target, replacement, label) {
    const normSource = source.replace(/\r\n/g, '\n');
    const normTarget = target.replace(/\r\n/g, '\n');
    const normReplacement = replacement.replace(/\r\n/g, '\n');
    if (!normSource.includes(normTarget)) {
        console.error('Target not found for: ' + label);
        console.error('Target snippet:', normTarget.substring(0, 100));
        throw new Error('Target text not found: ' + label);
    }
    const res = normSource.replace(normTarget, normReplacement);
    return res.replace(/\n/g, '\r\n');
}

// ============================================================================
// 1. UPDATE pilihModeAlur AND inisialisasiModeAksesDariUrl (lines ~4187-4476)
// ============================================================================
const targetBlock1Old = `    // Pemilih Alur Kerja (Dual-Mode Alur Cabang)
    function pilihModeAlur(mode) {
      if (mode === 'mandiri' || mode === 'MANDIRI') mode = 'PRIVATE_CABANG';
      if (mode === 'pusat' || mode === 'CENTRAL') mode = 'CENTRAL_APPROVAL';
      currentModeAlur = mode;

      const radioCentral = document.getElementById('alur_kerja_pusat') || document.querySelector('input[value="CENTRAL"]') || document.getElementById('radio-mode-central');
      const radioPrivate = document.getElementById('alur_kerja_mandiri') || document.querySelector('input[value="MANDIRI"]') || document.getElementById('radio-mode-private');
      const labelCentral = document.getElementById('label-mode-central');
      const labelPrivate = document.getElementById('label-mode-private');
      const noLpInput = getElLp();
      const noAdmInput = getElAdm();
      const btnSubmit = document.getElementById('label-btn-submit');
      const modeDesc = document.getElementById('mode-desc');
      const modeTitle = document.getElementById('mode-title');
      const banner = document.getElementById('banner-mode-akses') || document.getElementById('form-mode-banner');

      const auth = window.CURRENT_AUTH_SESSION || dapatkanSesiLogin() || userSession;
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
      }

      // Pastikan dropdown wilayah sinkron dengan sesi cabang pengguna
      setWilayahDropdown(userSession.wilayah);
    }

    function inisialisasiModeAksesDariUrl() {
      const auth = window.CURRENT_AUTH_SESSION || dapatkanSesiLogin() || userSession;
      const isSuper = Boolean(auth && (auth.isSuperAdmin || auth.role === 'SUPER_ADMIN' || auth.role === 'ADMIN_PUSAT' || auth.isKing));
      if (isSuper) {
        currentModeAlur = 'CENTRAL_APPROVAL';
        const containerDualMode = document.getElementById('container-dual-mode');
        if (containerDualMode) {
          containerDualMode.style.display = 'none';
          containerDualMode.classList.add('hidden');
        }
        perbaruiIndikatorTab3(window.DATA_PROYEK_TERPILIH || null);
        return;
      }

      const urlParams = new URLSearchParams(window.location.search);
      const paramMode = urlParams.get('mode');

      // Deteksi token cabang dari auth atau sessionStorage
      let tokenStr = (auth && auth.token) ? auth.token : (sessionStorage.getItem('NSR_SESSION_TOKEN') || '');
      tokenStr = String(tokenStr).toUpperCase();
      const isCabangToken = Boolean(
        (auth && (auth.isCabang || auth.mode === 'CABANG' || auth.role === 'ADMIN_CABANG')) ||
        tokenStr.includes('BDG') ||
        tokenStr.includes('PDG') ||
        tokenStr.includes('MKS') ||
        tokenStr.includes('PLB')
      );

      const isModeMandiri = (paramMode === 'mandiri') || (isCabangToken && paramMode !== 'pusat');

      const containerDualMode = document.getElementById('container-dual-mode');
      const labelCentral = document.getElementById('label-mode-central');
      const labelPrivate = document.getElementById('label-mode-private');
      const radioCentral = document.getElementById('alur_kerja_pusat') || document.querySelector('input[value="CENTRAL"]') || document.getElementById('radio-mode-central');
      const radioPrivate = document.getElementById('alur_kerja_mandiri') || document.querySelector('input[value="MANDIRI"]') || document.getElementById('radio-mode-private');

      // JIKA MEMEGANG TOKEN CABANG DAN TIDAK ADA PARAM ?mode=pusat (ATAU param ?mode=mandiri):
      if (isModeMandiri) {
        // A. Kunci mode ke Mandiri Cabang:
        currentModeAlur = 'MANDIRI';
        
        // B. Sembunyikan total kontainer pemilihan mode & radio pusat:
        if (containerDualMode) containerDualMode.setAttribute('style', 'display: none !important');
        if (labelCentral) labelCentral.setAttribute('style', 'display: none !important');
        if (radioCentral) radioCentral.checked = false;
        if (radioPrivate) radioPrivate.checked = true;

        // Kunci dropdown penandatangan ke rekan cabang aktif
        const selRekan = document.getElementById('rekan_nama');
        if (selRekan) {
          const partner = getRekanByWilayah((auth && (auth.wilayahLabel || auth.wilayah)) || userSession.wilayah);
          populateDropdownRekan(partner?.nama);
        }

        // C. Render Banner Hijau Mandiri Cabang (Preserving mode-title & mode-desc IDs):
        const bannerMode = document.getElementById('banner-mode-akses') || document.getElementById('form-mode-banner');
        if (bannerMode) {
          bannerMode.className = 'p-4 rounded-xl border border-emerald-500/30 bg-emerald-950/20 text-emerald-300 mb-6 flex items-start gap-3';
          bannerMode.innerHTML = \`
            <span class="text-2xl">⚡</span>
            <div>
              <div id="mode-title" class="font-bold text-sm text-emerald-200">Mode Akses: Penerbitan Mandiri \${(auth && auth.wilayahLabel) || 'Cabang'}</div>
              <div id="mode-desc" class="text-xs text-emerald-400/90 mt-0.5">
                Kewenangan Penuh Rekan Pemimpin Cabang (\${(auth && auth.rekanNama) || 'Rekan Cabang'}). Nomor SPK & JO terbit instan dari buku register cabang tanpa antrean Kantor Pusat.
              </div>
            </div>
          \`;
        }

        const btnSubmit = document.getElementById('label-btn-submit');
        if (btnSubmit) {
          btnSubmit.textContent = "Simpan & Cetak Instan (Mandiri Cabang)";
        }

        // D. Input Nomor SPK & JO LANGSUNG TERISI:
        updateNomorOtomatisPreview();
      } else {
        // Mode Pusat
        if (labelPrivate) {
          labelPrivate.style.display = 'none';
          labelPrivate.setAttribute('style', 'display: none !important');
          labelPrivate.classList.add('hidden');
        }
        if (radioPrivate) {
          radioPrivate.checked = false;
        }
        if (containerDualMode) {
          containerDualMode.style.display = 'none';
          containerDualMode.setAttribute('style', 'display: none !important');
          containerDualMode.classList.add('hidden');
        }

        if (radioCentral) {
          radioCentral.checked = true;
        }
        currentModeAlur = 'CENTRAL_APPROVAL';
        pilihModeAlur('CENTRAL_APPROVAL');

        const bannerMode = document.getElementById('banner-mode-akses') || document.getElementById('form-mode-banner');
        if (bannerMode) {
          bannerMode.className = 'p-4 rounded-xl border border-amber-500/30 bg-amber-950/20 text-amber-300 mb-6 flex items-start gap-3';
          bannerMode.innerHTML = \`
            <span class="text-2xl">🏛️</span>
            <div>
              <div id="mode-title" class="font-bold text-sm text-amber-200">Mode Akses: Pengajuan ke Kantor Pusat \${(auth && auth.wilayahLabel) ? '(' + auth.wilayahLabel + ')' : ''}</div>
              <div id="mode-desc" class="text-xs text-amber-400/90 mt-0.5">
                Pengajuan nomor register SPK/JO resmi dan penandatanganan Kantor Pusat (Ir. Nanang Rahayu / Deni Siswandi). Penugasan akan masuk ke antrean approval Kantor Pusat.
              </div>
            </div>
          \`;
        }
      }

      perbaruiIndikatorTab3(window.DATA_PROYEK_TERPILIH || null);
    }`;

const targetBlock1New = `    // -------------------------------------------------------------
    // Evaluasi Dinamis Batasan Kewenangan Profesional Cabang (PP vs PS)
    // PMK 101/2014 & Standar Penilaian Indonesia (SPI 204)
    // Matriks: Bandung = PP; Padang, Makassar, Palembang = PS
    // -------------------------------------------------------------
    function evaluasiKewenanganWorkflowCabang() {
      const auth = window.CURRENT_AUTH_SESSION || dapatkanSesiLogin() || userSession;
      const isSuper = Boolean(auth && (auth.isSuperAdmin || auth.role === 'SUPER_ADMIN' || auth.role === 'ADMIN_PUSAT' || auth.isKing));
      if (isSuper) {
        const warnDiv = document.getElementById('warning-kompetensi-cabang');
        if (warnDiv) warnDiv.classList.add('hidden');
        return { eligible: true, isPS: false, branchName: 'Pusat' };
      }

      const wilRaw = (auth && (auth.wilayahLabel || auth.wilayah)) || userSession.wilayah || document.getElementById('kantor_wilayah')?.value || 'Bandung';
      const branchName = wilRaw.replace(/^(Kantor\\s+Cabang|Cabang|Kantor)\\s+/i, '').trim();

      // Matriks Resmi: Bandung = PP; Padang, Makassar, Palembang = PS
      const isPSBranch = ['Padang', 'Makassar', 'Palembang'].some(b => branchName.toLowerCase().includes(b.toLowerCase()));
      const partner = getRekanByWilayah(branchName);

      const chosenService = document.getElementById('klasifikasi_jasa_penilaian')?.value || 'PROPERTY';
      const jenisObjek = (document.getElementById('jenis_objek')?.value || '').toLowerCase();
      const rawTujuan = (typeof getResolvedTujuanPenilaian === 'function' ? getResolvedTujuanPenilaian() : '').toLowerCase();

      let hasComplexRow = false;
      if (Array.isArray(window.objekRows)) {
        hasComplexRow = window.objekRows.some(row => {
          const t = (row.jenis || row.customJenis || '').toLowerCase();
          return t.includes('hotel') || t.includes('mall') || t.includes('pabrik') || t.includes('industri') || t.includes('apartemen') || t.includes('komersial');
        });
      }

      const isComplex = (
        chosenService === 'PROPERTY' ||
        chosenService === 'BUSINESS' ||
        chosenService === 'PERSONAL_PROPERTY' ||
        jenisObjek.includes('hotel') ||
        jenisObjek.includes('mall') ||
        jenisObjek.includes('pabrik') ||
        jenisObjek.includes('industri') ||
        jenisObjek.includes('apartemen') ||
        jenisObjek.includes('komersial') ||
        rawTujuan.includes('psak') ||
        rawTujuan.includes('laporan keuangan') ||
        (rawTujuan.includes('pengadaan tanah') && !rawTujuan.includes('skala kecil')) ||
        hasComplexRow
      );

      const warnDiv = document.getElementById('warning-kompetensi-cabang');
      const radioPrivate = document.getElementById('alur_kerja_mandiri') || document.querySelector('input[value="MANDIRI"]');
      const labelPrivate = document.getElementById('label-mode-private');
      const warnText = document.getElementById('warning-kompetensi-text');

      if (isPSBranch && isComplex) {
        if (warnDiv) warnDiv.classList.remove('hidden');
        if (warnText) {
          warnText.innerHTML = \`Kantor Cabang \${escapeHtml(branchName)} memiliki izin Penilai Properti Sederhana (PS) atas nama Rekan <strong>\${escapeHtml(partner?.nama || 'Pimpinan Cabang')} (\${escapeHtml(partner?.izin || 'PS')})</strong>. Penugasan ini berklasifikasi Komprehensif / Non-Sederhana. Sesuai regulasi PMK 101/2014 &amp; SPI 204, penugasan ini <strong>WAJIB diajukan via JALUR B (Pengajuan ke Kantor Pusat)</strong> untuk penugasan Penilai Publik berizin Properti P (Ir. Nanang Rahayu / Deni Siswandi).\`;
        }
        if (radioPrivate) {
          radioPrivate.disabled = true;
          radioPrivate.checked = false;
        }
        if (labelPrivate) {
          labelPrivate.classList.add('opacity-50', 'cursor-not-allowed');
          labelPrivate.classList.remove('border-emerald-400', 'bg-emerald-950/30');
          labelPrivate.title = "Kewenangan Mandiri Tidak Berlaku untuk Objek Komprehensif (Wajib Jalur B - Pengajuan Pusat)";
        }
        if (currentModeAlur === 'PRIVATE_CABANG' || currentModeAlur === 'MANDIRI') {
          pilihModeAlur('CENTRAL_APPROVAL');
        }
        return { eligible: false, isPS: true, branchName: branchName };
      } else {
        if (warnDiv) warnDiv.classList.add('hidden');
        if (radioPrivate) {
          radioPrivate.disabled = false;
        }
        if (labelPrivate) {
          labelPrivate.classList.remove('opacity-50', 'cursor-not-allowed');
          labelPrivate.title = "";
        }
        return { eligible: true, isPS: isPSBranch, branchName: branchName };
      }
    }

    // Pemilih Alur Kerja (Dual-Mode Alur Cabang: JALUR A vs JALUR B)
    function pilihModeAlur(mode) {
      if (mode === 'mandiri' || mode === 'MANDIRI') mode = 'PRIVATE_CABANG';
      if (mode === 'pusat' || mode === 'CENTRAL') mode = 'CENTRAL_APPROVAL';

      const auth = window.CURRENT_AUTH_SESSION || dapatkanSesiLogin() || userSession;
      const isSuper = Boolean(auth && (auth.isSuperAdmin || auth.role === 'SUPER_ADMIN' || auth.role === 'ADMIN_PUSAT' || auth.isKing));

      // Jika cabang mencoba memilih Mandiri pada objek komprehensif, evaluasi kelayakan
      if (!isSuper && mode === 'PRIVATE_CABANG') {
        const evalKewenangan = evaluasiKewenanganWorkflowCabang();
        if (!evalKewenangan.eligible) {
          alert(\`Penerbitan Mandiri Cabang Dibatasi:\\n\\nKantor Cabang \${evalKewenangan.branchName} memiliki kewenangan Penilai Properti Sederhana (PS). Objek/Layanan komprehensif ini wajib diajukan melalui JALUR B (Pengajuan ke Kantor Pusat).\`);
          mode = 'CENTRAL_APPROVAL';
        }
      }

      currentModeAlur = mode;

      const radioCentral = document.getElementById('alur_kerja_pusat') || document.querySelector('input[value="CENTRAL"]') || document.getElementById('radio-mode-central');
      const radioPrivate = document.getElementById('alur_kerja_mandiri') || document.querySelector('input[value="MANDIRI"]') || document.getElementById('radio-mode-private');
      const labelCentral = document.getElementById('label-mode-central');
      const labelPrivate = document.getElementById('label-mode-private');
      const noLpInput = getElLp();
      const noAdmInput = getElAdm();
      const btnSubmit = document.getElementById('label-btn-submit');
      const modeDesc = document.getElementById('mode-desc');
      const modeTitle = document.getElementById('mode-title');
      const banner = document.getElementById('banner-mode-akses') || document.getElementById('form-mode-banner');

      const helperBox = document.getElementById('helper-nomor-terakhir');
      const subWil = document.getElementById('sub-wilayah-info');
      const subTgl = document.getElementById('sub-tanggal-info');
      const selWil = document.getElementById('kantor_wilayah');

      const wil = (auth && (auth.wilayahLabel || auth.wilayah)) || userSession.wilayah || 'Bandung';
      const cleanWil = wil.replace(/^(Kantor\\s+Cabang|Cabang|Kantor)\\s+/i, '').trim() || 'Bandung';

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

        const code = getKodeCabang(cleanWil);
        const dSurat = new Date(document.getElementById('tanggal_surat')?.value || new Date());
        const romawi = getBulanRomawi(dSurat);
        const thn = dSurat.getFullYear() || 2026;
        const jenisLap = document.getElementById('jenis_laporan')?.value || 'APP';
        const kodeLap = (jenisLap === 'RTL') ? 'PN-RTL' : 'PN-APP';

        // Minta saran nomor urut dari register cabang di server
        fetch(\`/nolap-data-handler.php?action=suggestNextNumber&kantor=\${encodeURIComponent(cleanWil)}&jenisDokumen=LP_SPK&periode=\${thn}\`, { credentials: 'include' })
          .then(r => r.json())
          .then(data => {
            const nextSeq = data?.kandidatBerikutnya || '0001';
            const lastSeq = data?.nomorTerakhir || 0;
            const elLast = document.getElementById('helper-last-seq');
            const elNext = document.getElementById('helper-next-seq');
            const btnGunakan = document.getElementById('btn-gunakan-saran');
            if (elLast) elLast.textContent = \`[\${String(lastSeq).padStart(4, '0')}]\`;
            if (elNext) elNext.textContent = \`[\${nextSeq}]\`;
            if (btnGunakan) {
              btnGunakan.textContent = \`Gunakan \${nextSeq}\`;
              btnGunakan.dataset.saran = nextSeq;
            }

            const autoLp = \`\${nextSeq}/NSR-\${code}/\${kodeLap}/\${romawi}/\${thn}\`;
            const autoAdm = \`\${code}-\${nextSeq}\`;

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
            validasiDuplikatLive();
          })
          .catch(() => {
            const autoLp = \`0001/NSR-\${code}/\${kodeLap}/\${romawi}/\${thn}\`;
            const autoAdm = \`\${code}-0001\`;
            if (noLpInput && (!noLpInput.value || noLpInput.value.includes('Menunggu') || noLpInput.value.includes('[Ditetapkan'))) {
              noLpInput.value = autoLp;
            }
            if (noAdmInput && (!noAdmInput.value || noAdmInput.value.includes('Menunggu') || noAdmInput.value.includes('[Ditetapkan'))) {
              noAdmInput.value = autoAdm;
            }
            validasiDuplikatLive();
          });

        if (banner) {
          banner.className = "p-4 rounded-2xl bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-900 border border-emerald-500/40 flex flex-wrap items-center justify-between gap-4 shadow-xl";
        }
        if (modeTitle) {
          modeTitle.innerHTML = \`<span class="flex items-center gap-1.5 text-emerald-300 font-extrabold text-sm">⚡ Jalur A: Penerbitan Mandiri Cabang \${cleanWil}</span>\`;
        }
        const partner = getRekanByWilayah(cleanWil);
        if (modeDesc) {
          modeDesc.innerHTML = \`<span class="text-emerald-200 text-xs font-medium">Penerbitan nomor resmi berdasarkan kewenangan Pimpinan Cabang (\${partner?.nama || 'Pimpinan Cabang'}) &amp; kompetensi Penilai Publik (\${partner?.klasifikasi_kode || 'PS'}). Terbit sah dan langsung tersimpan di server.</span>\`;
        }

        if (btnSubmit) {
          btnSubmit.textContent = "Terbitkan Dokumen Resmi (Mandiri Cabang)";
        }

        // Kunci dropdown penandatangan ke rekan cabang aktif
        const selRekan = document.getElementById('rekan_nama');
        if (selRekan) {
          populateDropdownRekan(partner?.nama);
        }
      } else {
        // CENTRAL_APPROVAL (JALUR B)
        if (radioCentral) radioCentral.checked = true;
        if (radioPrivate) radioPrivate.checked = false;
        if (labelCentral) {
          labelCentral.className = "flex items-start gap-3 p-3.5 rounded-xl border-2 border-amber-400 bg-amber-950/30 cursor-pointer transition shadow";
        }
        if (labelPrivate) {
          labelPrivate.className = "flex items-start gap-3 p-3.5 rounded-xl border border-slate-700 bg-slate-950/60 hover:border-slate-600 cursor-pointer transition opacity-70";
        }

        if (!isSuper) {
          // Cabang ke Pusat: sembunyikan counter saran dan kunci input nomor
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
          // Admin Pusat / SUPER ADMIN KING
          if (helperBox) helperBox.classList.remove('hidden');
          if (subWil) subWil.classList.add('hidden');
          if (subTgl) subTgl.classList.add('hidden');
          if (selWil) selWil.disabled = false;
        }

        if (banner) {
          banner.className = "p-4 rounded-2xl bg-gradient-to-r from-amber-950/60 via-slate-900 to-indigo-950 border border-amber-500/40 flex flex-wrap items-center justify-between gap-4 shadow-lg";
        }
        if (modeTitle) {
          modeTitle.innerHTML = \`<span class="text-amber-300 font-extrabold text-sm">⏳ Jalur B: Pengajuan Verifikasi ke Kantor Pusat</span>\`;
        }
        if (modeDesc) {
          modeDesc.innerHTML = \`<span class="text-slate-300 text-xs">Permohonan diajukan ke antrean verifikasi Kantor Pusat dengan status <strong class="text-amber-400 font-bold">WAITING_APPROVAL</strong>. Nomor SPK &amp; JO resmi ditetapkan Admin Kantor Pusat setelah verifikasi dokumen &amp; kewenangan.</span>\`;
        }

        if (btnSubmit) {
          btnSubmit.textContent = "Ajukan Verifikasi & Penetapan Nomor ke Kantor Pusat";
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
      }

      setWilayahDropdown(userSession.wilayah);
      validasiDuplikatLive();
    }

    function inisialisasiModeAksesDariUrl() {
      const auth = window.CURRENT_AUTH_SESSION || dapatkanSesiLogin() || userSession;
      const isSuper = Boolean(auth && (auth.isSuperAdmin || auth.role === 'SUPER_ADMIN' || auth.role === 'ADMIN_PUSAT' || auth.isKing));
      if (isSuper) {
        currentModeAlur = 'CENTRAL_APPROVAL';
        const containerDualMode = document.getElementById('container-dual-mode');
        if (containerDualMode) {
          containerDualMode.style.display = 'none';
          containerDualMode.classList.add('hidden');
        }
        perbaruiIndikatorTab3(window.DATA_PROYEK_TERPILIH || null);
        return;
      }

      const urlParams = new URLSearchParams(window.location.search);
      const paramMode = urlParams.get('mode');

      // Tampilkan kontainer pemilihan alur kerja untuk pengguna cabang
      const containerDualMode = document.getElementById('container-dual-mode');
      if (containerDualMode) {
        containerDualMode.style.display = '';
        containerDualMode.classList.remove('hidden');
      }

      const labelCentral = document.getElementById('label-mode-central');
      const labelPrivate = document.getElementById('label-mode-private');
      if (labelCentral) {
        labelCentral.style.display = '';
        labelCentral.classList.remove('hidden');
      }
      if (labelPrivate) {
        labelPrivate.style.display = '';
        labelPrivate.classList.remove('hidden');
      }

      // Default mode untuk cabang: Jalur A (Mandiri Cabang), kecuali paramMode === 'pusat'
      if (paramMode === 'pusat') {
        pilihModeAlur('CENTRAL_APPROVAL');
      } else {
        pilihModeAlur('PRIVATE_CABANG');
      }

      // Evaluasi batasan kewenangan
      evaluasiKewenanganWorkflowCabang();
      perbaruiIndikatorTab3(window.DATA_PROYEK_TERPILIH || null);
    }`;

html = replaceExact(html, targetBlock1Old, targetBlock1New, 'Block 1: pilihModeAlur & inisialisasiModeAksesDariUrl');
console.log('✓ Block 1 berhasil diperbarui!');

// ============================================================================
// 2. UPDATE handleFormSubmit: Make async & implement server atomic persist
// ============================================================================
const targetBlock2AOld = `    function handleFormSubmit(event) {`;
const targetBlock2ANew = `    async function handleFormSubmit(event) {`;

html = replaceExact(html, targetBlock2AOld, targetBlock2ANew, 'Block 2A: async handleFormSubmit');
console.log('✓ Block 2A berhasil diperbarui (async handleFormSubmit)!');

const targetBlock2BOld = `      if (isPrivateCabang) {
        // Simpan eksklusif ke local private storage milik cabang (Zero-Cloud)
        const localList = ambilDataPrivatCabang(wilCabang);
        localList.unshift(newProject);
        simpanDataPrivatCabang(wilCabang, localList);
        window.DATA_PROYEK_TERPILIH = newProject;
        activeProjectData = newProject;
        renderDashboardTabel();

        if (btnSubmit) {
          delete btnSubmit.dataset.submitting;
          btnSubmit.disabled = false;
          if (labelSubmit) labelSubmit.textContent = origSubmitText;
          validasiDuplikatLive();
        }

        if (isCabangAdmin) {
          alert(\`Sukses! Data penugasan disimpan secara PRIVAT MANDIRI CABANG (100% Zero-Cloud):\\n\\n• ID: \${projectId}\\n• No. SPK: \${noLp}\\n• No. Adm JO: \${noAdm}\\n\\nStatus: APPROVED (🔒 MANDIRI CABANG).\\nDokumen Anda langsung siap dicetak tanpa menunggu server pusat.\`);
          gantiTab(3);
        } else {
          alert(\`Sukses! Data draft penugasan disimpan secara PRIVAT MANDIRI CABANG:\\n\\n• ID: \${projectId}\\n• Status: Menunggu Verifikasi Admin Cabang.\`);
          pindahTab('dashboard');
        }
        return;
      }

      // Jika ALUR 1 (Central Approval) atau Pusat:
      projectDatabase.unshift(newProject);
      simpanDatabaseLokal();
      activeProjectData = newProject;

      // Kirim sinkronisasi otomatis ke Google Spreadsheet
      kirimDataKeGasServer('CREATE_SUBMISSION', newProject);

      if (btnSubmit) {
        delete btnSubmit.dataset.submitting;
        btnSubmit.disabled = false;
        if (labelSubmit) labelSubmit.textContent = origSubmitText;
        validasiDuplikatLive();
      }

      if (isApproved) {
        alert("Sukses! Data penugasan berhasil disimpan dan nomor resmi langsung diterbitkan:\\n\\n• ID Penugasan: " + projectId + "\\n• No. SPK: " + noLp + "\\n• No. Adm JO: " + noAdm);
        pindahTab('preview');
      } else {
        alert("Sukses! Pengajuan penugasan berhasil diajukan ke antrean Kantor Pusat.\\nID: " + projectId + "\\nStatus: WAITING_APPROVAL.\\nSilakan tunggu verifikasi admin pusat.");
        pindahTab('dashboard');
      }`;

const targetBlock2BNew = `      if (isPrivateCabang) {
        // Validasi Pre-Submit PP vs PS (PMK 101/2014 & SPI 204)
        const chosenService = document.getElementById('klasifikasi_jasa_penilaian')?.value || 'PROPERTY';
        const partnerInfo = getRekanByWilayah(wilCabang);
        if (partnerInfo && partnerInfo.klasifikasi_kode === 'PS') {
          const evalRes = (typeof evaluasiKelayakanPenilai === 'function') ? evaluasiKelayakanPenilai(partnerInfo) : null;
          if (evalRes && evalRes.warning) {
            alert("Penerbitan Mandiri Ditolak:\\n\\n" + evalRes.message + "\\n\\nMohon alihkan alur kerja ke Jalur B (Pengajuan Verifikasi ke Kantor Pusat).");
            if (btnSubmit) {
              delete btnSubmit.dataset.submitting;
              btnSubmit.disabled = false;
              if (labelSubmit) labelSubmit.textContent = origSubmitText;
            }
            return;
          }
        }

        try {
          const payloadMandiri = {
            idPenugasan: projectId,
            kantorWilayah: wilCabang,
            nomorLpResmi: noLp,
            nomorAdmResmi: noAdm,
            tanggalSurat: tglStr,
            jenisLaporan: jenisLap,
            serviceClassification: chosenService,
            jenisObjek: document.getElementById('jenis_objek')?.value || 'Tanah dan Bangunan',
            tujuanPenilaian: rawTujuan,
            namaKlien: namaPemberiTugas,
            namaDebitur: document.getElementById('debitur_nama')?.value.trim().toUpperCase() || '-',
            rekanNama: rekanSelected.nama,
            rekanIzin: rekanSelected.izin,
            pengaju: {
              nama: pNama,
              nik: pNik,
              jabatan: pJabatan,
              email: pEmail,
              whatsapp_number: pWa
            },
            projectData: newProject
          };

          const resp = await fetch('/nolap-data-handler.php?action=publishMandiriCabangLP', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(payloadMandiri)
          });

          const resData = await resp.json();
          if (!resp.ok || !resData.success) {
            alert("Gagal Menerbitkan Mandiri Cabang:\\n\\n" + (resData.error || ("HTTP " + resp.status)));
            if (btnSubmit) {
              delete btnSubmit.dataset.submitting;
              btnSubmit.disabled = false;
              if (labelSubmit) labelSubmit.textContent = origSubmitText;
            }
            return;
          }

          // Sinkronisasi data resmi yang diterbitkan server
          newProject.nomor_lp = resData.nomorLpResmi || noLp;
          newProject.nomor_adm = resData.nomorAdmResmi || noAdm;
          newProject.disetujui_oleh = resData.diterbitkanOleh || ("Pimpinan Cabang (" + rekanSelected.nama + ")");
          newProject.status = "APPROVED";
          newProject.status_approval = "APPROVED_CABANG";
          newProject.jalur_penerbitan = "MANDIRI_CABANG";

          // Simpan ke antrean lokal dan dashboard
          const localList = ambilDataPrivatCabang(wilCabang);
          localList.unshift(newProject);
          simpanDataPrivatCabang(wilCabang, localList);
          projectDatabase.unshift(newProject);
          simpanDatabaseLokal();

          window.DATA_PROYEK_TERPILIH = newProject;
          activeProjectData = newProject;
          renderDashboardTabel();

          if (btnSubmit) {
            delete btnSubmit.dataset.submitting;
            btnSubmit.disabled = false;
            if (labelSubmit) labelSubmit.textContent = origSubmitText;
            validasiDuplikatLive();
          }

          alert(\`Sukses! Dokumen Lingkup Penugasan (SPK) & JO Mandiri Cabang RESMI DITERBITKAN & TERSIMPAN DI SERVER:\\n\\n• ID: \${projectId}\\n• No. SPK: \${newProject.nomor_lp}\\n• No. JO: \${newProject.nomor_adm}\\n• Otorisasi: \${newProject.disetujui_oleh}\\n\\nStatus: APPROVED_CABANG (Tersimpan Permanen Server).\\nDokumen resmi Anda langsung siap dicetak di Tab 3.\`);
          gantiTab(3);
        } catch (err) {
          alert("Terjadi kesalahan jaringan saat menyimpan ke server: " + err.message);
          if (btnSubmit) {
            delete btnSubmit.dataset.submitting;
            btnSubmit.disabled = false;
            if (labelSubmit) labelSubmit.textContent = origSubmitText;
          }
        }
        return;
      }

      // Jika JALUR B (Pengajuan Cabang ke Kantor Pusat):
      if (!isApproved) {
        try {
          const payloadPusat = {
            idPenugasan: projectId,
            kantorWilayah: newProject.kantor_wilayah,
            serviceClassification: document.getElementById('klasifikasi_jasa_penilaian')?.value || 'PROPERTY',
            jenisObjek: document.getElementById('jenis_objek')?.value || 'Tanah dan Bangunan',
            tujuanPenilaian: rawTujuan,
            namaKlien: namaPemberiTugas,
            namaDebitur: document.getElementById('debitur_nama')?.value.trim().toUpperCase() || '-',
            pengaju: {
              nama: pNama,
              nik: pNik,
              jabatan: pJabatan,
              email: pEmail,
              whatsapp_number: pWa
            },
            projectData: newProject
          };

          const resp = await fetch('/nolap-data-handler.php?action=submitPengajuanPusatLP', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(payloadPusat)
          });
          const resData = await resp.json();
          if (resData && resData.success) {
            newProject.jalur_penerbitan = 'PENGAJUAN_PUSAT';
            newProject.status = 'WAITING_APPROVAL';
            newProject.status_approval = 'WAITING_APPROVAL';
          }
        } catch (err) {
          console.warn('Gagal persist ke backend pusat, fallback sync:', err);
        }
      }

      projectDatabase.unshift(newProject);
      simpanDatabaseLokal();
      activeProjectData = newProject;

      // Kirim sinkronisasi otomatis ke Google Spreadsheet
      kirimDataKeGasServer('CREATE_SUBMISSION', newProject);

      if (btnSubmit) {
        delete btnSubmit.dataset.submitting;
        btnSubmit.disabled = false;
        if (labelSubmit) labelSubmit.textContent = origSubmitText;
        validasiDuplikatLive();
      }

      if (isApproved) {
        alert("Sukses! Data penugasan berhasil disimpan dan nomor resmi langsung diterbitkan:\\n\\n• ID Penugasan: " + projectId + "\\n• No. SPK: " + noLp + "\\n• No. Adm JO: " + noAdm);
        pindahTab('preview');
      } else {
        alert("Sukses! Pengajuan penugasan berhasil diajukan ke antrean Kantor Pusat.\\nID: " + projectId + "\\nStatus: WAITING_APPROVAL (Menunggu Verifikasi & Approval Admin Pusat).\\nSilakan pantau status di Tab 2 (Dashboard).");
        pindahTab('dashboard');
      }`;

html = replaceExact(html, targetBlock2BOld, targetBlock2BNew, 'Block 2B: handleFormSubmit body');
console.log('✓ Block 2B berhasil diperbarui (atomic server persist)!');

// ============================================================================
// 3. UPDATE renderDashboardTabel: Filter Jalur & Badges
// ============================================================================
const targetBlock3AOld = `      const fStatus = document.getElementById('filter_status')?.value || 'ALL';
      const fWil = document.getElementById('filter_wilayah')?.value || 'ALL';
      const fPic = document.getElementById('filter_pic')?.value || 'ALL';
      const fPeriode = document.getElementById('filter_periode')?.value || 'ALL';
      const query = document.getElementById('cari_proyek')?.value.toLowerCase().trim() || '';`;

const targetBlock3ANew = `      const fStatus = document.getElementById('filter_status')?.value || 'ALL';
      const fJalur = document.getElementById('filter_jalur')?.value || 'ALL';
      const fWil = document.getElementById('filter_wilayah')?.value || 'ALL';
      const fPic = document.getElementById('filter_pic')?.value || 'ALL';
      const fPeriode = document.getElementById('filter_periode')?.value || 'ALL';
      const query = document.getElementById('cari_proyek')?.value.toLowerCase().trim() || '';`;

html = replaceExact(html, targetBlock3AOld, targetBlock3ANew, 'Block 3A: filter_jalur declaration');
console.log('✓ Block 3A berhasil diperbarui!');

const targetBlock3BOld = `      // Saring basis metrik sesuai filter non-status (Wilayah, PIC, Periode, Query)
      const baseForMetrics = combined.filter(p => {
        // Filter Wilayah (hanya untuk pusat)
        if (!isCabangUser && fWil !== "ALL" && p.kantor_wilayah !== fWil) return false;`;

const targetBlock3BNew = `      // Saring basis metrik sesuai filter non-status (Wilayah, PIC, Periode, Query)
      const baseForMetrics = combined.filter(p => {
        // Filter Jalur Penerbitan Resmi
        if (fJalur === "MANDIRI_CABANG") {
          const isMandiri = (p.jalur_penerbitan === 'MANDIRI_CABANG' || p.status_approval === 'APPROVED_CABANG' || p.is_private || p.mode_alur === 'MANDIRI');
          if (!isMandiri) return false;
        } else if (fJalur === "PENGAJUAN_PUSAT") {
          const isMandiri = (p.jalur_penerbitan === 'MANDIRI_CABANG' || p.status_approval === 'APPROVED_CABANG' || p.is_private || p.mode_alur === 'MANDIRI');
          if (isMandiri) return false;
        }

        // Filter Wilayah (hanya untuk pusat)
        if (!isCabangUser && fWil !== "ALL" && p.kantor_wilayah !== fWil) return false;`;

html = replaceExact(html, targetBlock3BOld, targetBlock3BNew, 'Block 3B: baseForMetrics fJalur filter');
console.log('✓ Block 3B berhasil diperbarui!');

const targetBlock3COld = `      const s1 = document.getElementById('filter_status'); if (s1) s1.value = 'ALL';
      const s2 = document.getElementById('filter_wilayah'); if (s2) s2.value = 'ALL';`;

const targetBlock3CNew = `      const s1 = document.getElementById('filter_status'); if (s1) s1.value = 'ALL';
      const sJalur = document.getElementById('filter_jalur'); if (sJalur) sJalur.value = 'ALL';
      const s2 = document.getElementById('filter_wilayah'); if (s2) s2.value = 'ALL';`;

html = replaceExact(html, targetBlock3COld, targetBlock3CNew, 'Block 3C: resetSemuaFilterMonitoring');
console.log('✓ Block 3C berhasil diperbarui!');

const targetBlock3DOld = `        const isAnyFilterActive = (fStatus !== 'ALL') || (!isCabangUser && fWil !== 'ALL') || (fPic !== 'ALL') || (fPeriode !== 'ALL') || Boolean(query);`;
const targetBlock3DNew = `        const isAnyFilterActive = (fStatus !== 'ALL') || (fJalur !== 'ALL') || (!isCabangUser && fWil !== 'ALL') || (fPic !== 'ALL') || (fPeriode !== 'ALL') || Boolean(query);`;

html = replaceExact(html, targetBlock3DOld, targetBlock3DNew, 'Block 3D: isAnyFilterActive');
console.log('✓ Block 3D berhasil diperbarui!');

const targetBlock3EOld = `        // Status Badge Pekerjaan
        let statusBadge = "";
        if (p.is_private) {
          statusBadge = \`<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9.5px] font-black uppercase bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
               🔒 MANDIRI CABANG
             </span>\`;
        } else if (isSelesai) {
          statusBadge = \`<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9.5px] font-black uppercase bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold">
               ✔ SELESAI
             </span>\`;
        } else if (isApproved) {
          statusBadge = \`<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9.5px] font-black uppercase bg-sky-500/10 text-sky-400 border border-sky-500/20">
               <span class="w-1.5 h-1.5 rounded-full bg-sky-400"></span> SPK Terbit (Aktif)
             </span>\`;
        } else {
          statusBadge = \`<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9.5px] font-black uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20">
               <span class="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span> Menunggu Otorisasi
             </span>\`;
        }`;

const targetBlock3ENew = `        // Status Badge Pekerjaan (Pemisahan JALUR A vs JALUR B)
        let statusBadge = "";
        const isMandiri = (p.jalur_penerbitan === 'MANDIRI_CABANG' || p.status_approval === 'APPROVED_CABANG' || p.is_private || p.mode_alur === 'MANDIRI');
        if (isMandiri) {
          statusBadge = \`<div class="space-y-0.5">
            <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9.5px] font-black uppercase bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
              ⚡ MANDIRI CABANG
            </span>
            <span class="block text-[9px] text-emerald-400/90 truncate max-w-[140px]">\${escapeHtml(p.disetujui_oleh || p.approved_by || 'Pimpinan Cabang')}</span>
          </div>\`;
        } else if (isSelesai) {
          statusBadge = \`<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9.5px] font-black uppercase bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold">
               ✔ SELESAI
             </span>\`;
        } else if (isApproved) {
          statusBadge = \`<div class="space-y-0.5">
            <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9.5px] font-black uppercase bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <span class="w-1.5 h-1.5 rounded-full bg-sky-400"></span> DISETUJUI PUSAT
            </span>
            <span class="block text-[9px] text-sky-300/80 truncate max-w-[140px]">\${escapeHtml(p.disetujui_oleh || 'Admin Pusat')}</span>
          </div>\`;
        } else {
          statusBadge = \`<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9.5px] font-black uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20">
               <span class="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span> Menunggu Approval Pusat
             </span>\`;
        }`;

html = replaceExact(html, targetBlock3EOld, targetBlock3ENew, 'Block 3E: statusBadge render');
console.log('✓ Block 3E berhasil diperbarui!');

// ============================================================================
// 4. ATTACH LISTENERS FOR DYNAMIC GUARD
// ============================================================================
const targetBlock4Old = `    // Inisialisasi saat form dimuat
    document.addEventListener('DOMContentLoaded', () => {
      const selTujuan = document.getElementById('maksud_tujuan_penilaian');
      if (selTujuan) {
        renderChecklistMitigasiAwal(selTujuan.value);
        if (typeof populateDropdownRekan === 'function') populateDropdownRekan();
        if (typeof renderRosterPenilaiPublik === 'function') renderRosterPenilaiPublik();
        selTujuan.addEventListener('change', () => renderChecklistMitigasiAwal(selTujuan.value));
      }
    });`;

const targetBlock4New = `    // Inisialisasi saat form dimuat & Pasang Dynamic Guard Kewenangan
    document.addEventListener('DOMContentLoaded', () => {
      const selTujuan = document.getElementById('maksud_tujuan_penilaian');
      if (selTujuan) {
        renderChecklistMitigasiAwal(selTujuan.value);
        if (typeof populateDropdownRekan === 'function') populateDropdownRekan();
        if (typeof renderRosterPenilaiPublik === 'function') renderRosterPenilaiPublik();
        selTujuan.addEventListener('change', () => {
          renderChecklistMitigasiAwal(selTujuan.value);
          evaluasiKewenanganWorkflowCabang();
        });
      }

      // Pasang listener pada perubahan klasifikasi jasa & jenis objek
      const elKlas = document.getElementById('klasifikasi_jasa_penilaian');
      if (elKlas) elKlas.addEventListener('change', evaluasiKewenanganWorkflowCabang);

      const elObj = document.getElementById('jenis_objek');
      if (elObj) elObj.addEventListener('change', evaluasiKewenanganWorkflowCabang);

      const elWil = document.getElementById('kantor_wilayah');
      if (elWil) elWil.addEventListener('change', evaluasiKewenanganWorkflowCabang);
    });`;

html = replaceExact(html, targetBlock4Old, targetBlock4New, 'Block 4: DOMContentLoaded listeners');
console.log('✓ Block 4 berhasil diperbarui!');

fs.writeFileSync(htmlPath, html, 'utf8');
console.log('🎉 SELURUH PEMBARUAN PORTAL-PENUGASAN-JO.HTML BERHASIL DISIMPAN!');
