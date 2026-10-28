import fs from 'fs';

const filePath = 'portal-penugasan-jo.html';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Tambah field Bidang Usaha di Seksi 2
const targetSection2Fields = `<div id="col_pemberi_tugas_pic">
              <label id="lbl_pemberi_tugas_pic" class="block font-semibold text-slate-300 mb-1">Nama PIC / Pejabat Penandatangan</label>
              <input type="text" id="pemberi_tugas_pic" placeholder="Contoh: Bpk. Bambang Sutrisno" class="w-full h-10 px-3 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 focus:outline-none focus:border-amber-400">
            </div>`;

const replacementSection2Fields = `<div id="col_pemberi_tugas_bidang">
              <label id="lbl_pemberi_tugas_bidang" class="block font-semibold text-slate-300 mb-1">Bidang Usaha Instansi / Klien <span class="text-rose-400">*</span></label>
              <select id="pemberi_tugas_bidang" class="w-full h-10 px-3 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 font-semibold focus:outline-none focus:border-amber-400">
                <option value="Perbankan / Finansial" selected>Perbankan / Finansial</option>
                <option value="BUMN / Instansi Pemerintah">BUMN / Instansi Pemerintah</option>
                <option value="Korporasi / Industri Swasta">Korporasi / Industri Swasta</option>
                <option value="Pengembang / Properti">Pengembang / Properti</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>

            <div id="col_pemberi_tugas_pic">
              <label id="lbl_pemberi_tugas_pic" class="block font-semibold text-slate-300 mb-1">Nama PIC / Pejabat Penandatangan <span class="text-rose-400">*</span></label>
              <input type="text" id="pemberi_tugas_pic" placeholder="Contoh: Bpk. Bambang Sutrisno" class="w-full h-10 px-3 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 focus:outline-none focus:border-amber-400">
            </div>`;

// 2. Tambah Skema Termin Penagihan di Seksi 7
const targetCaraPembayaran = `<div class="mt-4 pt-3 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label class="block font-semibold text-slate-300 mb-1">Ketentuan Cara Pembayaran</label>
              <input type="text" id="cara_pembayaran" value="Pembayaran dilakukan 100% setelah Lingkup Penugasan (SPK) ditandatangani para pihak." class="w-full h-10 px-3 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 focus:outline-none focus:border-amber-400">
            </div>`;

const replacementCaraPembayaran = `<div class="mt-4 pt-3 border-t border-slate-800/80">
            <div class="flex items-center justify-between mb-2">
              <label class="block font-semibold text-slate-300 text-xs">Skema Termin Penagihan (Pilihan Cepat):</label>
              <span class="text-[10px] text-amber-400 font-mono">Standar SOP KJPP NSR</span>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-3.5">
              <button type="button" onclick="setSkemaTerminPenugasan('LUNAS_DIMUKA')" class="p-3 rounded-xl bg-slate-950 border border-slate-700 hover:border-amber-400 text-left transition hover:bg-slate-900 group cursor-pointer shadow-sm">
                <div class="text-[11px] font-bold text-amber-300 flex items-center gap-1.5">
                  <span>💰</span>
                  <span>100% di Muka / Pra-Final</span>
                </div>
                <div class="text-[10px] text-slate-400 mt-0.5">Pembayaran Penuh 100% di Muka / Sebelum Final diserahkan</div>
              </button>
              <button type="button" onclick="setSkemaTerminPenugasan('DP50_PELUNASAN50')" class="p-3 rounded-xl bg-slate-950 border border-slate-700 hover:border-amber-400 text-left transition hover:bg-slate-900 group cursor-pointer shadow-sm">
                <div class="text-[11px] font-bold text-amber-300 flex items-center gap-1.5">
                  <span>⚖️</span>
                  <span>DP 50% + Pelunasan 50%</span>
                </div>
                <div class="text-[10px] text-slate-400 mt-0.5">DP 50% saat SPK &amp; Pelunasan 50% saat final</div>
              </button>
              <button type="button" onclick="setSkemaTerminPenugasan('BAST_100')" class="p-3 rounded-xl bg-slate-950 border border-slate-700 hover:border-sky-400 text-left transition hover:bg-slate-900 group cursor-pointer shadow-sm">
                <div class="text-[11px] font-bold text-sky-300 flex items-center gap-1.5">
                  <span>🏛️</span>
                  <span>100% Pascaterbit / BAST</span>
                </div>
                <div class="text-[10px] text-slate-400 mt-0.5">Termin 100% Pascaterbit / BAST (Proyek Pemerintah / BUMN)</div>
              </button>
            </div>
          </div>

          <div class="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label class="block font-semibold text-slate-300 mb-1">Ketentuan Cara Pembayaran <span class="text-rose-400">*</span></label>
              <input type="text" id="cara_pembayaran" value="Pembayaran dilakukan 100% setelah Lingkup Penugasan (SPK) ditandatangani para pihak." class="w-full h-10 px-3 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 focus:outline-none focus:border-amber-400">
            </div>`;

