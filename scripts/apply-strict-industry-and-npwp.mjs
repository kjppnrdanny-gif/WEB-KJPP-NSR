import fs from 'node:fs';

// 1. portal-nolap.html
let pNolap = fs.readFileSync('portal-nolap.html', 'utf8');

// Normalize line endings
let pNolapNorm = pNolap.replace(/\r\n/g, '\n');

// A. Option list
const targetOpt = `<select id="f-industri" onchange="updateLivePreview()" required class="w-full h-10 px-3 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-amber-400">
                <option value="07" selected>07 — Sektor Keuangan - Perbankan</option>
                <option value="03">03 — Properti dan Konstruksi</option>
                <option value="01">01 — Pertanian, perkebunan, kehutanan, peternakan, perikanan</option>
                <option value="02">02 — Pertambangan dan Energi</option>
                <option value="04">04 — Industri Pengolahan / Manufaktur</option>
                <option value="05">05 — Perdagangan dan Jasa</option>
                <option value="06">06 — Informasi, Komunikasi, dan Transportasi</option>
                <option value="08">08 — Sektor Keuangan - Asuransi dan Dana Pensiun</option>
                <option value="09">09 — Sektor Keuangan - Lainnya</option>
                <option value="10">10 — Industri Lainnya</option>
                <option value="11">11 — Pemerintahan, Badan Internasional, Organisasi Non Profit</option>
                <option value="12">12 — Non Industri / Perorangan</option>
              </select>`;

const replOpt = `<select id="f-industri" onchange="updateLivePreview()" required class="w-full h-10 px-3 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-amber-400">
                <option value="" disabled selected>-- Pilih Sektor Industri Kemenkeu (01–12) * --</option>
                <option value="01">01 — Pertanian, perkebunan, kehutanan, peternakan, perikanan</option>
                <option value="02">02 — Pertambangan dan Energi</option>
                <option value="03">03 — Properti dan Konstruksi</option>
                <option value="04">04 — Industri Pengolahan / Manufaktur</option>
                <option value="05">05 — Perdagangan dan Jasa</option>
                <option value="06">06 — Informasi, Komunikasi, dan Transportasi</option>
                <option value="07">07 — Sektor Keuangan - Perbankan</option>
                <option value="08">08 — Sektor Keuangan - Asuransi dan Dana Pensiun</option>
                <option value="09">09 — Sektor Keuangan - Lainnya</option>
                <option value="10">10 — Industri Lainnya</option>
                <option value="11">11 — Pemerintahan, Badan Internasional, Organisasi Non Profit</option>
                <option value="12">12 — Non Industri / Perorangan</option>
              </select>`;

if (pNolapNorm.includes(targetOpt)) {
  pNolapNorm = pNolapNorm.replace(targetOpt, replOpt);
  console.log('✅ portal-nolap.html f-industri options replaced');
} else {
  console.log('⚠️ targetOpt not found in portal-nolap.html');
}

// B. updateLivePreview
const targetPrev = `      // 4. Kode Sektor Industri (2 Digit) Sesuai Master Baku 01-12
      const elIndustri = document.getElementById('f-industri');
      const rawIndustri = elIndustri?.value || "07";
      const cleanInd = String(rawIndustri).replace(/\\D/g, '').padStart(2, '0');
      const numInd = parseInt(cleanInd, 10);
      const kodeIndustri = (numInd >= 1 && numInd <= 12) ? cleanInd : "07";`;

const replPrev = `      // 4. Kode Sektor Industri (2 Digit) Sesuai Master Baku 01-12 (Dilarang fallback diam-diam ke 07)
      const elIndustri = document.getElementById('f-industri');
      const rawIndustri = (elIndustri?.value || "").trim();
      const cleanInd = String(rawIndustri).replace(/\\D/g, '').padStart(2, '0');
      const numInd = parseInt(cleanInd, 10);
      const kodeIndustri = (rawIndustri && !isNaN(numInd) && numInd >= 1 && numInd <= 12) ? cleanInd : "--";`;

if (pNolapNorm.includes(targetPrev)) {
  pNolapNorm = pNolapNorm.replace(targetPrev, replPrev);
  console.log('✅ portal-nolap.html updateLivePreview replaced');
} else {
  console.log('⚠️ targetPrev not found in portal-nolap.html');
}

