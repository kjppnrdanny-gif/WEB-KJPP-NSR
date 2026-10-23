// scripts/apply-master-personel-system.mjs
// Implementasi Master Personel Standar & Flexible Assignment System (OPINI NSR 2026)

import fs from 'fs';
import path from 'path';

console.log('================================================================');
console.log('APPLY MASTER PERSONEL & FLEXIBLE ASSIGNMENT SYSTEM (OPINI NSR)');
console.log('================================================================');

// 1. UPDATE data/masters/master_penilai_publik.json
const masterJsonPath = path.resolve('data/masters/master_penilai_publik.json');
if (fs.existsSync(masterJsonPath)) {
  let masterData = JSON.parse(fs.readFileSync(masterJsonPath, 'utf8'));
  let updatedCount = 0;
  masterData.forEach(p => {
    if (p.id === 'nanang_penilai') {
      p.nama = 'Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)';
      updatedCount++;
    } else if (p.id === 'deni_penilai') {
      p.nama = 'Deni Siswandi, S.T., MAPPI (Cert.)';
      updatedCount++;
    } else if (p.id === 'hernita_penilai') {
      p.nama = 'Hernita, S.Si., MAPPI (Cert.)';
      updatedCount++;
    } else if (p.id === 'amin_penilai') {
      p.nama = 'Muhammad Amin Sade, S.M., MAPPI (Cert.)';
      updatedCount++;
    } else if (p.id === 'dharma_penilai') {
      p.nama = 'Dharma Priyanto Sih Budi Susilo, S.T., MAPPI (Cert.)';
      updatedCount++;
    }
  });
  fs.writeFileSync(masterJsonPath, JSON.stringify(masterData, null, 2), 'utf8');
  console.log(`[1] master_penilai_publik.json updated (${updatedCount} records standardized).`);
}

// 2. UPDATE auth-registry-loader.php
const authPhpPath = path.resolve('auth-registry-loader.php');
if (fs.existsSync(authPhpPath)) {
  let authPhp = fs.readFileSync(authPhpPath, 'utf8');
  authPhp = authPhp.replace(/'displayName'\s*=>\s*'Deni Siswandi, S\.T\., MAPPI'/g, "'displayName'       => 'Deni Siswandi, S.T., MAPPI (Cert.)'");
  fs.writeFileSync(authPhpPath, authPhp, 'utf8');
  console.log('[2] auth-registry-loader.php updated with Deni Siswandi, S.T., MAPPI (Cert.).');
}

// 3. UPDATE portal-nolap.html (singularity fix)
const nolapPath = path.resolve('portal-nolap.html');
if (fs.existsSync(nolapPath)) {
  let nolap = fs.readFileSync(nolapPath, 'utf8');
  nolap = nolap.replace(
    "penilai = 'Deni Siswandi, S.T., MAPPI'; izin = '00581';",
    "penilai = 'Deni Siswandi, S.T., MAPPI (Cert.)'; izin = '00581';"
  );
  fs.writeFileSync(nolapPath, nolap, 'utf8');
  console.log('[3] portal-nolap.html checked & updated.');
}

// 4. RESTORE clean baseline of portal-penugasan-jo.html from backup before applying
const joBackupPath = path.resolve('portal-penugasan-jo.html.bak_personel');
if (fs.existsSync(joBackupPath)) {
  fs.copyFileSync(joBackupPath, 'portal-penugasan-jo.html');
  console.log('[4-PRE] Clean baseline restored from portal-penugasan-jo.html.bak_personel.');
}

// 4. UPDATE portal-penugasan-jo.html
const joPath = path.resolve('portal-penugasan-jo.html');
let joHtml = fs.readFileSync(joPath, 'utf8');

// A. Standardize DATABASE_REKAN
const targetOldDbRekanStart = 'const DATABASE_REKAN = [';
const targetOldDbRekanEnd = '];';
const startIdxRekan = joHtml.indexOf(targetOldDbRekanStart);
const endIdxRekan = joHtml.indexOf(targetOldDbRekanEnd, startIdxRekan) + targetOldDbRekanEnd.length;

const newDatabaseRekanStr = `const DATABASE_REKAN = [
      {
        id: "nanang_penilai",
        nama: "Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)",
        nama_resmi: "Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)",
        jabatan: "Pemimpin Rekan",
        klasifikasi: "Penilai Properti (Komprehensif)",
        klasifikasi_kode: "P",
        mappi: "95-S-00594",
        izin: "P-1.09.00218",
        izin_segmen: "0218",
        rmk: "RMK-2017.00201",
        bpn: "PP1.0006.25",
        ojk: "KEP-859/KS.13/2026",
        kantor_asal_kode: "PUSAT",
        kantor_asal_nama: "Kantor Pusat Jakarta",
        kewenangan_lingkup: "NASIONAL",
        email: "nanang.rahayu@kjppnanangrahayu.com"
      },
      {
        id: "deni_penilai",
        nama: "Deni Siswandi, S.T., MAPPI (Cert.)",
        nama_resmi: "Deni Siswandi, S.T., MAPPI (Cert.)",
        jabatan: "Rekan / Pimpinan Cabang Bandung",
        klasifikasi: "Penilai Properti (Komprehensif)",
        klasifikasi_kode: "P",
        mappi: "06-S-02013",
        izin: "P-1.20.00581",
        izin_segmen: "00581",
        rmk: "RMK-2017.01564",
        bpn: "PPI.0041.24",
        ojk: "KEP-1261/KS.13/2026",
        kantor_asal_kode: "CABANG_BANDUNG",
        kantor_asal_nama: "Kantor Cabang Bandung",
        kewenangan_lingkup: "NASIONAL",
        email: "deni.siswandi@kjppnanangrahayu.com"
      },
      {
        id: "hernita_penilai",
        nama: "Hernita, S.Si., MAPPI (Cert.)",
        nama_resmi: "Hernita, S.Si., MAPPI (Cert.)",
        jabatan: "Rekan / Pimpinan Cabang Padang",
        klasifikasi: "Penilai Properti Sederhana (PS)",
        klasifikasi_kode: "PS",
        mappi: "09-S-02262",
        izin: "PS1.15.00046",
        izin_segmen: "00046",
        rmk: "RMK-2017.00437",
        bpn: "-",
        ojk: "KEP-1012/KS.13/2026",
        kantor_asal_kode: "CABANG_PADANG",
        kantor_asal_nama: "Kantor Cabang Padang",
        kewenangan_lingkup: "CABANG_PADANG_DAN_KLASIFIKASI_PS",
        email: "hernita@kjppnanangrahayu.com"
      },
      {
        id: "amin_penilai",
        nama: "Muhammad Amin Sade, S.M., MAPPI (Cert.)",
        nama_resmi: "Muhammad Amin Sade, S.M., MAPPI (Cert.)",
        jabatan: "Rekan / Pimpinan Cabang Makassar",
        klasifikasi: "Penilai Properti Sederhana (PS)",
        klasifikasi_kode: "PS",
        mappi: "09-S-02425",
        izin: "PS1.16.00126",
        izin_segmen: "00126",
        rmk: "RMK-2017.00527",
        bpn: "Lisensi Pertanahan BPN",
        ojk: "KEP-1278/KS.13/2026",
        kantor_asal_kode: "CABANG_MAKASSAR",
        kantor_asal_nama: "Kantor Cabang Makassar",
        kewenangan_lingkup: "CABANG_MAKASSAR_DAN_KLASIFIKASI_PS",
        email: "amin.sade@kjppnanangrahayu.com"
      },
      {
        id: "dharma_penilai",
        nama: "Dharma Priyanto Sih Budi Susilo, S.T., MAPPI (Cert.)",
        nama_resmi: "Dharma Priyanto Sih Budi Susilo, S.T., MAPPI (Cert.)",
        jabatan: "Rekan / Pimpinan Cabang Palembang",
        klasifikasi: "Penilai Properti Sederhana (PS)",
        klasifikasi_kode: "PS",
        mappi: "16-S-06984",
        izin: "PS1.19.00249",
        izin_segmen: "00249",
        rmk: "RMK-2017.01801",
        bpn: "PP2.0031.23",
        ojk: "KEP-523/KS.13/2026",
        kantor_asal_kode: "CABANG_PALEMBANG",
        kantor_asal_nama: "Kantor Cabang Palembang",
        kewenangan_lingkup: "CABANG_PALEMBANG_DAN_KLASIFIKASI_PS",
        email: "dharma.priyanto@kjppnanangrahayu.com"
      }
    ];`;

joHtml = joHtml.substring(0, startIdxRekan) + newDatabaseRekanStr + joHtml.substring(endIdxRekan);
console.log('[4A] DATABASE_REKAN in portal-penugasan-jo.html replaced successfully.');

