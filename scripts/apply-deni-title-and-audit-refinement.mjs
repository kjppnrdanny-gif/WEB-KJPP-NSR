import fs from 'fs';
import path from 'path';

console.log('=== MEMULAI PENERAPAN STANDARISASI GELAR DENI SISWANDI & AUDIT TRAIL MANDIRI CABANG ===');

const baseDir = process.cwd();

// -----------------------------------------------------------------------------
// 1. UPDATE nolap-data-handler.php
// -----------------------------------------------------------------------------
const nolapFile = path.join(baseDir, 'nolap-data-handler.php');
if (fs.existsSync(nolapFile)) {
  let nolapContent = fs.readFileSync(nolapFile, 'utf8');

  // Ganti Deni Siswandi, S.T., MAPPI (Cert.) -> Deni Siswandi, S.T., MAPPI
  const beforeDeni = (nolapContent.match(/Deni Siswandi, S\.T\., MAPPI \(Cert\.\)/g) || []).length;
  nolapContent = nolapContent.replaceAll('Deni Siswandi, S.T., MAPPI (Cert.)', 'Deni Siswandi, S.T., MAPPI');
  console.log(`[nolap-data-handler.php] Mengganti ${beforeDeni} kemunculan 'Deni Siswandi, S.T., MAPPI (Cert.)' -> 'Deni Siswandi, S.T., MAPPI'`);

  // Sempurnakan audit trail & pemisahan kewenangan di publishMandiriCabangLP
  const markerTarget = `$pejabatNama = $branchConfig['rekan_nama'];
        $pejabatIzin = $branchConfig['rekan_izin'];
        $pejabatOtorisasi = "Pimpinan Cabang {$matchedBranchKey} ({$pejabatNama})";

        $dgEntry = [`;

  const newAuditLogic = `$pejabatNama = $branchConfig['rekan_nama'];
        $pejabatIzin = $branchConfig['rekan_izin'];
        $pejabatOtorisasi = "Pimpinan Cabang {$matchedBranchKey} ({$pejabatNama})";

        // Audit Trail Pemisahan Kewenangan Ketat:
        // Admin Cabang sebagai petugas administrasi tidak otomatis memiliki kewenangan profesional.
        // Penerbitan resmi wajib didasarkan pada persetujuan Pimpinan Cabang yang berwenang atau delegasi sah.
        $waktuInput = $payload['tanggalInput'] ?? ($payload['waktu_input'] ?? ($payload['created_at'] ?? $nowWib));
        $penginputNama = trim($payload['pengaju']['nama'] ?? ($payload['pengaju_nama'] ?? ($currentUser['nama'] ?? $userDisplayName)));
        $penginputNik = trim($payload['pengaju']['nik'] ?? ($payload['pengaju_nik'] ?? ($currentUser['nik'] ?? '-')));
        $penginputJabatan = trim($payload['pengaju']['jabatan'] ?? ($payload['pengaju_jabatan'] ?? ($userRole === 'ADMIN_CABANG' ? 'Petugas Administrasi Cabang' : $userRole)));
        $penginputEmail = trim($payload['pengaju']['email'] ?? ($payload['pengaju_email'] ?? ($currentUser['email'] ?? '')));
        $penginputWa = trim($payload['pengaju']['whatsapp_number'] ?? ($payload['pengaju_wa'] ?? ($currentUser['whatsapp_number'] ?? '')));

        $penginputData = [
            'id' => $currentUser['sub'] ?? ($payload['pengaju']['nik'] ?? 'staf_cabang'),
            'nama' => $penginputNama,
            'nik' => $penginputNik,
            'jabatan' => $penginputJabatan,
            'kantor' => "Kantor Cabang {$matchedBranchKey}",
            'role' => $userRole,
            'waktu_input' => $waktuInput
        ];

        $pejabatPengesah = [
            'id' => $branchConfig['rekan_id'],
            'nama' => $pejabatNama,
            'izin' => $pejabatIzin,
            'jabatan' => "Pimpinan Cabang {$matchedBranchKey}",
            'klasifikasi_profesional' => $branchConfig['klasifikasi_cabang'],
            'dasar_kewenangan' => "PMK 101/2014 & SPI 204 — Otorisasi Rekan Pemimpin Cabang {$matchedBranchKey} (Izin No. {$pejabatIzin})",
            'status_persetujuan' => 'DISETUJUI_PIMPINAN_CABANG',
            'waktu_pengesahan' => $nowWib
        ];

        $auditTrailItem = [
            'waktu' => $nowWib,
            'aksi' => 'PENERBITAN_RESMI_MANDIRI_CABANG',
            'jalur' => 'MANDIRI_CABANG',
            'penginput' => $penginputData,
            'pejabat_pengesah' => $pejabatPengesah,
            'waktu_input' => $waktuInput,
            'waktu_pengesahan' => $nowWib,
            'keterangan' => "Nomor SPK {$nomorLpResmi} & JO {$nomorAdmResmi} disahkan atas persetujuan Pimpinan Cabang {$matchedBranchKey} ({$pejabatNama}). Petugas administrasi cabang ({$penginputNama}) bertindak sebagai penginput data."
        ];

        $dgEntry = [`;

  if (nolapContent.includes(markerTarget)) {
    nolapContent = nolapContent.replace(markerTarget, newAuditLogic);
    console.log('[nolap-data-handler.php] Berhasil menyisipkan logika pemisahan penginput vs pejabat_pengesah');
  } else {
    // Normalisasi line endings untuk match
    const normContent = nolapContent.replace(/\r\n/g, '\n');
    const normMarker = markerTarget.replace(/\r\n/g, '\n');
    const normLogic = newAuditLogic.replace(/\r\n/g, '\n');
    if (normContent.includes(normMarker)) {
      nolapContent = normContent.replace(normMarker, normLogic).replace(/\n/g, '\r\n');
      console.log('[nolap-data-handler.php] Berhasil menyisipkan logika pemisahan (CRLF mode)');
    } else {
      console.warn('[nolap-data-handler.php] Marker target tidak ditemukan persis, periksa manual');
    }
  }

  // Tambahkan field penginput, pejabat_pengesah, waktu_input, waktu_pengesahan ke dgEntry
  const targetEntryEnd = `'disetujui_oleh' => $pejabatOtorisasi,
            'pejabatOtorisasi' => $pejabatOtorisasi,
            'pejabat_otorisasi' => $pejabatOtorisasi,`;

  const newEntryFields = `'disetujui_oleh' => $pejabatOtorisasi,
            'pejabatOtorisasi' => $pejabatOtorisasi,
            'pejabat_otorisasi' => $pejabatOtorisasi,
            'penginput' => $penginputData,
            'pejabat_pengesah' => $pejabatPengesah,
            'waktu_input' => $waktuInput,
            'waktu_pengesahan' => $nowWib,
            'audit_trail' => [$auditTrailItem],`;

  nolapContent = nolapContent.replace(targetEntryEnd.replace(/\r\n/g, '\n'), newEntryFields.replace(/\r\n/g, '\n'));
  nolapContent = nolapContent.replace(targetEntryEnd, newEntryFields);

  // Perbarui gerbang1 di dgEntry
  const oldGerbang1 = `'gerbang1' => [
                'status' => 'LP_DITERBITKAN',
                'jalur' => 'MANDIRI_CABANG',
                'nomorLpResmi' => $nomorLpResmi,
                'nomorAdmResmi' => $nomorAdmResmi,
                'diterbitkanPada' => $nowWib,
                'diterbitkanOleh' => $pejabatOtorisasi,
                'pejabatBerwenang' => $pejabatNama,
                'nomorIzinPejabat' => $pejabatIzin,
                'kantorPenerbit' => "Kantor Cabang {$matchedBranchKey}"
            ],`;

  const newGerbang1 = `'gerbang1' => [
                'status' => 'LP_DITERBITKAN',
                'jalur' => 'MANDIRI_CABANG',
                'nomorLpResmi' => $nomorLpResmi,
                'nomorAdmResmi' => $nomorAdmResmi,
                'diterbitkanPada' => $nowWib,
                'waktu_input' => $waktuInput,
                'waktu_pengesahan' => $nowWib,
                'penginput' => $penginputData,
                'pejabat_pengesah' => $pejabatPengesah,
                'diterbitkanOleh' => $pejabatOtorisasi,
                'pejabatBerwenang' => $pejabatNama,
                'nomorIzinPejabat' => $pejabatIzin,
                'kantorPenerbit' => "Kantor Cabang {$matchedBranchKey}"
            ],`;

  nolapContent = nolapContent.replace(oldGerbang1.replace(/\r\n/g, '\n'), newGerbang1.replace(/\r\n/g, '\n'));
  nolapContent = nolapContent.replace(oldGerbang1, newGerbang1);

  // Perbarui response JSON publishMandiriCabangLP
  const oldResponse = `'nomorAdmResmi' => $nomorAdmResmi,
            'diterbitkanOleh' => $pejabatOtorisasi,
            'pejabatBerwenang' => $pejabatNama,
            'nomorIzinPejabat' => $pejabatIzin,
            'kantorWilayah' => "Kantor Cabang {$matchedBranchKey}"
        ]);`;

  const newResponse = `'nomorAdmResmi' => $nomorAdmResmi,
            'penginput' => $penginputData,
            'pejabat_pengesah' => $pejabatPengesah,
            'waktu_input' => $waktuInput,
            'waktu_pengesahan' => $nowWib,
            'diterbitkanOleh' => $pejabatOtorisasi,
            'pejabatBerwenang' => $pejabatNama,
            'nomorIzinPejabat' => $pejabatIzin,
            'kantorWilayah' => "Kantor Cabang {$matchedBranchKey}"
        ]);`;

  nolapContent = nolapContent.replace(oldResponse.replace(/\r\n/g, '\n'), newResponse.replace(/\r\n/g, '\n'));
  nolapContent = nolapContent.replace(oldResponse, newResponse);

  fs.writeFileSync(nolapFile, nolapContent, 'utf8');
  console.log('[nolap-data-handler.php] Berhasil disimpan.');
}