// 3. Update onEntitasPemberiTugasChange
const targetOnEntitas = `function onEntitasPemberiTugasChange() {
      const isPerorangan = document.getElementById('entitas_perorangan')?.checked;
      const lblNama = document.getElementById('lbl_pemberi_tugas_nama');
      const inpNama = document.getElementById('pemberi_tugas_nama');
      const colPic = document.getElementById('col_pemberi_tugas_pic');
      const colJabatan = document.getElementById('col_pemberi_tugas_jabatan');
      const inpPic = document.getElementById('pemberi_tugas_pic');
      const inpJabatan = document.getElementById('pemberi_tugas_jabatan');
      const lblAlamat = document.getElementById('lbl_pemberi_tugas_alamat');
      const lblNpwp = document.getElementById('lbl_pemberi_tugas_npwp');
      const inpNpwp = document.getElementById('pemberi_tugas_npwp');

      if (isPerorangan) {
        if (lblNama) lblNama.innerHTML = 'Nama Lengkap Pemberi Tugas (sesuai KTP) <span class="text-rose-400">*</span>';
        if (inpNama) inpNama.placeholder = 'Contoh: Budi Santoso / H. Muhammad Arifin';
        if (colPic) colPic.classList.add('hidden');
        if (colJabatan) colJabatan.classList.add('hidden');
        if (inpPic) { inpPic.required = false; inpPic.value = ''; }
        if (inpJabatan) { inpJabatan.required = false; inpJabatan.value = ''; }
        if (lblAlamat) lblAlamat.innerHTML = 'Alamat Domisili KTP Pemberi Tugas <span class="text-rose-400">*</span>';
        if (lblNpwp) lblNpwp.innerHTML = 'NIK KTP (16 Digit) / NPWP Pribadi';
        if (inpNpwp) inpNpwp.placeholder = 'Contoh: 3201012304850001 (NIK 16 Digit) atau NPWP Pribadi (opsional / "-" jika non-NPWP)';
      } else {
        if (lblNama) lblNama.innerHTML = 'Nama Instansi / Badan Usaha Pemberi Tugas <span class="text-rose-400">*</span>';
        if (inpNama) inpNama.placeholder = 'Contoh: PT BANK RAKYAT INDONESIA (PERSERO) TBK';
        if (colPic) colPic.classList.remove('hidden');
        if (colJabatan) colJabatan.classList.remove('hidden');
        if (lblAlamat) lblAlamat.innerHTML = 'Alamat Kantor Pemberi Tugas <span class="text-rose-400">*</span>';
        if (lblNpwp) lblNpwp.innerHTML = 'NPWP &amp; Alamat NPWP Pemberi Tugas';
        if (inpNpwp) inpNpwp.placeholder = 'NPWP: 01.001.604.1-092.000 (Alamat sesuai NPWP: Jl. Jend. Sudirman Kav. 44-46, Jakarta Pusat)';
      }
    }`;