// B. Replace Section 05 HTML in Tab 1
const s05MarkerStart = '<!-- 5. SUSUNAN TIM PENILAI & AUTO-VLOOKUP KREDENSIAL -->';
const s06MarkerStart = '<!-- 6. WAKTU PELAKSANAAN & JADWAL KERJA -->';
const s05Idx = joHtml.indexOf(s05MarkerStart);
const s06Idx = joHtml.indexOf(s06MarkerStart);

const newSection05Html = `<!-- 5. SUSUNAN TIM PENILAI & AUTO-VLOOKUP KREDENSIAL -->
        <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-6">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
            <div>
              <h3 class="text-sm font-black text-amber-400 uppercase tracking-wider flex items-center gap-2">
                <span class="w-6 h-6 rounded-md bg-amber-400/20 text-amber-300 flex items-center justify-center text-xs">05</span>
                <span>Susunan Tim Penilai &amp; Penugasan Personel (SPI 103)</span>
              </h3>
              <p class="text-[11px] text-slate-400 mt-0.5">Dropdown Master • Koreksi Redaksional Terkendali • Input Manual Berpenanda • Dukungan Multi-Personel</p>
            </div>
            <span class="text-[10px] text-sky-400 font-semibold bg-sky-500/10 px-2.5 py-1 rounded-lg border border-sky-500/20 flex items-center gap-1.5 self-start sm:self-auto">
              <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Master Personel Terpadu</span>
            </span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            
            <!-- 1. Rekan Penilai Publik (Penanggung Jawab Laporan) -->
            <div class="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
              <div class="flex items-center justify-between">
                <label class="font-bold text-amber-300">Rekan Penilai Publik (Penanggung Jawab Laporan) <span class="text-rose-400">*</span></label>
                <span class="text-[10px] text-amber-400/90 font-mono bg-amber-950/50 px-2 py-0.5 rounded border border-amber-800/40">Master Berizin Kemenkeu</span>
              </div>
              <select id="rekan_nama" required onchange="vlookupRekan()" class="w-full h-10 px-3 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 font-bold focus:outline-none focus:border-amber-400">
                <!-- Diisi otomatis dari DATABASE_REKAN -->
              </select>
              
              <!-- Penyesuaian Nama / Gelar / Keterangan Jabatan -->
              <div class="pt-1">
                <div class="flex items-center justify-between mb-1">
                  <label for="rekan_nama_custom" class="text-[11px] font-semibold text-slate-300">Penyesuaian Nama / Gelar / Jabatan (Opsional)</label>
                  <button type="button" id="btn_reset_rekan_master" onclick="resetRekanMaster()" class="text-[10px] text-amber-400 hover:text-amber-300 underline font-medium">Kembalikan ke Data Master</button>
                </div>
                <input type="text" id="rekan_nama_custom" oninput="onRekanCustomInput()" placeholder="Nama dan gelar sesuai dokumen penugasan ini" class="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-amber-400">
                <p class="text-[10px] text-slate-500 mt-1">Penanggung jawab laporan wajib dari master berizin. Koreksi redaksi hanya berlaku pada record penugasan ini.</p>
              </div>

              <!-- Parameter Legalitas & Izin Kemenkeu -->
              <div class="grid grid-cols-2 gap-2 text-[11px] text-slate-300 font-mono pt-2 border-t border-slate-800/80">
                <div>Jabatan: <span id="view_rekan_jabatan" class="text-white font-semibold">-</span></div>
                <div>No. MAPPI: <span id="view_rekan_mappi" class="text-amber-400 font-semibold">-</span></div>
                <div>No. Izin Kemenkeu: <span id="view_rekan_izin" class="text-sky-300 font-semibold">-</span></div>
                <div>No. RMK: <span id="view_rekan_rmk" class="text-slate-300 font-semibold">-</span></div>
                <div>No. Lisensi BPN: <span id="view_rekan_bpn" class="text-emerald-300 font-semibold">-</span></div>
                <div>STTD OJK (PMDK &amp; Non-PMDK): <span id="view_rekan_ojk" class="text-teal-300 font-semibold">-</span></div>
              </div>
            </div>

            <!-- 2. Reviewer Laporan (Pengendali Mutu Teknis) -->
            <div class="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
              <div class="flex items-center justify-between">
                <label class="font-bold text-sky-300">Reviewer (Pengendali Mutu Teknis) <span class="text-rose-400">*</span></label>
                <span class="text-[10px] text-sky-400/90 font-mono bg-sky-950/50 px-2 py-0.5 rounded border border-sky-800/40">Kendali Mutu SPI 103</span>
              </div>
              <select id="reviewer_nama" required onchange="vlookupReviewer()" class="w-full h-10 px-3 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 font-semibold focus:outline-none focus:border-sky-400">
                <!-- Diisi otomatis dari DATABASE_PERSONIL -->
                <option value="__MANUAL__">+ Lainnya / Input Nama Manual</option>
              </select>

              <!-- Penyesuaian Nama / Gelar Reviewer Master -->
              <div id="wrapper_reviewer_custom" class="pt-1">
                <div class="flex items-center justify-between mb-1">
                  <label for="reviewer_nama_custom" class="text-[11px] font-semibold text-slate-300">Penyesuaian Nama / Gelar Reviewer (Opsional)</label>
                  <button type="button" id="btn_reset_reviewer_master" onclick="resetReviewerMaster()" class="text-[10px] text-sky-400 hover:text-sky-300 underline font-medium">Kembalikan ke Data Master</button>
                </div>
                <input type="text" id="reviewer_nama_custom" placeholder="Nama dan gelar reviewer (opsional)" class="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-sky-400">
              </div>

              <!-- Kredensial Reviewer Master -->
              <div id="view_reviewer_master_kredensial" class="grid grid-cols-2 gap-2 text-[11px] text-slate-300 font-mono pt-2 border-t border-slate-800/80">
                <div>No. MAPPI: <span id="view_reviewer_mappi" class="text-amber-400 font-semibold">-</span></div>
                <div>No. RMK: <span id="view_reviewer_rmk" class="text-sky-300 font-semibold">-</span></div>
              </div>

              <!-- Formulir Reviewer Manual (+ Lainnya / Input Nama Manual) -->
              <div id="form_reviewer_manual" class="hidden p-3.5 rounded-lg bg-sky-950/30 border border-sky-800/60 space-y-2.5 mt-2">
                <div class="flex items-center justify-between">
                  <span class="text-[11px] font-bold text-sky-300 flex items-center gap-1.5">
                    <span>📝</span><span>Form Reviewer Non-Master (Manual)</span>
                  </span>
                  <span class="bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded text-[9px] font-mono border border-amber-500/30">PENDING_VERIFICATION</span>
                </div>
                <p class="text-[10px] text-slate-400 leading-normal">Peringatan: Reviewer manual tidak memiliki akun sistem dan tidak memperoleh hak login / review SPM / DIVTEK resmi.</p>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <div>
                    <label class="text-[10px] font-medium text-slate-300">Nama Lengkap <span class="text-rose-400">*</span></label>
                    <input type="text" id="rev_manual_nama" placeholder="Nama Reviewer Lengkap" class="w-full h-8 px-2.5 rounded bg-slate-900 border border-slate-700 text-white text-xs">
                  </div>
                  <div>
                    <label class="text-[10px] font-medium text-slate-300">Gelar Akademik / Profesi</label>
                    <input type="text" id="rev_manual_gelar" placeholder="Contoh: S.T., M.Sc., MAPPI (Cert.)" class="w-full h-8 px-2.5 rounded bg-slate-900 border border-slate-700 text-white text-xs">
                  </div>
                  <div>
                    <label class="text-[10px] font-medium text-slate-300">Jabatan / Fungsi</label>
                    <input type="text" id="rev_manual_jabatan" placeholder="Reviewer Eksternal / Mitra QC" class="w-full h-8 px-2.5 rounded bg-slate-900 border border-slate-700 text-white text-xs">
                  </div>
                  <div>
                    <label class="text-[10px] font-medium text-slate-300">Kantor Wilayah / Asal</label>
                    <input type="text" id="rev_manual_kantor" placeholder="Kantor Asal" class="w-full h-8 px-2.5 rounded bg-slate-900 border border-slate-700 text-white text-xs">
                  </div>
                  <div>
                    <label class="text-[10px] font-medium text-slate-300">No. Register Penilai / MAPPI</label>
                    <input type="text" id="rev_manual_rmk" placeholder="No. RMK / MAPPI (bila ada)" class="w-full h-8 px-2.5 rounded bg-slate-900 border border-slate-700 text-white text-xs font-mono">
                  </div>
                  <div>
                    <label class="text-[10px] font-medium text-slate-300">Catatan Khusus</label>
                    <input type="text" id="rev_manual_catatan" placeholder="Keterangan verifikasi" class="w-full h-8 px-2.5 rounded bg-slate-900 border border-slate-700 text-white text-xs">
                  </div>
                </div>
              </div>

            </div>

            <!-- 3. Penilai Pelaksana Lapangan (MULTIPERSONEL) -->
            <div class="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3 md:col-span-2">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800/80">
                <div>
                  <div class="flex items-center gap-2">
                    <label class="font-bold text-emerald-300 text-sm">Penilai Pelaksana Lapangan</label>
                    <span class="bg-emerald-500/10 text-emerald-300 text-[10px] font-semibold px-2 py-0.5 rounded border border-emerald-500/30">Multi-Personel Didukung</span>
                  </div>
                  <p class="text-[11px] text-slate-400 mt-0.5">Dapat menugaskan satu atau lebih penilai pelaksana. Gunakan panah untuk mengatur urutan susunan tim.</p>
                </div>
                <button type="button" id="btn_tambah_penilai" onclick="tambahPenilaiBaris()" class="px-3 py-1.5 rounded-lg bg-emerald-600/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-600/30 text-xs font-bold transition flex items-center gap-1.5 self-start sm:self-auto shadow-sm">
                  <span class="text-base leading-none">+</span>
                  <span>Tambah Penilai Pelaksana</span>
                </button>
              </div>

              <!-- Hidden input untuk kompatibilitas script lama -->
              <input type="hidden" id="penilai_nama" name="penilai_nama" value="">

              <!-- Container Dinamis Baris Penilai Pelaksana -->
              <div id="list_penilai_container" class="space-y-3">
                <!-- Dirender secara dinamis oleh renderPenilaiListUI() -->
              </div>
            </div>

            <!-- 4. Asisten Penilai / Surveyor Lapangan (MULTIPERSONEL) -->
            <div class="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3 md:col-span-2">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800/80">
                <div>
                  <div class="flex items-center gap-2">
                    <label class="font-bold text-teal-300 text-sm">Asisten Penilai / Surveyor Lapangan</label>
                    <span class="bg-teal-500/10 text-teal-300 text-[10px] font-semibold px-2 py-0.5 rounded border border-teal-500/30">Multi-Personel Didukung</span>
                  </div>
                  <p class="text-[11px] text-slate-400 mt-0.5">Dapat menugaskan satu atau lebih surveyor / asisten lapangan untuk inspeksi fisik.</p>
                </div>
                <button type="button" id="btn_tambah_asisten" onclick="tambahAsistenBaris()" class="px-3 py-1.5 rounded-lg bg-teal-600/20 border border-teal-500/40 text-teal-300 hover:bg-teal-600/30 text-xs font-bold transition flex items-center gap-1.5 self-start sm:self-auto shadow-sm">
                  <span class="text-base leading-none">+</span>
                  <span>Tambah Asisten / Surveyor</span>
                </button>
              </div>

              <!-- Hidden input untuk kompatibilitas script lama -->
              <input type="hidden" id="asisten_nama" name="asisten_nama" value="">

              <!-- Container Dinamis Baris Asisten / Surveyor -->
              <div id="list_asisten_container" class="space-y-3">
                <!-- Dirender secara dinamis oleh renderAsistenListUI() -->
              </div>
            </div>

          </div>
        </div>

        `;