// C. Mandatory check in ajukanPermohonanNoLap
const targetSubmitCheck = `      if (!waPemohon || waPemohon.replace(/\\D/g, '').length < 8) {
        alert('⚠️ INPUT MANDATORY: WhatsApp Pemohon wajib diisi dengan nomor yang valid (minimal 8 digit).');
        document.getElementById('f-wa-pemohon')?.focus();
        return;
      }`;

const replSubmitCheck = `      if (!waPemohon || waPemohon.replace(/\\D/g, '').length < 8) {
        alert('⚠️ INPUT MANDATORY: WhatsApp Pemohon wajib diisi dengan nomor yang valid (minimal 8 digit).');
        document.getElementById('f-wa-pemohon')?.focus();
        return;
      }

      // Validasi Wajib Sektor Industri Master 01-12 (Anti-Fallback Diam-Diam)
      const rawIndSubmit = (document.getElementById('f-industri')?.value || '').trim();
      const numIndSubmit = parseInt(rawIndSubmit, 10);
      if (!rawIndSubmit || isNaN(numIndSubmit) || numIndSubmit < 1 || numIndSubmit > 12) {
        alert('⚠️ INPUT MANDATORY: Sektor Industri Kemenkeu (01–12) wajib dipilih sesuai master klasifikasi resmi.');
        document.getElementById('f-industri')?.focus();
        return;
      }`;

if (pNolapNorm.includes(targetSubmitCheck)) {
  pNolapNorm = pNolapNorm.replace(targetSubmitCheck, replSubmitCheck);
  console.log('✅ portal-nolap.html ajukanPermohonanNoLap mandatory check added');
} else {
  console.log('⚠️ targetSubmitCheck not found in portal-nolap.html');
}

// D. Table render fallback
pNolapNorm = pNolapNorm.replace("const kodeIndustri = String(item.kodeIndustri || '07').padStart(2, '0');", "const kodeIndustri = item.kodeIndustri ? String(item.kodeIndustri).padStart(2, '0') : '--';");
pNolapNorm = pNolapNorm.replace("kodeIndustri: cleanCols[17] || '07',", "kodeIndustri: cleanCols[17] || '',");

fs.writeFileSync('portal-nolap.html', pNolapNorm, 'utf8');
console.log('Saved portal-nolap.html');

// 2. portal-nolap-cabang.html
let pCabang = fs.readFileSync('portal-nolap-cabang.html', 'utf8');
let pCabangNorm = pCabang.replace(/\r\n/g, '\n');

const targetCabangOpt = `<select id="sektor_industri" onchange="sinkronkanSegmenLive()" class="w-full h-11 px-3 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs font-bold focus:outline-none focus:border-teal-400">
                  <option value="07" selected>07 - Perbankan &amp; Jasa Keuangan</option>
                  <option value="01">01 - Pertanian, Kehutanan &amp; Perikanan</option>
                  <option value="02">02 - Pertambangan &amp; Penggalian</option>
                  <option value="03">03 - Industri Pengolahan &amp; Manufaktur</option>
                  <option value="05">05 - Konstruksi &amp; Real Estate</option>
                  <option value="06">06 - Perdagangan Besar &amp; Eceran</option>
                  <option value="08">08 - Transportasi &amp; Pergudangan</option>
                  <option value="14">14 - Jasa Lainnya / Instansi Pemerintah</option>
                </select>`;

const replCabangOpt = `<select id="sektor_industri" onchange="sinkronkanSegmenLive()" required class="w-full h-11 px-3 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs font-bold focus:outline-none focus:border-teal-400">
                  <option value="" disabled selected>-- Pilih Sektor Industri (01–12) * --</option>
                  <option value="01">01 — Pertanian, perkebunan, kehutanan, peternakan, perikanan</option>
                  <option value="02">02 — Pertambangan dan Energi</option>
                  <option value="03">03 — Properti dan Konstruksi</option>
                  <option value="04">04 — Industri Pengolahan / Manufaktur</option>
                  <option value="05">05 — Perdagangan dan Jasa</option>
                  <option value="06">06 — Informasi, Komunikasi, dan Transportasi</option>
                  <option value="07">07 — Sektor Keuangan - Perbankan</option>
                  <option value="08">08 — Sektor Keuangan - Asuransi dan Dana Pensiun</option>
                  <option value="09">09 — Sektor Keuangan - Lainnya</option>
                  <option value="10">10 — Industri Lainnya</option>
                  <option value="11">11 — Pemerintahan, Badan Internasional, Organisasi Non Profit</option>
                  <option value="12">12 — Non Industri / Perorangan</option>
                </select>`;

