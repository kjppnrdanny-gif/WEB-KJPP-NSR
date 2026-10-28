import fs from 'node:fs';
import path from 'node:path';

const filePath = path.resolve('portal-nolap.html');
let raw = fs.readFileSync(filePath, 'utf8');
const hadCrlf = raw.includes('\r\n');
let content = raw.replace(/\r\n/g, '\n');

console.log('Original content length (raw):', raw.length, 'hadCrlf:', hadCrlf);

// 1. Update Preview Box (Title & Sub-badges)
const targetPreview = `<div class="text-[11px] text-amber-300 font-mono mb-1 font-semibold">USULAN FORMAT PENGAJUAN (NOMOR URUT RESMI DITETAPKAN &amp; DITERBITKAN OLEH PETUGAS ADMIN PUSAT):</div>
            <div id="live-nomor-laporan" class="text-base sm:text-2xl font-black font-mono text-amber-400 tracking-wider break-all select-all">
              [NO. URUT PUSAT]/2.0160-00/PI/07/00581/1/X/2026
            </div>`;

const replacePreview = `<div class="text-[11px] text-amber-300 font-mono mb-1 font-semibold">USULAN NOMOR — BELUM DEFINITIF (NOMOR URUT RESMI DITETAPKAN &amp; DITERBITKAN OLEH PETUGAS ADMIN PUSAT):</div>
            <div id="live-nomor-laporan" class="text-base sm:text-2xl font-black font-mono text-amber-400 tracking-wider break-all select-all">
              [NO. URUT PUSAT]/2.0160-00/PI/07/0218/1/X/2026
            </div>
            <!-- Sub-label pemisahan asal permohonan vs kewenangan TTD vs penilai publik -->
            <div class="flex flex-wrap items-center justify-center gap-2 mt-2 pt-2 border-t border-slate-800 text-[11px]">
              <span class="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-medium" id="badge-preview-asal">Asal Permohonan: Kantor Pusat [2.0160-00]</span>
              <span class="px-2.5 py-0.5 rounded-full bg-amber-950/70 text-amber-300 border border-amber-700/50 font-medium" id="badge-preview-ttd">Kewenangan TTD: Kantor Pusat Jakarta [2.0160-00]</span>
              <span class="px-2.5 py-0.5 rounded-full bg-emerald-950/70 text-emerald-300 border border-emerald-700/50 font-medium" id="badge-preview-penilai">Penilai: Ir. Nanang Rahayu [0218]</span>
            </div>`;

if (!content.includes(targetPreview)) {
  throw new Error('targetPreview not found in portal-nolap.html');
}
content = content.replace(targetPreview, replacePreview);
console.log('✓ [1/8] Preview card updated.');

// 2. Update Section A Form Fields
const targetSectionA = `<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div>
              <label class="block font-semibold text-slate-300 mb-1">Kewenangan Ttd *</label>
              <select id="f-cabang" onchange="onCabangChange()" required class="w-full h-10 px-3 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-amber-400">
                <option value="Pusat" data-kode="2.0160-00">Pusat (2.0160-00)</option>
                <option value="Padang" data-kode="2.0160-02">Cabang Padang (2.0160-02)</option>
                <option value="Makassar" data-kode="2.0160-03">Cabang Makassar (2.0160-03)</option>
                <option value="Bandung" data-kode="2.0160-04">Cabang Bandung (2.0160-04)</option>
                <option value="Palembang" data-kode="2.0160-05">Cabang Palembang (2.0160-05)</option>
              </select>
            </div>

            <div>
              <label class="block font-semibold text-slate-300 mb-1">Nama Pemohon (Penilai/Staf) *</label>
              <input type="text" id="f-pemohon" required placeholder="Contoh: Zahra / Tedi Setiadi" class="w-full h-10 px-3 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-amber-400">
            </div>

            <div>
              <label class="block font-semibold text-slate-300 mb-1">Jabatan Pemohon *</label>
              <input type="text" id="f-jabatan" required placeholder="Contoh: Admin / Penilai Muda" class="w-full h-10 px-3 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-amber-400">
            </div>

            <div>
              <label class="block font-semibold text-slate-300 mb-1">Email Pemohon *</label>
              <input type="email" id="f-email-pemohon" required placeholder="email@kjppnanangrahayu.com" class="w-full h-10 px-3 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-amber-400">
            </div>

            <div>
              <label class="block font-semibold text-slate-300 mb-1">WhatsApp Pemohon *</label>
              <input type="tel" id="f-wa-pemohon" required placeholder="0812... / 628..." class="w-full h-10 px-3 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-amber-400">
            </div>

            <div>
              <label class="block font-semibold text-slate-300 mb-1">Penilai Penandatangan Laporan *</label>
              <select id="f-penilai" onchange="onPenilaiChange()" required class="w-full h-10 px-3 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-amber-400">
                <option value="Deni Siswandi" data-izin="00581">Deni Siswandi — Izin: 00581</option>
                <option value="Nanang Rahayu" data-izin="0218">Ir. Nanang Rahayu — Izin: 0218</option>
                <option value="Dharma Priyanto Sih Budi Susilo" data-izin="PS.0249">Dharma Priyanto S.B.S. — Izin: PS.0249</option>
                <option value="Hernita" data-izin="PS.0046">Hernita — Izin: PS.0046</option>
                <option value="Muhammad Amin Sade" data-izin="PS.0126">Muhammad Amin Sade — Izin: PS.0126</option>
              </select>
            </div>`;

