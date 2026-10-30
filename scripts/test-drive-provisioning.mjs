import assert from 'node:assert';
import { spawn } from 'node:child_process';
import fs from 'node:fs';

console.log('================================================================');
console.log('   PENGUJIAN OTOMASI STRUKTUR GOOGLE DRIVE PENUGASAN (M-01)     ');
console.log('   KJPP Nanang Rahayu Sigit Paryanto & Rekan (OPINI NSR)        ');
console.log('================================================================');

const PORT = 8422;
const BASE = `http://127.0.0.1:${PORT}`;
const phpServer = spawn('php', ['-S', `127.0.0.1:${PORT}`, 'backend/job-tracking-handler.php']);
await new Promise(r => setTimeout(r, 1200));

async function runTests() {
  try {
    const timestamp = Date.now().toString().slice(-4);
    const testJo = `JO-BDG-2026-${timestamp}`;

    // 1. Registrasi Job Order baru (M-01) dengan Otomasi Provisioning Folder Google Drive
    console.log(`\n1. Registrasi Job Order baru: ${testJo}`);
    const regPayload = {
      jo_number: testJo,
      spk_number: `SPK/BTN-BDG/${timestamp}/2026`,
      pemberi_tugas: 'PT Bank Tabungan Negara (Persero) Tbk - KC Bandung',
      pengguna_laporan: 'PT Bank Tabungan Negara (Persero) Tbk - Divisi Asset & Remedial',
      debitur: `PT Graha Logistik Parahyangan ${timestamp}`,
      jenis_properti: 'Kompleks Pergudangan Logistik',
      lokasi_aset: 'Jl. Soekarno Hatta No. 458, Gedebage, Bandung',
      kantor: 'Cabang Bandung',
      client_pic_name: 'Bapak Ilham Ramadhan',
      client_pic_phone: '081234567890',
      penilai_publik: 'Deni Siswandi, S.E., M.Ec.Dev., MAPPI (Cert.)'
    };

    const regRes = await fetch(`${BASE}/?action=create_job_order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(regPayload)
    });
    const regJson = await regRes.json();
    assert.strictEqual(regJson.status, 'success');
    const createdJob = regJson.data;
    console.log(`[PASS] Registrasi berhasil: ${createdJob.jo_number} (${createdJob.kode_lacak})`);

    // 2. Validasi Struktur Folder Drive & 5 Subfolder Standar SPI 105
    console.log('\n2. Validasi Atribut Drive & 5 Subfolder Standar');
    assert.ok(createdJob.drive_folder_url, 'drive_folder_url harus ada');
    assert.ok(createdJob.drive_folder_url.includes('drive.google.com/drive/folders/'), 'URL Drive harus valid Google Drive URL');
    assert.strictEqual(createdJob.evidence_link, createdJob.drive_folder_url, 'evidence_link harus terisi default folder Drive');
    assert.ok(Array.isArray(createdJob.subfolders), 'subfolders harus berupa array');
    assert.strictEqual(createdJob.subfolders.length, 5, 'Harus memiliki tepat 5 subfolder standar');

    const expectedSubfolders = [
      '01_Dokumen_Yuridis_SPK',
      '02_Foto_Inspeksi_Geotag',
      '03_Data_Pasar_Pembanding',
      '04_Kertas_Kerja_Analisis',
      '05_Laporan_Final_PDF'
    ];

    createdJob.subfolders.forEach((sub, idx) => {
      assert.strictEqual(sub.name, expectedSubfolders[idx], `Subfolder #${idx + 1} harus ${expectedSubfolders[idx]}`);
      assert.ok(sub.url.includes(expectedSubfolders[idx]), `URL subfolder #${idx + 1} harus memuat nama subfolder`);
      console.log(`   [✓ Subfolder ${idx + 1}] ${sub.name} -> ${sub.url}`);
    });
    console.log('[PASS] Seluruh 5 subfolder standar terverifikasi lengkap');

    // 3. Verifikasi Catatan Audit Trail M-01-DRIVE-PROVISION
    console.log('\n3. Verifikasi Pencatatan Audit Trail M-01-DRIVE-PROVISION');
    const auditRes = await fetch(`${BASE}/?action=get_audit_log&jo=${createdJob.jo_number}`);
    const auditJson = await auditRes.json();
    assert.strictEqual(auditJson.status, 'success');
    const auditList = auditJson.data || [];
    const driveAudit = auditList.find(a => a.milestone_baru === 'M-01-DRIVE-PROVISION');
    assert.ok(driveAudit, 'Log audit M-01-DRIVE-PROVISION harus terekam di sistem');
    console.log(`[PASS] Audit log terekam: [${driveAudit.milestone_baru}] -> ${driveAudit.catatan_progres}`);

    // 4. Uji Idempotensi: Panggilan On-Demand provision_drive_folder
    console.log('\n4. Uji Idempotensi & Endpoint On-Demand provision_drive_folder');
    const provRes = await fetch(`${BASE}/?action=provision_drive_folder&id_jo=${createdJob.jo_number}`);
    const provJson = await provRes.json();
    assert.strictEqual(provJson.status, 'success');
    assert.strictEqual(provJson.data.folder_url, createdJob.drive_folder_url, 'Idempotensi: URL folder harus identik tanpa membuat folder ganda');
    console.log(`[PASS] Idempotensi terbukti: Folder URL identik (${provJson.data.folder_url})`);

    // 5. Uji Proteksi Kerahasiaan (KEPI): Penyekaan Link Internal dari Endpoint Publik Track
    console.log('\n5. Uji Proteksi Kerahasiaan (KEPI) pada Endpoint Lacak Publik');
    const trackRes = await fetch(`${BASE}/?action=track&jo=${createdJob.kode_lacak}`);
    const trackJson = await trackRes.json();
    assert.strictEqual(trackJson.status, 'success');
    const publicData = trackJson.data;

    // Verifikasi penyekaan data konfidensial
    assert.strictEqual(publicData.drive_folder_url, undefined, 'drive_folder_url WAJIB diseka dari respons publik');
    assert.strictEqual(publicData.link_folder_drive, undefined, 'link_folder_drive WAJIB diseka dari respons publik');
    assert.strictEqual(publicData.evidence_link, undefined, 'evidence_link WAJIB diseka dari respons publik');
    assert.strictEqual(publicData.subfolders, undefined, 'subfolders WAJIB diseka dari respons publik');
    assert.strictEqual(publicData.opini_nilai_pasar, undefined, 'opini_nilai_pasar WAJIB diseka dari respons publik');
    assert.strictEqual(publicData.opini_nilai_likuidasi, undefined, 'opini_nilai_likuidasi WAJIB diseka dari respons publik');

    // Pastikan data publik yang legal tetap tersedia
    assert.strictEqual(publicData.jo_number, createdJob.jo_number);
    assert.strictEqual(publicData.kode_lacak, createdJob.kode_lacak);
    assert.ok(publicData.milestones, 'Stepper 7 milestone tetap tersedia untuk publik');
    console.log('[PASS] Proteksi KEPI Terbukti Aman: drive_folder_url, subfolders, dan evidence_link berhasil diseka 100% dari pandangan publik!');

    console.log('\n================================================================');
    console.log('🏆 SEMUA 5 PENGUJIAN OTOMASI GOOGLE DRIVE M-01 LULUS 100%! 🏆');
    console.log('================================================================');
  } finally {
    phpServer.kill();
  }
}

runTests().catch(err => {
  console.error('[FAIL]', err);
  phpServer.kill();
  process.exit(1);
});