if (pCabangNorm.includes(targetCabangOpt)) {
  pCabangNorm = pCabangNorm.replace(targetCabangOpt, replCabangOpt);
  console.log('✅ portal-nolap-cabang.html sektor_industri options replaced');
} else {
  console.log('⚠️ targetCabangOpt not found in portal-nolap-cabang.html');
}

// Cabang badge 07 -> --
pCabangNorm = pCabangNorm.replace('<strong id="seg-industri" class="text-amber-300 font-mono">07</strong>', '<strong id="seg-industri" class="text-amber-300 font-mono">--</strong>');

// Cabang sinkronkanSegmenLive
const targetCabSync = "const industri = document.getElementById('sektor_industri')?.value || '07';";
const replCabSync = `const rawIndCab = (document.getElementById('sektor_industri')?.value || '').trim();
      const numIndCab = parseInt(rawIndCab, 10);
      const industri = (rawIndCab && !isNaN(numIndCab) && numIndCab >= 1 && numIndCab <= 12) ? String(numIndCab).padStart(2, '0') : '--';`;

if (pCabangNorm.includes(targetCabSync)) {
  pCabangNorm = pCabangNorm.replace(targetCabSync, replCabSync);
  console.log('✅ portal-nolap-cabang.html sinkronkanSegmenLive replaced');
} else {
  console.log('⚠️ targetCabSync not found in portal-nolap-cabang.html');
}

fs.writeFileSync('portal-nolap-cabang.html', pCabangNorm, 'utf8');
console.log('Saved portal-nolap-cabang.html');

// 3. Code.gs
let codeGs = fs.readFileSync('Code.gs', 'utf8').replace(/\r\n/g, '\n');
const targetCodeGs = `  const klasifikasi = (data.klasifikasi || data.jenisJasa || 'PI').toString().trim();
  const sektor = (data.sektorIndustri || data.kodeIndustri || '07').toString().trim();
  const seq = String(Math.floor(Math.random() * 9000) + 1000).padStart(5, '0');
  const noDefinitif = \`\${seq}/\${conf.kodeKemenkeu}/\${klasifikasi}/\${sektor}/\${conf.izin}/1/\${romawiBln}/\${thn}\`;`;

const replCodeGs = `  const rawJasa = (data.report_service_code || data.service_classification_id || data.klasifikasi || data.jenisJasa || 'PI').toString().trim().toUpperCase();
  const klasifikasi = (rawJasa === 'PS' || rawJasa === 'PROPERTY_SIMPLE' || rawJasa.indexOf('SEDERHANA') !== -1) ? 'PI' : ((rawJasa === 'BS' || rawJasa === 'BUSINESS') ? 'BS' : ((rawJasa === 'PP' || rawJasa === 'PERSONAL_PROPERTY') ? 'PP' : 'PI'));
  const rawSektor = (data.sektorIndustri || data.kodeIndustri || '').toString().trim();
  const cleanSektor = rawSektor.replace(/\\D/g, '').padStart(2, '0');
  const numSektor = parseInt(cleanSektor, 10);
  if (!rawSektor || isNaN(numSektor) || numSektor < 1 || numSektor > 12) {
    return { status: 'error', success: false, error: 'VALIDASI GAGAL: Kode Industri Kemenkeu wajib dipilih dan valid (01–12).' };
  }
  const sektor = cleanSektor;
  const rawNpwp = (data.npwp || data.pemberi_tugas_npwp || data.klien_npwp || data.kodeNpwp || '').toString().trim();
  const cleanNpwp = rawNpwp.replace(/\\D/g, '');
  const kodeNpwp = (cleanNpwp.length >= 10 || data.statusNpwp === '1' || data.kodeNpwp === '1') ? '1' : '0';
  const seq = String(Math.floor(Math.random() * 9000) + 1000).padStart(5, '0');
  const noDefinitif = \`\${seq}/\${conf.kodeKemenkeu}/\${klasifikasi}/\${sektor}/\${conf.izin}/\${kodeNpwp}/\${romawiBln}/\${thn}\`;`;