joHtml = joHtml.substring(0, s05Idx) + newSection05Html + joHtml.substring(s06Idx);
console.log('[4B] Section 05 HTML in Tab 1 replaced successfully.');

// C. Update inisialisasiDropdownPersonil & Personnel JS Management
const initJsMarkerStart = 'function inisialisasiDropdownPersonil() {';
const s07JsMarker = '// 7. TABEL DINAMIS OBJEK PENILAIAN';
const initJsIdx = joHtml.indexOf(initJsMarkerStart);
const s07JsIdx = joHtml.indexOf(s07JsMarker, initJsIdx);

const newPersonnelJs = `// ==========================================================
    // 5. MANAJEMEN STATE MULTIPERSONEL & DROPDOWN FLEKSIBEL
    // ==========================================================
    window.statePenilaiList = [
      {
        id: "penilai_1",
        source: "MASTER",
        nama_master: "Tedi Setiadi, S.T.",
        nama_custom: "",
        mappi: "10-T-02490",
        rmk: "RMK-2017.01563",
        manual_data: null,
        status: "VERIFIED"
      }
    ];

    window.stateAsistenList = [
      {
        id: "asisten_1",
        source: "MASTER",
        nama_master: "Fadri Nurdin",
        nama_custom: "",
        mappi: "14-A-05096",
        rmk: "-",
        manual_data: null,
        status: "VERIFIED"
      }
    ];

    function inisialisasiDropdownPersonil() {
      const selRekan = document.getElementById('rekan_nama');
      const selReviewer = document.getElementById('reviewer_nama');
      if (!selRekan || !selReviewer) return;

      const isCabang = userSession && (userSession.mode === 'CABANG' || userSession.role === 'ADMIN_CABANG');
      const wil = (userSession && userSession.wilayah) || '';

      if (isCabang) {
        const partner = getRekanByWilayah(wil);
        populateDropdownRekan(partner?.nama);
      } else {
        selRekan.disabled = false;
        selRekan.innerHTML = DATABASE_REKAN.map(r => {
          const klasifikasiBadge = r.klasifikasi_kode === 'PS' ? '[PS - Sederhana]' : '[P - Properti]';
          return \`<option value="\${r.nama}">\${r.nama} (\${r.jabatan}) \${klasifikasiBadge}</option>\`;
        }).join('');
      }

      // Reviewer Dropdown: Master + Option Manual
      let optionsReviewer = DATABASE_PERSONIL.map(p => \`<option value="\${p.nama}">\${p.nama} (\${p.peran})</option>\`).join('');
      optionsReviewer += \`<option value="__MANUAL__">+ Lainnya / Input Nama Manual</option>\`;
      selReviewer.innerHTML = optionsReviewer;

      if (!isCabang) {
        const curRekan = selRekan.value;
        const defaultRekan = DATABASE_REKAN.find(r => r.nama === curRekan || r.nama.includes("Nanang Rahayu"))?.nama || DATABASE_REKAN[0].nama;
        selRekan.value = defaultRekan;
      }

      const defaultReviewer = DATABASE_PERSONIL.find(p => p.nama.includes("Danny Taufik"))?.nama || DATABASE_PERSONIL[1].nama;
      selReviewer.value = defaultReviewer;

      vlookupRekan();
      vlookupReviewer();

      // Render Multi-Personel Lists
      renderPenilaiListUI();
      renderAsistenListUI();
    }

    function vlookupRekan() {
      const sel = document.getElementById('rekan_nama');
      if (!sel) return;
      const nama = sel.value;
      const data = DATABASE_REKAN.find(r => r.nama === nama || r.nama.replace(/[^a-zA-Z]/g, '') === nama.replace(/[^a-zA-Z]/g, '')) || DATABASE_REKAN[0];
      
      const customEl = document.getElementById('rekan_nama_custom');
      if (customEl && (!customEl.value || DATABASE_REKAN.some(r => r.nama === customEl.value))) {
        customEl.value = data.nama;
      }

      if (document.getElementById('view_rekan_jabatan')) document.getElementById('view_rekan_jabatan').textContent = data.jabatan || "-";
      if (document.getElementById('view_rekan_mappi')) document.getElementById('view_rekan_mappi').textContent = data.mappi || "-";
      if (document.getElementById('view_rekan_izin')) document.getElementById('view_rekan_izin').textContent = data.izin || "-";
      if (document.getElementById('view_rekan_rmk')) document.getElementById('view_rekan_rmk').textContent = data.rmk || "-";
      if (document.getElementById('view_rekan_bpn')) document.getElementById('view_rekan_bpn').textContent = data.bpn || "-";
      if (document.getElementById('view_rekan_ojk')) document.getElementById('view_rekan_ojk').textContent = data.ojk || "-";
      if (typeof syncSection05ToSection08 === 'function') syncSection05ToSection08();
    }

    function resetRekanMaster() {
      const sel = document.getElementById('rekan_nama');
      if (!sel) return;
      const data = DATABASE_REKAN.find(r => r.nama === sel.value) || DATABASE_REKAN[0];
      const customEl = document.getElementById('rekan_nama_custom');
      if (customEl) {
        customEl.value = data.nama;
      }
      vlookupRekan();
    }

    function onRekanCustomInput() {
      if (typeof syncSection05ToSection08 === 'function') syncSection05ToSection08();
    }

    function vlookupReviewer() {
      const sel = document.getElementById('reviewer_nama');
      if (!sel) return;
      const val = sel.value;
      const formManual = document.getElementById('form_reviewer_manual');
      const kredMaster = document.getElementById('view_reviewer_master_kredensial');
      const wrapperCustom = document.getElementById('wrapper_reviewer_custom');

      if (val === '__MANUAL__') {
        if (formManual) formManual.classList.remove('hidden');
        if (kredMaster) kredMaster.classList.add('hidden');
        if (wrapperCustom) wrapperCustom.classList.add('hidden');
      } else {
        if (formManual) formManual.classList.add('hidden');
        if (kredMaster) kredMaster.classList.remove('hidden');
        if (wrapperCustom) wrapperCustom.classList.remove('hidden');

        const data = DATABASE_PERSONIL.find(p => p.nama === val || p.nama.replace(/[^a-zA-Z]/g, '') === val.replace(/[^a-zA-Z]/g, '')) || DATABASE_PERSONIL[1];
        if (document.getElementById('view_reviewer_mappi')) document.getElementById('view_reviewer_mappi').textContent = data.mappi || "-";
        if (document.getElementById('view_reviewer_rmk')) document.getElementById('view_reviewer_rmk').textContent = data.rmk || "-";

        const customEl = document.getElementById('reviewer_nama_custom');
        if (customEl && (!customEl.value || DATABASE_PERSONIL.some(p => p.nama === customEl.value))) {
          customEl.value = data.nama;
        }
      }
    }

    function resetReviewerMaster() {
      const sel = document.getElementById('reviewer_nama');
      if (!sel || sel.value === '__MANUAL__') return;
      const data = DATABASE_PERSONIL.find(p => p.nama === sel.value) || DATABASE_PERSONIL[1];
      const customEl = document.getElementById('reviewer_nama_custom');
      if (customEl) {
        customEl.value = data.nama;
      }
      vlookupReviewer();
    }

    // --- MULTIPERSONEL PENILAI PELAKSANA LAPANGAN ---
    function renderPenilaiListUI() {
      const container = document.getElementById('list_penilai_container');
      if (!container) return;

      container.innerHTML = window.statePenilaiList.map((item, index) => {
        const isManual = (item.source === 'MANUAL');
        const isFirst = (index === 0);
        const isLast = (index === window.statePenilaiList.length - 1);
        const canDelete = (window.statePenilaiList.length > 1);

        const optionsMaster = DATABASE_PERSONIL.map(p => {
          const isSelected = (!isManual && item.nama_master === p.nama);
          return \`<option value="\${p.nama}" \${isSelected ? 'selected' : ''}>\${p.nama} (\${p.peran})</option>\`;
        }).join('');

        return \`
          <div class="p-3.5 rounded-xl bg-slate-900/90 border \${isManual ? 'border-amber-600/50 bg-amber-950/10' : 'border-slate-800'} space-y-3">
            <div class="flex items-center justify-between pb-2 border-b border-slate-800">
              <div class="flex items-center gap-2">
                <span class="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-[10px] font-bold">\${index + 1}</span>
                <span class="font-bold text-slate-200 text-xs">Penilai Pelaksana #\${index + 1}</span>
                \${isManual ? '<span class="text-[9px] font-mono bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30">PENDING_VERIFICATION</span>' : '<span class="text-[9px] font-mono bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30">Master Roster</span>'}
              </div>
              <div class="flex items-center gap-1.5">
                <button type="button" onclick="geserPenilai(\${index}, -1)" \${isFirst ? 'disabled' : ''} class="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none text-slate-200 flex items-center justify-center text-xs" title="Geser Naik">▲</button>
                <button type="button" onclick="geserPenilai(\${index}, 1)" \${isLast ? 'disabled' : ''} class="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none text-slate-200 flex items-center justify-center text-xs" title="Geser Turun">▼</button>
                <button type="button" onclick="hapusPenilaiBaris(\${index})" \${!canDelete ? 'disabled' : ''} class="w-6 h-6 rounded bg-rose-950/50 hover:bg-rose-900/80 border border-rose-800/50 disabled:opacity-30 disabled:pointer-events-none text-rose-300 flex items-center justify-center text-xs" title="Hapus Personel">✕</button>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label class="block text-[10.5px] font-semibold text-slate-300 mb-1">Pilih dari Master atau Input Manual</label>
                <select onchange="onPenilaiSourceChange(\${index}, this.value)" class="w-full h-9 px-2.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-emerald-400">
                  <optgroup label="Daftar Master Personel">
                    \${optionsMaster}
                  </optgroup>
                  <optgroup label="Personel Non-Master">
                    <option value="__MANUAL__" \${isManual ? 'selected' : ''}>+ Lainnya / Input Nama Manual</option>
                  </optgroup>
                </select>
              </div>

              \${!isManual ? \`
                <div>
                  <div class="flex items-center justify-between mb-1">
                    <label class="block text-[10.5px] font-semibold text-slate-300">Penyesuaian Redaksi Nama (Opsional)</label>
                    <button type="button" onclick="resetPenilaiRowMaster(\${index})" class="text-[9.5px] text-emerald-400 hover:underline">Reset Master</button>
                  </div>
                  <input type="text" value="\${item.nama_custom || ''}" oninput="onPenilaiCustomInput(\${index}, this.value)" placeholder="Nama tampilan di dokumen" class="w-full h-9 px-2.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-emerald-400">
                </div>
                <div class="sm:col-span-2 flex items-center gap-4 text-[11px] font-mono text-slate-400 pt-1">
                  <div>No. MAPPI: <span class="text-amber-400 font-semibold">\${item.mappi || '-'}</span></div>
                  <div>No. RMK: <span class="text-emerald-400 font-semibold">\${item.rmk || '-'}</span></div>
                </div>
              \` : \`
                <div class="sm:col-span-2 p-3 rounded-lg bg-amber-950/20 border border-amber-800/40 space-y-2">
                  <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <label class="text-[10px] text-slate-300">Nama Lengkap <span class="text-rose-400">*</span></label>
                      <input type="text" value="\${item.manual_data?.nama || ''}" oninput="onPenilaiManualInput(\${index}, 'nama', this.value)" placeholder="Nama Lengkap" class="w-full h-8 px-2 rounded bg-slate-950 border border-slate-700 text-white text-xs">
                    </div>
                    <div>
                      <label class="text-[10px] text-slate-300">Gelar</label>
                      <input type="text" value="\${item.manual_data?.gelar || ''}" oninput="onPenilaiManualInput(\${index}, 'gelar', this.value)" placeholder="Gelar akademik/profesi" class="w-full h-8 px-2 rounded bg-slate-950 border border-slate-700 text-white text-xs">
                    </div>
                    <div>
                      <label class="text-[10px] text-slate-300">No. Register / MAPPI</label>
                      <input type="text" value="\${item.manual_data?.rmk || ''}" oninput="onPenilaiManualInput(\${index}, 'rmk', this.value)" placeholder="No. Reg Kemenkeu" class="w-full h-8 px-2 rounded bg-slate-950 border border-slate-700 text-white text-xs font-mono">
                    </div>
                  </div>
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label class="text-[10px] text-slate-300">Kantor Asal</label>
                      <input type="text" value="\${item.manual_data?.kantor || ''}" oninput="onPenilaiManualInput(\${index}, 'kantor', this.value)" placeholder="Kantor Asal" class="w-full h-8 px-2 rounded bg-slate-950 border border-slate-700 text-white text-xs">
                    </div>
                    <div>
                      <label class="text-[10px] text-slate-300">Fungsi dalam Tim / Catatan</label>
                      <input type="text" value="\${item.manual_data?.catatan || ''}" oninput="onPenilaiManualInput(\${index}, 'catatan', this.value)" placeholder="Fungsi atau catatan kualifikasi" class="w-full h-8 px-2 rounded bg-slate-950 border border-slate-700 text-white text-xs">
                    </div>
                  </div>
                </div>
              \`}
            </div>
          </div>
        \`;
      }).join('');

      // Sinkronisasi hidden backward compatibility input
      const elCompat = document.getElementById('penilai_nama');
      if (elCompat) {
        const primary = window.statePenilaiList[0];
        elCompat.value = primary ? (primary.nama_custom || (primary.source === 'MANUAL' ? (primary.manual_data?.nama || '') : primary.nama_master)) : '';
      }
    }

    function tambahPenilaiBaris() {
      const idxNext = window.statePenilaiList.length + 1;
      const defaultPerson = DATABASE_PERSONIL[idxNext % DATABASE_PERSONIL.length] || DATABASE_PERSONIL[0];
      window.statePenilaiList.push({
        id: 'penilai_' + Date.now(),
        source: 'MASTER',
        nama_master: defaultPerson.nama,
        nama_custom: '',
        mappi: defaultPerson.mappi || '-',
        rmk: defaultPerson.rmk || '-',
        manual_data: null,
        status: 'VERIFIED'
      });
      renderPenilaiListUI();
    }

    function hapusPenilaiBaris(index) {
      if (window.statePenilaiList.length <= 1) return;
      window.statePenilaiList.splice(index, 1);
      renderPenilaiListUI();
    }

    function geserPenilai(index, dir) {
      const targetIdx = index + dir;
      if (targetIdx < 0 || targetIdx >= window.statePenilaiList.length) return;
      const temp = window.statePenilaiList[index];
      window.statePenilaiList[index] = window.statePenilaiList[targetIdx];
      window.statePenilaiList[targetIdx] = temp;
      renderPenilaiListUI();
    }

    function onPenilaiSourceChange(index, val) {
      const item = window.statePenilaiList[index];
      if (!item) return;

      if (val === '__MANUAL__') {
        item.source = 'MANUAL';
        item.status = 'PENDING_VERIFICATION';
        item.manual_data = item.manual_data || {
          nama: '',
          gelar: '',
          rmk: '',
          kantor: '',
          catatan: ''
        };
      } else {
        item.source = 'MASTER';
        item.status = 'VERIFIED';
        item.nama_master = val;
        const pObj = DATABASE_PERSONIL.find(p => p.nama === val);
        item.mappi = pObj?.mappi || '-';
        item.rmk = pObj?.rmk || '-';
      }
      renderPenilaiListUI();
    }

    function onPenilaiCustomInput(index, val) {
      const item = window.statePenilaiList[index];
      if (item) item.nama_custom = val;
    }

    function resetPenilaiRowMaster(index) {
      const item = window.statePenilaiList[index];
      if (item) {
        item.nama_custom = '';
        renderPenilaiListUI();
      }
    }

    function onPenilaiManualInput(index, field, val) {
      const item = window.statePenilaiList[index];
      if (item && item.manual_data) {
        item.manual_data[field] = val;
      }
    }

    // --- MULTIPERSONEL ASISTEN PENILAI / SURVEYOR ---
    function renderAsistenListUI() {
      const container = document.getElementById('list_asisten_container');
      if (!container) return;

      container.innerHTML = window.stateAsistenList.map((item, index) => {
        const isManual = (item.source === 'MANUAL');
        const isFirst = (index === 0);
        const isLast = (index === window.stateAsistenList.length - 1);
        const canDelete = (window.stateAsistenList.length > 1);

        const optionsMaster = DATABASE_PERSONIL.map(p => {
          const isSelected = (!isManual && item.nama_master === p.nama);
          return \`<option value="\${p.nama}" \${isSelected ? 'selected' : ''}>\${p.nama} (\${p.peran})</option>\`;
        }).join('');

        return \`
          <div class="p-3.5 rounded-xl bg-slate-900/90 border \${isManual ? 'border-amber-600/50 bg-amber-950/10' : 'border-slate-800'} space-y-3">
            <div class="flex items-center justify-between pb-2 border-b border-slate-800">
              <div class="flex items-center gap-2">
                <span class="w-5 h-5 rounded-full bg-teal-500/20 text-teal-300 flex items-center justify-center text-[10px] font-bold">\${index + 1}</span>
                <span class="font-bold text-slate-200 text-xs">Asisten / Surveyor #\${index + 1}</span>
                \${isManual ? '<span class="text-[9px] font-mono bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30">PENDING_VERIFICATION</span>' : '<span class="text-[9px] font-mono bg-teal-500/20 text-teal-300 px-2 py-0.5 rounded border border-teal-500/30">Master Roster</span>'}
              </div>
              <div class="flex items-center gap-1.5">
                <button type="button" onclick="geserAsisten(\${index}, -1)" \${isFirst ? 'disabled' : ''} class="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none text-slate-200 flex items-center justify-center text-xs" title="Geser Naik">▲</button>
                <button type="button" onclick="geserAsisten(\${index}, 1)" \${isLast ? 'disabled' : ''} class="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none text-slate-200 flex items-center justify-center text-xs" title="Geser Turun">▼</button>
                <button type="button" onclick="hapusAsistenBaris(\${index})" \${!canDelete ? 'disabled' : ''} class="w-6 h-6 rounded bg-rose-950/50 hover:bg-rose-900/80 border border-rose-800/50 disabled:opacity-30 disabled:pointer-events-none text-rose-300 flex items-center justify-center text-xs" title="Hapus Personel">✕</button>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label class="block text-[10.5px] font-semibold text-slate-300 mb-1">Pilih dari Master atau Input Manual</label>
                <select onchange="onAsistenSourceChange(\${index}, this.value)" class="w-full h-9 px-2.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-teal-400">
                  <optgroup label="Daftar Master Personel">
                    \${optionsMaster}
                  </optgroup>
                  <optgroup label="Personel Non-Master">
                    <option value="__MANUAL__" \${isManual ? 'selected' : ''}>+ Lainnya / Input Nama Manual</option>
                  </optgroup>
                </select>
              </div>

              \${!isManual ? \`
                <div>
                  <div class="flex items-center justify-between mb-1">
                    <label class="block text-[10.5px] font-semibold text-slate-300">Penyesuaian Redaksi Nama (Opsional)</label>
                    <button type="button" onclick="resetAsistenRowMaster(\${index})" class="text-[9.5px] text-teal-400 hover:underline">Reset Master</button>
                  </div>
                  <input type="text" value="\${item.nama_custom || ''}" oninput="onAsistenCustomInput(\${index}, this.value)" placeholder="Nama tampilan di dokumen" class="w-full h-9 px-2.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-teal-400">
                </div>
                <div class="sm:col-span-2 flex items-center gap-4 text-[11px] font-mono text-slate-400 pt-1">
                  <div>No. MAPPI: <span class="text-amber-400 font-semibold">\${item.mappi || '-'}</span></div>
                  <div>Peran: <span class="text-teal-300 font-semibold">Surveyor Lapangan</span></div>
                </div>
              \` : \`
                <div class="sm:col-span-2 p-3 rounded-lg bg-amber-950/20 border border-amber-800/40 space-y-2">
                  <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <label class="text-[10px] text-slate-300">Nama Lengkap <span class="text-rose-400">*</span></label>
                      <input type="text" value="\${item.manual_data?.nama || ''}" oninput="onAsistenManualInput(\${index}, 'nama', this.value)" placeholder="Nama Lengkap" class="w-full h-8 px-2 rounded bg-slate-950 border border-slate-700 text-white text-xs">
                    </div>
                    <div>
                      <label class="text-[10px] text-slate-300">Gelar</label>
                      <input type="text" value="\${item.manual_data?.gelar || ''}" oninput="onAsistenManualInput(\${index}, 'gelar', this.value)" placeholder="Gelar akademik/profesi" class="w-full h-8 px-2 rounded bg-slate-950 border border-slate-700 text-white text-xs">
                    </div>
                    <div>
                      <label class="text-[10px] text-slate-300">No. ID Internal / MAPPI</label>
                      <input type="text" value="\${item.manual_data?.no_id || ''}" oninput="onAsistenManualInput(\${index}, 'no_id', this.value)" placeholder="ID / No. MAPPI" class="w-full h-8 px-2 rounded bg-slate-950 border border-slate-700 text-white text-xs font-mono">
                    </div>
                  </div>
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label class="text-[10px] text-slate-300">Kantor Asal</label>
                      <input type="text" value="\${item.manual_data?.kantor || ''}" oninput="onAsistenManualInput(\${index}, 'kantor', this.value)" placeholder="Kantor Asal" class="w-full h-8 px-2 rounded bg-slate-950 border border-slate-700 text-white text-xs">
                    </div>
                    <div>
                      <label class="text-[10px] text-slate-300">Fungsi / Catatan</label>
                      <input type="text" value="\${item.manual_data?.catatan || ''}" oninput="onAsistenManualInput(\${index}, 'catatan', this.value)" placeholder="Fungsi penugasan" class="w-full h-8 px-2 rounded bg-slate-950 border border-slate-700 text-white text-xs">
                    </div>
                  </div>
                </div>
              \`}
            </div>
          </div>
        \`;
      }).join('');

      // Sinkronisasi hidden backward compatibility input
      const elCompat = document.getElementById('asisten_nama');
      if (elCompat) {
        const primary = window.stateAsistenList[0];
        elCompat.value = primary ? (primary.nama_custom || (primary.source === 'MANUAL' ? (primary.manual_data?.nama || '') : primary.nama_master)) : '';
      }
    }

    function tambahAsistenBaris() {
      const idxNext = window.stateAsistenList.length + 1;
      const defaultPerson = DATABASE_PERSONIL[Math.min(DATABASE_PERSONIL.length - 1, 6 + (idxNext % 4))] || DATABASE_PERSONIL[7];
      window.stateAsistenList.push({
        id: 'asisten_' + Date.now(),
        source: 'MASTER',
        nama_master: defaultPerson.nama,
        nama_custom: '',
        mappi: defaultPerson.mappi || '-',
        rmk: defaultPerson.rmk || '-',
        manual_data: null,
        status: 'VERIFIED'
      });
      renderAsistenListUI();
    }

    function hapusAsistenBaris(index) {
      if (window.stateAsistenList.length <= 1) return;
      window.stateAsistenList.splice(index, 1);
      renderAsistenListUI();
    }

    function geserAsisten(index, dir) {
      const targetIdx = index + dir;
      if (targetIdx < 0 || targetIdx >= window.stateAsistenList.length) return;
      const temp = window.stateAsistenList[index];
      window.stateAsistenList[index] = window.stateAsistenList[targetIdx];
      window.stateAsistenList[targetIdx] = temp;
      renderAsistenListUI();
    }

    function onAsistenSourceChange(index, val) {
      const item = window.stateAsistenList[index];
      if (!item) return;

      if (val === '__MANUAL__') {
        item.source = 'MANUAL';
        item.status = 'PENDING_VERIFICATION';
        item.manual_data = item.manual_data || {
          nama: '',
          gelar: '',
          no_id: '',
          kantor: '',
          catatan: ''
        };
      } else {
        item.source = 'MASTER';
        item.status = 'VERIFIED';
        item.nama_master = val;
        const pObj = DATABASE_PERSONIL.find(p => p.nama === val);
        item.mappi = pObj?.mappi || '-';
        item.rmk = pObj?.rmk || '-';
      }
      renderAsistenListUI();
    }

    function onAsistenCustomInput(index, val) {
      const item = window.stateAsistenList[index];
      if (item) item.nama_custom = val;
    }

    function resetAsistenRowMaster(index) {
      const item = window.stateAsistenList[index];
      if (item) {
        item.nama_custom = '';
        renderAsistenListUI();
      }
    }

    function onAsistenManualInput(index, field, val) {
      const item = window.stateAsistenList[index];
      if (item && item.manual_data) {
        item.manual_data[field] = val;
      }
    }

    function kumpulkanDataPenilaiList() {
      return (window.statePenilaiList || []).map(p => {
        let finalNama = '';
        if (p.source === 'MANUAL') {
          const nm = (p.manual_data?.nama || '').trim();
          const gl = (p.manual_data?.gelar || '').trim();
          finalNama = nm ? (gl ? \`\${nm}, \${gl}\` : nm) : 'Penilai Lapangan';
          return {
            id: p.id,
            source: 'MANUAL',
            status: 'PENDING_VERIFICATION',
            nama: finalNama,
            mappi: (p.manual_data?.rmk || '-'),
            rmk: (p.manual_data?.rmk || '-'),
            kantor: (p.manual_data?.kantor || '-'),
            catatan: (p.manual_data?.catatan || '-')
          };
        } else {
          finalNama = (p.nama_custom && p.nama_custom.trim()) ? p.nama_custom.trim() : p.nama_master;
          return {
            id: p.id,
            source: 'MASTER',
            status: 'VERIFIED',
            nama: finalNama,
            nama_master: p.nama_master,
            nama_custom: p.nama_custom,
            mappi: p.mappi || '-',
            rmk: p.rmk || '-'
          };
        }
      });
    }

    function kumpulkanDataAsistenList() {
      return (window.stateAsistenList || []).map(a => {
        let finalNama = '';
        if (a.source === 'MANUAL') {
          const nm = (a.manual_data?.nama || '').trim();
          const gl = (a.manual_data?.gelar || '').trim();
          finalNama = nm ? (gl ? \`\${nm}, \${gl}\` : nm) : 'Surveyor Lapangan';
          return {
            id: a.id,
            source: 'MANUAL',
            status: 'PENDING_VERIFICATION',
            nama: finalNama,
            mappi: (a.manual_data?.no_id || '-'),
            rmk: '-',
            kantor: (a.manual_data?.kantor || '-'),
            catatan: (a.manual_data?.catatan || '-')
          };
        } else {
          finalNama = (a.nama_custom && a.nama_custom.trim()) ? a.nama_custom.trim() : a.nama_master;
          return {
            id: a.id,
            source: 'MASTER',
            status: 'VERIFIED',
            nama: finalNama,
            nama_master: a.nama_master,
            nama_custom: a.nama_custom,
            mappi: a.mappi || '-',
            rmk: a.rmk || '-'
          };
        }
      });
    }

    `;