const replaceSectionA = `<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div>
              <label class="block font-semibold text-slate-300 mb-1">Asal Kantor Permohonan *</label>
              <select id="f-cabang" onchange="onAsalCabangChange()" required class="w-full h-10 px-3 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-amber-400">
                <option value="Pusat" data-kode="2.0160-00">Kantor Pusat Jakarta (2.0160-00)</option>
                <option value="Padang" data-kode="2.0160-01">Kantor Cabang Padang (2.0160-01)</option>
                <option value="Makassar" data-kode="2.0160-02">Kantor Cabang Makassar (2.0160-02)</option>
                <option value="Bandung" data-kode="2.0160-04">Kantor Cabang Bandung (2.0160-04)</option>
                <option value="Palembang" data-kode="2.0160-03">Kantor Cabang Palembang (2.0160-03)</option>
              </select>
              <div id="badge-asal-cabang-lock" class="hidden w-full h-10 px-3 rounded-lg bg-slate-900 border border-slate-700 text-amber-300 flex items-center justify-between text-xs font-semibold">
                <span id="text-asal-cabang-lock">Kantor Cabang Makassar</span>
                <span id="kode-asal-cabang-lock" class="px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 font-mono text-[10px]">2.0160-02</span>
              </div>
            </div>

            <div>
              <label class="block font-semibold text-amber-300 mb-1">Kewenangan Tanda Tangan Laporan *</label>
              <select id="f-kewenangan-ttd" onchange="onKewenanganTtdChange()" required class="w-full h-10 px-3 rounded-lg bg-slate-950 border border-amber-500/50 text-amber-300 font-semibold focus:outline-none focus:border-amber-400">
                <option value="PUSAT" data-kode="2.0160-00" selected>🏛️ Kantor Pusat Jakarta (2.0160-00) — TTD Penilai Publik Pusat</option>
                <option value="CABANG" data-kode="2.0160-02" id="opt-ttd-cabang">🏢 Rekan Cabang Sendiri — TTD Pimpinan Rekan Cabang</option>
              </select>
            </div>

            <div>
              <label class="block font-semibold text-slate-300 mb-1">Penilai Penandatangan Laporan *</label>
              <select id="f-penilai" onchange="onPenilaiChange()" required class="w-full h-10 px-3 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-amber-400">
                <option value="Nanang Rahayu" data-izin="0218">Ir. Nanang Rahayu — Izin: 0218 (Pimpinan Rekan Pusat)</option>
                <option value="Deni Siswandi" data-izin="00581">Deni Siswandi — Izin: 00581 (Penilai Rekan / Divtek)</option>
              </select>
            </div>

            <div>
              <label class="block font-semibold text-slate-300 mb-1">Nama Pemohon (Penilai/Staf) *</label>
              <input type="text" id="f-pemohon" required placeholder="Contoh: Zahra / Tedi Setiadi" class="w-full h-10 px-3 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-amber-400">
            </div>

            <div>
              <label class="block font-semibold text-slate-300 mb-1">Jabatan Pemohon *</label>
              <input type="text" id="f-jabatan" required placeholder="Contoh: Admin / Penilai Muda" class="w-full h-10 px-3 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-amber-400">
            </div>

            <div>
              <label class="block font-semibold text-slate-300 mb-1">Email Pemohon *</label>
              <input type="email" id="f-email-pemohon" required placeholder="email@kjppnanangrahayu.com" class="w-full h-10 px-3 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-amber-400">
            </div>

            <div class="col-span-1 sm:col-span-2 lg:col-span-3">
              <label class="block font-semibold text-slate-300 mb-1">WhatsApp Pemohon *</label>
              <input type="tel" id="f-wa-pemohon" required placeholder="0812... / 628..." class="w-full h-10 px-3 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-amber-400">
            </div>`;