if (codeGs.includes(targetCodeGs)) {
  codeGs = codeGs.replace(targetCodeGs, replCodeGs);
  fs.writeFileSync('Code.gs', codeGs, 'utf8');
  console.log('✅ Code.gs updated');
} else {
  console.log('⚠️ targetCodeGs not found in Code.gs');
}

// 4. gas-nolap-Code.gs
let gasNolap = fs.readFileSync('gas-nolap-Code.gs', 'utf8').replace(/\r\n/g, '\n');
const targetGasNolap = `  const sektor = (data.sektorIndustri || data.kodeIndustri || '07').toString().trim();

  // 7 Segmen Format Resmi: 00045/2.0160-04/PI/07/00581/1/X/2026
  const noDefinitif = \`\${nextSeqStr}/\${conf.kodeKemenkeu}/\${reportCode}/\${sektor}/\${conf.izin}/1/\${romawiBln}/\${thn}\`;`;

const replGasNolap = `  const rawSektor = (data.sektorIndustri || data.kodeIndustri || '').toString().trim();
  const cleanSektor = rawSektor.replace(/\\D/g, '').padStart(2, '0');
  const numSektor = parseInt(cleanSektor, 10);
  if (!rawSektor || isNaN(numSektor) || numSektor < 1 || numSektor > 12) {
    return { status: 'error', success: false, error: 'VALIDASI GAGAL: Kode Industri Kemenkeu wajib dipilih dan valid (01–12).' };
  }
  const sektor = cleanSektor;
  const rawNpwp = (data.npwp || data.pemberi_tugas_npwp || data.klien_npwp || data.kodeNpwp || '').toString().trim();
  const cleanNpwp = rawNpwp.replace(/\\D/g, '');
  const kodeNpwp = (cleanNpwp.length >= 10 || data.statusNpwp === '1' || data.kodeNpwp === '1') ? '1' : '0';

  // 7 Segmen Format Resmi: 00045/2.0160-04/PI/07/00581/1/X/2026 (Segmen 6 dinamis 1/0)
  const noDefinitif = \`\${nextSeqStr}/\${conf.kodeKemenkeu}/\${reportCode}/\${sektor}/\${conf.izin}/\${kodeNpwp}/\${romawiBln}/\${thn}\`;`;

if (gasNolap.includes(targetGasNolap)) {
  gasNolap = gasNolap.replace(targetGasNolap, replGasNolap);
  fs.writeFileSync('gas-nolap-Code.gs', gasNolap, 'utf8');
  console.log('✅ gas-nolap-Code.gs updated');
} else {
  console.log('⚠️ targetGasNolap not found in gas-nolap-Code.gs');
}

// 5. scripts/generate-portal-nolap-cabang.mjs
let genCab = fs.readFileSync('scripts/generate-portal-nolap-cabang.mjs', 'utf8').replace(/\r\n/g, '\n');
genCab = genCab.replace("const formatDefinitif = `${seqDefinitif}/${kodeKantor}/${jenisJasa}/${industri}/${izinRekan}/1/${romawi}/${thn}`;", "const inpNpwp = document.getElementById('pemberi_tugas_npwp')?.value.trim() || '';\n      const cleanNpwp = inpNpwp.replace(/\\D/g, '');\n      const kodeNpwp = cleanNpwp.length >= 10 ? '1' : '0';\n      const formatDefinitif = `${seqDefinitif}/${kodeKantor}/${jenisJasa}/${industri}/${izinRekan}/${kodeNpwp}/${romawi}/${thn}`;");
genCab = genCab.replace("const noDefinitif = `${seq}/${conf.kodeKemenkeu}/${jenisJasa}/${industri}/${conf.rekan.izin}/1/${romawi}/${thn}`;", "const inpNpwp = (data.npwp || data.pemberi_tugas_npwp || '').toString().trim();\n      const cleanNpwp = inpNpwp.replace(/\\D/g, '');\n      const kodeNpwp = cleanNpwp.length >= 10 ? '1' : '0';\n      const noDefinitif = `${seq}/${conf.kodeKemenkeu}/${jenisJasa}/${industri}/${conf.rekan.izin}/${kodeNpwp}/${romawi}/${thn}`;");
fs.writeFileSync('scripts/generate-portal-nolap-cabang.mjs', genCab, 'utf8');
console.log('✅ scripts/generate-portal-nolap-cabang.mjs updated');