joHtml = joHtml.substring(0, initJsIdx) + newPersonnelJs + joHtml.substring(s07JsIdx);
console.log('[4C] inisialisasiDropdownPersonil & Multi-Personel JS replaced successfully.');

// D. Update bangunDraftDariForm to capture new fields
const oldDraftCaptureStart = 'rekan_nama: (isCabang && branchPartner) ? branchPartner.nama : (document.getElementById(\'rekan_nama\')?.value || rekanSelected.nama || \'\'),';
const oldDraftCaptureEnd = 'surveyor_pendamping:';
const draftCapIdx = joHtml.indexOf(oldDraftCaptureStart);
const draftCapEndIdx = joHtml.indexOf(oldDraftCaptureEnd, draftCapIdx);

if (draftCapIdx !== -1 && draftCapEndIdx !== -1) {
  const newDraftCapture = `rekan_nama: (isCabang && branchPartner) ? branchPartner.nama : ((document.getElementById('rekan_nama_custom')?.value || '').trim() || document.getElementById('rekan_nama')?.value || rekanSelected.nama || ''),
        rekan_nama_master: (isCabang && branchPartner) ? branchPartner.nama : (document.getElementById('rekan_nama')?.value || rekanSelected.nama || ''),
        rekan_nama_custom: (document.getElementById('rekan_nama_custom')?.value || '').trim(),
        rekan_izin: (isCabang && branchPartner) ? (branchPartner.izin || 'P-1.20.00581') : (rekanSelected.izin || 'P-1.20.00581'),
        reviewer_nama: (() => {
          const revSel = document.getElementById('reviewer_nama')?.value;
          if (revSel === '__MANUAL__') {
            const nm = (document.getElementById('rev_manual_nama')?.value || '').trim();
            const gl = (document.getElementById('rev_manual_gelar')?.value || '').trim();
            return nm ? (gl ? \`\${nm}, \${gl}\` : nm) : 'Reviewer Eksternal';
          }
          return (document.getElementById('reviewer_nama_custom')?.value || '').trim() || revSel || '';
        })(),
        reviewer_nama_master: document.getElementById('reviewer_nama')?.value || '',
        reviewer_nama_custom: (document.getElementById('reviewer_nama_custom')?.value || '').trim(),
        reviewer_is_manual: (document.getElementById('reviewer_nama')?.value === '__MANUAL__'),
        reviewer_manual_data: (document.getElementById('reviewer_nama')?.value === '__MANUAL__') ? {
          source: 'MANUAL',
          status: 'PENDING_VERIFICATION',
          nama: (document.getElementById('rev_manual_nama')?.value || '').trim(),
          gelar: (document.getElementById('rev_manual_gelar')?.value || '').trim(),
          jabatan: (document.getElementById('rev_manual_jabatan')?.value || '').trim(),
          kantor: (document.getElementById('rev_manual_kantor')?.value || '').trim(),
          rmk: (document.getElementById('rev_manual_rmk')?.value || '').trim(),
          catatan: (document.getElementById('rev_manual_catatan')?.value || '').trim()
        } : null,
        penilai_list: (typeof kumpulkanDataPenilaiList === 'function') ? kumpulkanDataPenilaiList() : [],
        penilai_nama: (() => {
          const list = (typeof kumpulkanDataPenilaiList === 'function') ? kumpulkanDataPenilaiList() : [];
          return list.map(p => p.nama).join(', ') || document.getElementById('penilai_nama')?.value || '';
        })(),
        asisten_list: (typeof kumpulkanDataAsistenList === 'function') ? kumpulkanDataAsistenList() : [],
        asisten_nama: (() => {
          const list = (typeof kumpulkanDataAsistenList === 'function') ? kumpulkanDataAsistenList() : [];
          return list.map(a => a.nama).join(', ') || document.getElementById('asisten_nama')?.value || '';
        })(),
        `;
  joHtml = joHtml.substring(0, draftCapIdx) + newDraftCapture + joHtml.substring(draftCapEndIdx);
  console.log('[4D] bangunDraftDariForm personnel extraction updated successfully.');
} else {
  console.warn('[4D] WARNING: Could not find exact boundary for oldDraftCaptureStart in bangunDraftDariForm.');
}