const replacementOnEntitas = `function setSkemaTerminPenugasan(skema) {
      const inpCara = document.getElementById('cara_pembayaran');
      if (!inpCara) return;
      if (skema === 'LUNAS_DIMUKA') {
        inpCara.value = 'Pembayaran Penuh 100% di Muka / Sebelum Final Laporan diserahkan.';
      } else if (skema === 'DP50_PELUNASAN50') {
        inpCara.value = 'DP 50% pada saat penandatanganan SPK dan Pelunasan 50% setelah draft laporan disetujui / penyerahan laporan final.';
      } else if (skema === 'BAST_100') {
        inpCara.value = 'Termin 100% Pascaterbit / BAST (Proyek Pemerintah / BUMN) setelah penyerahan laporan resmi.';
      }
    }

    function onEntitasPemberiTugasChange() {
      const isPerorangan = document.getElementById('entitas_perorangan')?.checked;
      const lblNama = document.getElementById('lbl_pemberi_tugas_nama');
      const inpNama = document.getElementById('pemberi_tugas_nama');
      const colPic = document.getElementById('col_pemberi_tugas_pic');
      const colJabatan = document.getElementById('col_pemberi_tugas_jabatan');
      const colBidang = document.getElementById('col_pemberi_tugas_bidang');
      const inpPic = document.getElementById('pemberi_tugas_pic');
      const inpJabatan = document.getElementById('pemberi_tugas_jabatan');
      const inpBidang = document.getElementById('pemberi_tugas_bidang');
      const lblAlamat = document.getElementById('lbl_pemberi_tugas_alamat');
      const lblNpwp = document.getElementById('lbl_pemberi_tugas_npwp');
      const inpNpwp = document.getElementById('pemberi_tugas_npwp');

      if (isPerorangan) {
        if (lblNama) lblNama.innerHTML = 'Nama Lengkap Pemberi Tugas (sesuai KTP) <span class="text-rose-400">*</span>';
        if (inpNama) inpNama.placeholder = 'Contoh: Budi Santoso / H. Muhammad Arifin';
        if (colPic) colPic.classList.add('hidden');
        if (colJabatan) colJabatan.classList.add('hidden');
        if (colBidang) colBidang.classList.add('hidden');
        if (inpPic) { inpPic.required = false; inpPic.value = ''; }
        if (inpJabatan) { inpJabatan.required = false; inpJabatan.value = ''; }
        if (lblAlamat) lblAlamat.innerHTML = 'Alamat Domisili KTP Pemberi Tugas <span class="text-rose-400">*</span>';
        if (lblNpwp) lblNpwp.innerHTML = 'NIK KTP (16 Digit) / NPWP Pribadi';
        if (inpNpwp) inpNpwp.placeholder = 'Contoh: 3201012304850001 (NIK 16 Digit) atau NPWP Pribadi (opsional / "-" jika non-NPWP)';
      } else {
        if (lblNama) lblNama.innerHTML = 'Nama Klien / Instansi / Pemberi Tugas <span class="text-rose-400">*</span>';
        if (inpNama) inpNama.placeholder = 'Contoh: PT. BANK CENTRAL ASIA, Tbk KANTOR WILAYAH V – MEDAN';
        if (colPic) colPic.classList.remove('hidden');
        if (colJabatan) colJabatan.classList.remove('hidden');
        if (colBidang) colBidang.classList.remove('hidden');
        if (lblAlamat) lblAlamat.innerHTML = 'Alamat Kantor Pemberi Tugas <span class="text-rose-400">*</span>';
        if (lblNpwp) lblNpwp.innerHTML = 'NPWP &amp; Alamat NPWP Pemberi Tugas';
        if (inpNpwp) inpNpwp.placeholder = 'NPWP: 01.001.604.1-092.000 (Alamat sesuai NPWP: Jl. Jend. Sudirman Kav. 44-46, Jakarta Pusat)';
      }
    }`;

// 4. Update pengambilan bidang_usaha_klien di handleFormSubmit
const targetBidangSubmit = `bidang_usaha_klien: isPerorangan ? "Perorangan / Pribadi" : "Perbankan / Finansial",`;
const replacementBidangSubmit = `bidang_usaha_klien: isPerorangan ? "Perorangan / Pribadi" : (document.getElementById('pemberi_tugas_bidang')?.value || "Perbankan / Finansial"),`;

// Helper untuk replace string dengan normalisasi CRLF
function doReplace(haystack, needle, replacement, label) {
  const normHaystack = haystack.replace(/\r\n/g, '\n');
  const normNeedle = needle.replace(/\r\n/g, '\n');
  const normReplacement = replacement.replace(/\r\n/g, '\n');
  if (!normHaystack.includes(normNeedle)) {
    throw new Error(`Failed to find target block for: ${label}`);
  }
  const replaced = normHaystack.replace(normNeedle, normReplacement);
  // Revert to CRLF if original had CRLF
  if (haystack.includes('\r\n')) {
    return replaced.replace(/\n/g, '\r\n');
  }
  return replaced;
}

content = doReplace(content, targetSection2Fields, replacementSection2Fields, 'Section 2 Bidang Usaha');
content = doReplace(content, targetCaraPembayaran, replacementCaraPembayaran, 'Section 7 Skema Termin');
content = doReplace(content, targetOnEntitas, replacementOnEntitas, 'onEntitasPemberiTugasChange');
content = doReplace(content, targetBidangSubmit, replacementBidangSubmit, 'handleFormSubmit Bidang Usaha');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully updated portal-penugasan-jo.html');