if (!content.includes(targetSectionA)) {
  throw new Error('targetSectionA not found in portal-nolap.html');
}
content = content.replace(targetSectionA, replaceSectionA);
console.log('✓ [2/8] Section A form fields updated.');

// 3. Update MASTER_KANTOR Mapping
const targetMasterKantor = `const MASTER_KANTOR = {
      "Pusat": { kode: "2.19.0160", kodeSegmen: "2.0160-00", nama: "Kantor Pusat Jakarta" },
      "PUSAT": { kode: "2.19.0160", kodeSegmen: "2.0160-00", nama: "Kantor Pusat Jakarta" },
      "Padang": { kode: "2.0160-01", kodeSegmen: "2.0160-02", nama: "Kantor Cabang Padang" },
      "PADANG": { kode: "2.0160-01", kodeSegmen: "2.0160-02", nama: "Kantor Cabang Padang" },
      "Makassar": { kode: "2.0160-02", kodeSegmen: "2.0160-03", nama: "Kantor Cabang Makassar" },
      "MAKASSAR": { kode: "2.0160-02", kodeSegmen: "2.0160-03", nama: "Kantor Cabang Makassar" },
      "Bandung": { kode: "2.0160-04", kodeSegmen: "2.0160-04", nama: "Kantor Cabang Bandung" },
      "BANDUNG": { kode: "2.0160-04", kodeSegmen: "2.0160-04", nama: "Kantor Cabang Bandung" },
      "Palembang": { kode: "2.0160-03", kodeSegmen: "2.0160-05", nama: "Kantor Cabang Palembang" },
      "PALEMBANG": { kode: "2.0160-03", kodeSegmen: "2.0160-05", nama: "Kantor Cabang Palembang" }
    };`;

const replaceMasterKantor = `const MASTER_KANTOR = {
      "Pusat": { kode: "2.19.0160", kodeSegmen: "2.0160-00", nama: "Kantor Pusat Jakarta" },
      "PUSAT": { kode: "2.19.0160", kodeSegmen: "2.0160-00", nama: "Kantor Pusat Jakarta" },
      "Padang": { kode: "2.0160-01", kodeSegmen: "2.0160-01", nama: "Kantor Cabang Padang" },
      "PADANG": { kode: "2.0160-01", kodeSegmen: "2.0160-01", nama: "Kantor Cabang Padang" },
      "Makassar": { kode: "2.0160-02", kodeSegmen: "2.0160-02", nama: "Kantor Cabang Makassar" },
      "MAKASSAR": { kode: "2.0160-02", kodeSegmen: "2.0160-02", nama: "Kantor Cabang Makassar" },
      "Bandung": { kode: "2.0160-04", kodeSegmen: "2.0160-04", nama: "Kantor Cabang Bandung" },
      "BANDUNG": { kode: "2.0160-04", kodeSegmen: "2.0160-04", nama: "Kantor Cabang Bandung" },
      "Palembang": { kode: "2.0160-03", kodeSegmen: "2.0160-03", nama: "Kantor Cabang Palembang" },
      "PALEMBANG": { kode: "2.0160-03", kodeSegmen: "2.0160-03", nama: "Kantor Cabang Palembang" }
    };

    const REKAN_CABANG_CONFIG = {
      "Pusat": { nama: "Nanang Rahayu", label: "Ir. Nanang Rahayu — Izin: 0218", izin: "0218", kodeSegmen: "2.0160-00" },
      "Padang": { nama: "Hernita", label: "Hernita — Izin: PS.0046", izin: "PS.0046", kodeSegmen: "2.0160-01" },
      "Makassar": { nama: "Muhammad Amin Sade", label: "Muhammad Amin Sade — Izin: PS.0126", izin: "PS.0126", kodeSegmen: "2.0160-02" },
      "Bandung": { nama: "Deni Siswandi", label: "Deni Siswandi — Izin: 00581", izin: "00581", kodeSegmen: "2.0160-04" },
      "Palembang": { nama: "Dharma Priyanto Sih Budi Susilo", label: "Dharma Priyanto S.B.S. — Izin: PS.0249", izin: "PS.0249", kodeSegmen: "2.0160-03" }
    };`;

if (!content.includes(targetMasterKantor)) {
  throw new Error('targetMasterKantor not found in portal-nolap.html');
}
content = content.replace(targetMasterKantor, replaceMasterKantor);
console.log('✓ [3/8] MASTER_KANTOR and REKAN_CABANG_CONFIG updated.');

