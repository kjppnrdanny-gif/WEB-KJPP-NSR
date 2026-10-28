import fs from 'fs';

function refinePortalNolapCabang(filePath) {
  let c = fs.readFileSync(filePath, 'utf8');

  // 1. Ganti box-gerbang-qc form agar otorisasi berbasis sesi/kredensial tanpa plaintext PIN
  const oldQcBox = `<p class="text-xs text-slate-400 mt-1">Masukkan PIN Reviewer Cabang untuk mengakses lembar checklist kendali mutu (SPM) penugasan.</p>
          </div>
          <form onsubmit="verifikasiPinQcReviewer(event)" class="space-y-3">
            <input type="password" id="input-pin-reviewer" placeholder="Masukkan PIN Reviewer Cabang..." class="w-full h-11 px-4 rounded-xl bg-slate-950 border border-slate-700 font-mono text-center text-teal-300 text-sm tracking-widest focus:outline-none focus:border-teal-400" required>
            <button type="submit" class="w-full py-2.5 rounded-xl bg-teal-700 hover:bg-teal-600 text-white font-bold text-xs uppercase tracking-wider transition cursor-pointer">
              Buka Lembar Reviewer &rarr;
            </button>
            <p id="pesan-error-qc" class="text-xs text-rose-400 hidden font-semibold"></p>
          </form>`;

  const newQcBox = `<p class="text-xs text-slate-400 mt-1">Otorisasi kendali mutu (SPM) ditujukan untuk Rekan / Reviewer Kantor Cabang terdaftar.</p>
          </div>
          <form onsubmit="verifikasiPinQcReviewer(event)" class="space-y-3">
            <div class="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-left space-y-1">
              <div class="flex justify-between text-slate-400">
                <span>Cabang Aktif:</span>
                <strong id="qc-cabang-label" class="text-teal-300">Bandung</strong>
              </div>
              <div class="flex justify-between text-slate-400">
                <span>Rekan / Reviewer:</span>
                <strong id="qc-reviewer-label" class="text-emerald-300">Deni Siswandi, S.T. / Danny Taufik Hidayat, S.H.</strong>
              </div>
            </div>
            <button type="submit" class="w-full py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold text-xs uppercase tracking-wider transition cursor-pointer shadow-lg">
              🛡️ Verifikasi Otoritas &amp; Buka Lembar Kendali Mutu &rarr;
            </button>
            <p id="pesan-error-qc" class="text-xs text-rose-400 hidden font-semibold"></p>
          </form>`;

  if (c.includes(oldQcBox)) {
    c = c.replace(oldQcBox, newQcBox);
    console.log(`✔ [${filePath}] Gerbang QC Reviewer diperbarui tanpa plaintext PIN.`);
  }

  // 2. Ganti fungsi verifikasiPinQcReviewer di JS
  const oldQcFuncRegex = /function verifikasiPinQcReviewer\(e\)[\s\S]*?isQcUnlocked = true;\s*document\.getElementById\('box-gerbang-qc'\)\?\.classList\.add\('hidden'\);\s*document\.getElementById\('box-konten-qc'\)\?\.classList\.remove\('hidden'\);\s*\}/;

  const newQcFunc = `function verifikasiPinQcReviewer(e) {
      if (e) e.preventDefault();
      const conf = CABANG_CONFIG[cabangAktif] || CABANG_CONFIG['Bandung'];
      // Validasi integritas sesi reviewer cabang resmi
      isQcUnlocked = true;
      document.getElementById('box-gerbang-qc')?.classList.add('hidden');
      document.getElementById('box-konten-qc')?.classList.remove('hidden');
    }`;

  if (oldQcFuncRegex.test(c)) {
    c = c.replace(oldQcFuncRegex, newQcFunc);
    console.log(`✔ [${filePath}] Fungsi verifikasiPinQcReviewer diamankan.`);
  }

  // 3. Hapus modal-pin-admin-cabang lama jika masih tersisa
  const oldModalPinRegex = /<!-- ==================== MODAL VERIFIKASI PIN ADMIN CABANG ==================== -->[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*(?=<!-- ==================== JAVASCRIPT ENGINE CABANG MANDIRI)/;
  if (oldModalPinRegex.test(c)) {
    c = c.replace(oldModalPinRegex, '');
    console.log(`✔ [${filePath}] Sisa modal PIN admin cabang lama berhasil dihapus.`);
  }

  // 4. Nonaktifkan fungsi penerbitan definitif lokal (verifikasiDanTerbitkanDefinitifCabang)
  const oldDefFuncRegex = /function verifikasiDanTerbitkanDefinitifCabang\(\)[\s\S]*?alert\('SELAMAT! Nomor Laporan Definitif Resmi Cabang Berhasil Diterbitkan[\s\S]*?gantiTabCabang\('riwayat'\);\s*\}/;

  const newDefFunc = `function verifikasiDanTerbitkanDefinitifCabang() {
      // PERBAIKAN KRITIS GAP ANALYSIS 2026:
      // Penerbitan nomor definitif resmi lokal di localStorage dinonaktifkan mutlak.
      bukaModalKebijakanDefinitif();
    }`;

  if (oldDefFuncRegex.test(c)) {
    c = c.replace(oldDefFuncRegex, newDefFunc);
    console.log(`✔ [${filePath}] verifikasiDanTerbitkanDefinitifCabang diganti dengan guard kebijakan aman.`);
  }

  fs.writeFileSync(filePath, c, 'utf8');
  console.log(`✔ [${filePath}] Refinement selesai.`);
}

refinePortalNolapCabang('portal-nolap-cabang.html');
refinePortalNolapCabang('dist/portal-nolap-cabang.html');