// E. Update renderSemuaDokumen Personnel Setup & Integration
const rDocSetupStart = '// Metadata Personil Fallback & Dynamic Lookup Rekan dari Master_Personil';
const rDocSetupEnd = 'const selDok = document.getElementById(\'pilih_tampilan_dokumen\').value;';
const rDocSetupIdx = joHtml.indexOf(rDocSetupStart);
const rDocSetupEndIdx = joHtml.indexOf(rDocSetupEnd, rDocSetupIdx);

if (rDocSetupIdx !== -1 && rDocSetupEndIdx !== -1) {
  const newRDocSetup = `// Metadata Personil Fallback & Dynamic Lookup Rekan dari Master_Personil
      const rekanObj = DATABASE_REKAN.find(r => 
        r.nama === p.rekan_nama ||
        r.nama === p.rekan_nama_master ||
        (r.id && r.id === p.rekan_id) ||
        r.nama.toLowerCase().replace(/[^a-z]/g, '') === (p.rekan_nama || '').toLowerCase().replace(/[^a-z]/g, '')
      ) || DATABASE_REKAN[0];

      // Redaksi Tampilan Rekan Penilai Publik (Bisa disesuaikan per record tanpa mengubah data legal/izin master)
      const rekanTampilan = (p.rekan_nama_custom && p.rekan_nama_custom.trim()) ? p.rekan_nama_custom.trim() : (p.rekan_nama || rekanObj.nama);

      function cariPersonil(namaTarget, fallbackMappi, fallbackRmk) {
        if (!namaTarget) return { nama: '-', mappi: fallbackMappi || '-', rmk: fallbackRmk || '-', hp: '-' };
        const clean = namaTarget.toLowerCase().replace(/[^a-z]/g, '');
        const found = DATABASE_PERSONIL.find(x => {
          const xClean = x.nama.toLowerCase().replace(/[^a-z]/g, '');
          return clean.includes(xClean) || xClean.includes(clean);
        });
        return found || { nama: namaTarget, mappi: fallbackMappi || '-', rmk: fallbackRmk || '-', hp: '-' };
      }

      // Reviewer Tampilan & Metadata
      const reviewerTampilan = (p.reviewer_nama_custom && p.reviewer_nama_custom.trim()) ? p.reviewer_nama_custom.trim() : (p.reviewer_nama || 'Danny Taufik Hidayat, S.H.');
      const reviewerIsManual = Boolean(p.reviewer_is_manual || (p.reviewer_manual_data && p.reviewer_manual_data.source === 'MANUAL'));
      const reviewerMeta = cariPersonil(p.reviewer_nama, '10-P-02594', 'RMK-2021.04012');
      if (reviewerIsManual && p.reviewer_manual_data) {
        if (p.reviewer_manual_data.rmk) reviewerMeta.rmk = p.reviewer_manual_data.rmk;
        if (p.reviewer_manual_data.mappi) reviewerMeta.mappi = p.reviewer_manual_data.mappi;
      }

      // Multi-Personel List Resolvers (Fallback ke single field untuk backward compatibility)
      const listPenilai = (Array.isArray(p.penilai_list) && p.penilai_list.length > 0)
        ? p.penilai_list
        : [{
            nama: p.penilai_nama || 'Tedi Setiadi, S.T.',
            mappi: '10-T-02490',
            rmk: 'RMK-2017.01563',
            source: 'MASTER'
          }];

      const listAsisten = (Array.isArray(p.asisten_list) && p.asisten_list.length > 0)
        ? p.asisten_list
        : [{
            nama: p.asisten_nama || 'Fadri Nurdin',
            mappi: '14-A-05096',
            rmk: '-',
            source: 'MASTER'
          }];

      const penilaiMeta = cariPersonil(listPenilai[0]?.nama || p.penilai_nama, '10-T-02490', 'RMK-2017.01563');
      const asistenMeta = cariPersonil(listAsisten[0]?.nama || p.asisten_nama, '14-A-05096', '-');

      const viewRekanIzin = p.rekan_izin || (document.getElementById('view_rekan_izin') ? document.getElementById('view_rekan_izin').textContent : '') || rekanObj.izin || 'P-1.20.00581';
      const viewReviewerMappi = (document.getElementById('view_reviewer_mappi') ? document.getElementById('view_reviewer_mappi').textContent : '') || reviewerMeta.mappi || '10-P-02594';
      const viewReviewerRmk = (document.getElementById('view_reviewer_rmk') ? document.getElementById('view_reviewer_rmk').textContent : '') || reviewerMeta.rmk || 'RMK-2021.04012';
      const viewPenilaiMappi = (document.getElementById('view_penilai_mappi') ? document.getElementById('view_penilai_mappi').textContent : '') || penilaiMeta.mappi || '10-T-02490';
      const viewAsistenMappi = (document.getElementById('view_asisten_mappi') ? document.getElementById('view_asisten_mappi').textContent : '') || asistenMeta.mappi || '14-A-05096';

      `;
  joHtml = joHtml.substring(0, rDocSetupIdx) + newRDocSetup + joHtml.substring(rDocSetupEndIdx);
  console.log('[4E] renderSemuaDokumen setup updated with multi-personel resolvers.');
}