// 4. Update inisialisasiSesiPengguna
const targetInisialisasiSesi = `function inisialisasiSesiPengguna(sesi) {
      if (!sesi) return;
      const selectCabang = document.getElementById('f-cabang');
      if (selectCabang && sesi.cabang && sesi.cabang !== 'Pusat') {
        selectCabang.value = sesi.cabang;
      }
      if (typeof onCabangChange === 'function') {
        onCabangChange();
      }
      const elPemohon = document.getElementById('f-pemohon');
      const elJabatan = document.getElementById('f-jabatan');
      if (elPemohon && sesi.nama && !elPemohon.value) {
        elPemohon.value = sesi.nama;
      }
      if (elJabatan && sesi.jabatan && !elJabatan.value) {
        elJabatan.value = sesi.jabatan;
      }
    }`;

const replaceInisialisasiSesi = `function inisialisasiSesiPengguna(sesi) {
      if (!sesi) return;
      const selectCabang = document.getElementById('f-cabang');
      const wrapAsalLock = document.getElementById('badge-asal-cabang-lock');
      const textAsalLock = document.getElementById('text-asal-cabang-lock');
      const kodeAsalLock = document.getElementById('kode-asal-cabang-lock');
      const elKewenangan = document.getElementById('f-kewenangan-ttd');

      const userBranch = sesi.cabang || sesi.wilayah || 'Pusat';

      if (selectCabang) {
        selectCabang.value = userBranch;
      }

      // Jika user adalah Cabang: Kunci visual Asal Permohonan & default-kan kewenangan TTD ke PUSAT
      if (sesi.isCabang || (userBranch && userBranch !== 'Pusat')) {
        if (selectCabang) selectCabang.classList.add('hidden');
        if (wrapAsalLock) {
          wrapAsalLock.classList.remove('hidden');
          const kodeBranch = MASTER_KANTOR[userBranch]?.kodeSegmen || MASTER_KANTOR[userBranch]?.kode || '2.0160-00';
          if (textAsalLock) textAsalLock.innerText = \`Kantor Cabang \${userBranch}\`;
          if (kodeAsalLock) kodeAsalLock.innerText = kodeBranch;
        }
        // KEBUTUHAN OPERASIONAL P0: Admin Cabang (Makassar dll) default mengajukan permohonan dengan kewenangan TTD KANTOR PUSAT
        if (elKewenangan) {
          elKewenangan.value = 'PUSAT';
        }
      } else {
        if (selectCabang) selectCabang.classList.remove('hidden');
        if (wrapAsalLock) wrapAsalLock.classList.add('hidden');
      }

      if (typeof onAsalCabangChange === 'function') {
        onAsalCabangChange();
      } else if (typeof onCabangChange === 'function') {
        onCabangChange();
      }

      const elPemohon = document.getElementById('f-pemohon');
      const elJabatan = document.getElementById('f-jabatan');
      if (elPemohon && sesi.nama && !elPemohon.value) {
        elPemohon.value = sesi.nama;
      }
      if (elJabatan && sesi.jabatan && !elJabatan.value) {
        elJabatan.value = sesi.jabatan;
      }
    }`;

if (!content.includes(targetInisialisasiSesi)) {
  throw new Error('targetInisialisasiSesi not found in portal-nolap.html');
}
content = content.replace(targetInisialisasiSesi, replaceInisialisasiSesi);
console.log('✓ [4/8] inisialisasiSesiPengguna updated.');

// 5. Update aktifkanPanelUtama (call inisialisasiSesiPengguna instead of duplicate setter)
const targetAktifkanPanelCabang = `// Set cabang otomatis pada form sesuai sesi staf jika bukan admin
      const selectCabang = document.getElementById('f-cabang');
      if (selectCabang && sesiAktif.cabang && sesiAktif.cabang !== 'Pusat') {
        selectCabang.value = sesiAktif.cabang;
      }
      if (typeof onCabangChange === 'function') {
        onCabangChange();
      }`;

const replaceAktifkanPanelCabang = `// Sinkronisasi identitas sesi pengguna & kewenangan TTD
      inisialisasiSesiPengguna(sesiAktif);`;

if (!content.includes(targetAktifkanPanelCabang)) {
  throw new Error('targetAktifkanPanelCabang not found in portal-nolap.html');
}
content = content.replace(targetAktifkanPanelCabang, replaceAktifkanPanelCabang);
console.log('✓ [5/8] aktifkanPanelUtama session hook updated.');