// -----------------------------------------------------------------------------
// 2. UPDATE portal-penugasan-jo.html
// -----------------------------------------------------------------------------
const portalJoFile = path.join(baseDir, 'portal-penugasan-jo.html');
if (fs.existsSync(portalJoFile)) {
  let joContent = fs.readFileSync(portalJoFile, 'utf8');

  // Ganti Deni Siswandi, S.T., MAPPI (Cert.) dan variannya
  const matchDeni1 = (joContent.match(/Deni Siswandi, S\.T\., MAPPI \(Cert\.\)/g) || []).length;
  const matchDeni2 = (joContent.match(/Deni Siswandi, S\.T, MAPPI \(Cert\.\)/g) || []).length;
  joContent = joContent.replaceAll('Deni Siswandi, S.T., MAPPI (Cert.)', 'Deni Siswandi, S.T., MAPPI');
  joContent = joContent.replaceAll('Deni Siswandi, S.T, MAPPI (Cert.)', 'Deni Siswandi, S.T., MAPPI');
  console.log(`[portal-penugasan-jo.html] Mengganti ${matchDeni1 + matchDeni2} varian gelar Deni Siswandi -> 'Deni Siswandi, S.T., MAPPI'`);

  // Di payloadMandiri, sertakan informasi waktu_input dan pengesahan pimpinan
  const oldPayloadMandiri = `const payloadMandiri = {
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
          };`;

  const newPayloadMandiri = `const payloadMandiri = {
            idPenugasan: projectId,
            kantorWilayah: wilCabang,
            nomorLpResmi: noLp,
            nomorAdmResmi: noAdm,
            tanggalSurat: tglStr,
            tanggalInput: new Date().toISOString(),
            jenisLaporan: jenisLap,
            serviceClassification: chosenService,
            jenisObjek: document.getElementById('jenis_objek')?.value || 'Tanah dan Bangunan',
            tujuanPenilaian: rawTujuan,
            namaKlien: namaPemberiTugas,
            namaDebitur: document.getElementById('debitur_nama')?.value.trim().toUpperCase() || '-',
            rekanNama: rekanSelected.nama,
            rekanIzin: rekanSelected.izin,
            otorisasi_pimpinan_cabang: true,
            pengaju: {
              nama: pNama,
              nik: pNik,
              jabatan: pJabatan || 'Petugas Administrasi Cabang',
              email: pEmail,
              whatsapp_number: pWa
            },
            projectData: newProject
          };`;

  joContent = joContent.replace(oldPayloadMandiri.replace(/\r\n/g, '\n'), newPayloadMandiri.replace(/\r\n/g, '\n'));
  joContent = joContent.replace(oldPayloadMandiri, newPayloadMandiri);

  // Di sinkronisasi newProject setelah submit berhasil
  const oldSync = `newProject.nomor_lp = resData.nomorLpResmi || noLp;
          newProject.nomor_adm = resData.nomorAdmResmi || noAdm;
          newProject.disetujui_oleh = resData.diterbitkanOleh || ("Pimpinan Cabang (" + rekanSelected.nama + ")");
          newProject.status = "APPROVED";
          newProject.status_approval = "APPROVED_CABANG";
          newProject.jalur_penerbitan = "MANDIRI_CABANG";`;

  const newSync = `newProject.nomor_lp = resData.nomorLpResmi || noLp;
          newProject.nomor_adm = resData.nomorAdmResmi || noAdm;
          newProject.disetujui_oleh = resData.diterbitkanOleh || ("Pimpinan Cabang (" + rekanSelected.nama + ")");
          newProject.penginput = resData.penginput || { nama: pNama, nik: pNik, jabatan: pJabatan || 'Petugas Administrasi Cabang', waktu_input: new Date().toISOString() };
          newProject.pejabat_pengesah = resData.pejabat_pengesah || { nama: rekanSelected.nama, izin: rekanSelected.izin, jabatan: 'Pimpinan Cabang ' + wilCabang, waktu_pengesahan: new Date().toISOString() };
          newProject.waktu_input = resData.waktu_input || new Date().toISOString();
          newProject.waktu_pengesahan = resData.waktu_pengesahan || new Date().toISOString();
          newProject.status = "APPROVED";
          newProject.status_approval = "APPROVED_CABANG";
          newProject.jalur_penerbitan = "MANDIRI_CABANG";`;

  joContent = joContent.replace(oldSync.replace(/\r\n/g, '\n'), newSync.replace(/\r\n/g, '\n'));
  joContent = joContent.replace(oldSync, newSync);

  // Perjelas badge status dan audit di Tab 2 Dashboard
  const oldStatusBadgeMandiri = `if (isMandiri) {
          statusBadge = \`<div class="space-y-0.5">
            <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9.5px] font-black uppercase bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
              ⚡ MANDIRI CABANG
            </span>
            <span class="block text-[9px] text-emerald-400/90 truncate max-w-[140px]">\${escapeHtml(p.disetujui_oleh || p.approved_by || 'Pimpinan Cabang')}</span>
          </div>\`;`;

  const newStatusBadgeMandiri = `if (isMandiri) {
          const pengesahNama = p.pejabat_pengesah?.nama || p.disetujui_oleh || p.approved_by || 'Pimpinan Cabang';
          const inputNama = p.penginput?.nama || p.pengaju?.nama || p.penilai_nama || 'Petugas Admin';
          statusBadge = \`<div class="space-y-0.5">
            <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9.5px] font-black uppercase bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
              ⚡ MANDIRI CABANG
            </span>
            <span class="block text-[9px] text-emerald-300 truncate max-w-[150px]" title="Disahkan oleh: \${escapeHtml(pengesahNama)}">Disahkan: <strong>\${escapeHtml(pengesahNama)}</strong></span>
            <span class="block text-[8.5px] text-slate-400 truncate max-w-[150px]" title="Diinput oleh: \${escapeHtml(inputNama)}">Input: \${escapeHtml(inputNama)}</span>
          </div>\`;`;

  joContent = joContent.replace(oldStatusBadgeMandiri.replace(/\r\n/g, '\n'), newStatusBadgeMandiri.replace(/\r\n/g, '\n'));
  joContent = joContent.replace(oldStatusBadgeMandiri, newStatusBadgeMandiri);

  fs.writeFileSync(portalJoFile, joContent, 'utf8');
  console.log('[portal-penugasan-jo.html] Berhasil disimpan.');
}