// F. In Dok 1 Klausul 1 & Klausul 23:
joHtml = joHtml.replace(
  '<td class="font-bold text-slate-900">${rekanObj.nama}</td>',
  '<td class="font-bold text-slate-900">${rekanTampilan}</td>'
);
joHtml = joHtml.replace(
  '<p class="font-bold underline text-sm">${rekanObj.nama}</p>',
  '<p class="font-bold underline text-sm">${rekanTampilan}</p>'
);

// G. In Dok 2 Surat Representasi:
joHtml = joHtml.replace(
  '<p class="font-bold underline text-sm">${rekanObj.nama}</p>',
  '<p class="font-bold underline text-sm">${rekanTampilan}</p>'
);

// H. In Dok 3A Lembar Isian Umum:
joHtml = joHtml.replace(
  '<td><strong>${rekanObj.nama}</strong> (Rekan, No Ijin Penilai:',
  '<td><strong>${rekanTampilan}</strong> (Rekan, No Ijin Penilai:'
);
joHtml = joHtml.replace(
  '<td>${p.reviewer_nama} (No. MAPPI: <span class="font-mono">${viewReviewerMappi}</span>, RMK: <span class="font-mono">${reviewerMeta.rmk || \'-\'}</span>)</td>',
  '<td>${reviewerTampilan} (No. MAPPI: <span class="font-mono">${viewReviewerMappi}</span>, No. RMK: <span class="font-mono">${viewReviewerRmk}</span>)</td>'
);
joHtml = joHtml.replace(
  '<td>${p.penilai_nama} (No. MAPPI: <span class="font-mono">${viewPenilaiMappi}</span>, RMK: <span class="font-mono">${penilaiMeta.rmk || \'-\'}</span>)</td>',
  '<td>${listPenilai.map(pen => `<strong>${pen.nama}</strong> (No. MAPPI: <span class="font-mono">${pen.mappi || \'-\'}</span>, No. RMK: <span class="font-mono">${pen.rmk || \'-\'}</span>)`).join(\'<br>\')}</td>'
);
joHtml = joHtml.replace(
  '<td>${p.asisten_nama} (No. MAPPI: <span class="font-mono">${viewAsistenMappi}</span>)</td>',
  '<td>${listAsisten.map(as => `<strong>${as.nama}</strong> (No. MAPPI: <span class="font-mono">${as.mappi || \'-\'}</span>)`).join(\'<br>\')}</td>'
);