// 6. Update onCabangChange, onKewenanganTtdChange, onAsalCabangChange, updateLivePreview
const targetLiveFuncs = `function onCabangChange() {
      const elCabang = document.getElementById('f-cabang');
      const elPenilai = document.getElementById('f-penilai');
      const valCabang = elCabang?.value;

      // Otomatis sinkronkan Rekan Penilai Publik penandatangan sesuai cabang
      if (elPenilai && valCabang) {
        if (valCabang === 'Makassar') {
          elPenilai.value = 'Muhammad Amin Sade';
        } else if (valCabang === 'Bandung') {
          elPenilai.value = 'Deni Siswandi';
        } else if (valCabang === 'Padang') {
          elPenilai.value = 'Hernita';
        } else if (valCabang === 'Palembang') {
          elPenilai.value = 'Dharma Priyanto Sih Budi Susilo';
        } else if (valCabang === 'Pusat') {
          elPenilai.value = 'Nanang Rahayu';
        }
      }

      validasiKetersediaanPenilaiHarian(false);
      updateLivePreview();
    }

    function alihkanKeNanangRahayu() {
      const elPenilai = document.getElementById('f-penilai');
      if (elPenilai) {
        elPenilai.value = 'Nanang Rahayu';
      }
      tutupModalLockPenilai();
      validasiKetersediaanPenilaiHarian(true);
      updateLivePreview();
    }

    function tutupModalLockPenilai() {
      const modal = document.getElementById('modal-lock-penilai');
      if (modal) modal.classList.add('hidden');
    }

    function tampilkanModalLockPenilai(cabangPengguna) {
      const modal = document.getElementById('modal-lock-penilai');
      const elCabangName = document.getElementById('modal-lock-cabang-name');
      if (elCabangName) {
        elCabangName.textContent = cabangPengguna ? cabangPengguna.toUpperCase() : 'CABANG LAIN';
      }
      if (modal) modal.classList.remove('hidden');
    }

    function updateLivePreview() {
      // 1. Nomor Urut (Segmen 1): Hak Otoritas Tunggal Petugas Admin Kantor Pusat
      const strUrut = "[NO. URUT PUSAT]";

      // 2. Kode Identitas Kantor (5 Karakter)
      const elCabang = document.getElementById('f-cabang');
      const optCabang = elCabang?.options[elCabang.selectedIndex];
      const kodeKantor = optCabang?.getAttribute('data-kode') || "2.0160-00";

      // 3. Kode Jenis Jasa (PI, PS, BS, PP)
      const elJasa = document.getElementById('f-jasa');
      const kodeJasa = elJasa?.value || "PI";

      // 4. Kode Sektor Industri (2 Digit)
      const elIndustri = document.getElementById('f-industri');
      const kodeIndustri = elIndustri?.value || "07";

      // 5. Kode Izin Penilai
      const elPenilai = document.getElementById('f-penilai');
      const optPenilai = elPenilai?.options[elPenilai.selectedIndex];
      const izinPenilai = optPenilai?.getAttribute('data-izin') || "00581";

      // 6. Kode NPWP (1 jika ada NPWP, 0 jika tanpa NPWP)
      const valNpwp = document.getElementById('f-npwp')?.value.trim();
      let kodeNpwp = "1";
      if (!valNpwp || valNpwp === '-' || valNpwp.toLowerCase().includes('non') || valNpwp.toLowerCase().includes('tidak')) {
        kodeNpwp = "0";
      } else {
        // Cek jika hanya angka minimal 10 digit atau format standar
        const cleanDigits = valNpwp.replace(/\\D/g, '');
        kodeNpwp = cleanDigits.length >= 10 ? "1" : "0";
      }

      // 7. Waktu Penerbitan (Bulan Romawi / Tahun 4 Digit)
      const valTglPenilaian = (document.getElementById('input_tgl_penilaian') || document.getElementById('f-tgl-penilaian'))?.value;
      const refDate = valTglPenilaian ? new Date(valTglPenilaian) : new Date();
      const bulanRomawi = BULAN_ROMAWI[refDate.getMonth()];
      const tahun = refDate.getFullYear();
      const strWaktu = \`\${bulanRomawi}/\${tahun}\`;

      // Susun Format Usulan Pengajuan 7 Segmen
      const nomorLengkap = \`\${strUrut}/\${kodeKantor}/\${kodeJasa}/\${kodeIndustri}/\${izinPenilai}/\${kodeNpwp}/\${strWaktu}\`;

      // Update Tampilan DOM
      const liveBox = document.getElementById('live-nomor-laporan');
      if (liveBox) liveBox.innerText = nomorLengkap;

      document.getElementById('seg-urut').innerText = "Ditetapkan Pusat";
      document.getElementById('seg-kantor').innerText = kodeKantor;
      document.getElementById('seg-jasa').innerText = kodeJasa;
      document.getElementById('seg-industri').innerText = kodeIndustri;
      document.getElementById('seg-penilai').innerText = izinPenilai;
      document.getElementById('seg-npwp').innerText = kodeNpwp;
      document.getElementById('seg-waktu').innerText = strWaktu;
    }`;