// -----------------------------------------------------------------------------
// 3. UPDATE merge-tags-engine.php
// -----------------------------------------------------------------------------
const mergeFile = path.join(baseDir, 'merge-tags-engine.php');
if (fs.existsSync(mergeFile)) {
  let mContent = fs.readFileSync(mergeFile, 'utf8');
  mContent = mContent.replace("penilaiDefault = 'Deni Siswandi, S.T., M.Ec.Dev.';", "penilaiDefault = 'Deni Siswandi, S.T., MAPPI';");
  fs.writeFileSync(mergeFile, mContent, 'utf8');
  console.log('[merge-tags-engine.php] Berhasil update penilaiDefault -> Deni Siswandi, S.T., MAPPI');
}

// -----------------------------------------------------------------------------
// 4. UPDATE portal-nolap.html
// -----------------------------------------------------------------------------
const nolapHtmlFile = path.join(baseDir, 'portal-nolap.html');
if (fs.existsSync(nolapHtmlFile)) {
  let nhContent = fs.readFileSync(nolapHtmlFile, 'utf8');
  nhContent = nhContent.replace("penilai = 'Deni Siswandi, S.T., M.Ec.Dev.';", "penilai = 'Deni Siswandi, S.T., MAPPI';");
  fs.writeFileSync(nolapHtmlFile, nhContent, 'utf8');
  console.log('[portal-nolap.html] Berhasil update penilai -> Deni Siswandi, S.T., MAPPI');
}