// I. In Dok 3B Form JO:
joHtml = joHtml.replace(
  '<td><strong>${p.penilai_nama} / ${p.asisten_nama}</strong></td>',
  '<td><strong>${listPenilai.map(p => p.nama).join(\', \')} / ${listAsisten.map(a => a.nama).join(\', \')}</strong></td>'
);

// J. In Dok 3C Kartu Proyek:
joHtml = joHtml.replace(
  '<p class="font-bold underline">${p.reviewer_nama}</p>',
  '<p class="font-bold underline">${reviewerTampilan}</p>'
);

// K. In Dok 3D Surat Tugas: Table of personnel
const newDok3DTableRows = `\${(() => {
                            let rows = '';
                            let noUrut = 1;
                            listPenilai.forEach(pen => {
                              rows += \`<tr>
                                <td class="text-center font-bold">\${noUrut++}</td>
                                <td class="font-bold">Penilai Pelaksana Lapangan</td>
                                <td class="font-bold">\${pen.nama}</td>
                                <td class="font-mono">\${pen.mappi || '-'}</td>
                              </tr>\`;
                            });
                            listAsisten.forEach(as => {
                              rows += \`<tr>
                                <td class="text-center font-bold">\${noUrut++}</td>
                                <td class="font-bold">Asisten Penilai / Surveyor</td>
                                <td class="font-bold">\${as.nama}</td>
                                <td class="font-mono">\${as.mappi || '-'}</td>
                              </tr>\`;
                            });
                            return rows;
                          })()}`;