const replaceLiveFuncs = `function onKewenanganTtdChange() {
      const elKewenangan = document.getElementById('f-kewenangan-ttd');
      const elPenilai = document.getElementById('f-penilai');
      const elCabang = document.getElementById('f-cabang');
      const cabangVal = elCabang?.value || (sesiAktif?.cabang) || "Pusat";
      const kewenangan = elKewenangan?.value || "PUSAT";

      if (!elPenilai) return;

      const prevPenilai = elPenilai.value;

      if (kewenangan === 'PUSAT') {
        // TTD Kantor Pusat: Penilai Publik Rekan Pusat
        elPenilai.innerHTML = \`
          <option value="Nanang Rahayu" data-izin="0218">Ir. Nanang Rahayu — Izin: 0218 (Pimpinan Rekan Pusat)</option>
          <option value="Deni Siswandi" data-izin="00581">Deni Siswandi — Izin: 00581 (Penilai Rekan / Divtek)</option>
        \`;
        if (prevPenilai === 'Deni Siswandi' || prevPenilai === 'Nanang Rahayu') {
          elPenilai.value = prevPenilai;
        } else {
          elPenilai.value = 'Nanang Rahayu';
        }
      } else {
        // TTD Rekan Cabang Sendiri
        const rekanCfg = REKAN_CABANG_CONFIG[cabangVal] || REKAN_CABANG_CONFIG["Pusat"];
        elPenilai.innerHTML = \`
          <option value="\${rekanCfg.nama}" data-izin="\${rekanCfg.izin}">\${rekanCfg.label} (Pimpinan Cabang \${cabangVal})</option>
        \`;
        elPenilai.value = rekanCfg.nama;
      }

      validasiKetersediaanPenilaiHarian(false);
      updateLivePreview();
    }

    function onAsalCabangChange() {
      const elCabang = document.getElementById('f-cabang');
      const elKewenangan = document.getElementById('f-kewenangan-ttd');
      const optTtdCabang = document.getElementById('opt-ttd-cabang');
      const cabangVal = elCabang?.value || "Pusat";
      const cfg = REKAN_CABANG_CONFIG[cabangVal] || REKAN_CABANG_CONFIG["Pusat"];

      if (optTtdCabang) {
        optTtdCabang.setAttribute('data-kode', cfg.kodeSegmen);
        optTtdCabang.textContent = \`🏢 Rekan Cabang \${cabangVal} (\${cfg.kodeSegmen}) — TTD Pimpinan Rekan\`;
        if (cabangVal === 'Pusat') {
          optTtdCabang.classList.add('hidden');
          if (elKewenangan) elKewenangan.value = 'PUSAT';
        } else {
          optTtdCabang.classList.remove('hidden');
        }
      }

      onKewenanganTtdChange();
    }

    function onCabangChange() {
      onAsalCabangChange();
    }

    function alihkanKeNanangRahayu() {
      const elPenilai = document.getElementById('f-penilai');
      if (elPenilai) {
        elPenilai.value = 'Nanang Rahayu';
      }
      tutupModalLockPenilai();
      validasiKetersediaanPenilaiHarian(true);
      updateLivePreview();
    }

    function tutupModalLockPenilai() {
      const modal = document.getElementById('modal-lock-penilai');
      if (modal) modal.classList.add('hidden');
    }

    function tampilkanModalLockPenilai(cabangPengguna) {
      const modal = document.getElementById('modal-lock-penilai');
      const elCabangName = document.getElementById('modal-lock-cabang-name');
      if (elCabangName) {
        elCabangName.textContent = cabangPengguna ? cabangPengguna.toUpperCase() : 'CABANG LAIN';
      }
      if (modal) modal.classList.remove('hidden');
    }

    function updateLivePreview() {
      // 1. Nomor Urut (Segmen 1): Hak Otoritas Tunggal Petugas Admin Kantor Pusat
      const strUrut = "[NO. URUT PUSAT]";

      // 2. Kode Identitas Kantor (Kewenangan Tanda Tangan)
      const elKewenangan = document.getElementById('f-kewenangan-ttd');
      const optKewenangan = elKewenangan?.options[elKewenangan.selectedIndex];
      const kodeKantor = optKewenangan?.getAttribute('data-kode') || "2.0160-00";

      // Asal Kantor Permohonan
      const elCabang = document.getElementById('f-cabang');
      const optCabang = elCabang?.options[elCabang.selectedIndex];
      const asalCabangVal = elCabang?.value || (sesiAktif?.cabang) || "Pusat";
      const kodeAsalCabang = MASTER_KANTOR[asalCabangVal]?.kodeSegmen || MASTER_KANTOR[asalCabangVal]?.kode || optCabang?.getAttribute('data-kode') || "2.0160-00";

      // 3. Kode Jenis Jasa (PI, PS, BS, PP)
      const elJasa = document.getElementById('f-jasa');
      const kodeJasa = elJasa?.value || "PI";

      // 4. Kode Sektor Industri (2 Digit)
      const elIndustri = document.getElementById('f-industri');
      const kodeIndustri = elIndustri?.value || "07";

      // 5. Kode Izin Penilai
      const elPenilai = document.getElementById('f-penilai');
      const optPenilai = elPenilai?.options[elPenilai.selectedIndex];
      const penilaiVal = elPenilai?.value || "Nanang Rahayu";
      const izinPenilai = optPenilai?.getAttribute('data-izin') || MASTER_PENILAI[penilaiVal] || "0218";

      // 6. Kode NPWP (1 jika ada NPWP, 0 jika tanpa NPWP)
      const valNpwp = document.getElementById('f-npwp')?.value.trim();
      let kodeNpwp = "1";
      if (!valNpwp || valNpwp === '-' || valNpwp.toLowerCase().includes('non') || valNpwp.toLowerCase().includes('tidak')) {
        kodeNpwp = "0";
      } else {
        const cleanDigits = valNpwp.replace(/\\D/g, '');
        kodeNpwp = cleanDigits.length >= 10 ? "1" : "0";
      }

      // 7. Waktu Penerbitan (Bulan Romawi / Tahun 4 Digit)
      const valTglPenilaian = (document.getElementById('input_tgl_penilaian') || document.getElementById('f-tgl-penilaian'))?.value;
      const refDate = valTglPenilaian ? new Date(valTglPenilaian) : new Date();
      const bulanRomawi = BULAN_ROMAWI[refDate.getMonth()];
      const tahun = refDate.getFullYear();
      const strWaktu = \`\${bulanRomawi}/\${tahun}\`;

      // Susun Format Usulan Pengajuan 7 Segmen
      const nomorLengkap = \`\${strUrut}/\${kodeKantor}/\${kodeJasa}/\${kodeIndustri}/\${izinPenilai}/\${kodeNpwp}/\${strWaktu}\`;

      // Update Tampilan DOM
      const liveBox = document.getElementById('live-nomor-laporan');
      if (liveBox) liveBox.innerText = nomorLengkap;

      // Update Sub-badges
      const badgeAsal = document.getElementById('badge-preview-asal');
      if (badgeAsal) {
        badgeAsal.innerText = \`Asal Permohonan: Kantor \${asalCabangVal === 'Pusat' ? 'Pusat' : ('Cabang ' + asalCabangVal)} [\${kodeAsalCabang}]\`;
      }
      const badgeTtd = document.getElementById('badge-preview-ttd');
      if (badgeTtd) {
        const ttdLabel = (elKewenangan?.value === 'CABANG') ? \`Kantor Cabang \${asalCabangVal} [\${kodeKantor}]\` : \`Kantor Pusat Jakarta [2.0160-00]\`;
        badgeTtd.innerText = \`Kewenangan TTD: \${ttdLabel}\`;
      }
      const badgePenilai = document.getElementById('badge-preview-penilai');
      if (badgePenilai) {
        badgePenilai.innerText = \`Penilai: \${optPenilai?.text?.split('—')[0]?.trim() || penilaiVal} [\${izinPenilai}]\`;
      }

      document.getElementById('seg-urut').innerText = "Ditetapkan Pusat";
      document.getElementById('seg-kantor').innerText = kodeKantor;
      document.getElementById('seg-jasa').innerText = kodeJasa;
      document.getElementById('seg-industri').innerText = kodeIndustri;
      document.getElementById('seg-penilai').innerText = izinPenilai;
      document.getElementById('seg-npwp').innerText = kodeNpwp;
      document.getElementById('seg-waktu').innerText = strWaktu;
    }`;