// -----------------------------------------------------------------------------
// 5. UPDATE daftar-token-akses-internal.html
// -----------------------------------------------------------------------------
const tokenDocFile = path.join(baseDir, 'daftar-token-akses-internal.html');
if (fs.existsSync(tokenDocFile)) {
  let tkContent = fs.readFileSync(tokenDocFile, 'utf8');
  tkContent = tkContent.replaceAll('Deni Siswandi, S.T., M.Ec.Dev.', 'Deni Siswandi, S.T., MAPPI');
  fs.writeFileSync(tokenDocFile, tkContent, 'utf8');
  console.log('[daftar-token-akses-internal.html] Berhasil update Deni Siswandi, S.T., MAPPI');
}

// -----------------------------------------------------------------------------
// 6. UPDATE master data json
// -----------------------------------------------------------------------------
const mPenilai = path.join(baseDir, 'data', 'masters', 'master_penilai_publik.json');
if (fs.existsSync(mPenilai)) {
  let mpContent = fs.readFileSync(mPenilai, 'utf8');
  mpContent = mpContent.replaceAll('Deni Siswandi, S.T., MAPPI (Cert.)', 'Deni Siswandi, S.T., MAPPI');
  fs.writeFileSync(mPenilai, mpContent, 'utf8');
  console.log('[data/masters/master_penilai_publik.json] Berhasil update master penilai publik');
}