const dok3dMatch = joHtml.indexOf('<td class="font-bold">Penilai Lapangan</td>');
if (dok3dMatch !== -1) {
  const tableBodyStart = joHtml.lastIndexOf('<tbody>', dok3dMatch) + 7;
  const tableBodyEnd = joHtml.indexOf('</tbody>', dok3dMatch);
  joHtml = joHtml.substring(0, tableBodyStart) + '\n' + newDok3DTableRows + '\n' + joHtml.substring(tableBodyEnd);
  console.log('[4K] Dok 3D Surat Tugas table replaced via tbody index.');
}

// Surat Tugas Signature Rekan
joHtml = joHtml.replace(
  '<p class="font-bold underline">${rekanObj.nama}</p>\n                            <p class="text-[10px]">Rekan Penilai Publik',
  '<p class="font-bold underline">${rekanTampilan}</p>\n                            <p class="text-[10px]">Rekan Penilai Publik'
);

// L. In Dok 3E BAP:
joHtml = joHtml.replace(
  '<td class="py-0.5"><strong>${p.asisten_nama} / ${p.penilai_nama}</strong></td>',
  '<td class="py-0.5"><strong>${[...listAsisten.map(a => a.nama), ...listPenilai.map(p => p.nama)].join(\' / \')}</strong></td>'
);
joHtml = joHtml.replace(
  '<td class="font-mono py-0.5">${viewAsistenMappi} / ${viewPenilaiMappi}</td>',
  '<td class="font-mono py-0.5">${[...listAsisten.map(a => a.mappi || \'-\'), ...listPenilai.map(p => p.mappi || \'-\')].join(\' / \')}</td>'
);
joHtml = joHtml.replace(
  '<p class="font-bold underline">${p.asisten_nama}</p>\n                                <p class="text-[9.5px]">Surveyor / Penilai Lapangan</p>',
  '<p class="font-bold underline">${[...listAsisten.map(a => a.nama), ...listPenilai.map(p => p.nama)].join(\' / \')}</p>\n                                <p class="text-[9.5px]">Surveyor / Penilai Lapangan</p>'
);

// M. In Dok 3F ETI:
const newDok3FETIRows = `<tr>
                            <td class="font-bold">\${reviewerTampilan}</td>
                            <td>Reviewer</td>
                            <td class="font-mono">\${viewReviewerMappi}</td>
                            <td class="font-mono">\${viewReviewerRmk}</td>
                          </tr>
                          \${(() => {
                            let rows = '';
                            listPenilai.forEach(pen => {
                              rows += \`<tr>
                                <td class="font-bold">\${pen.nama}</td>
                                <td>Penilai Pelaksana Lapangan</td>
                                <td class="font-mono">\${pen.mappi || '-'}</td>
                                <td class="font-mono">\${pen.rmk || '-'}</td>
                              </tr>\`;
                            });
                            listAsisten.forEach(as => {
                              rows += \`<tr>
                                <td class="font-bold">\${as.nama}</td>
                                <td>Asisten Penilai / Surveyor</td>
                                <td class="font-mono">\${as.mappi || '-'}</td>
                                <td class="font-mono">\${as.rmk || '-'}</td>
                              </tr>\`;
                            });
                            return rows;
                          })()}`;

const etiMatch = joHtml.indexOf('<td>Reviewer</td>');
if (etiMatch !== -1) {
  const tableBodyStart = joHtml.lastIndexOf('<tbody>', etiMatch) + 7;
  const tableBodyEnd = joHtml.indexOf('</tbody>', etiMatch);
  joHtml = joHtml.substring(0, tableBodyStart) + '\n' + newDok3FETIRows + '\n' + joHtml.substring(tableBodyEnd);
  console.log('[4M] Dok 3F ETI table replaced via tbody index.');
}

// Dok 3F Signature
joHtml = joHtml.replace(
  '<p class="font-bold underline">${p.reviewer_nama}</p>\n                                  <p class="text-[10px] font-bold">Reviewer Mutu</p>',
  '<p class="font-bold underline">${reviewerTampilan}</p>\n                                  <p class="text-[10px] font-bold">Reviewer Mutu</p>'
);
joHtml = joHtml.replace(
  '<p class="font-bold underline">${p.penilai_nama}</p>\n                                  <p class="text-[10px] font-bold">Penilai Lapangan</p>',
  '<p class="font-bold underline">${listPenilai.map(p => p.nama).join(\', \')}</p>\n                                  <p class="text-[10px] font-bold">Penilai Lapangan</p>'
);
joHtml = joHtml.replace(
  '<p class="font-bold underline">${p.asisten_nama}</p>\n                                  <p class="text-[10px] font-bold">Asisten Penilai</p>',
  '<p class="font-bold underline">${listAsisten.map(a => a.nama).join(\', \')}</p>\n                                  <p class="text-[10px] font-bold">Asisten Penilai</p>'
);

// N. In Dok 3G PI (4 signature blocks):
joHtml = joHtml.replace(
  '<p class="font-bold underline text-[10.5px]">${rekanObj.nama}</p>',
  '<p class="font-bold underline text-[10.5px]">${rekanTampilan}</p>'
);

// In Dok 3G: Reviewer signature block
const d3gIdx = joHtml.indexOf('PERNYATAAN INDEPENDENSI (PI)');
if (d3gIdx !== -1) {
  const revPatt = '<p class="font-bold underline text-[10.5px]">${p.reviewer_nama}</p>';
  const revPos = joHtml.indexOf(revPatt, d3gIdx);
  if (revPos !== -1) {
    joHtml = joHtml.substring(0, revPos) + '<p class="font-bold underline text-[10.5px]">${reviewerTampilan}</p>' + joHtml.substring(revPos + revPatt.length);
    console.log('[4N] Dok 3G PI Reviewer signature updated to reviewerTampilan.');
  }

  const rmkPatt = '<p class="text-[9px] text-slate-600 font-mono">No. Register: ${reviewerMeta.rmk || \'-\'}</p>';
  const rmkPos = joHtml.indexOf(rmkPatt, d3gIdx);
  if (rmkPos !== -1) {
    joHtml = joHtml.substring(0, rmkPos) + '<p class="text-[9px] text-slate-600 font-mono">No. Register: ${viewReviewerRmk}</p>' + joHtml.substring(rmkPos + rmkPatt.length);
    console.log('[4N] Dok 3G PI Reviewer RMK updated to viewReviewerRmk.');
  }
}

// In Dok 3G: Penilai & Asisten multi-signature
const penPatt = '<p class="font-bold underline text-[10.5px]">${p.penilai_nama}</p>';
const penPos = joHtml.indexOf(penPatt, d3gIdx);
if (penPos !== -1) {
  joHtml = joHtml.substring(0, penPos) + '<p class="font-bold underline text-[10.5px]">${listPenilai.map(p => p.nama).join(\'<br>\')}</p>' + joHtml.substring(penPos + penPatt.length);
}

const asPatt = '<p class="font-bold underline text-[10.5px]">${p.asisten_nama}</p>';
const asPos = joHtml.indexOf(asPatt, d3gIdx);
if (asPos !== -1) {
  joHtml = joHtml.substring(0, asPos) + '<p class="font-bold underline text-[10.5px]">${listAsisten.map(a => a.nama).join(\'<br>\')}</p>' + joHtml.substring(asPos + asPatt.length);
}

fs.writeFileSync(joPath, joHtml, 'utf8');
console.log('[4] portal-penugasan-jo.html successfully updated with Master Personel & Flexible Assignment System.');

console.log('================================================================');
console.log('SUCCESS: All files successfully synchronized and patched.');
console.log('================================================================');