if (!content.includes(targetLiveFuncs)) {
  throw new Error('targetLiveFuncs not found in portal-nolap.html');
}
content = content.replace(targetLiveFuncs, replaceLiveFuncs);
console.log('✓ [6/8] onKewenanganTtdChange and updateLivePreview updated.');

// 7. Update submitRequest form payload handling
const targetSubmitPayload = `// Ambil nilai dari form
      const cabang = document.getElementById('f-cabang').value;
      const pemohon = document.getElementById('f-pemohon').value.trim();`;

const replaceSubmitPayload = `// Ambil nilai dari form (Pemisahan Asal Permohonan vs Kewenangan TTD)
      const elCabang = document.getElementById('f-cabang');
      const originBranchId = (elCabang?.value || sesiAktif?.cabang || 'Pusat').trim();
      const originBranchCode = MASTER_KANTOR[originBranchId]?.kodeSegmen || MASTER_KANTOR[originBranchId]?.kode || '2.0160-00';

      const elKewenangan = document.getElementById('f-kewenangan-ttd');
      const optKewenangan = elKewenangan?.options[elKewenangan.selectedIndex];
      const requestedSigningOffice = (elKewenangan?.value || 'PUSAT').trim().toUpperCase();
      const signingOfficeCode = optKewenangan?.getAttribute('data-kode') || (requestedSigningOffice === 'PUSAT' ? '2.0160-00' : originBranchCode);
      const cabang = originBranchId;

      const pemohon = document.getElementById('f-pemohon').value.trim();`;