const mPersonel = path.join(baseDir, 'data', 'masters', 'master_personel_kontak.json');
if (fs.existsSync(mPersonel)) {
  let mperContent = fs.readFileSync(mPersonel, 'utf8');
  mperContent = mperContent.replaceAll('Deni Siswandi, S.T., MAPPI (Cert.)', 'Deni Siswandi, S.T., MAPPI');
  fs.writeFileSync(mPersonel, mperContent, 'utf8');
  console.log('[data/masters/master_personel_kontak.json] Berhasil update master personel kontak');
}

// -----------------------------------------------------------------------------
// 7. UPDATE auth-registry-loader.php & credentials.secrets.php
// -----------------------------------------------------------------------------
const authReg = path.join(baseDir, 'auth-registry-loader.php');
if (fs.existsSync(authReg)) {
  let arContent = fs.readFileSync(authReg, 'utf8');
  arContent = arContent.replaceAll('Deni Siswandi, S.T., MAPPI (Cert.)', 'Deni Siswandi, S.T., MAPPI');
  fs.writeFileSync(authReg, arContent, 'utf8');
  console.log('[auth-registry-loader.php] Berhasil update auth-registry-loader');
}

const credSec = path.join(baseDir, 'data', 'config', 'credentials.secrets.php');
if (fs.existsSync(credSec)) {
  let csContent = fs.readFileSync(credSec, 'utf8');
  csContent = csContent.replaceAll('Deni Siswandi, S.T., MAPPI (Cert.)', 'Deni Siswandi, S.T., MAPPI');
  fs.writeFileSync(credSec, csContent, 'utf8');
  console.log('[data/config/credentials.secrets.php] Berhasil update credentials secrets');
}

// -----------------------------------------------------------------------------
// 8. UPDATE scripts & dist-staging
// -----------------------------------------------------------------------------
const scriptMerge = path.join(baseDir, 'scripts', 'apply-tahap2-merge-tags-and-drive.mjs');
if (fs.existsSync(scriptMerge)) {
  let smContent = fs.readFileSync(scriptMerge, 'utf8');
  smContent = smContent.replaceAll('Deni Siswandi, S.T., M.Ec.Dev.', 'Deni Siswandi, S.T., MAPPI');
  fs.writeFileSync(scriptMerge, smContent, 'utf8');
  console.log('[scripts/apply-tahap2-merge-tags-and-drive.mjs] Berhasil update');
}

const stagingMerge = path.join(baseDir, 'dist-staging', 'merge-tags-engine.php');
if (fs.existsSync(stagingMerge)) {
  let stmContent = fs.readFileSync(stagingMerge, 'utf8');
  stmContent = stmContent.replaceAll('Deni Siswandi, S.T., M.Ec.Dev.', 'Deni Siswandi, S.T., MAPPI');
  fs.writeFileSync(stagingMerge, stmContent, 'utf8');
  console.log('[dist-staging/merge-tags-engine.php] Berhasil update');
}

const stagingDual = path.join(baseDir, 'dist-staging', 'portal-dual-gate-staging.html');
if (fs.existsSync(stagingDual)) {
  let stdContent = fs.readFileSync(stagingDual, 'utf8');
  stdContent = stdContent.replaceAll('Deni Siswandi, S.T., MAPPI (Cert.)', 'Deni Siswandi, S.T., MAPPI');
  fs.writeFileSync(stagingDual, stdContent, 'utf8');
  console.log('[dist-staging/portal-dual-gate-staging.html] Berhasil update');
}

console.log('=== SELESAI PENERAPAN STANDARISASI GELAR & AUDIT TRAIL ===');