if (!content.includes(targetSubmitPayload)) {
  throw new Error('targetSubmitPayload not found in portal-nolap.html');
}
content = content.replace(targetSubmitPayload, replaceSubmitPayload);

const targetDataBaruCabang = `catatanPemohon: catatanPemohon,
        status: isBookingMode ? "BOOKING DIAJUKAN" : "DIAJUKAN",`;

const replaceDataBaruCabang = `origin_branch_id: originBranchId,
        origin_branch_code: originBranchCode,
        requested_signing_office: requestedSigningOffice,
        signing_office_code: signingOfficeCode,
        assigned_public_appraiser_id: penilai,
        appraiser_license_code: izinPenilai,
        official_report_sequence: null,
        request_status: isBookingMode ? "BOOKING DIAJUKAN" : "DIAJUKAN",
        kewenanganTtd: requestedSigningOffice,
        kodeKantorTtd: signingOfficeCode,
        catatanPemohon: catatanPemohon,
        status: isBookingMode ? "BOOKING DIAJUKAN" : "DIAJUKAN",`;

if (!content.includes(targetDataBaruCabang)) {
  throw new Error('targetDataBaruCabang not found in portal-nolap.html');
}
content = content.replace(targetDataBaruCabang, replaceDataBaruCabang);
console.log('✓ [7/8] Form submission 8 attributes updated.');

// 8. Update modal-terbitkan-nolap-manual
const targetModalManual = `const kodeKantor = MASTER_KANTOR[item.cabang]?.kode || "2.0160-00";`;
const replaceModalManual = `const kodeKantor = item.signing_office_code || item.kodeKantorTtd || (item.requested_signing_office === 'PUSAT' ? '2.0160-00' : (MASTER_KANTOR[item.cabang]?.kodeSegmen || MASTER_KANTOR[item.cabang]?.kode || "2.0160-00"));`;

if (!content.includes(targetModalManual)) {
  throw new Error('targetModalManual not found in portal-nolap.html');
}
content = content.replace(targetModalManual, replaceModalManual);

const targetModalKantorText = `document.getElementById('manual-req-kantor').innerText = \`\${item.cabang} (\${kodeKantor})\`;`;
const replaceModalKantorText = `document.getElementById('manual-req-kantor').innerText = \`\${item.cabang || item.origin_branch_id || 'Pusat'} [Asal] → \${item.requested_signing_office || 'PUSAT'} [TTD: \${kodeKantor}]\`;`;

if (!content.includes(targetModalKantorText)) {
  throw new Error('targetModalKantorText not found in portal-nolap.html');
}
content = content.replace(targetModalKantorText, replaceModalKantorText);
console.log('✓ [8/8] modal-terbitkan-nolap-manual updated.');

const finalOut = hadCrlf ? content.replace(/\n/g, '\r\n') : content;
fs.writeFileSync(filePath, finalOut, 'utf8');
console.log('SUCCESS: portal-nolap.html patched cleanly.');
